
import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../src/App';
import { Layout } from '../components/Layout';
import { CalendarIcon, MapPinIcon, EnvelopeIcon, PhoneIcon } from '../components/Icons';
import { WeightChart } from '../components/WeightChart';
import { OwnerInfo } from '../types';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';

// Custom Action Sheet Component for Email Options
const EmailActionSheet: React.FC<{
    email: string;
    onClose: () => void;
    translations: any;
}> = ({ email, onClose, translations }) => {
    const handleOption = async (type: 'default' | 'gmail' | 'yahoo' | 'copy' | 'share') => {
        onClose();
        switch (type) {
            case 'default':
                window.location.href = `mailto:${email}`;
                break;
            case 'gmail':
                window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, '_system');
                break;
            case 'yahoo':
                window.open(`https://compose.mail.yahoo.com/?to=${email}`, '_system');
                break;
            case 'copy':
                await Clipboard.write({ string: email });
                // Optional: Show toast?
                alert('Email copiado!');
                break;
            case 'share':
                try {
                    await Share.share({
                        title: 'Contato',
                        text: email,
                        dialogTitle: 'Compartilhar Email',
                    });
                } catch (e) { console.error(e); }
                break;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-t-2xl p-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6" />
                <h3 className="text-lg font-bold text-center mb-4 text-text-light dark:text-text-dark">
                    {translations.contactOptions || 'Opções de Contato'}
                </h3>
                <div className="space-y-2">
                    <button onClick={() => handleOption('default')} className="w-full p-4 flex items-center space-x-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <EnvelopeIcon className="w-6 h-6 text-primary" />
                        <span className="font-medium">App de E-mail Padrão</span>
                    </button>
                    <button onClick={() => handleOption('gmail')} className="w-full p-4 flex items-center space-x-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z text-red-600" fill="#EA4335" /></svg>
                        <span className="font-medium">Gmail (Web)</span>
                    </button>
                    <button onClick={() => handleOption('yahoo')} className="w-full p-4 flex items-center space-x-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-4H7v-2h2V9h2v2h2v2h-2v4z" fill="#6001D2" /></svg> {/* Generic icon for now, strictly speaking should be Yahoo SVG */}
                        <span className="font-medium">Yahoo Mail (Web)</span>
                    </button>
                    <button onClick={() => handleOption('copy')} className="w-full p-4 flex items-center space-x-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        <span className="font-medium">Copiar E-mail</span>
                    </button>
                    <button onClick={() => handleOption('share')} className="w-full p-4 flex items-center space-x-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        <span className="font-medium">Compartilhar...</span>
                    </button>
                </div>
                <button onClick={onClose} className="w-full mt-4 p-4 text-center text-red-500 font-bold bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Cancelar
                </button>
            </div>
        </div>
    );
};

export const PetDetailScreen: React.FC = () => {
    const { petId } = useParams<{ petId: string }>();
    const { getPet, getRecordForPet, translations } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    const pet = petId ? getPet(petId) : undefined;
    const record = petId ? getRecordForPet(petId) : undefined;
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

    // ... existing code ...

    if (!pet) {
        return (
            <Layout title="Pet Not Found">
                <p>The pet you are looking for does not exist.</p>
            </Layout>
        );
    }

    // handleShareEmail removed as it is now handled by EmailActionSheet

    const DetailItem: React.FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
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

    const calculateAge = (dateString?: string) => {
        if (!dateString) return '';
        const today = new Date();
        const birthDate = new Date(dateString);
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();

        if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
            years--;
            months += 12;
        }

        if (today.getDate() < birthDate.getDate()) {
            months--;
        }

        if (months < 0) {
            months += 12;
        }

        const lang = localStorage.getItem('language') || 'pt';
        if (years > 0) {
            return `${years} ${lang === 'pt' ? 'anos' : 'years'} ${months > 0 ? `e ${months} ${lang === 'pt' ? 'meses' : 'months'}` : ''}`;
        } else {
            return `${months} ${lang === 'pt' ? 'meses' : 'months'}`;
        }
    };

    return (
        <div className="relative min-h-screen">
            <div className="relative z-10">
                <Layout title={`${translations.petDetails} - ${pet.name}`} backPath="/pets" showBackButton={false}>
                    {/* Main Details Card */}
                    <div className="p-4 sm:p-6 rounded-xl shadow-lg bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm">
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
                                    {pet.birthDate && (
                                        <>
                                            <DetailItem label={translations.birthDate} value={new Date(pet.birthDate).toLocaleDateString()} />
                                            <DetailItem label={translations.age} value={calculateAge(pet.birthDate)} />
                                        </>
                                    )}
                                    <DetailItem label={translations.sterilized} value={pet.isSterilized ? translations.yes : translations.no} />
                                    <DetailItem label={translations.behaviorWithAnimals} value={getTranslatedValue(pet.behaviorWithAnimals)} />
                                    <DetailItem label={translations.behaviorWithPeople} value={getTranslatedValue(pet.behaviorWithPeople)} />
                                </div>
                            </div>
                        </div>

                        {record && record.weightHistory && record.weightHistory.length >= 2 && (
                            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-text-light dark:text-text-dark">
                                        {translations.animalWeight}
                                    </h3>
                                </div>

                                <WeightChart data={sortedHistory} sortOrder={sortOrder} />
                            </div>
                        )}

                        {/* Owner / FAT Details */}
                        {(pet.owner || (pet.isFAT && pet.foster)) && (
                            <>
                                {pet.owner && (
                                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">{translations.owner || 'Tutor'}</h3>
                                        <div className="space-y-3">
                                            <DetailItem label={translations.name || 'Nome'} value={pet.owner.name} />
                                            {pet.owner.address && (
                                                <div className="py-3 border-b border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4 items-center">
                                                    <p className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark col-span-1">{translations.address || 'Morada'}</p>
                                                    <div className="col-span-2 flex items-center space-x-2">
                                                        <span>{pet.owner.address}</span>
                                                        <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pet.owner?.address || '')}`, '_blank')} className="text-primary hover:text-primary-dark">
                                                            <MapPinIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            <DetailItem label="NIF" value={pet.owner.nif} />
                                            <div className="py-3 border-b border-gray-200 dark:border-gray-700 flex flex-col items-start gap-1">
                                                <p className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">{translations.phone || 'Telefone'}</p>
                                                <div className="flex items-center space-x-2 w-full">
                                                    <span className="break-all">{pet.owner.phone}</span>
                                                    <button
                                                        onClick={() => window.open(`tel:${pet.owner.phone}`, '_system')}
                                                        className="text-primary hover:text-primary-dark flex-shrink-0"
                                                        aria-label="Call Owner"
                                                    >
                                                        <PhoneIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            {pet.owner.email && (
                                                <div className="py-3 border-b border-gray-200 dark:border-gray-700 flex flex-col items-start gap-1">
                                                    <p className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">{translations.email || 'E-mail'}</p>
                                                    <div className="flex items-center space-x-2 w-full">
                                                        <span className="break-all">{pet.owner.email}</span>
                                                        <button
                                                            onClick={() => setSelectedEmail(pet.owner?.email || null)}
                                                            className="text-primary hover:text-primary-dark flex-shrink-0"
                                                        >
                                                            <EnvelopeIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {pet.isFAT && pet.foster && (
                                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">{translations.fat || 'FAT'}</h3>
                                        <div className="space-y-3">
                                            <DetailItem label={translations.name || 'Nome'} value={pet.foster.name} />
                                            {pet.foster.address && (
                                                <div className="py-3 border-b border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4 items-center">
                                                    <p className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark col-span-1">{translations.address || 'Morada'}</p>
                                                    <div className="col-span-2 flex items-center space-x-2">
                                                        <span>{pet.foster.address}</span>
                                                        <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pet.foster?.address || '')}`, '_blank')} className="text-primary hover:text-primary-dark">
                                                            <MapPinIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            <DetailItem label="NIF" value={pet.foster.nif} />
                                            <div className="py-3 border-b border-gray-200 dark:border-gray-700 flex flex-col items-start gap-1">
                                                <p className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">{translations.phone || 'Telefone'}</p>
                                                <div className="flex items-center space-x-2 w-full">
                                                    <span className="break-all">{pet.foster.phone}</span>
                                                    <button
                                                        onClick={() => window.open(`tel:${pet.foster.phone}`, '_system')}
                                                        className="text-primary hover:text-primary-dark flex-shrink-0"
                                                        aria-label="Call Foster"
                                                    >
                                                        <PhoneIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            {pet.foster.email && (
                                                <div className="py-3 border-b border-gray-200 dark:border-gray-700 flex flex-col items-start gap-1">
                                                    <p className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">{translations.email || 'E-mail'}</p>
                                                    <div className="flex items-center space-x-2 w-full">
                                                        <span className="break-all">{pet.foster.email}</span>
                                                        <button
                                                            onClick={() => setSelectedEmail(pet.foster?.email || null)}
                                                            className="text-primary hover:text-primary-dark flex-shrink-0"
                                                        >
                                                            <EnvelopeIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Action Box - Styled exactly like the main details card above */}
                    <div className="mt-4 p-3 rounded-xl shadow-lg bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm flex justify-around items-center">

                        {/* Marcação */}
                        <button
                            onClick={() => navigate(`/appointment/new/${pet.id}`)}
                            className="flex flex-col items-center text-secondary-dark dark:text-secondary-light hover:text-primary dark:hover:text-primary-light transition-colors"
                        >
                            <CalendarIcon className="w-7 h-7" />
                            <span className="text-xs font-medium mt-1">{translations.appointments}</span>
                        </button>

                        {/* NOVO BOTÃO — HISTÓRICO VETERINÁRIO */}
                        <button
                            onClick={() => navigate(`/history/${pet.id}`)}
                            className="flex flex-col items-center text-secondary-dark dark:text-secondary-light hover:text-primary dark:hover:text-primary-light transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-7 h-7">
                                <path d="M4 19.5V6a2 2 0 0 1 2-2h9l5 5v10.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                                <path d="M14 2v4h4" />
                            </svg>
                            <span className="text-xs font-medium mt-1">
                                {translations?.history ?? translations?.vetHistoryTitle ?? 'Histórico'}
                            </span>
                        </button>

                        {/* Prontuário */}
                        <button
                            onClick={() => navigate(`/record/${pet.id}`, { state: { from: location.pathname } })}
                            className="flex flex-col items-center text-secondary-dark dark:text-secondary-light hover:text-primary dark:hover:text-primary-light transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-7 h-7">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span className="text-xs font-medium mt-1">{translations.medicalRecord}</span>
                        </button>

                    </div>
                </Layout>

                {selectedEmail && (
                    <EmailActionSheet
                        email={selectedEmail}
                        onClose={() => setSelectedEmail(null)}
                        translations={translations}
                    />
                )}
            </div>
        </div>
    );
};

