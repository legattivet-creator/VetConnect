import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../src/App';
import type { Pet } from '../types';
import { Species, AppointmentStatus, AppointmentType } from '../types';
import { Layout } from '../components/Layout';
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon, LogOutIcon, FirstAidIcon, PillIcon, MagnifyingGlassIcon } from '../components/Icons';

const PetCard: React.FC<{ pet: Pet; onEdit: (id: string) => void; onDelete: (id: string) => void; onOpen: (id: string) => void; }> = ({ pet, onEdit, onDelete, onOpen }) => {
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
    }, [appointments, pet.id, updateAppointment]);

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
        'cursor-pointer transition-all duration-200 hover:shadow-lg',
        countdownStatus === 'due' ? 'animate-flash-warning' : '',
        countdownStatus === 'urgent' ? 'animate-flash-urgent' : '',
        countdownStatus === 'soon' ? 'animate-flash-soon' : '',
    ].join(' ').replace(/\s+/g, ' ').trim();

    return (
        <div
            onClick={() => onOpen(pet.id)}
            className={cardClasses}
        >
            <img src={pet.photoUrl} alt={pet.name} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-secondary-light flex-shrink-0" />
            <div className="flex-grow min-w-0">
                <div className="flex items-center space-x-2">
                    <h3 className="text-lg md:text-xl font-bold truncate">{pet.name}</h3>
                    {displayElement}
                </div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark truncate">{pet.microchip}</p>
            </div>

            <div className="flex flex-col space-y-2 flex-shrink-0">
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(pet.id); }}
                        className="p-2 text-secondary-dark dark:text-secondary-light hover:text-primary dark:hover:text-primary-light transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        title={translations.editPet}
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(pet.id); }}
                        className="p-2 text-secondary-dark dark:text-secondary-light hover:text-red-600 dark:hover:text-red-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        title={translations.removePet}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>

            </div>
        </div>
    );
};


export const PetListScreen: React.FC = () => {
    const { pets, deletePet, translations, logout, background, language } = useAppContext();
    const navigate = useNavigate();
    const [filter, setFilter] = useState<Species | 'All'>('All');
    const [searchText, setSearchText] = useState('');
    const [petToDelete, setPetToDelete] = useState<string | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

    const filteredPets = pets.filter(p => {
        // 1. Species Filter
        if (filter !== 'All' && p.species !== filter) return false;

        // 2. Text Search
        if (!searchText) return true;
        const lowerSearch = searchText.toLowerCase();

        // Check Pet Fields
        if (p.name.toLowerCase().includes(lowerSearch)) return true;
        if (p.microchip?.toLowerCase().includes(lowerSearch)) return true;
        if (p.breed?.toLowerCase().includes(lowerSearch)) return true;

        // Check Owner Fields
        if (p.owner) {
            if (p.owner.name?.toLowerCase().includes(lowerSearch)) return true;
            if (p.owner.email?.toLowerCase().includes(lowerSearch)) return true;
            if (p.owner.phone?.toLowerCase().includes(lowerSearch)) return true;
            if (p.owner.nif?.toLowerCase().includes(lowerSearch)) return true;
            if (p.owner.address?.toLowerCase().includes(lowerSearch)) return true;
        }

        // Check Foster Fields
        if (p.foster) {
            if (p.foster.name?.toLowerCase().includes(lowerSearch)) return true;
            if (p.foster.email?.toLowerCase().includes(lowerSearch)) return true;
        }

        return false;
    });

    const handleEditPet = (id: string) => {
        navigate(`/pet/edit/${id}`);
    };

    const handleDeleteRequest = (id: string) => {
        setPetToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (petToDelete) {
            deletePet(petToDelete);
            setPetToDelete(null);
            setDeleteModalOpen(false);
        }
    };

    return (
        <Layout title={translations.pets} showBackButton={false}>
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={language === 'pt' ? "Buscar por nome, chip, tutor..." : "Search by name, chip, owner..."}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark focus:ring-primary focus:border-primary sm:text-sm placeholder-gray-400"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>

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
                            <PetCard
                                key={pet.id}
                                pet={pet}
                                onEdit={handleEditPet}
                                onDelete={handleDeleteRequest}
                                onOpen={(id) => navigate(`/pet/${id}`)}
                            />
                        ))
                    ) : (
                        <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-8">{`No ${filter !== 'All' ? filter.toLowerCase() : ''} pets found.`}</p>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && petToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">{translations.confirmDelete}</h3>
                        <p className="mb-6 text-sm text-text-secondary-light dark:text-text-secondary-dark">{`You are about to delete ${pets.find(p => p.id === petToDelete)?.name}. This action cannot be undone.`}</p>
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
