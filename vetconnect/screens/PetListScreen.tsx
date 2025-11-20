import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import type { Pet } from '../types';
import { Species, AppointmentStatus, AppointmentType } from '../types';
import { Layout } from '../components/Layout';
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon, LogOutIcon, FirstAidIcon, PillIcon } from '../components/Icons';

const PetCard: React.FC<{ pet: Pet; isSelected: boolean; onSelect: (id: string) => void; onOpen: (id: string) => void; }> = ({ pet, isSelected, onSelect, onOpen }) => {
    const { translations, appointments, background, updateAppointment } = useAppContext();
    const [countdownStatus, setCountdownStatus] = useState<'none' | 'soon' | 'urgent' | 'due'>('none');

    useEffect(() => {
        const hasPastDue = appointments.some(a => a.petId === pet.id && a.status === AppointmentStatus.Scheduled && new Date(a.dateTime) <= new Date());
        
        const nextAppointment = appointments
            .filter(a => a.petId === pet.id && a.status === AppointmentStatus.Scheduled)
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
            .find(a => new Date(a.dateTime) > new Date());
        
        if (hasPastDue) {
            setCountdownStatus('due');
        }

        if (!nextAppointment) {
            if (!hasPastDue) setCountdownStatus('none');
            return;
        }

        const intervalId = setInterval(() => {
            const now = new Date().getTime();
            const dueTime = new Date(nextAppointment.dateTime).getTime();
            const timeLeft = dueTime - now;

            let newStatus: 'none' | 'soon' | 'urgent' | 'due' = 'none';
            if (timeLeft <= 0) {
                newStatus = 'due';
                onSelect(pet.id);
                updateAppointment(nextAppointment);
                clearInterval(intervalId);
            } else if (timeLeft <= 10 * 60 * 1000) {
                newStatus = 'urgent';
            } else if (timeLeft <= 60 * 60 * 1000) {
                newStatus = 'soon';
            } else {
                newStatus = 'none';
            }
            
            setCountdownStatus(currentStatus => {
                if (hasPastDue && newStatus !== 'due') return 'due';
                if (currentStatus !== newStatus) return newStatus;
                return currentStatus;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [appointments, pet.id, onSelect, updateAppointment]);

    let displayElement = null;
    if (countdownStatus === 'due') {
        displayElement = (
            <p className="text-base font-bold text-black dark:text-white animate-pulse">
                {translations.checkSchedule}
            </p>
        );
    } else {
        const nextAppointment = appointments
            .filter(a => a.petId === pet.id && a.status === AppointmentStatus.Scheduled)
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
            .find(a => new Date(a.dateTime) > new Date());
        
        if (nextAppointment) {
            if (nextAppointment.type === AppointmentType.TreatmentMedication) {
                displayElement = <PillIcon className="w-7 h-7 text-primary-light" />;
            } else {
                displayElement = <CalendarIcon className="w-7 h-7 text-primary-light" />;
            }
        }
    }

    const cardClasses = [
        background ? 'bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm' : 'bg-surface-light dark:bg-surface-dark',
        'p-4 rounded-lg shadow-md flex items-center space-x-4',
        'cursor-pointer transition-all duration-200',
        isSelected ? 'ring-2 ring-primary' : 'hover:shadow-lg',
        countdownStatus === 'due' ? 'animate-flash-warning' : '',
        countdownStatus === 'urgent' ? 'animate-flash-urgent' : '',
        countdownStatus === 'soon' ? 'animate-flash-soon' : '',
    ].join(' ').replace(/\s+/g, ' ').trim();

    return (
        <div 
            onClick={() => onSelect(pet.id)}
            className={cardClasses}
        >
            <img src={pet.photoUrl} alt={pet.name} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-secondary-light" />
            <div className="flex-grow">
                <div className="flex items-center space-x-2">
                    <h3 className="text-lg md:text-xl font-bold">{pet.name}</h3>
                    {displayElement}
                </div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{pet.microchip}</p>
            </div>
            
            <div className="flex flex-col space-y-2 items-stretch w-36">
                <button 
                    onClick={(e) => { e.stopPropagation(); onOpen(pet.id); }}
                    className="bg-primary hover:bg-primary-dark text-white font-semibold py-1 px-3 rounded-lg transition-transform transform hover:scale-105 text-sm"
                >
                    {translations.open}
                </button>
            </div>
        </div>
    );
};


export const PetListScreen: React.FC = () => {
    const { pets, deletePet, translations, logout, background } = useAppContext();
    const navigate = useNavigate();
    const [filter, setFilter] = useState<Species | 'All'>('All');
    const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

    const filteredPets = pets.filter(p => filter === 'All' || p.species === filter);

    const handleSelectPet = (id: string) => {
        setSelectedPetId(prev => (prev === id ? null : id));
    };
    
    const confirmDelete = () => {
        if(selectedPetId) {
            deletePet(selectedPetId);
            setSelectedPetId(null);
            setDeleteModalOpen(false);
        }
    };
    
    const handleEmergency = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                const query = "clínicas veterinárias abertas";
                const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&ll=${latitude},${longitude}`;
                window.open(url, '_blank');
            }, (error) => {
                console.error("Error getting location: ", error);
                alert("Não foi possível obter sua localização. Por favor, verifique as permissões do seu navegador.");
            });
        } else {
            alert("Geolocalização não é suportada por este navegador.");
        }
    };
    
    return (
        <Layout title={translations.pets}>
            <div className="space-y-4">
                <div className={`p-2 rounded-lg shadow-sm flex space-x-1 justify-center ${background ? 'bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm' : 'bg-surface-light dark:bg-surface-dark'}`}>
                    {(['All', ...Object.values(Species)] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full ${filter === f ? 'bg-primary text-white' : `hover:bg-gray-200 dark:hover:bg-gray-700 ${background ? 'text-text-light dark:text-text-dark' : ''}`}`}
                        >
                            {translations[f.toLowerCase() as keyof typeof translations]}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filteredPets.length > 0 ? (
                        filteredPets.map(pet => (
                            <PetCard key={pet.id} pet={pet} isSelected={pet.id === selectedPetId} onSelect={handleSelectPet} onOpen={(id) => navigate(`/pet/${id}`)} />
                        ))
                    ) : (
                        <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-8">{`No ${filter !== 'All' ? filter.toLowerCase() : ''} pets found.`}</p>
                    )}
                </div>

                {!selectedPetId && <p className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">{translations.selectPet}</p>}
            </div>

            {/* Footer Actions */}
            <footer className={`sticky bottom-0 z-10 border-t border-gray-200 dark:border-gray-700 mt-6 -mx-4 -mb-4 md:-mx-6 md:-mb-6 ${background ? 'bg-surface-light/70 dark:bg-surface-dark/70 backdrop-blur-md' : 'bg-surface-light dark:bg-surface-dark shadow-lg'}`}>
                <nav className="max-w-4xl mx-auto p-2 grid grid-cols-6 gap-1 items-center">
                    <button onClick={() => navigate('/pet/new')} className="flex flex-col items-center text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 transition-colors">
                        <PlusIcon className="w-7 h-7" />
                        <span className="text-xs font-medium">{translations.addPet}</span>
                    </button>
                    <button onClick={() => selectedPetId && navigate(`/pet/edit/${selectedPetId}`)} disabled={!selectedPetId} className="flex flex-col items-center text-secondary-dark dark:text-secondary-light hover:text-primary dark:hover:text-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <PencilIcon className="w-7 h-7" />
                        <span className="text-xs font-medium">{translations.editPet}</span>
                    </button>
                     <button onClick={() => setDeleteModalOpen(true)} disabled={!selectedPetId} className="flex flex-col items-center text-secondary-dark dark:text-secondary-light hover:text-red-600 dark:hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <TrashIcon className="w-7 h-7" />
                        <span className="text-xs font-medium">{translations.removePet}</span>
                    </button>
                    <button onClick={() => navigate('/schedule')} className="flex flex-col items-center text-secondary-dark dark:text-secondary-light hover:text-primary dark:hover:text-primary-light transition-colors">
                        <CalendarIcon className="w-7 h-7" />
                        <span className="text-xs font-medium">{translations.schedule}</span>
                    </button>
                    <button onClick={handleEmergency} className="flex flex-col items-center text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 transition-colors">
                        <FirstAidIcon className="w-7 h-7" />
                        <span className="text-xs font-medium">{translations.urgency}</span>
                    </button>
                    <button onClick={logout} className="flex flex-col items-center text-secondary-dark dark:text-secondary-light hover:text-red-600 dark:hover:text-red-500 transition-colors">
                        <LogOutIcon className="w-7 h-7" />
                        <span className="text-xs font-medium">{translations.logout}</span>
                    </button>
                </nav>
            </footer>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedPetId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">{translations.confirmDelete}</h3>
                        <p className="mb-6 text-sm text-text-secondary-light dark:text-text-secondary-dark">{`You are about to delete ${pets.find(p=>p.id === selectedPetId)?.name}. This action cannot be undone.`}</p>
                        <div className="flex justify-end space-x-4">
                            <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition">{translations.cancel}</button>
                            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">{translations.delete}</button>
                        </div>
                    </div>
                </div>
            )}

        </Layout>
    );
};