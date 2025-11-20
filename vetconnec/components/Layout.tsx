

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { HomeIcon, ArrowLeftIcon, CogIcon, BellIcon, CalendarIcon, XMarkIcon } from './Icons';
import { AppointmentStatus } from '../types';

export const Layout: React.FC<{ children: React.ReactNode; title: string; overrideBackground?: boolean; }> = ({ children, title, overrideBackground = false }) => {
    const { translations, background, openSettings, appointments, language, dismissedNotificationIds, dismissNotification, spokenAlertIds } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    
    // Hide bottom nav on Home (Login) page AND Pets List page. 
    // normalize path to remove trailing slash for consistent matching
    const normalizedPath = location.pathname.endsWith('/') && location.pathname.length > 1 
        ? location.pathname.slice(0, -1) 
        : location.pathname;
        
    const showBottomNav = !['/', '/pets'].includes(normalizedPath);
    const canGoBack = location.state?.from;
    const hasBg = background || overrideBackground;
    
    // Notification Logic: Get appointments in the next 24 hours that are NOT dismissed
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const upcomingNotifications = appointments.filter(appt => {
        const apptDate = new Date(appt.dateTime);
        return appt.status === AppointmentStatus.Scheduled && 
               apptDate > now && 
               apptDate <= next24h &&
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

    // Voice Alert Logic (TTS)
    useEffect(() => {
        const checkAndSpeak = () => {
            const currentTime = new Date().getTime();

            appointments.forEach(appt => {
                if (appt.status !== AppointmentStatus.Scheduled) return;
                
                // If the user has dismissed this notification, don't speak about it
                if (dismissedNotificationIds.includes(appt.id)) return;

                const apptTime = new Date(appt.dateTime).getTime();
                const diffMs = apptTime - currentTime;
                const diffHours = diffMs / (1000 * 60 * 60);

                // Thresholds (approximate windows to catch the event)
                // 24 Hours warning (between 23.9 and 24.1 hours)
                if (diffHours >= 23.9 && diffHours <= 24.1) {
                    const alertKey = `${appt.id}-24h`;
                    // Check global ref instead of local
                    if (!spokenAlertIds.current.has(alertKey)) {
                        speakAlert(translations.voiceAlertDay.replace('{pet}', appt.petName));
                        spokenAlertIds.current.add(alertKey);
                    }
                }

                // 1 Hour warning (between 0.9 and 1.1 hours)
                if (diffHours >= 0.9 && diffHours <= 1.1) {
                    const alertKey = `${appt.id}-1h`;
                    if (!spokenAlertIds.current.has(alertKey)) {
                        speakAlert(translations.voiceAlertHour.replace('{pet}', appt.petName));
                        spokenAlertIds.current.add(alertKey);
                    }
                }
            });
        };

        const speakAlert = (text: string) => {
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech to avoid queue pile-up if user navigates fast
                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(text);
                // Try to set voice based on language
                utterance.lang = language === 'pt' ? 'pt-BR' : 'en-US';
                utterance.rate = 1; // Normal speed
                utterance.pitch = 1;
                
                window.speechSynthesis.speak(utterance);
            }
        };

        // Check every 60 seconds
        const intervalId = setInterval(checkAndSpeak, 60000);
        
        // Run once immediately on mount/update to check current status
        checkAndSpeak();

        return () => clearInterval(intervalId);
    }, [appointments, language, translations, dismissedNotificationIds, spokenAlertIds]);
    
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
                                                        {appt.petName} - {appt.type}
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
