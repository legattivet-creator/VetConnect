import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../src/App';
import { Layout } from '../components/Layout';
import { OwnerInfo } from '../types';
import { ChevronDownIcon, ChevronUpIcon, PencilSquareIcon } from '../components/Icons';

// Helper to compare owners
const areOwnersEqual = (a?: OwnerInfo, b?: OwnerInfo) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.name === b.name && a.nif === b.nif && a.email === b.email; // Basic identity check
};

const InputField: React.FC<{ label: string; value: string; onChange: (val: string) => void; type?: string; disabled?: boolean }> = ({ label, value, onChange, type = 'text', disabled }) => (
    <div>
        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{label}</label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-primary focus:border-primary
                ${disabled
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }
            `}
        />
    </div>
);

const OwnerForm: React.FC<{
    data: OwnerInfo;
    setData: (d: OwnerInfo) => void;
    title: string;
    translations: any;
    language: string;
    disabled?: boolean;
}> = ({ data, setData, title, translations, language, disabled }) => (
    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-md space-y-4 mb-6">
        <h3 className="text-lg font-bold text-primary dark:text-primary-light">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label={translations.name || "Nome"} value={data.name} onChange={v => setData({ ...data, name: v })} disabled={disabled} />
            <InputField label={translations.address || (language === 'pt' ? "Morada" : "Address")} value={data.address} onChange={v => setData({ ...data, address: v })} disabled={disabled} />
            <InputField label="NIF" value={data.nif} onChange={v => setData({ ...data, nif: v })} disabled={disabled} />
            <InputField label={translations.phone || (language === 'pt' ? "Telefone" : "Phone")} value={data.phone} onChange={v => setData({ ...data, phone: v })} type="tel" disabled={disabled} />
            <InputField label={translations.email || "E-mail"} value={data.email} onChange={v => setData({ ...data, email: v })} type="email" disabled={disabled} />
        </div>
    </div>
);


export const PetOwnerScreen: React.FC = () => {
    const { petId } = useParams<{ petId: string }>();
    const navigate = useNavigate();
    const { getPet, updatePet, pets, translations, language, userProfile, setUserProfile } = useAppContext();

    // Determine mode
    const isGlobalMode = !petId;
    const pet = petId ? getPet(petId) : undefined;

    // State
    const [owner, setOwner] = useState<OwnerInfo>({ name: '', address: '', nif: '', phone: '', email: '' });
    const [isFAT, setIsFAT] = useState(false);
    const [foster, setFoster] = useState<OwnerInfo>({ name: '', address: '', nif: '', phone: '', email: '' });

    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Selection state (Global Mode)
    const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
    const [filterText, setFilterText] = useState('');
    const [initialMatchingPetIds, setInitialMatchingPetIds] = useState<string[]>([]); // To track who WAS associated

    // Initial Load logic
    useEffect(() => {
        if (isGlobalMode) {
            if (userProfile && userProfile.name) {
                // If we have a global profile saved
                setOwner(userProfile);
                setIsEditing(false); // Start in View mode

                // Pre-select pets that match this profile
                const matches = pets.filter(p => areOwnersEqual(p.owner, userProfile)).map(p => p.id);
                setSelectedPetIds(matches);
                setInitialMatchingPetIds(matches);
            } else {
                // No profile yet, start in Edit mode
                setIsEditing(true);
                // Auto-select all pets by default for convenience
                setSelectedPetIds(pets.map(p => p.id));
            }
        } else if (pet) {
            // Pet mode
            if (pet.owner && pet.owner.name) {
                setOwner(pet.owner);
                setIsEditing(false);
            } else {
                setIsEditing(true);
            }

            if (pet.isFAT) setIsFAT(pet.isFAT);
            if (pet.foster) setFoster(pet.foster);
        }
    }, [isGlobalMode, pet?.id, userProfile]); // Dependencies kept simple

    if (!isGlobalMode && !pet) {
        return <Layout title="Pet Not Found"><p>Pet not found.</p></Layout>;
    }

    const handleCancel = () => {
        // Reset state to original values to avoid "fake save" visual
        if (isGlobalMode) {
            setOwner(userProfile || { name: '', address: '', nif: '', phone: '', email: '' });
            // Restore selection
            const matches = pets.filter(p => areOwnersEqual(p.owner, userProfile)).map(p => p.id);
            setSelectedPetIds(matches);
        } else if (pet && pet.owner) {
            setOwner(pet.owner);
            setIsFAT(pet.isFAT || false);
            setFoster(pet.foster || { name: '', address: '', nif: '', phone: '', email: '' });
        } else {
            // If new pet or empty owner, reset to empty
            setOwner({ name: '', address: '', nif: '', phone: '', email: '' });
        }
        setIsEditing(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isGlobalMode) {
            // 1. Save Global
            setUserProfile(owner);

            // 2. Bulk Sync - Update SELECTED pets
            // We need to fetch the LATEST pets array from context to ensure we don't overwrite other parallel changes? 
            // actually pets from context is fine because it updates on re-render.

            // Optimization: Create a list of updates
            selectedPetIds.forEach(id => {
                const p = pets.find(pet => pet.id === id);
                if (p) {
                    updatePet({
                        ...p,
                        owner,
                        isFAT,
                        foster: isFAT ? foster : undefined
                    });
                }
            });

            // 3. Dissociate Unselected Pets (ONLY if they were previously matching)
            initialMatchingPetIds.forEach(id => {
                if (!selectedPetIds.includes(id)) {
                    const p = pets.find(pet => pet.id === id);
                    if (p) {
                        // Clear owner info because user explicitly unselected it
                        updatePet({ ...p, owner: undefined, isFAT: false, foster: undefined });
                    }
                }
            });

            // Update initial state for next edit
            setInitialMatchingPetIds(selectedPetIds);

            setIsEditing(false);
            alert(language === 'pt' ? "Perfil e associações salvos com sucesso!" : "Profile and associations saved successfully!");
        } else if (pet) {
            updatePet({
                ...pet,
                owner,
                isFAT,
                foster: isFAT ? foster : undefined
            });
            setIsEditing(false);
            // Navigate back to details for immediate feedback as requested
            navigate(backPath);
        }
    };

    // Filter pets
    const filteredPets = pets.filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()));

    const togglePetSelection = (id: string) => {
        if (!isEditing) return; // Cannot change selection in view mode
        setSelectedPetIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        if (!isEditing) return;
        if (selectedPetIds.length === filteredPets.length) setSelectedPetIds([]);
        else setSelectedPetIds(filteredPets.map(p => p.id));
    };

    // Title
    const getPageTitle = () => {
        const nameToShow = owner.name?.trim();
        // Always show "Tutor" header in edit mode or if empty?
        if (isGlobalMode) return language === 'pt' ? "Meu Perfil (Tutor)" : "My Profile (Tutor)";

        // If viewing specific pet tutor
        return nameToShow ? `${language === 'pt' ? "Tutor de" : "Owner of"} ${pet?.name}` : (language === 'pt' ? "Dados do Tutor" : "Owner Details");
    };

    const backPath = isGlobalMode ? '/pets' : `/pet/${petId}`; // Changed Global back to /pets based on context

    return (
        <Layout title={getPageTitle()} backPath={backPath}>
            <div className="flex justify-end mb-4">
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        <PencilSquareIcon className="w-5 h-5" />
                        <span>{language === 'pt' ? "Editar" : "Edit"}</span>
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Pet Selection Dropdown (Global Mode Only) */}
                {isGlobalMode && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span className="font-bold text-gray-800 dark:text-gray-200">
                                {language === 'pt'
                                    ? `Associar a Animais (${selectedPetIds.length})`
                                    : `Associate with Pets (${selectedPetIds.length})`}
                            </span>
                            {isDropdownOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                        </button>

                        {isDropdownOpen && (
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                {/* Disabled overlay/message if not editing */}
                                {!isEditing && (
                                    <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded">
                                        {language === 'pt' ? "Clique em Editar para alterar as associações." : "Click Edit to change associations."}
                                    </div>
                                )}

                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder={language === 'pt' ? "Filtrar por nome..." : "Filter by name..."}
                                        value={filterText}
                                        onChange={e => setFilterText(e.target.value)}
                                        disabled={!isEditing}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-60"
                                    />
                                </div>

                                {filteredPets.length > 0 && isEditing && (
                                    <div className="flex items-center mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={selectedPetIds.length === filteredPets.length && filteredPets.length > 0}
                                            onChange={handleSelectAll}
                                            disabled={!isEditing}
                                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {language === 'pt' ? "Selecionar Todos" : "Select All"}
                                        </span>
                                    </div>
                                )}

                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    {filteredPets.map(p => (
                                        <div key={p.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition">
                                            <input
                                                type="checkbox"
                                                id={`pet-${p.id}`}
                                                checked={selectedPetIds.includes(p.id)}
                                                onChange={() => togglePetSelection(p.id)}
                                                disabled={!isEditing}
                                                className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded disabled:opacity-50"
                                            />
                                            {p.photoUrl ? (
                                                <img src={p.photoUrl} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300">
                                                    {p.name.charAt(0)}
                                                </div>
                                            )}
                                            <label htmlFor={`pet-${p.id}`} className={`flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 ${isEditing ? 'cursor-pointer' : ''}`}>
                                                {p.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <OwnerForm
                    data={owner}
                    setData={setOwner}
                    title={language === 'pt' ? "Dados do Tutor" : "Owner Details"}
                    translations={translations}
                    language={language}
                    disabled={!isEditing}
                />

                <div className="flex items-center space-x-2 bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm">
                    <input
                        type="checkbox"
                        id="isFAT"
                        checked={isFAT}
                        onChange={e => setIsFAT(e.target.checked)}
                        disabled={!isEditing}
                        className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded disabled:opacity-60"
                    />
                    <label htmlFor="isFAT" className="font-medium text-text-light dark:text-text-dark">
                        FAT (Família de Acolhimento Temporário)
                    </label>
                </div>

                {isFAT && (
                    <OwnerForm
                        data={foster}
                        setData={setFoster}
                        title="FAT Details"
                        translations={translations}
                        language={language}
                        disabled={!isEditing}
                    />
                )}

                {isEditing && (
                    <div className="flex justify-end pt-4 space-x-4">
                        <button type="button" onClick={handleCancel} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-text-light dark:text-text-dark font-bold py-2 px-6 rounded-lg transition">
                            {translations.cancel}
                        </button>
                        <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">
                            {translations.save}
                        </button>
                    </div>
                )}
            </form>
        </Layout>
    );
};

