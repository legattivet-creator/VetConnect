
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../src/App';
import type { Pet } from '../types';
import { Species, Gender, Behavior } from '../types';
import { Layout } from '../components/Layout';
import { compressImage } from '../utils';

const dogBreeds = ['Affenpinscher', 'Afghan Hound', 'Airedale Terrier', 'Akita', 'Alaskan Malamute', 'American Staffordshire Terrier', 'American Water Spaniel', 'Australian Cattle Dog', 'Australian Shepherd', 'Australian Terrier', 'Basenji', 'Basset Hound', 'Beagle', 'Bearded Collie', 'Bedlington Terrier', 'Bernese Mountain Dog', 'Bichon Frise', 'Black and Tan Coonhound', 'Bloodhound', 'Border Collie', 'Border Terrier', 'Borzoi', 'Boston Terrier', 'Bouvier des Flandres', 'Boxer', 'Briard', 'Brittany', 'Brussels Griffon', 'Bulldog', 'Bullmastiff', 'Cairn Terrier', 'Cavalier King Charles Spaniel', 'Chesapeake Bay Retriever', 'Chihuahua', 'Chinese Crested', 'Chinese Shar-Pei', 'Chow Chow', 'Cocker Spaniel', 'Collie', 'Curly-Coated Retriever', 'Dachshund', 'Dalmatian', 'Doberman Pinscher', 'English Cocker Spaniel', 'English Setter', 'English Springer Spaniel', 'English Toy Spaniel', 'Eskimo Dog', 'Finnish Spitz', 'Flat-Coated Retriever', 'Fox Terrier', 'Foxhound', 'French Bulldog', 'German Shepherd', 'German Shorthaired Pointer', 'Giant Schnauzer', 'Golden Retriever', 'Gordon Setter', 'Great Dane', 'Great Pyrenees', 'Greyhound', 'Irish Setter', 'Irish Water Spaniel', 'Irish Wolfhound', 'Jack Russell Terrier', 'Japanese Chin', 'Keeshond', 'Kerry Blue Terrier', 'Komondor', 'Kuvasz', 'Labrador Retriever', 'Lakeland Terrier', 'Lhasa Apso', 'Maltese', 'Manchester Terrier', 'Mastiff', 'Mexican Hairless', 'Newfoundland', 'Norwegian Elkhound', 'Norwich Terrier', 'Old English Sheepdog', 'Otterhound', 'Papillon', 'Pekingese', 'Pointer', 'Pomeranian', 'Poodle', 'Pug', 'Puli', 'Rhodesian Ridgeback', 'Rottweiler', 'Saint Bernard', 'Saluki', 'Samoyed', 'Schipperke', 'Scottish Deerhound', 'Scottish Terrier', 'Sealyham Terrier', 'Shetland Sheepdog', 'Shih Tzu', 'Siberian Husky', 'Silky Terrier', 'Skye Terrier', 'Staffordshire Bull Terrier', 'Standard Schnauzer', 'Tibetan Spaniel', 'Tibetan Terrier', 'Vizsla', 'Weimaraner', 'Welsh Terrier', 'West Highland White Terrier', 'Whippet', 'Yorkshire Terrier', 'Other'];
const dogBreedsPt = ['Affenpinscher', 'Galgo Afegão', 'Airedale Terrier', 'Akita', 'Malamute do Alasca', 'American Staffordshire Terrier', 'American Water Spaniel', 'Boiadeiro Australiano', 'Pastor Australiano', 'Terrier Australiano', 'Basenji', 'Basset Hound', 'Beagle', 'Bearded Collie', 'Bedlington Terrier', 'Boiadeiro de Berna', 'Bichon Frisé', 'Black and Tan Coonhound', 'Bloodhound', 'Border Collie', 'Border Terrier', 'Borzoi', 'Boston Terrier', 'Boiadeiro da Flandres', 'Boxer', 'Briard', 'Brittany', 'Griffon de Bruxelas', 'Buldogue', 'Bullmastiff', 'Cairn Terrier', 'Cavalier King Charles Spaniel', 'Chesapeake Bay Retriever', 'Chihuahua', 'Cão de Crista Chinês', 'Shar-Pei Chinês', 'Chow Chow', 'Cocker Spaniel', 'Collie', 'Curly-Coated Retriever', 'Dachshund', 'Dálmata', 'Doberman Pinscher', 'Cocker Spaniel Inglês', 'Setter Inglês', 'Springer Spaniel Inglês', 'English Toy Spaniel', 'Cão Esquimó', 'Spitz Finlandês', 'Flat-Coated Retriever', 'Fox Terrier', 'Foxhound', 'Buldogue Francês', 'Pastor Alemão', 'Braco Alemão de Pêlo Curto', 'Schnauzer Gigante', 'Golden Retriever', 'Setter Gordon', 'Dogue Alemão', 'Cão dos Pirenéus', 'Galgo Inglês', 'Setter Irlandês', 'Spaniel d\'Água Irlandês', 'Wolfhound Irlandês', 'Jack Russell Terrier', 'Chin Japonês', 'Keeshond', 'Kerry Blue Terrier', 'Komondor', 'Kuvasz', 'Labrador Retriever', 'Lakeland Terrier', 'Lhasa Apso', 'Maltês', 'Manchester Terrier', 'Mastim', 'Pelado Mexicano', 'Terra-nova', 'Elkhound Norueguês', 'Norwich Terrier', 'Old English Sheepdog', 'Lontreiro', 'Papillon', 'Pequinês', 'Pointer', 'Pomerânia', 'Poodle', 'Pug', 'Puli', 'Rhodesian Ridgeback', 'Rottweiler', 'São Bernardo', 'Saluki', 'Samoieda', 'Schipperke', 'Scottish Deerhound', 'Terrier Escocês', 'Sealyham Terrier', 'Pastor de Shetland', 'Shih Tzu', 'Husky Siberiano', 'Silky Terrier', 'Skye Terrier', 'Staffordshire Bull Terrier', 'Schnauzer Standard', 'Spaniel Tibetano', 'Terrier Tibetano', 'Vizsla', 'Weimaraner', 'Welsh Terrier', 'West Highland White Terrier', 'Whippet', 'Yorkshire Terrier', 'Outro'];
const catBreeds = ['Abyssinian', 'American Bobtail', 'American Curl', 'American Shorthair', 'American Wirehair', 'Balinese', 'Bengal', 'Birman', 'Bombay', 'British Shorthair', 'Burmese', 'Chartreux', 'Cornish Rex', 'Devon Rex', 'Egyptian Mau', 'Exotic Shorthair', 'Havana Brown', 'Himalayan', 'Japanese Bobtail', 'Javanese', 'Korat', 'LaPerm', 'Maine Coon', 'Manx', 'Norwegian Forest Cat', 'Ocicat', 'Oriental', 'Persian', 'Ragamuffin', 'Ragdoll', 'Russian Blue', 'Scottish Fold', 'Selkirk Rex', 'Siamese', 'Siberian', 'Singapura', 'Somali', 'Sphynx', 'Tonkinese', 'Turkish Angora', 'Turkish Van', 'Other'];
const catBreedsPt = ['Abissínio', 'Bobtail Americano', 'American Curl', 'Pelo Curto Americano', 'American Wirehair', 'Balinês', 'Bengala', 'Birmanês', 'Bombaim', 'Pelo Curto Britânico', 'Birmanês', 'Chartreux', 'Cornish Rex', 'Devon Rex', 'Mau Egípcio', 'Exótico de Pelo Curto', 'Havana Brown', 'Himalaia', 'Bobtail Japonês', 'Javanês', 'Korat', 'LaPerm', 'Maine Coon', 'Manx', 'Gato da Floresta Norueguês', 'Ocicat', 'Oriental', 'Persa', 'Ragamuffin', 'Ragdoll', 'Azul Russo', 'Scottish Fold', 'Selkirk Rex', 'Siamês', 'Siberiano', 'Singapura', 'Somali', 'Sphynx', 'Tonkinês', 'Angorá Turco', 'Van Turco', 'Outro'];

const InputField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; }> = ({ label, name, value, onChange, type = 'text' }) => (
    <div>
        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{label}</label>
        <input type={type} name={name} value={value} onChange={onChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
    </div>
);

const SelectField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: readonly string[]; translations: Record<string, string> }> = ({ label, name, value, onChange, options, translations }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{label}</label>
            <select name={name} value={value} onChange={onChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                <option value="">Select...</option>
                {options.map(opt => <option key={opt} value={opt}>{translations[opt.toLowerCase()] || opt}</option>)}
            </select>
        </div>
    );
};


export const PetFormScreen: React.FC = () => {
    const { petId } = useParams<{ petId: string }>();
    const navigate = useNavigate();
    const { getPet, addPet, updatePet, translations, language } = useAppContext();

    const [formData, setFormData] = useState<Omit<Pet, 'id'>>({
        name: '',
        microchip: '',
        species: Species.Canine,
        breed: '',
        gender: Gender.Male,
        color: '',
        isSterilized: false,
        behaviorWithAnimals: Behavior.Docile,
        behaviorWithPeople: Behavior.Docile,
        photoUrl: 'https://picsum.photos/seed/newpet/400/400',
        birthDate: ''
    });
    const [age, setAge] = useState('');
    const [customBreed, setCustomBreed] = useState('');
    const [photoPreview, setPhotoPreview] = useState<string | null>(formData.photoUrl);
    const photoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (petId) {
            const pet = getPet(petId);
            if (pet) {
                const isPortuguese = language === 'pt';
                const otherOption = isPortuguese ? 'Outro' : 'Other';
                const breedList = pet.species === Species.Canine
                    ? (isPortuguese ? dogBreedsPt : dogBreeds)
                    : (isPortuguese ? catBreedsPt : catBreeds);

                if (pet.species !== Species.Exotic && !breedList.includes(pet.breed)) {
                    setFormData({ ...pet, breed: otherOption });
                    setCustomBreed(pet.breed);
                } else {
                    setFormData(pet);
                    setCustomBreed('');
                }
            }
            setPhotoPreview(pet.photoUrl);
            if (pet.birthDate) {
                calculateAge(pet.birthDate);
            }
        }
    }, [petId, getPet, language]);

    const calculateAge = (dateString: string) => {
        if (!dateString) {
            setAge('');
            return;
        }
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

        if (years > 0) {
            setAge(`${years} ${language === 'pt' ? 'anos' : 'years'} ${months > 0 ? `e ${months} ${language === 'pt' ? 'meses' : 'months'}` : ''}`);
        } else {
            setAge(`${months} ${language === 'pt' ? 'meses' : 'months'}`);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const otherOption = language === 'pt' ? 'Outro' : 'Other';

        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            if (name === 'species') {
                setFormData(prev => ({ ...prev, species: value as Species, breed: '' }));
                setCustomBreed('');
            } else {
                if (name === 'breed' && value !== otherOption) {
                    setCustomBreed('');
                }
                if (name === 'birthDate') {
                    calculateAge(value);
                }
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                try {
                    const compressed = await compressImage(base64, 500, 0.7); // Resize pet photo
                    setPhotoPreview(compressed);
                    setFormData(prev => ({ ...prev, photoUrl: compressed }));
                } catch (e) {
                    setPhotoPreview(base64);
                    setFormData(prev => ({ ...prev, photoUrl: base64 }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const otherOption = language === 'pt' ? 'Outro' : 'Other';
        const dataToSave = { ...formData };

        if (formData.breed === otherOption) {
            if (!customBreed.trim()) {
                // The 'required' attribute on the input will handle this visually.
                return;
            }
            dataToSave.breed = customBreed.trim();
        }

        if (petId) {
            updatePet({ ...dataToSave, id: petId });
        } else {
            addPet(dataToSave);
        }
        navigate('/pets');
    };

    const currentDogBreeds = language === 'pt' ? dogBreedsPt : dogBreeds;
    const currentCatBreeds = language === 'pt' ? catBreedsPt : catBreeds;
    const otherOption = language === 'pt' ? 'Outro' : 'Other';

    return (
        <Layout title={petId ? translations.editPet : translations.addPet}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                    <img src={photoPreview || formData.photoUrl} alt="Pet" className="w-32 h-32 rounded-full object-cover border-4 border-primary-light" />
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark shadow-sm transition">{translations.choosePhoto}</button>
                    <input type="file" accept="image/*" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label={translations.name} name="name" value={formData.name} onChange={handleChange} />
                    <InputField label={translations.microchip} name="microchip" value={formData.microchip} onChange={handleChange} />
                    <SelectField label={translations.species} name="species" value={formData.species} onChange={handleChange} options={Object.values(Species)} translations={translations} />

                    {formData.species === Species.Exotic
                        ? <InputField label={translations.breed} name="breed" value={formData.breed} onChange={handleChange} />
                        : (
                            <div>
                                <SelectField
                                    label={translations.breed}
                                    name="breed"
                                    value={formData.breed}
                                    onChange={handleChange}
                                    options={formData.species === Species.Canine ? currentDogBreeds : currentCatBreeds}
                                    translations={translations}
                                />
                                {formData.breed === otherOption && (
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            name="customBreed"
                                            value={customBreed}
                                            onChange={(e) => setCustomBreed(e.target.value)}
                                            placeholder={translations.specifyBreedPlaceholder}
                                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    }

                    <SelectField label={translations.gender} name="gender" value={formData.gender} onChange={handleChange} options={Object.values(Gender)} translations={translations} />
                    <InputField label={translations.color} name="color" value={formData.color} onChange={handleChange} />

                    <InputField label={translations.birthDate} name="birthDate" value={formData.birthDate || ''} onChange={handleChange} type="date" />
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{translations.age}</label>
                        <div className="mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-text-secondary-light dark:text-text-secondary-dark min-h-[38px] flex items-center">
                            {age || '-'}
                        </div>
                    </div>

                    <SelectField label={translations.behaviorWithAnimals} name="behaviorWithAnimals" value={formData.behaviorWithAnimals} onChange={handleChange} options={Object.values(Behavior)} translations={translations} />
                    <SelectField label={translations.behaviorWithPeople} name="behaviorWithPeople" value={formData.behaviorWithPeople} onChange={handleChange} options={Object.values(Behavior)} translations={translations} />
                    <div className="flex items-center justify-start mt-2 md:mt-8">
                        <input type="checkbox" id="isSterilized" name="isSterilized" checked={formData.isSterilized} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                        <label htmlFor="isSterilized" className="ml-2 block text-sm text-text-light dark:text-text-dark">{translations.sterilized}</label>
                    </div>
                </div>

                <div className="flex justify-end pt-4 space-x-4">
                    <button type="button" onClick={() => navigate(-1)} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-text-light dark:text-text-dark font-bold py-2 px-6 rounded-lg transition">
                        {translations.cancel}
                    </button>
                    <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">
                        {translations.save}
                    </button>
                </div>
            </form>
        </Layout>
    );
};

