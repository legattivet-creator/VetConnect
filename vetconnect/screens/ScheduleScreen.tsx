import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../App';
import type { Appointment, AppointmentType } from '../types';
import { AppointmentStatus, AppointmentType as AppointmentTypeEnum } from '../types';
import { Layout } from '../components/Layout';
import { PencilIcon, TrashIcon, PlusIcon, CalendarPlusIcon } from '../components/Icons';

const StyledNotes: React.FC<{ notes: string, lastDoseText: string, lastBathText: string }> = ({ notes, lastDoseText, lastBathText }) => {
    if (!notes) return null;

    const lastDoseTextWithParens = `(${lastDoseText})`;
    const lastBathTextWithParens = `(${lastBathText})`;
    
    let textToHighlight = '';
    if (notes.includes(lastDoseTextWithParens)) {
        textToHighlight = lastDoseTextWithParens;
    } else if (notes.includes(lastBathTextWithParens)) {
        textToHighlight = lastBathTextWithParens;
    }

    if (!textToHighlight) {
        return <p className="text-sm mt-1 whitespace-pre-wrap">{notes}</p>;
    }
    
    const parts = notes.split(textToHighlight);
    
    return (
        <p className="text-sm mt-1 whitespace-pre-wrap">
            {parts.map((part, index) => (
                <React.Fragment key={index}>
                    {part}
                    {index < parts.length - 1 && (
                         <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                            {textToHighlight}
                        </span>
                    )}
                </React.Fragment>
            ))}
        </p>
    );
};

const getTranslatedAppointmentType = (type: AppointmentType, translations: Record<string, string>) => {
    const key = type.toLowerCase().replace(/[^a-z0-9]/gi, '');
    return translations[key] || type;
};

const Countdown: React.FC<{ targetDate: Date, onFinish: () => void }> = ({ targetDate, onFinish }) => {
    const { translations } = useAppContext();
    
    const calculateTimeLeft = useCallback(() => {
        const difference = +new Date(targetDate) - +new Date();
        if (difference > 0) {
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return {};
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        if (new Date(targetDate) <= new Date()) {
            onFinish();
            return;
        }

        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            if (Object.keys(newTimeLeft).length > 0) {
                setTimeLeft(newTimeLeft);
            } else {
                setTimeLeft({});
                onFinish();
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate, onFinish, calculateTimeLeft]);

    const timeParts = [
        timeLeft.days > 0 && `${timeLeft.days}${translations.days}`,
        `${timeLeft.hours < 10 ? '0' : ''}${timeLeft.hours || 0}${translations.hours}`,
        `${timeLeft.minutes < 10 ? '0' : ''}${timeLeft.minutes || 0}${translations.minutes}`,
        `${timeLeft.seconds < 10 ? '0' : ''}${timeLeft.seconds || 0}${translations.seconds}`,
    ].filter(Boolean);


    return (
        <div className="flex flex-wrap justify-center sm:justify-end items-center space-x-2 text-xl sm:text-2xl font-mono text-primary dark:text-primary-light">
           {timeParts.map((part, index) => <span key={index}>{part}</span>)}
        </div>
    );
};

const AppointmentCard: React.FC<{ 
    appointment: Appointment; 
    onCancel: (appointment: Appointment) => void;
    isSelectionMode: boolean;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
}> = ({ appointment, onCancel, isSelectionMode, isSelected, onToggleSelection }) => {
    const { language, translations, background, updateAppointmentStatus, updateAppointment } = useAppContext();
    const navigate = useNavigate();
    
    const isTreatmentType = [AppointmentTypeEnum.TreatmentMedication, AppointmentTypeEnum.TherapeuticBath].includes(appointment.type);
    const isRecurringTreatment = isTreatmentType && (!!appointment.frequency || !!appointment.bathFrequency);
    
    const [countdownStatus, setCountdownStatus] = useState<'active' | 'soon' | 'urgent' | 'due'>(() => {
        const now = new Date().getTime();
        const dueTime = new Date(appointment.dateTime).getTime();
        const timeLeft = dueTime - now;
        if (timeLeft <= 0) return 'due';
        if (timeLeft <= 10 * 60 * 1000) return 'urgent';
        if (timeLeft <= 60 * 60 * 1000) return 'soon';
        return 'active';
    });
    
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const dueTime = new Date(appointment.dateTime).getTime();
            const timeLeft = dueTime - now;
            
            let newStatus: 'active' | 'soon' | 'urgent' | 'due';

            if (timeLeft <= 0) {
                newStatus = 'due';
                clearInterval(interval);
                updateAppointment(appointment);
            } else if (timeLeft <= 10 * 60 * 1000) {
                newStatus = 'urgent';
            } else if (timeLeft <= 60 * 60 * 1000) {
                newStatus = 'soon';
            } else {
                newStatus = 'active';
            }
            
            setCountdownStatus(currentStatus => {
                if (currentStatus !== newStatus) {
                    return newStatus;
                }
                return currentStatus;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [appointment, updateAppointment]);
    
    const generateGoogleCalendarLink = (appointment: Appointment): string => {
        const formatGCDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const startTime = appointment.dateTime;
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Assume 1 hour duration

        const url = new URL('https://www.google.com/calendar/render');
        url.searchParams.set('action', 'TEMPLATE');
        url.searchParams.set('text', `${appointment.petName} - ${getTranslatedAppointmentType(appointment.type, translations)}`);
        url.searchParams.set('dates', `${formatGCDate(startTime)}/${formatGCDate(endTime)}`);
        url.searchParams.set('details', appointment.notes);

        return url.toString();
    };

    const cardClasses = [
        background ? 'bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm' : 'bg-surface-light dark:bg-surface-dark',
        'rounded-lg shadow-md transition-all duration-300',
        isSelectionMode 
            ? 'p-4 cursor-pointer flex items-center space-x-4' 
            : 'p-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 sm:p-4 sm:flex sm:flex-row sm:items-center sm:space-x-4',
        isSelected ? 'ring-2 ring-primary dark:ring-primary-light' : '',
        !isSelectionMode && countdownStatus === 'due' ? 'animate-flash-warning' : '',
        !isSelectionMode && countdownStatus === 'urgent' ? 'animate-flash-urgent' : '',
        !isSelectionMode && countdownStatus === 'soon' ? 'animate-flash-soon' : '',
    ].join(' ').replace(/\s+/g, ' ').trim();

    return (
        <div className={cardClasses} onClick={() => isSelectionMode && onToggleSelection(appointment.id)}>
             {isSelectionMode && (
                <div className="flex items-center justify-center self-center sm:self-auto sm:pr-2">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                        aria-label={`Select appointment for ${appointment.petName}`}
                    />
                </div>
            )}
            <img src={appointment.petPhotoUrl} alt={appointment.petName} className={`rounded-full object-cover ${isSelectionMode ? 'w-16 h-16' : 'w-12 h-12 col-start-1 row-start-1'} sm:w-16 sm:h-16`} />
            <div className={`flex-grow text-left ${isSelectionMode ? '' : 'col-start-2 row-start-1'} sm:mt-0`}>
                <h3 className="text-lg font-bold">{appointment.petName} - <span className="text-primary dark:text-primary-light">{getTranslatedAppointmentType(appointment.type, translations)}</span></h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">{new Date(appointment.dateTime).toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}</p>
                <StyledNotes notes={appointment.notes} lastDoseText={translations.lastDose} lastBathText={translations.lastBath} />
            </div>
            {!isSelectionMode && (
                <div className="contents sm:mt-0 sm:self-center sm:self-end sm:flex sm:flex-col sm:items-end sm:space-y-2 sm:w-auto">
                    {countdownStatus === 'due' ? (
                        <div className="col-start-1 col-span-3 row-start-2 flex flex-col items-center space-y-2 w-full sm:items-end">
                           <p className="text-base font-bold text-black dark:text-white text-right">{translations.awaitingStatus}</p>
                            <div className="flex items-center space-x-2">
                                {(() => {
                                    const attendedText = isTreatmentType ? translations.administered : translations.attended;
                                    const missedText = isTreatmentType ? translations.notAdministered : translations.didNotAttend;
                                    
                                    return (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); updateAppointmentStatus(appointment.id, AppointmentStatus.Completed); }}
                                                className="px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700"
                                            >
                                                {attendedText}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); updateAppointmentStatus(appointment.id, AppointmentStatus.Missed); }}
                                                className="px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
                                            >
                                                {missedText}
                                            </button>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        <>
                             {/* Mobile elements */}
                            <div className="col-start-1 col-span-2 row-start-2 flex justify-between items-center sm:hidden">
                                <button 
                                    onClick={() => navigate(`/appointment/edit/${appointment.id}`)} 
                                    disabled={isRecurringTreatment}
                                    className="p-2 text-secondary-dark dark:text-secondary-light hover:text-primary dark:hover:text-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                                <Countdown targetDate={new Date(appointment.dateTime)} onFinish={() => setCountdownStatus('due')} />
                                <button onClick={() => onCancel(appointment)} className="p-2 text-secondary-dark dark:text-secondary-light hover:text-red-600 dark:hover:text-red-500 transition-colors">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Desktop wrapper and elements */}
                            <div className="hidden sm:flex sm:flex-col sm:items-end sm:space-y-2">
                                <Countdown targetDate={new Date(appointment.dateTime)} onFinish={() => setCountdownStatus('due')} />
                                <div className="flex items-center space-x-2">
                                     <button
                                        onClick={(e) => { e.stopPropagation(); window.open(generateGoogleCalendarLink(appointment), '_blank'); }}
                                        className="p-2 text-secondary-dark dark:text-secondary-light hover:text-primary dark:hover:text-primary-light transition-colors"
                                        aria-label={translations.addToCalendar}
                                    >
                                        <CalendarPlusIcon className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => navigate(`/appointment/edit/${appointment.id}`)} 
                                        disabled={isRecurringTreatment}
                                        className="p-2 text-secondary-dark dark:text-secondary-light hover:text-primary dark:hover:text-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => onCancel(appointment)} className="p-2 text-secondary-dark dark:text-secondary-light hover:text-red-600 dark:hover:text-red-500 transition-colors">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};


const HistoryCard: React.FC<{ 
    appointment: Appointment; 
    onDelete: (appointment: Appointment) => void;
    isSelectionMode: boolean;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
}> = ({ appointment, onDelete, isSelectionMode, isSelected, onToggleSelection }) => {
    const { language, translations, background } = useAppContext();
    
    const isTreatmentType = [AppointmentTypeEnum.TreatmentMedication, AppointmentTypeEnum.TherapeuticBath].includes(appointment.type);
    const statusText = appointment.status === AppointmentStatus.Completed 
        ? (isTreatmentType ? translations.administered : translations.attended) 
        : (isTreatmentType ? translations.notAdministered : translations.didNotAttend);
        
    const statusColor = appointment.status === AppointmentStatus.Completed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-500';
    
    const cardClasses = [
        background ? 'bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm' : 'bg-surface-light dark:bg-surface-dark',
        'p-4 rounded-lg shadow-md flex items-center space-x-4 opacity-80 transition-all duration-300',
        isSelectionMode ? 'cursor-pointer' : '',
        isSelected ? 'ring-2 ring-primary dark:ring-primary-light' : ''
    ].join(' ');

    return (
        <div className={cardClasses} onClick={() => isSelectionMode && onToggleSelection(appointment.id)}>
            {isSelectionMode && (
                 <div className="flex items-center justify-center pr-2">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                        aria-label={`Select appointment for ${appointment.petName}`}
                    />
                </div>
            )}
            <img src={appointment.petPhotoUrl} alt={appointment.petName} className="w-16 h-16 rounded-full object-cover" />
            <div className="flex-grow">
                <h3 className="text-lg font-bold">{appointment.petName} - <span className="text-primary dark:text-primary-light">{getTranslatedAppointmentType(appointment.type, translations)}</span></h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">{new Date(appointment.dateTime).toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}</p>
                 <StyledNotes notes={appointment.notes} lastDoseText={translations.lastDose} lastBathText={translations.lastBath} />
            </div>
            <div className={`flex items-center space-x-2 ${isSelectionMode ? 'hidden' : ''}`}>
                <p className={`font-semibold text-sm sm:text-base ${statusColor}`}>{statusText}</p>
                <button 
                    onClick={() => onDelete(appointment)} 
                    className="p-2 text-secondary-dark dark:text-secondary-light hover:text-red-600 dark:hover:text-red-500 transition-colors"
                    aria-label={translations.delete}
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


export const ScheduleScreen: React.FC = () => {
    const { appointments, deleteAppointment, deleteAppointments, translations, background, pets } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const [modalInfo, setModalInfo] = useState<{
        appointment: Appointment | null;
        type: 'cancel' | 'delete';
    }>({ appointment: null, type: 'cancel' });
    const [multiDeleteModalOpen, setMultiDeleteModalOpen] = useState(false);
    const [view, setView] = useState<'upcoming' | 'history'>('upcoming');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<string[]>([]);
    const [filterPetId, setFilterPetId] = useState<string>(location.state?.petId || 'all');


    useEffect(() => {
        if (location.state?.petId) {
            setFilterPetId(location.state.petId);
        }
    }, [location.state]);

    const scheduledAppointments = appointments
        .filter(a => a.status === AppointmentStatus.Scheduled && (filterPetId === 'all' || a.petId === filterPetId))
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    const appointmentHistory = appointments
        .filter(a => a.status !== AppointmentStatus.Scheduled && (filterPetId === 'all' || a.petId === filterPetId))
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
        
    const currentViewAppointments = view === 'upcoming' ? scheduledAppointments : appointmentHistory;

    const handleToggleSelectionMode = () => {
        setIsSelectionMode(prev => !prev);
        setSelectedAppointmentIds([]);
    };

    const handleToggleAppointmentSelection = (id: string) => {
        setSelectedAppointmentIds(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedAppointmentIds.length === currentViewAppointments.length) {
            setSelectedAppointmentIds([]);
        } else {
            setSelectedAppointmentIds(currentViewAppointments.map(a => a.id));
        }
    };
    
    const handleDeleteSelected = () => {
        if (selectedAppointmentIds.length > 0) {
            setMultiDeleteModalOpen(true);
        }
    };

    const confirmDeleteSelected = () => {
        deleteAppointments(selectedAppointmentIds);
        setMultiDeleteModalOpen(false);
        setIsSelectionMode(false);
        setSelectedAppointmentIds([]);
    };

    const handleConfirmSingleDelete = () => {
        if (modalInfo.appointment) {
            deleteAppointment(modalInfo.appointment.id);
            setModalInfo({ appointment: null, type: 'cancel' });
        }
    };
    
    const isDeletingHistory = modalInfo.type === 'delete';
    const modalTitle = isDeletingHistory ? translations.confirmDeleteAppointment : translations.confirmCancelAppointment;
    const modalMessage = isDeletingHistory ? translations.areYouSureDeleteAppointment : translations.areYouSureCancel;

    return (
        <Layout title={view === 'upcoming' ? translations.schedule : translations.appointmentHistory}>
             <div className={`mb-4 ${background ? 'bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm' : 'bg-surface-light dark:bg-surface-dark'} p-3 rounded-lg shadow-sm`}>
                <label htmlFor="petFilter" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{translations.filterByPet}</label>
                <select
                    id="petFilter"
                    value={filterPetId}
                    onChange={(e) => setFilterPetId(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white dark:bg-gray-800"
                >
                    <option value="all">{translations.allPets}</option>
                    {pets.map(pet => (
                        <option key={pet.id} value={pet.id}>{pet.name}</option>
                    ))}
                </select>
            </div>
             <div className={`mb-4 p-2 rounded-lg shadow-sm flex space-x-1 justify-between items-center ${background ? 'bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm' : 'bg-surface-light dark:bg-surface-dark'}`}>
                 <div className="flex-grow flex space-x-1">
                    <button
                        onClick={() => setView('upcoming')}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full ${view === 'upcoming' ? 'bg-primary text-white' : `hover:bg-gray-200 dark:hover:bg-gray-700 ${background ? 'text-text-light dark:text-text-dark' : ''}`}`}
                    >
                        {translations.upcoming}
                    </button>
                    <button
                        onClick={() => setView('history')}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full ${view === 'history' ? 'bg-primary text-white' : `hover:bg-gray-200 dark:hover:bg-gray-700 ${background ? 'text-text-light dark:text-text-dark' : ''}`}`}
                    >
                        {translations.history}
                    </button>
                </div>
                 <button onClick={handleToggleSelectionMode} className="ml-2 px-3 py-2 text-sm font-semibold text-primary dark:text-primary-light rounded-md hover:bg-primary/10 transition-colors">
                    {isSelectionMode ? translations.cancelSelection : translations.select}
                </button>
            </div>

            {isSelectionMode && (
                <div className="mb-4 flex items-center justify-end space-x-2">
                    <label htmlFor="selectAll" className="text-sm font-medium">{translations.selectAll}</label>
                    <input 
                        type="checkbox" 
                        id="selectAll"
                        checked={currentViewAppointments.length > 0 && selectedAppointmentIds.length === currentViewAppointments.length}
                        onChange={handleSelectAll}
                        className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                </div>
            )}

            <div className="space-y-4 pb-20">
                {view === 'upcoming' && (
                    scheduledAppointments.length > 0 ? (
                        scheduledAppointments.map(app => 
                            <AppointmentCard 
                                key={app.id} 
                                appointment={app} 
                                onCancel={(appointment) => setModalInfo({ appointment, type: 'cancel' })} 
                                isSelectionMode={isSelectionMode}
                                isSelected={selectedAppointmentIds.includes(app.id)}
                                onToggleSelection={handleToggleAppointmentSelection}
                            />)
                    ) : (
                        <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-8">{translations.noUpcomingAppointments}</p>
                    )
                )}
                {view === 'history' && (
                    appointmentHistory.length > 0 ? (
                        appointmentHistory.map(app => 
                            <HistoryCard 
                                key={app.id} 
                                appointment={app} 
                                onDelete={(appointment) => setModalInfo({ appointment, type: 'delete' })}
                                isSelectionMode={isSelectionMode}
                                isSelected={selectedAppointmentIds.includes(app.id)}
                                onToggleSelection={handleToggleAppointmentSelection}
                            />)
                    ) : (
                        <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-8">{translations.noAppointmentHistory}</p>
                    )
                )}
            </div>

            {/* Floating Action Button */}
            {!isSelectionMode && filterPetId !== 'all' && (
                <button
                    onClick={() => navigate(`/appointment/new/${filterPetId}`)}
                    className="fixed bottom-24 right-6 bg-primary hover:bg-primary-dark text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 z-20"
                    aria-label={translations.newAppointment}
                >
                    <PlusIcon className="w-8 h-8" />
                </button>
            )}


            {/* Selection Mode Footer */}
            {isSelectionMode && selectedAppointmentIds.length > 0 && (
                 <footer className={`fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 dark:border-gray-700 ${background ? 'bg-surface-light/70 dark:bg-surface-dark/70 backdrop-blur-md' : 'bg-surface-light dark:bg-surface-dark shadow-lg'}`}>
                    <div className="max-w-4xl mx-auto p-4 flex justify-center items-center">
                        <button onClick={handleDeleteSelected} className="w-full sm:w-auto bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
                            {translations.deleteSelected} ({selectedAppointmentIds.length})
                        </button>
                    </div>
                 </footer>
            )}

            {/* Single Delete Confirmation Modal */}
            {modalInfo.appointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">{modalTitle}</h3>
                        <p className="mb-6 text-sm text-text-secondary-light dark:text-text-secondary-dark">{modalMessage}</p>
                        <div className="flex justify-end space-x-4">
                            <button onClick={() => setModalInfo({ appointment: null, type: 'cancel' })} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition">{translations.cancel}</button>
                            <button onClick={handleConfirmSingleDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">{translations.delete}</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Multi-Delete Confirmation Modal */}
            {multiDeleteModalOpen && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">{translations.confirmDeleteSelected}</h3>
                        <p className="mb-6 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                            {translations.areYouSureDeleteSelected.replace('{count}', selectedAppointmentIds.length.toString())}
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button onClick={() => setMultiDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition">{translations.cancel}</button>
                            <button onClick={confirmDeleteSelected} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">{translations.delete}</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};