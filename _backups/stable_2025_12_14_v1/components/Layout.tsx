import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../src/App';
import { HomeIcon, ArrowLeftIcon, CogIcon, BellIcon, CalendarIcon, XMarkIcon, Bars3Icon, PlusIcon, FirstAidIcon, LogOutIcon, UserIcon, QrCodeIcon } from './Icons';
import { AppointmentStatus } from '../types';
import { Geolocation } from '@capacitor/geolocation';
import { Browser } from '@capacitor/browser';

export const Layout: React.FC<{
    children: React.ReactNode;
    title: string;
    overrideBackground?: boolean;
    backPath?: string;
    showBackButton?: boolean;
}> = ({ children, title, overrideBackground = false, backPath, showBackButton = true }) => {
    const { translations, background, openSettings, appointments, language, dismissedNotificationIds, dismissNotification, logout, getPet, notificationAudioLanguage, setNotificationAudioLanguage } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLDivElement>(null);

    const normalizedPath = location.pathname.endsWith('/') && location.pathname.length > 1
        ? location.pathname.slice(0, -1)
        : location.pathname;

    const showBottomNav = !['/', '/pets'].includes(normalizedPath);
    const showHomeButton = !['/', '/pets', '/home'].includes(normalizedPath);

    const canGoBack = (backPath || location.state?.from) && showBackButton;

    // Background Logic
    let computedBgImage: string | null = null;
    if (normalizedPath === '/pets') {
        computedBgImage = background || '/default-bg.jpg';
    } else if (params.petId) {
        const currentPet = getPet(params.petId);
        if (currentPet?.photoUrl) {
            computedBgImage = currentPet.photoUrl;
        }
    }

    const hasBg = !!computedBgImage;

    // Notification logic
    const now = new Date();
    const next24hBuffer = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 1000);
    const upcomingNotifications = appointments
        .filter(appt => {
            const apptDate = new Date(appt.dateTime);
            return appt.status === AppointmentStatus.Scheduled &&
                apptDate > now &&
                apptDate <= next24hBuffer &&
                !dismissedNotificationIds.includes(appt.id);
        })
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    const hasNotifications = upcomingNotifications.length > 0;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node) && isDrawerOpen) {
                setIsDrawerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDrawerOpen]);

    // Scroll to top on route change
    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTop = 0;
        }
    }, [location.pathname]);

    // ... (rest of methods)

    const handleUrgency = async () => {
        // ... (omitted)
        setIsDrawerOpen(false); // dummy replacement start point to avoid omitting too much
        try {
            const coordinates = await Geolocation.getCurrentPosition();
            const { latitude, longitude } = coordinates.coords;
            const query = 'veterinários abertos agora';
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&ll=${latitude},${longitude}`;
            await Browser.open({ url });
        } catch (error) {
            console.error('Error getting location', error);
            const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('veterinários abertos agora')}`;
            await Browser.open({ url: fallbackUrl });
        }
    };

    // ... (handleNavigation, handleSettings)

    const handleNavigation = (path: string) => {
        navigate(path);
        setIsDrawerOpen(false);
    };

    const handleSettings = () => {
        openSettings();
        setIsDrawerOpen(false);
    };

    return (
        <div className={`min-h-screen text-text-light dark:text-text-dark font-sans flex flex-col ${!hasBg ? 'bg-background-light dark:bg-background-dark' : 'bg-transparent'}`}>
            {hasBg && computedBgImage && (
                <div
                    className="fixed inset-0 z-[-1]"
                    style={{
                        backgroundImage: `url(${computedBgImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        opacity: 0.5
                    }}
                />
            )}
            <header className={`sticky top-0 z-20 p-4 flex justify-between items-center ${hasBg ? 'bg-surface-light/70 dark:bg-surface-dark/70 backdrop-blur-md' : 'bg-surface-light dark:bg-surface-dark shadow-md'}`}>
                <div className="flex items-center space-x-3">
                    {/* Menu button always shown when drawer is available */}
                    {isDrawerOpen !== undefined && (
                        <button
                            onClick={e => { e.stopPropagation(); setIsDrawerOpen(true); }}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-2"
                        >
                            <Bars3Icon className="w-7 h-7 text-primary dark:text-primary-light" />
                        </button>
                    )}
                    {showHomeButton && (
                        <button
                            onClick={() => navigate('/pets')}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-2"
                            title={translations.home}
                        >
                            <HomeIcon className="w-6 h-6 text-primary dark:text-primary-light" />
                        </button>
                    )}
                    {canGoBack && (
                        <button
                            onClick={() => navigate(backPath || location.state?.from)}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ArrowLeftIcon className="w-6 h-6 text-primary dark:text-primary-light" />
                        </button>
                    )}
                    <h1 className="text-xl md:text-2xl font-bold text-primary dark:text-primary-light">{title}</h1>
                </div>
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
                                    {hasNotifications ? (
                                        upcomingNotifications.map(appt => (
                                            <div key={appt.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700/50 last:border-0 flex items-start space-x-3 group">
                                                <div className="flex-shrink-0 mt-1">
                                                    <CalendarIcon className="w-5 h-5 text-primary dark:text-primary-light" />
                                                </div>
                                                <div className="flex-grow cursor-pointer" onClick={() => { navigate('/schedule'); setIsNotificationsOpen(false); }}>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {appt.petName} - {translations[appt.type?.toLowerCase() as keyof typeof translations] || appt.type}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(appt.dateTime).toLocaleString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={e => { e.stopPropagation(); dismissNotification(appt.id); }}
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
                </div>
            </header>
            {/* Side Drawer */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-40 flex">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
                    <div ref={drawerRef} className="relative z-50 w-64 h-full bg-surface-light dark:bg-surface-dark shadow-2xl flex flex-col transition-transform duration-300">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-primary/10 dark:bg-primary/20">
                            <h2 className="text-2xl font-bold text-primary dark:text-primary-light">VetConnect</h2>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">{translations.welcome}</p>
                        </div>
                        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">


                            <button onClick={() => handleNavigation('/pet/new')} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left font-medium">
                                <PlusIcon className="w-6 h-6 text-green-600" />
                                <span>{translations.addPet}</span>
                            </button>

                            <button onClick={() => handleNavigation('/import-animal')} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left font-medium">
                                <QrCodeIcon className="w-6 h-6 text-purple-600" />
                                <span>Importar Animal</span>
                            </button>


                            <button
                                onClick={() => handleNavigation(params.petId ? `/pet/${params.petId}/owner` : '/tutor')}
                                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left font-medium"
                            >
                                <UserIcon className="w-6 h-6 text-indigo-500" />
                                <span>{translations.owner || 'Tutor'}</span>
                            </button>

                            <button onClick={() => handleNavigation('/schedule')} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left font-medium">
                                <CalendarIcon className="w-6 h-6 text-blue-500" />
                                <span>{translations.schedule}</span>
                            </button>
                            <button onClick={handleUrgency} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left font-medium">
                                <FirstAidIcon className="w-6 h-6 text-red-500" />
                                <span>{translations.urgency}</span>
                            </button>
                            <div className="border-t border-gray-100 dark:border-gray-700 my-2" />
                            <button onClick={handleSettings} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left font-medium">
                                <CogIcon className="w-6 h-6 text-gray-500" />
                                <span>{translations.settings}</span>
                            </button>

                            {/* Audio Notifications Selector */}
                            <div className="px-4 py-3">
                                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                                    Áudio das notificações
                                </label>
                                <select
                                    value={notificationAudioLanguage}
                                    onChange={(e) => setNotificationAudioLanguage(e.target.value as any)}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm"
                                >
                                    <option value="PT_PT">Português (PT)</option>
                                    <option value="PT_BR">Português (BR)</option>
                                    <option value="EN">English</option>
                                </select>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-700 my-2" />
                            <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left font-medium">
                                <LogOutIcon className="w-6 h-6 text-red-600" />
                                <span>{translations.logout}</span>
                            </button>
                        </nav>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-center text-text-secondary-light dark:text-text-secondary-dark mb-4">Version 1.0.0</p>
                        </div>
                    </div>
                </div>
            )}

            <main ref={mainRef} className="flex-grow p-4 md:p-6 overflow-y-auto pb-20">
                <div className="max-w-4xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

