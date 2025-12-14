

export enum Species {
  Canine = 'Canine',
  Feline = 'Feline',
  Exotic = 'Exotic',
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
}

export enum Behavior {
  Docile = 'Docile',
  Friendly = 'Friendly',
  Brave = 'Brave',
  Aggressive = 'Aggressive',
}

export interface OwnerInfo {
  name: string;
  address: string;
  nif: string;
  phone: string;
  email: string;
}

export interface Pet {
  id: string;
  microchip: string;
  name: string;
  species: Species;
  breed: string;
  gender: Gender;
  color: string;
  isSterilized: boolean;
  behaviorWithAnimals: Behavior;
  behaviorWithPeople: Behavior;
  photoUrl: string;
  birthDate?: string;
  owner?: OwnerInfo;
  foster?: OwnerInfo;
  isFAT?: boolean;
}

export enum AppointmentType {
  Consultation = 'Consultation',
  Surgery = 'Surgery',
  Vaccination = 'Vaccination',
  Application = 'Application',
  Grooming = 'Grooming',
  ControlAnalysis = 'Control Analysis',
  DentalTreatment = 'Dental Treatment',
  ImagingExam = 'Imaging Exam',
  FollowUp = 'Follow-up',
  TreatmentMedication = 'Treatment/Medication',
  TherapeuticBath = 'TherapeuticBath',
  Chemotherapy = 'Chemotherapy',
  Others = 'Others',
}

export enum AppointmentStatus {
  Scheduled = 'Scheduled',
  Completed = 'Completed',
  Missed = 'Missed',
}

export interface Appointment {
  id: string;
  petId: string;
  petName: string;
  petPhotoUrl: string;
  type: AppointmentType;
  dateTime: Date;
  notes: string;
  status: AppointmentStatus;
  frequency?: '24h' | '12h' | '8h' | '6h';
  durationValue?: number;
  durationUnit?: 'days' | 'weeks' | 'months';
  bathFrequency?: '1' | '2' | '3';
  bathDays?: string[];
}

export interface MedicalFile {
  id: string;
  name: string;
  url: string;
  type: 'document' | 'image' | 'video' | 'audio';
  mimeType: string;
  createdAt: Date;
  note?: string;
}

export interface MedicalRecordCategory {
  title: string;
  files: MedicalFile[];
}

export interface WeightEntry {
  id: string;
  date: Date;
  weight: number;
  unit: 'kg' | 'lb' | 'g';
}

export interface VetNote {
  id: string;
  title: string;
  content: string;
  timestamp: string; // ISO string
}


export interface MedicalRecord {
  petId: string;
  categories: MedicalRecordCategory[];
  weightHistory?: WeightEntry[];
  vetHistory?: VetNote[];   //  <-- adicione isso
}
export type AudioLanguage = 'PT_PT' | 'PT_BR' | 'EN';
export type Language = 'en' | 'pt';
export type Theme = 'light' | 'dark';