
import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../App';
import { Layout } from '../components/Layout';
import { CalendarIcon } from '../components/Icons';
import { WeightChart } from '../components/WeightChart';

export const PetDetailScreen: React.FC = () => {
    const { petId } = useParams<{ petId: string }>();
    const { getPet, getRecordForPet, translations } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    const pet = petId ? getPet(petId) : undefined;
    const record = petId ? getRecordForPet(petId) : undefined;
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    if (!pet) {
        return (
            <Layout title="Pet Not Found">
                <p>The pet you are looking for does not exist.</p>
            </Layout>
        );
    }
    
    const DetailItem: React.FC<{label: string; value: string | React.ReactNode}> = ({label, value}) => (
        <div className="py-3 border-b border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4 items-center">
            <p className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark col-span-1">{label}</p>
            <p className="text-md col-span-2">{value}</p>
        </div>
    );

    const getTranslatedValue = (key: string) => {
        const translationKey = key.toLowerCase();
        return translations[translationKey as keyof typeof translations] || key;
    };
    
    const sortedHistory = [...(record?.weightHistory || [])].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return (
        <div className="relative min-h-screen">
            <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center bg-fixed transition-all duration-500 z-0"
                style={{ backgroundImage: `url(${pet.photoUrl})` }}
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"></div>
            
            <div className="relative z-10">
                <Layout title={translations.petDetails} overrideBackground={true}>
                    <div className="p-4 sm:p-6 rounded-lg shadow-lg bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row md:space-x-8">
                            {/* First column: Photo */}
                            <div className="flex-shrink-0 mb-6 md:mb-0 text-center">
                                <img src={pet.photoUrl} alt={pet.name} className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-primary-light mx-auto" />
                            </div>
                            
                            {/* Second column: Details */}
                            <div className="flex-grow">
                                <h2 className="text-3xl font-bold text-text-light dark:text-text-dark mb-4 text-center md:text-left">{pet.name}</h2>
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                                     <DetailItem label={translations.microchip} value={pet.microchip} />
                                     <DetailItem label={translations.species} value={getTranslatedValue(pet.species)} />
                                     <DetailItem label={translations.breed} value={pet.breed} />
                                     <DetailItem label={translations.gender} value={getTranslatedValue(pet.gender)} />
                                     <DetailItem label={translations.color} value={pet.color} />
                                     <DetailItem label={translations.sterilized} value={pet.isSterilized ? translations.yes : translations.no} />
                                     <DetailItem label={translations.behaviorWithAnimals} value={getTranslatedValue(pet.behaviorWithAnimals)} />
                                     <DetailItem label={translations.behaviorWithPeople} value={getTranslatedValue(pet.behaviorWithPeople)} />
                                </div>
                            </div>
                        </div>
                        
                        {record && record.weightHistory && record.weightHistory.length >= 2 && (
                            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-text-light dark:text-text-dark">{translations.animalWeight}</h3>
                                    <button 
                                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} 
                                        className="px-3 py-1 text-sm font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20"
                                        aria-label="Toggle weight chart sort order"
                                    >
                                        {translations.date.split(' ')[0]} {sortOrder === 'asc' ? '▲' : '▼'}
                                    </button>
                                </div>
                                <WeightChart data={sortedHistory} sortOrder={sortOrder} />
                            </div>
                        )}
                    </div>
                    
                    {/* Footer Actions */}
                    <footer className="bg-surface-light/70 dark:bg-surface-dark/70 backdrop-blur-md shadow-lg sticky bottom-0 z-10 border-t border-gray-200 dark:border-gray-700 mt-6 -mx-4 -mb-4 md:-mx-6 md:-mb-6">
                        <nav className="max-w-4xl mx-auto p-2 flex justify-around items-center">
                            <button onClick={() => navigate(`/appointment/new/${pet.id}`)} className="flex flex-col items-center text-secondary-dark dark:text-secondary-light hover:text-primary dark:hover:text-primary-light transition-colors">
                                <CalendarIcon className="w-7 h-7" />
                                <span className="text-xs font-medium">{translations.appointments}</span>
                            </button>
                            <button onClick={() => navigate(`/record/${pet.id}`, { state: { from: location.pathname } })} className="flex flex-col items-center text-secondary-dark dark:text-secondary-light hover:text-primary dark:hover:text-primary-light transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                <span className="text-xs font-medium">{translations.medicalRecord}</span>
                            </button>
                        </nav>
                    </footer>
                </Layout>
            </div>
        </div>
    );
};