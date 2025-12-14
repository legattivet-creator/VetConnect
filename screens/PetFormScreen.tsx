
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../src/App';
import type { Pet } from '../types';
import { Species, Gender, Behavior } from '../types';
import { Layout } from '../components/Layout';
import { compressImage } from '../utils';

const dogBreeds = ['Affenpinscher', 'Afghan Hound', 'Airedale Terrier', 'Akita', 'Alaskan Malamute', 'American Bulldog', 'American English Coonhound', 'American Eskimo Dog', 'American Foxhound', 'American Hairless Terrier', 'American Leopard Hound', 'American Staffordshire Terrier', 'American Water Spaniel', 'Anatolian Shepherd Dog', 'Appenzeller Sennenhund', 'Australian Cattle Dog', 'Australian Kelpie', 'Australian Shepherd', 'Australian Terrier', 'Azawakh', 'Barbet', 'Basenji', 'Basset Fauve de Bretagne', 'Basset Hound', 'Beagle', 'Bearded Collie', 'Beauceron', 'Bedlington Terrier', 'Belgian Laekenois', 'Belgian Malinois', 'Belgian Sheepdog', 'Belgian Tervuren', 'Bergamasco Sheepdog', 'Berger Picard', 'Bernese Mountain Dog', 'Bichon Frise', 'Biewer Terrier', 'Black and Tan Coonhound', 'Black Russian Terrier', 'Bloodhound', 'Bluetick Coonhound', 'Boerboel', 'Bolognese', 'Border Collie', 'Border Terrier', 'Borzoi', 'Boston Terrier', 'Bouvier des Flandres', 'Boxer', 'Boykin Spaniel', 'Bracco Italiano', 'Briard', 'Brittany', 'Brussels Griffon', 'Bull Terrier', 'Bulldog', 'Bullmastiff', 'Cairn Terrier', 'Canaan Dog', 'Cane Corso', 'Cardigan Welsh Corgi', 'Catahoula Leopard Dog', 'Caucasian Shepherd Dog', 'Cavalier King Charles Spaniel', 'Central Asian Shepherd Dog', 'Cesky Terrier', 'Chesapeake Bay Retriever', 'Chihuahua', 'Chinese Crested', 'Chinese Shar-Pei', 'Chinook', 'Chow Chow', 'Cirneco dell\'Etna', 'Clumber Spaniel', 'Cocker Spaniel', 'Collie', 'Coton de Tulear', 'Curly-Coated Retriever', 'Czechoslovakian Vlcak', 'Dachshund', 'Dalmatian', 'Dandie Dinmont Terrier', 'Doberman Pinscher', 'Dogo Argentino', 'Dogue de Bordeaux', 'Dutch Shepherd', 'English Cocker Spaniel', 'English Foxhound', 'English Setter', 'English Springer Spaniel', 'English Toy Spaniel', 'Entlebucher Mountain Dog', 'Estrela Mountain Dog', 'Eurasier', 'Field Spaniel', 'Finnish Lapphund', 'Finnish Spitz', 'Flat-Coated Retriever', 'Fox Terrier (Smooth)', 'Fox Terrier (Wire)', 'French Bulldog', 'German Pinscher', 'German Shepherd', 'German Shorthaired Pointer', 'German Wirehaired Pointer', 'Giant Schnauzer', 'Glen of Imaal Terrier', 'Golden Retriever', 'Gordon Setter', 'Grand Basset Griffon Vendeen', 'Great Dane', 'Great Pyrenees', 'Greater Swiss Mountain Dog', 'Greyhound', 'Harrier', 'Havanese', 'Hovawart', 'Ibizan Hound', 'Icelandic Sheepdog', 'Irish Red and White Setter', 'Irish Setter', 'Irish Terrier', 'Irish Water Spaniel', 'Irish Wolfhound', 'Italian Greyhound', 'Jack Russell Terrier', 'Japanese Chin', 'Japanese Spitz', 'Keeshond', 'Kerry Blue Terrier', 'Komondor', 'Kooikerhondje', 'Kuvasz', 'Labrador Retriever', 'Lagotto Romagnolo', 'Lakeland Terrier', 'Lancashire Heeler', 'Leonberger', 'Lhasa Apso', 'Lowchen', 'Maltese', 'Manchester Terrier', 'Mastiff', 'Miniature American Shepherd', 'Miniature Bull Terrier', 'Miniature Pinscher', 'Miniature Schnauzer', 'Mixed Breed', 'Neapolitan Mastiff', 'Newfoundland', 'Norfolk Terrier', 'Norwegian Buhund', 'Norwegian Elkhound', 'Norwegian Lundehund', 'Norwich Terrier', 'Nova Scotia Duck Tolling Retriever', 'Old English Sheepdog', 'Otterhound', 'Papillon', 'Parson Russell Terrier', 'Pekingese', 'Pembroke Welsh Corgi', 'Petit Basset Griffon Vendeen', 'Pharaoh Hound', 'Plott Hound', 'Pointer', 'Polish Lowland Sheepdog', 'Pomeranian', 'Poodle (Miniature)', 'Poodle (Standard)', 'Poodle (Toy)', 'Portuguese Podengo Pequeno', 'Portuguese Water Dog', 'Pug', 'Puli', 'Pumi', 'Pyrenean Shepherd', 'Rat Terrier', 'Redbone Coonhound', 'Rhodesian Ridgeback', 'Rottweiler', 'Russell Terrier', 'Russian Toy', 'Saint Bernard', 'Saluki', 'Samoyed', 'Schipperke', 'Scottish Deerhound', 'Scottish Terrier', 'Sealyham Terrier', 'Shetland Sheepdog', 'Shiba Inu', 'Shih Tzu', 'Siberian Husky', 'Silky Terrier', 'Skye Terrier', 'Sloughi', 'Smooth Fox Terrier', 'Soft Coated Wheaten Terrier', 'Spanish Water Dog', 'Spinone Italiano', 'Staffordshire Bull Terrier', 'Standard Schnauzer', 'Sussex Spaniel', 'Swedish Vallhund', 'Tibetan Mastiff', 'Tibetan Spaniel', 'Tibetan Terrier', 'Toy Fox Terrier', 'Treeing Walker Coonhound', 'Vizsla', 'Weimaraner', 'Welsh Springer Spaniel', 'Welsh Terrier', 'West Highland White Terrier', 'Whippet', 'Wire Fox Terrier', 'Wirehaired Pointing Griffon', 'Wirehaired Vizsla', 'Xoloitzcuintli', 'Yorkshire Terrier', 'Other'];
const dogBreedsPt = ['Affenpinscher', 'Airedale Terrier', 'Akita', 'American Staffordshire Terrier', 'Australian Cattle Dog', 'Basenji', 'Basset Hound', 'Beagle', 'Bearded Collie', 'Bedlington Terrier', 'Bernese Mountain Dog', 'Bichon Frisé', 'Bloodhound', 'Boiadeiro Australiano', 'Boiadeiro de Berna', 'Border Collie', 'Border Terrier', 'Borzoi', 'Boston Terrier', 'Boxer', 'Braco Alemão', 'Braco Italiano', 'Briard', 'Brittany', 'Bull Terrier', 'Bulldog Americano', 'Bulldog Francês', 'Bulldog Inglês', 'Bullmastiff', 'Cane Corso', 'Cavalier King Charles Spaniel', 'Chihuahua', 'Chow Chow', 'Cocker Spaniel Americano', 'Cocker Spaniel Inglês', 'Collie', 'Coton de Tulear', 'Cão D\'Água Espanhol', 'Cão D\'Água Irlandês', 'Cão D\'Água Português', 'Cão Esquimó Americano', 'Cão Fila de São Miguel', 'Cão Lobo Checoslovaco', 'Cão Pelado Mexicano', 'Cão de Canaã', 'Cão de Crista Chinês', 'Cão de Guarda de Moscou', 'Cão de Montanha dos Pirenéus', 'Cão de Santo Humberto', 'Dachshund (Teckel)', 'Dálmata', 'Doberman', 'Dogo Argentino', 'Dogue Alemão', 'Dogue de Bordeaux', 'Elkhound Norueguês', 'Fila Brasileiro', 'Flat-Coated Retriever', 'Fox Terrier', 'Foxhound Americano', 'Foxhound Inglês', 'Galgo Afegão', 'Galgo Espanhol', 'Galgo Inglês', 'Galgo Italiano', 'Golden Retriever', 'Grande Boiadeiro Suíço', 'Griffon de Bruxelas', 'Husky Siberiano', 'Jack Russell Terrier', 'Keeshond', 'Kerry Blue Terrier', 'Komondor', 'Kuvasz', 'Labrador Retriever', 'Lakeland Terrier', 'Leonberger', 'Lhasa Apso', 'Lulu da Pomerânia', 'Malamute do Alasca', 'Maltês', 'Mastiff', 'Mastim Espanhol', 'Mastim Napolitano', 'Mastim Tibetano', 'Old English Sheepdog', 'Papillon', 'Pastor Alemão', 'Pastor Australiano', 'Pastor Belga', 'Pastor Bergamasco', 'Pastor Branco Suíço', 'Pastor Holandês', 'Pastor Maremano Abruzês', 'Pastor de Shetland', 'Pastor do Cáucaso', 'Pequinês', 'Perdigueiro Português', 'Pinscher Miniatura', 'Pit Bull', 'Podengo Português', 'Pointer Inglês', 'Poodle', 'Pug', 'Puli', 'Raça Mista (SRD)', 'Rhodesian Ridgeback', 'Rottweiler', 'Saluki', 'Samoieda', 'Schipperke', 'Schnauzer Gigante', 'Schnauzer Miniatura', 'Schnauzer Standard', 'Scottish Terrier', 'Setter Gordon', 'Setter Inglês', 'Setter Irlandês', 'Shar-Pei', 'Shiba Inu', 'Shih Tzu', 'Skye Terrier', 'Soft Coated Wheaten Terrier', 'Spinone Italiano', 'Spitz Alemão', 'Spitz Japonês', 'Staffordshire Bull Terrier', 'São Bernardo', 'Terra Nova', 'Terrier Brasileiro', 'Terrier Escocês', 'Terrier Irlandês', 'Terrier Tibetano', 'Tosa Inu', 'Vizsla', 'Weimaraner', 'Welsh Corgi Cardigan', 'Welsh Corgi Pembroke', 'Welsh Terrier', 'West Highland White Terrier', 'Whippet', 'Xoloitzcuintli', 'Yorkshire Terrier', 'Outro'];
const catBreeds = ['Abyssinian', 'American Bobtail', 'American Curl', 'American Shorthair', 'American Wirehair', 'Balinese', 'Bengal', 'Birman', 'Bombay', 'British Longhair', 'British Shorthair', 'Burmese', 'Burmilla', 'Chartreux', 'Chausie', 'Cornish Rex', 'Cymric', 'Devon Rex', 'Donskoy', 'Egyptian Mau', 'European Shorthair', 'Exotic Shorthair', 'Havana Brown', 'Himalayan', 'Japanese Bobtail', 'Javanese', 'Khao Manee', 'Korat', 'Kurilian Bobtail', 'LaPerm', 'Lykoi', 'Maine Coon', 'Manx', 'Mixed Breed', 'Munchkin', 'Nebelung', 'Norwegian Forest Cat', 'Ocicat', 'Oriental', 'Persian', 'Peterbald', 'Pixie-bob', 'Ragamuffin', 'Ragdoll', 'Russian Blue', 'Savannah', 'Scottish Fold', 'Selkirk Rex', 'Siamese', 'Siberian', 'Singapura', 'Snowshoe', 'Somali', 'Sphynx', 'Thai', 'Tonkinese', 'Toyger', 'Turkish Angora', 'Turkish Van', 'Other'];
const catBreedsPt = ['Abissínio', 'American Shorthair', 'Angorá Turco', 'Ashera', 'Azul Russo', 'Balinês', 'Bambino', 'Bengal', 'Bobtail Americano', 'Bobtail Japonês', 'Bombaim', 'British Shorthair', 'Burmês', 'Burmilla', 'Chartreux', 'Cornish Rex', 'Cymric', 'Devon Rex', 'Donskoy', 'Egyptian Mau', 'Exótico', 'Gato Floresta Norueguesa', 'Gato de Pelo Curto Americano', 'Gato de Pelo Curto Brasileiro', 'Gato de Pelo Curto Europeu', 'Gato de Pelo Curto Inglês', 'Gato do Egeu', 'Havana Brown', 'Himalaia', 'Javanês', 'Khao Manee', 'Korat', 'Kurilian Bobtail', 'LaPerm', 'Lykoi', 'Maine Coon', 'Manx', 'Mau Egípcio', 'Munchkin', 'Nebelung', 'Ocicat', 'Oriental', 'Persa', 'Peterbald', 'Pixie-bob', 'Raça Mista (SRD)', 'Ragamuffin', 'Ragdoll', 'Sagrado da Birmânia', 'Savannah', 'Scottish Fold', 'Selkirk Rex', 'Siamês', 'Siberiano', 'Singapura', 'Snowshoe', 'Somali', 'Sphynx', 'Thai', 'Tonquinês', 'Toyger', 'Van Turco', 'Outro'];

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

                <div className="bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                        {translations.basicInfo || 'Informações Básicas'}
                    </h3>
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

