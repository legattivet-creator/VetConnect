
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { HomeIcon, ArrowLeftIcon, CogIcon, BellIcon, CalendarIcon, XMarkIcon } from './Icons';
import { AppointmentStatus } from '../types';

// Hack to prevent garbage collection of the utterance object, which causes audio cuts
declare global {
    interface Window {
        currentUtterance?: SpeechSynthesisUtterance;
    }
}

export const Layout: React.FC<{ children: React.ReactNode; title: string; overrideBackground?: boolean; }> = ({ children, title, overrideBackground = false }) => {
    const { translations, background, openSettings, appointments, language, dismissedNotificationIds, dismissNotification } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    
    // State to track which alerts are currently valid and triggered based on time
    const [activeAlertIds, setActiveAlertIds] = useState<string[]>([]);
    
    // Hide bottom nav on Home (Login) page AND Pets List page. 
    // normalize path to remove trailing slash for consistent matching
    const normalizedPath = location.pathname.endsWith('/') && location.pathname.length > 1 
        ? location.pathname.slice(0, -1) 
        : location.pathname;
        
    const showBottomNav = !['/', '/pets'].includes(normalizedPath);
    const canGoBack = location.state?.from;
    const hasBg = background || overrideBackground;

    // Helper to translate appointment types
    const getTranslatedType = (type: string) => {
        const key = type.toLowerCase().replace(/[^a-z0-9]/gi, '');
        return translations[key] || type;
    };
    
    // Notification Logic: Get appointments in the next 24 hours that are NOT dismissed
    const now = new Date();
    // Add a small buffer (e.g., 10 minutes) to the 24h window. 
    // This ensures that if the 24h voice alert triggers exactly at 24h00m, 
    // the item definitely appears in the list so it can be dismissed.
    const next24hBuffer = new Date(now.getTime() + (24 * 60 * 60 * 1000) + (10 * 60 * 1000)); 
    
    const upcomingNotifications = appointments.filter(appt => {
        const apptDate = new Date(appt.dateTime);
        return appt.status === AppointmentStatus.Scheduled && 
               apptDate > now && 
               apptDate <= next24hBuffer &&
               !dismissedNotificationIds.includes(appt.id); // Filter out dismissed ones
    }).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    const hasNotifications = upcomingNotifications.length > 0;

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // 1. Time Checker: Identifies appointments that need alerting
    useEffect(() => {
        const checkTime = () => {
            const currentTime = new Date().getTime();
            const newTriggeredIds: string[] = [];

            appointments.forEach(appt => {
                if (appt.status !== AppointmentStatus.Scheduled) return;
                
                const apptTime = new Date(appt.dateTime).getTime();
                const diffMs = apptTime - currentTime;
                // Use minutes for higher precision to match the visual countdowns exactly
                const diffMinutes = diffMs / (1000 * 60); 

                // 24 Hours warning
                // Trigger exactly between 23h 59m and 24h 00m (1439 - 1440 minutes)
                if (diffMinutes >= 1439 && diffMinutes <= 1440) {
                     newTriggeredIds.push(`${appt.id}-24h`);
                }

                // 1 Hour warning
                // Trigger exactly between 59m and 60m. 
                // The visual "green" flash (soon) starts at <= 60 minutes.
                if (diffMinutes >= 59 && diffMinutes <= 60) {
                    newTriggeredIds.push(`${appt.id}-1h`);
                }
            });

            // Update state if we found new alerts that aren't already tracked locally
            if (newTriggeredIds.length > 0) {
                 setActiveAlertIds(prev => {
                     // Merge new IDs with existing ones, avoiding duplicates
                     const combined = new Set([...prev, ...newTriggeredIds]);
                     return Array.from(combined);
                 });
            }
        };

        // Check every 10 seconds for better precision than 60s, ensures we hit the 1-minute window
        const intervalId = setInterval(checkTime, 10000);
        checkTime(); // Run immediately

        return () => clearInterval(intervalId);
    }, [appointments]);


    // 2. Audio Looper: Plays sound continuously for active, undismissed alerts
    useEffect(() => {
        // Filter out alerts that the user has explicitly dismissed globally
        const pendingAlerts = activeAlertIds.filter(alertId => {
            const baseId = alertId.split('-')[0];
            return !dismissedNotificationIds.includes(baseId);
        });

        if (pendingAlerts.length === 0) {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                window.currentUtterance = undefined;
            }
            return;
        }

        // Pick the first pending alert to speak
        const currentAlertKey = pendingAlerts[0];
        const [apptId, type] = currentAlertKey.split('-');
        const appt = appointments.find(a => a.id === apptId);

        if (!appt) return;

        const translatedType = getTranslatedType(appt.type);

        const text = (type === '24h' ? translations.voiceAlertDay : translations.voiceAlertHour)
            .replace('{pet}', appt.petName)
            .replace('{type}', translatedType);

        let timer: ReturnType<typeof setTimeout>;

        const speakLoop = () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel(); // Ensure clean slate
                
                const utterance = new SpeechSynthesisUtterance(text);
                const targetLang = language === 'pt' ? 'pt-BR' : 'en-US';
                utterance.lang = targetLang;
                utterance.rate = 1;
                
                // Voice selection logic:
                // 1. Try to find a "Male" voice for the target language.
                // 2. Fallback to "Google" voice (usually high quality).
                // 3. Fallback to any voice for the language.
                const voices = window.speechSynthesis.getVoices();
                
                const maleVoice = voices.find(v => 
                    v.lang === targetLang && 
                    (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('masculino'))
                );
                
                const googleVoice = voices.find(v => v.lang === targetLang && v.name.includes('Google'));
                
                utterance.voice = maleVoice || googleVoice || voices.find(v => v.lang === targetLang) || null;
                
                // CRITICAL FIX: Assign utterance to window to prevent Garbage Collection from cutting audio
                window.currentUtterance = utterance;

                // When finished, wait 5 seconds and speak again (Loop)
                utterance.onend = () => {
                    timer = setTimeout(speakLoop, 5000);
                };
                
                window.speechSynthesis.speak(utterance);
            }
        };

        // We need to ensure voices are loaded before speaking (Chrome issue)
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = speakLoop;
        } else {
            speakLoop();
        }

        return () => {
            clearTimeout(timer);
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                window.currentUtterance = undefined;
            }
        };
    }, [activeAlertIds, dismissedNotificationIds, appointments, language, translations]);

    
    return (
        <div className={`min-h-screen text-text-light dark:text-text-dark font-sans flex flex-col ${!hasBg ? 'bg-background-light dark:bg-background-dark' : 'bg-transparent'}`}>
            <header className={`sticky top-0 z-20 p-4 flex justify-between items-center ${hasBg ? 'bg-surface-light/70 dark:bg-surface-dark/70 backdrop-blur-md' : 'bg-surface-light dark:bg-surface-dark shadow-md'}`}>
                <h1 className="text-xl md:text-2xl font-bold text-primary dark:text-primary-light">{title}</h1>
                
                <div className="flex items-center space-x-2">
                    {/* Notification Center */}
                    <div className="relative" ref={notificationRef}>
                        <button 
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative" 
                            aria-label={translations.notifications}
                        >
                            <BellIcon className="w-6 h-6" />
                            {hasNotifications && (
                                <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-gray-800 animate-pulse" />
                            )}
                        </button>

                        {isNotificationsOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl py-2 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-gray-100 dark:border-gray-700">
                                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{translations.notifications}</h3>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {upcomingNotifications.length > 0 ? (
                                        upcomingNotifications.map(appt => (
                                            <div 
                                                key={appt.id} 
                                                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700/50 last:border-0 flex items-start space-x-3 group"
                                            >
                                                <div className="flex-shrink-0 mt-1">
                                                    <CalendarIcon className="w-5 h-5 text-primary dark:text-primary-light" />
                                                </div>
                                                <div className="flex-grow cursor-pointer" onClick={() => { navigate('/schedule'); setIsNotificationsOpen(false); }}>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {appt.petName} - {getTranslatedType(appt.type)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(appt.dateTime).toLocaleString()}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); dismissNotification(appt.id); }}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                                                    title={translations.dismiss}
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                            {translations.noNotifications}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={openSettings} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={translations.settings}>
                        <CogIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>
            <main className="flex-grow p-4 md:p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {children}
                </div>
            </main>
            {showBottomNav && (
                <footer className={`bg-surface-light dark:bg-surface-dark shadow-lg sticky bottom-0 z-10 border-t border-gray-200 dark:border-gray-700 ${hasBg ? 'bg-surface-light/70 dark:bg-surface-dark/70 backdrop-blur-md' : 'bg-surface-light dark:bg-surface-dark shadow-lg'}`}>
                    <nav className="max-w-4xl mx-auto p-2 flex justify-around items-center">
                        {canGoBack && (
                             <button onClick={() => navigate(location.state.from)} className="flex flex-col items-center text-secondary-dark dark:text-secondary-light hover:text-primary dark:hover:text-primary-light transition-colors">
                                <ArrowLeftIcon className="w-7 h-7" />
                                <span className="text-xs font-medium">{translations.back}</span>
                            </button>
                        )}
                        <button onClick={() => navigate('/pets')} className="flex flex-col items-center text-secondary-dark dark:text-secondary-light hover:text-primary dark:hover:text-primary-light transition-colors">
                            <HomeIcon className="w-7 h-7" />
                            <span className="text-xs font-medium">{translations.home}</span>
                        </button>
                    </nav>
                </footer>
            )}
        </div>
    );
};
