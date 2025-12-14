


import type { Pet, Appointment, MedicalRecord, MedicalRecordCategory, WeightEntry } from './types';
import { Species, Gender, Behavior, AppointmentType, AppointmentStatus } from './types';

export const MOCK_PETS: Pet[] = [
  {
    id: '1',
    name: 'Buddy',
    microchip: '981020018872913',
    species: Species.Canine,
    breed: 'Golden Retriever',
    gender: Gender.Male,
    color: 'Golden',
    isSterilized: true,
    behaviorWithAnimals: Behavior.Friendly,
    behaviorWithPeople: Behavior.Friendly,
    photoUrl: 'https://picsum.photos/seed/buddy/400/400',
  },
  {
    id: '2',
    name: 'Lucy',
    microchip: '981020018872914',
    species: Species.Feline,
    breed: 'Domestic Shorthair',
    gender: Gender.Female,
    color: 'Black',
    isSterilized: true,
    behaviorWithAnimals: Behavior.Docile,
    behaviorWithPeople: Behavior.Friendly,
    photoUrl: 'https://picsum.photos/seed/lucy/400/400',
  },
  {
    id: '3',
    name: 'Rocky',
    microchip: '981020018872915',
    species: Species.Exotic,
    breed: 'Green Iguana',
    gender: Gender.Male,
    color: 'Green',
    isSterilized: false,
    behaviorWithAnimals: Behavior.Brave,
    behaviorWithPeople: Behavior.Docile,
    photoUrl: 'https://picsum.photos/seed/rocky/400/400',
  },
];

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(14, 30, 0, 0);

const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);
nextWeek.setHours(10, 0, 0, 0);

const threeDaysAgo = new Date();
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
threeDaysAgo.setHours(11, 0, 0, 0);

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    petId: '1',
    petName: 'Buddy',
    petPhotoUrl: 'https://picsum.photos/seed/buddy/400/400',
    type: AppointmentType.Vaccination,
    dateTime: tomorrow,
    notes: 'Annual booster shots.',
    status: AppointmentStatus.Scheduled,
  },
  {
    id: 'a2',
    petId: '2',
    petName: 'Lucy',
    petPhotoUrl: 'https://picsum.photos/seed/lucy/400/400',
    type: AppointmentType.Consultation,
    dateTime: nextWeek,
    notes: 'Checkup for recent lethargy.',
    status: AppointmentStatus.Scheduled,
  },
  {
    id: 'a3',
    petId: '1',
    petName: 'Buddy',
    petPhotoUrl: 'https://picsum.photos/seed/buddy/400/400',
    type: AppointmentType.Grooming,
    dateTime: threeDaysAgo,
    notes: 'Full grooming session.',
    status: AppointmentStatus.Completed,
  },
];

const MOCK_RECORD_CATEGORIES: string[] = [
    'Hemograma', 
    'Bioquímicos', 
    'Hormônios', 
    'PCR', 
    'Sorologia', 
    'Citologia', 
    'Histopatologia', 
    'Urinálise/Cultura', 
    'Cultura de ouvidos', 
    'Cultura de pele e Outros', 
    'Raio – X', 
    'Tomografia', 
    'Ressonância', 
    'Endoscopia', 
    'Alimentação', 
    'Medicamentos'
].sort((a, b) => a.localeCompare(b, 'pt-BR'));

export const generateCategories = (): MedicalRecordCategory[] => {
    return MOCK_RECORD_CATEGORIES.map(title => ({
        title,
        files: []
    }));
};

export const MOCK_RECORDS: MedicalRecord[] = [
    {
        petId: '1',
        categories: generateCategories(),
        weightHistory: [],
    },
     {
        petId: '2',
        categories: generateCategories(),
        weightHistory: [],
    },
    {
        petId: '3',
        categories: generateCategories(),
        weightHistory: [],
    }
];

// Add some sample data to Buddy
const buddyRecord = MOCK_RECORDS.find(r => r.petId === '1');
if (buddyRecord) {
    let category = buddyRecord.categories.find(c => c.title === 'Hemograma');
    if (category) {
        category.files.push({ id: 'f1', name: 'blood_results_jan.pdf', type: 'document', url: 'data:application/pdf;base64,JVBERi0xLjAKMSAwIG9iajw8L1BhZ2VzIDIgMCBSPj5lbmRvYmogMiAwIG9iajw8L0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iaiAzIDAgb2JqPDwvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCAzIDNdPj5lbmRvYmoKdHJhaWxlcjw8L1Jvb3QgMSAwIFI+Pg==', mimeType: 'application/pdf', createdAt: new Date() });
    }
    category = buddyRecord.categories.find(c => c.title === 'Raio – X');
    if (category) {
        category.files.push({ id: 'f2', name: 'chest_xray.jpg', type: 'image', url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEElEQVR42mP8/5/hP2AEAAAL8gL8/paZ7wAAAABJRU5ErkJggg==', mimeType: 'image/png', createdAt: new Date() });
    }

    buddyRecord.weightHistory = [
        { id: 'w1', date: new Date('2023-01-15T12:00:00Z'), weight: 34, unit: 'kg' },
        { id: 'w2', date: new Date('2023-07-20T12:00:00Z'), weight: 35.2, unit: 'kg' },
        { id: 'w3', date: new Date('2024-01-10T12:00:00Z'), weight: 78.9, unit: 'lb' },
    ];
}