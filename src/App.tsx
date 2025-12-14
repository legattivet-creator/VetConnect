// App.tsx
import { requestNotificationPermission } from "./notifications";
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';
import { compressImage } from '../utils';
import VetHistory from './pages/VetHistory';
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import type {
  Pet,
  Appointment,
  Language,
  Theme,
  MedicalRecord,
  MedicalFile,
  MedicalRecordCategory,
  WeightEntry,
  OwnerInfo
} from '../types';
import { AppointmentStatus } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { PetListScreen } from '../screens/PetListScreen';
import { PetDetailScreen } from '../screens/PetDetailScreen';
import { PetFormScreen } from '../screens/PetFormScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { AppointmentFormScreen } from '../screens/AppointmentFormScreen';
import { MedicalRecordScreen } from '../screens/MedicalRecordScreen';
import { PetOwnerScreen } from '../screens/PetOwnerScreen';
import { MOCK_PETS, MOCK_APPOINTMENTS, MOCK_RECORDS, generateCategories } from '../mockData';
import { MoonIcon, SunIcon, LanguagesIcon } from '../components/Icons';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { PrivacyBanner } from "./components/PrivacyBanner";
import TermsOfUse from "./pages/TermsOfUse";
import ScrollToTop from './components/ScrollToTop';

// App Context for global state management
interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  pets: Pet[];
  getPet: (id: string) => Pet | undefined;
  addPet: (pet: Omit<Pet, 'id'>) => void;
  updatePet: (pet: Pet) => void;
  deletePet: (id: string) => void;
  appointments: Appointment[];
  getAppointment: (id: string) => Appointment | undefined;
  getAppointmentsForPet: (petId: string) => Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  addAppointments: (appointments: Omit<Appointment, 'id' | 'status'>[]) => void;
  updateAppointment: (appointment: Appointment) => void;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  deleteAppointment: (id: string) => void;
  deleteAppointments: (ids: string[]) => void;
  records: MedicalRecord[];
  getRecordForPet: (petId: string) => MedicalRecord | undefined;
  addMedicalFile: (petId: string, categoryTitle: string, fileData: Omit<MedicalFile, 'id' | 'createdAt'>) => void;
  renameMedicalFile: (petId: string, categoryTitle: string, fileId: string, newName: string) => void;
  updateMedicalFileNote: (petId: string, categoryTitle: string, fileId: string, note: string) => void;
  deleteMedicalFile: (petId: string, categoryTitle: string, fileId: string) => void;
  updateCategoryOrder: (petId: string, newCategories: MedicalRecordCategory[]) => void;
  addWeightEntry: (petId: string, entryData: Omit<WeightEntry, 'id'>) => void;
  updateWeightEntry: (petId: string, updatedEntry: WeightEntry) => void;
  deleteWeightEntry: (petId: string, entryId: string) => void;

  // Vet history (prontuário veterinário)
  getVetHistory: (petId: string) => any[];
  addVetNote: (petId: string, title: string, content: string) => void;
  updateVetNote: (petId: string, noteId: string, updatedData: Partial<{ title: string; content: string }>) => void;
  deleteVetNote: (petId: string, noteId: string) => void;

  translations: Record<string, string>;
  background: string | null;
  setBackground: (url: string | null) => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  // Notification & Voice Alert Logic (Global Persistence)
  dismissedNotificationIds: string[];
  dismissNotification: (id: string) => void;
  spokenAlertIds: React.MutableRefObject<Set<string>>;
  activeAlertIds: string[];
  professionalLogo: string | null;
  setProfessionalLogo: (logo: string | null) => void;
  userProfile: OwnerInfo | null;
  setUserProfile: (profile: OwnerInfo) => void;
}

const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

const translationData = {
  en: {
    appName: "VetConnect",
    welcome: "Welcome",
    notifications: "Notifications",
    noNotifications: "No upcoming notifications (24h).",
    voiceAlertDay: "One day left for {pet}'s {type}.",
    voiceAlertHour: "One hour left for {pet}'s {type}.",
    professionalLogo: "Professional Logo",
    uploadLogo: "Upload Logo",
    removeLogo: "Remove Logo",
    logoInfo: "This logo will appear on documents.",
    dismiss: "Dismiss",
    back: "Back",
    save: "Save",
    petDetails: "Details",
    settings: "Settings",
    theme: "Theme",
    language: "Language",
    years: "years",
    months: "months",
    and: "and",
    lessThanOneMonth: "Less than 1 month",
    canine: "Canine",
    feline: "Feline",
    exotic: "Exotic",
    male: "Male",
    female: "Female",
    weightHistory: "Weight Tracking",
    animalWeight: "Weight History",
    name: "Name",
    species: "Species",
    breed: "Breed",
    gender: "Gender",
    age: "Age",
    sterilized: "Sterilized",
    yes: "Yes",
    no: "No",
    microchip: "Microchip",
    pdfSaved: "PDF saved in Documents",
    history: "History",
    vetHistoryTitle: "Vet History",
    search: "Search",
    title: "Title",
    writeNote: "Write the note...",
    newNote: "New note",
    cancel: "Cancel",
    select: "Select",
    export: "Export",
    share: "Share",
    selectAll: "Select all",
    deleteSelected: "Delete selected",
    loading: "Loading...",
    noNotes: "No notes found.",
    untitled: "Untitled",
    edit: "Edit",
    delete: "Delete",
    days: "d",
    hours: "h",
    minutes: "m",
    seconds: "s",
    lastDose: "Last dose",
    lastBath: "Last bath",
    myPets: "My Pets",
    pets: "My Pets",
    addPet: "Add Pet",
    medicalRecord: "Medical Record",
    schedule: "Schedule",
    appointments: "Schedule",
    password: "Password",
    email: "Email",
    login: "Login",
    register: "Register",
    haveAccount: "Already have an account? Login",
    noAccount: "Don't have an account? Register",
    showPassword: "Show Password",
    confirmPassword: "Confirm Password",
    passwordsMismatch: "Passwords do not match",
    logout: "Logout",
    home: "Home",
    cancelSelection: "Cancel Selection",
    others: "Others",
    treatment: "Treatment",
    vaccine: "Vaccine",
    consultation: "Consultation",
    medication: "Medication",
    deworming: "Deworming",
    grooming: "Grooming",
    exam: "Exam",
    surgery: "Surgery",
    therapy: "Therapy",
    acupuncture: "Acupuncture",
    physiotherapy: "Physiotherapy",
    nutrition: "Nutrition",
    dermatology: "Dermatology",
    cardiology: "Cardiology",
    neurology: "Neurology",
    oncology: "Oncology",
    orthopedics: "Orthopedics",
    ophthalmology: "Ophthalmology",
    dentistry: "Dentistry",
    castration: "Castration",
    checkup: "Checkup",
    reorder: "Reorder",
    doneReordering: "Done Reordering",
    confirmDeleteFile: "Delete File",
    areYouSureDeleteFile: "Are you sure you want to delete {fileName}?",
    confirmDeleteWeightEntry: "Delete Weight Entry",
    areYouSureDeleteWeightEntry: "Are you sure you want to delete this weight entry?",
    attachFile: "Attach File",
    capturePhoto: "Take Photo",
    weight: "Weight",
    addEntry: "Add Entry",
    kg: "kg",
    lb: "lb",
    g: "g",
    actions: "Actions",
    cat_hemogram: "Blood Count",
    cat_biochemistry: "Biochemistry",
    cat_hormones: "Hormones",
    cat_pcr: "PCR",
    cat_serology: "Serology",
    cat_cytology: "Cytology",
    cat_histopathology: "Histopathology",
    cat_urinalysis: "Urinalysis",
    cat_ear_culture: "Ear Culture",
    cat_skin_culture: "Skin Culture",
    cat_xray: "X-Ray",
    cat_ct_scan: "CT Scan",
    cat_mri: "MRI",
    cat_endoscopy: "Endoscopy",
    cat_nutrition: "Nutrition",
    cat_medications: "Medications",
    urgency: "Clinics and Hospitals",
    owner: "Owner",
    address: "Address",
    phone: "Phone",
    fat: "FAT",
    choosePhoto: "Attach Photo",
    specifyBreedPlaceholder: "Specify breed",
    color: "Color",
    birthDate: "Birth Date",
    behaviorWithAnimals: "Behavior w/ Animals",
    behaviorWithPeople: "Behavior w/ People",
    docile: "Docile",
    friendly: "Friendly",
    brave: "Brave",
    aggressive: "Aggressive",
    scared: "Scared",
    editPet: "Edit Pet",
    removePet: "Remove Pet",
    checkSchedule: "Check Schedule!",
    confirmDelete: "Confirm Delete",
    upcoming: "Upcoming",
    appointmentHistory: "Appointment History",
    filterByPet: "Filter by Pet",
    allPets: "All Pets",
    all: "All",
    noUpcomingAppointments: "No upcoming appointments.",
    noAppointmentHistory: "No appointment history.",
    addToCalendar: "Add to Calendar",
    awaitingStatus: "Awaiting Status",
    administered: "Administered",
    attended: "Attended",
    notAdministered: "Not Administered",
    didNotAttend: "Did Not Attend",
    newAppointment: "New Appointment",
    confirmDeleteAppointment: "Delete Appointment",
    confirmCancelAppointment: "Cancel Appointment",
    areYouSureDeleteAppointment: "Are you sure you want to delete this appointment?",
    areYouSureCancel: "Are you sure you want to cancel this appointment?",
    confirmDeleteSelected: "Delete Selected",
    areYouSureDeleteSelected: "Are you sure you want to delete {count} appointments?",
    cancelAppointment: "Cancel Appointment",
    saveAppointment: "Save Appointment",
    notes: "Notes",
    type: "Type",
    date: "Date",
    time: "Time",
    recurrence: "Recurrence",
    frequency: "Frequency",
    times: "Times",
    period: "Period",
    // Frequency & Duration
    every24hours: "Every 24 hours",
    every12hours: "Every 12 hours",
    every8hours: "Every 8 hours",
    every6hours: "Every 6 hours",
    onceAWeek: "Once a week",
    twiceAWeek: "Twice a week",
    thriceAWeek: "3 times a week",
    durationDays: "days",
    durationWeeks: "weeks",
    treatmentDuration: "Treatment Duration",
    quantity: "Quantity",
    selectDays: "Select Days",
    bathFrequency: "Bath Frequency",
    // Weekdays
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    return: "Return"
  },
  pt: {
    appName: "VetConnect",
    welcome: "Bem-vindo",
    notifications: "Notificações",
    noNotifications: "Sem notificações (24h).",
    voiceAlertDay: "Falta um dia para {type} de {pet}.",
    voiceAlertHour: "Falta uma hora para {type} de {pet}.",
    professionalLogo: "Logotipo Profissional",
    uploadLogo: "Inserir logotipo profissional",
    removeLogo: "Remover logotipo",
    logoInfo: "Este logotipo aparecerá nos documentos.",
    dismiss: "Dispensar",
    back: "Voltar",
    save: "Salvar",
    petDetails: "Detalhes",
    settings: "Configurações",
    theme: "Tema",
    language: "Idioma",
    years: "anos",
    months: "meses",
    and: "e",
    lessThanOneMonth: "Menos de 1 mês",
    canine: "Canino",
    feline: "Felino",
    exotic: "Exótico",
    male: "Macho",
    female: "Fêmea",
    weightHistory: "Acompanhamento de Peso",
    animalWeight: "Histórico de Peso",
    name: "Nome",
    species: "Espécie",
    breed: "Raça",
    gender: "Sexo",
    age: "Idade",
    sterilized: "Castrado",
    yes: "Sim",
    no: "Não",
    microchip: "Microchip",
    pdfSaved: "PDF salvo em Documentos",
    history: "Histórico",
    vetHistoryTitle: "Histórico Veterinário",
    search: "Pesquisar...",
    title: "Título",
    writeNote: "Escreva a anotação...",
    newNote: "Nova nota",
    cancel: "Cancelar",
    select: "Selecionar",
    export: "Exportar",
    share: "Compartilhar",
    selectAll: "Selecionar todas",
    deleteSelected: "Excluir selecionadas",
    loading: "Carregando...",
    noNotes: "Nenhuma anotação encontrada.",
    untitled: "Sem título",
    edit: "Editar",
    delete: "Excluir",
    days: "d",
    hours: "h",
    minutes: "m",
    seconds: "s",
    lastDose: "Última dose",
    lastBath: "Último banho",
    myPets: "Meus Pets",
    pets: "Meus Pets",
    addPet: "Adicionar Pet",
    medicalRecord: "Prontuário",
    schedule: "Agendamento",
    appointments: "Marcações",
    password: "Senha",
    email: "E-mail",
    login: "Entrar",
    register: "Cadastrar",
    haveAccount: "Já tem uma conta? Entre",
    noAccount: "Não tem conta? Cadastre-se",
    showPassword: "Mostrar Senha",
    confirmPassword: "Confirmar Senha",
    passwordsMismatch: "As senhas não coincidem",
    logout: "Sair",
    home: "Início",
    cancelSelection: "Cancelar Seleção",

    treatment: "Tratamento",
    vaccine: "Vacina",
    consultation: "Consulta",
    medication: "Medicação",
    deworming: "Vermífugo",
    grooming: "Banho e tosquia",
    exam: "Exame",
    surgery: "Cirurgia",
    therapy: "Terapia",
    acupuncture: "Acupuntura",
    physiotherapy: "Fisioterapia",
    nutrition: "Nutrição",
    dermatology: "Dermatologia",
    cardiology: "Cardiologia",
    neurology: "Neurologia",
    oncology: "Oncologia",
    orthopedics: "Ortopedia",
    ophthalmology: "Oftalmologia",
    dentistry: "Odontologia",
    castration: "Castração",
    checkup: "Check-up",
    // New types
    application: "Aplicação",
    reorder: "Reordenar",
    doneReordering: "Concluir Reordenação",
    confirmDeleteFile: "Excluir Arquivo",
    areYouSureDeleteFile: "Tem certeza que deseja excluir {fileName}?",
    confirmDeleteWeightEntry: "Excluir Registro de Peso",
    areYouSureDeleteWeightEntry: "Tem certeza que deseja excluir este registro de peso?",
    attachFile: "Anexar Arquivo",
    capturePhoto: "Tirar Foto",
    weight: "Peso",
    addEntry: "Adicionar Registro",
    kg: "kg",
    lb: "lb",
    g: "g",
    actions: "Ações",
    cat_hemogram: "Hemograma",
    cat_biochemistry: "Bioquímicos",
    cat_hormones: "Hormônios",
    cat_pcr: "PCR",
    cat_serology: "Sorologia",
    cat_cytology: "Citologia",
    cat_histopathology: "Histopatologia",
    cat_urinalysis: "Urinálise/Cultura",
    cat_ear_culture: "Cultura de ouvidos",
    cat_skin_culture: "Cultura de pele e Outros",
    cat_xray: "Raio – X",
    cat_ct_scan: "Tomografia",
    cat_mri: "Ressonância",
    cat_endoscopy: "Endoscopia",
    cat_nutrition: "Alimentação",
    cat_medications: "Medicamentos",
    // Appointment Types
    controlanalysis: "Análise de Controle",
    dentaltreatment: "Tratamento Dentário",
    imagingexam: "Exame de Imagem",
    followup: "Fisioterapia",
    therapeuticbath: "Banho Terapêutico",
    chemotherapy: "Quimioterapia",
    others: "Acupuntura",
    treatmentmedication: "Medicação",
    vaccination: "Vacinação",
    urgency: "Clínicas e Hospitais",
    owner: "Tutor",
    address: "Morada",
    phone: "Telefone",
    fat: "FAT",
    choosePhoto: "Anexar foto",
    specifyBreedPlaceholder: "Especifique a raça",
    color: "Cor",
    birthDate: "Data de Nascimento",
    behaviorWithAnimals: "Comp. c/ Animais",
    behaviorWithPeople: "Comp. c/ Pessoas",
    docile: "Dócil",
    friendly: "Amigável",
    brave: "Corajoso",
    aggressive: "Agressivo",
    scared: "Assustado",
    editPet: "Editar Pet",
    removePet: "Remover Pet",
    checkSchedule: "Ver Agendamento!",
    confirmDelete: "Confirmar Exclusão",
    upcoming: "Próximas",
    appointmentHistory: "Histórico",
    filterByPet: "Filtrar por Pet",
    allPets: "Todos",
    all: "Todos",
    noUpcomingAppointments: "Nenhuma marcação próxima.",
    noAppointmentHistory: "Nenhum histórico.",
    addToCalendar: "Adicionar ao Calendário",
    awaitingStatus: "Aguardando Status",
    administered: "Administrado",
    attended: "Compareceu",
    notAdministered: "Não Administrado",
    didNotAttend: "Não Compareceu",
    newAppointment: "Nova Marcação",
    confirmDeleteAppointment: "Excluir Marcação",
    confirmCancelAppointment: "Cancelar Marcação",
    areYouSureDeleteAppointment: "Tem certeza que deseja excluir esta marcação?",
    areYouSureCancel: "Tem certeza que deseja cancelar esta marcação?",
    confirmDeleteSelected: "Excluir Selecionadas",
    areYouSureDeleteSelected: "Tem certeza que deseja excluir {count} marcações?",
    cancelAppointment: "Cancelar Marcação",
    saveAppointment: "Salvar Marcação",
    notes: "Notas",
    type: "Tipo",
    date: "Data",
    time: "Hora",
    recurrence: "Recorrência",
    frequency: "Frequência",
    times: "Vezes",
    period: "Período",
    // Frequency & Duration
    every24hours: "A cada 24 horas",
    every12hours: "A cada 12 horas",
    every8hours: "A cada 8 horas",
    every6hours: "A cada 6 horas",
    onceAWeek: "1 vez por semana",
    twiceAWeek: "2 vezes por semana",
    thriceAWeek: "3 vezes por semana",
    durationDays: "dias",
    durationWeeks: "semanas",
    treatmentDuration: "Duração do Tratamento",
    quantity: "Quantidade",
    selectDays: "Selecionar Dias",
    bathFrequency: "Frequência dos Banhos",
    // Weekdays
    sunday: "Domingo",
    monday: "Segunda",
    tuesday: "Terça",
    wednesday: "Quarta",
    thursday: "Quinta",
    friday: "Sexta",
    saturday: "Sábado",
    return: "Fisioterapia"
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'pt');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('isAuthenticated'));

  // Persist dismissed notification IDs to avoid showing/playing them again in this session
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissedNotificationIds');
    return saved ? JSON.parse(saved) : [];
  });

  const [professionalLogo, setProfessionalLogo] = useState<string | null>(() => {
    return localStorage.getItem('professionalLogo') || null;
  });

  const [userProfile, setUserProfile] = useState<OwnerInfo | null>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    } else {
      localStorage.removeItem('userProfile');
    }
  }, [userProfile]);

  const [pets, setPets] = useState<Pet[]>(() => {
    const savedPets = localStorage.getItem('pets');
    return savedPets ? JSON.parse(savedPets) : MOCK_PETS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const savedAppointments = localStorage.getItem('appointments');
    if (savedAppointments) {
      return JSON.parse(savedAppointments, (key, value) => {
        if (key === 'dateTime') return new Date(value);
        return value;
      });
    }
    return MOCK_APPOINTMENTS;
  });

  const [records, setRecords] = useState<MedicalRecord[]>(() => {
    const savedRecords = localStorage.getItem('records');
    if (savedRecords) {
      return JSON.parse(savedRecords, (key, value) => {
        if (key === 'createdAt' || key === 'date') return new Date(value);
        return value;
      });
    }
    // ensure vetHistory exists in records
    return MOCK_RECORDS.map(r => ({ ...r, vetHistory: r.vetHistory || [] }));
  });

  const [background, setBackground] = useState<string | null>(() => localStorage.getItem('background'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);



  // Use a ref for spoken alerts so it persists across re-renders but doesn't cause them
  const spokenAlertIds = useRef<Set<string>>(new Set());

  const dismissNotification = (id: string) => {
    setDismissedNotificationIds(prev => [...prev, id]);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem('language', language); }, [language]);
  useEffect(() => { localStorage.setItem('isAuthenticated', isAuthenticated ? 'true' : ''); }, [isAuthenticated]);
  useEffect(() => { localStorage.setItem('pets', JSON.stringify(pets)); }, [pets]);
  useEffect(() => { localStorage.setItem('appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('records', JSON.stringify(records)); }, [records]);
  useEffect(() => {
    if (background) localStorage.setItem('background', background);
    else localStorage.removeItem('background');
  }, [background]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  const login = (email: string) => setIsAuthenticated(true);
  const logout = () => { setIsAuthenticated(false); navigate('/'); };

  // Pets CRUD
  const getPet = (id: string) => pets.find(p => p.id === id);

  const addPet = (petData: Omit<Pet, 'id'>) => {
    const newPet = { ...petData, id: Date.now().toString() };
    setPets(prev => [...prev, newPet]);
    setRecords(prev => [...prev, { petId: newPet.id, categories: generateCategories(), weightHistory: [], vetHistory: [] }]);
  };

  const updatePet = (updatedPet: Pet) => {
    setPets(prev => prev.map(p => (p.id === updatedPet.id ? updatedPet : p)));
  };

  const deletePet = (id: string) => {
    setPets(prev => prev.filter(p => p.id !== id));
    setAppointments(prev => prev.filter(a => a.petId !== id));
    setRecords(prev => prev.filter(r => r.petId !== id));
  };

  // ------------------------------
  //   HISTÓRICO VETERINÁRIO (vet history)
  // ------------------------------
  // Vet history stored inside each record.vetHistory (array)
  const getVetHistory = (petId: string) => {
    const rec = records.find(r => r.petId === petId);
    return rec?.vetHistory || [];
  };

  const addVetNote = (petId: string, title: string, content: string) => {
    const newNote = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString(),
    };

    setRecords(prev =>
      prev.map(r =>
        r.petId === petId ? { ...r, vetHistory: [...(r.vetHistory || []), newNote] } : r
      )
    );
  };

  const updateVetNote = (petId: string, noteId: string, updatedData: Partial<{ title: string; content: string }>) => {
    setRecords(prev =>
      prev.map(r =>
        r.petId === petId
          ? {
            ...r,
            vetHistory: r.vetHistory?.map(note => note.id === noteId ? { ...note, ...updatedData } : note) || [],
          }
          : r
      )
    );
  };

  const deleteVetNote = (petId: string, noteId: string) => {
    setRecords(prev =>
      prev.map(r =>
        r.petId === petId ? { ...r, vetHistory: r.vetHistory?.filter(note => note.id !== noteId) || [] } : r
      )
    );
  };

  // Appointments / records functions (kept)
  const getAppointment = (id: string) => appointments.find(a => a.id === id);
  const getAppointmentsForPet = (petId: string) => appointments.filter(a => a.petId === petId);

  const addAppointment = (appointmentData: Omit<Appointment, 'id' | 'status'>) => {
    const newAppointment = { ...appointmentData, id: Date.now().toString(), status: AppointmentStatus.Scheduled };
    setAppointments(prev => [...prev, newAppointment]);
  };

  const addAppointments = (newAppointmentsData: Omit<Appointment, 'id' | 'status'>[]) => {
    const newAppointments = newAppointmentsData.map(appt => ({
      ...appt,
      id: `${Date.now()}-${Math.random()}`,
      status: AppointmentStatus.Scheduled
    }));
    setAppointments(prev => [...prev, ...newAppointments]);
  };

  const updateAppointment = (updatedAppointment: Appointment) => {
    setAppointments(prev =>
      prev.map(a => {
        if (a.id !== updatedAppointment.id) return a;
        // when user changes date/time → reset notifications markers for that appointment
        const updated = {
          ...a,
          ...updatedAppointment,
          lastNotifiedDay: null,
          lastNotifiedHour: null,
        };
        return updated;
      })
    );
  };

  const updateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status } : a));
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const deleteAppointments = (ids: string[]) => {
    setAppointments(prev => prev.filter(a => !ids.includes(a.id)));
  };

  const getRecordForPet = (petId: string) => records.find(r => r.petId === petId);

  const addMedicalFile = (petId: string, categoryTitle: string, fileData: Omit<MedicalFile, 'id' | 'createdAt'>) => {
    setRecords(prev => prev.map(record => {
      if (record.petId === petId) {
        const newCategories = record.categories.map(cat => {
          if (cat.title === categoryTitle) {
            const newFile: MedicalFile = { ...fileData, id: Date.now().toString(), createdAt: new Date() };
            return { ...cat, files: [...cat.files, newFile] };
          }
          return cat;
        });
        return { ...record, categories: newCategories };
      }
      return record;
    }));
  };

  const renameMedicalFile = (petId: string, categoryTitle: string, fileId: string, newName: string) => {
    setRecords(prev => prev.map(rec => rec.petId === petId ? {
      ...rec,
      categories: rec.categories.map(cat => cat.title === categoryTitle ? {
        ...cat,
        files: cat.files.map(file => file.id === fileId ? { ...file, name: newName } : file)
      } : cat)
    } : rec));
  };

  const updateMedicalFileNote = (petId: string, categoryTitle: string, fileId: string, note: string) => {
    setRecords(prev => prev.map(rec => rec.petId === petId ? {
      ...rec,
      categories: rec.categories.map(cat => cat.title === categoryTitle ? {
        ...cat,
        files: cat.files.map(file => file.id === fileId ? { ...file, note } : file)
      } : cat)
    } : rec));
  };

  const deleteMedicalFile = (petId: string, categoryTitle: string, fileId: string) => {
    setRecords(prev => prev.map(rec => rec.petId === petId ? {
      ...rec,
      categories: rec.categories.map(cat => cat.title === categoryTitle ? {
        ...cat,
        files: cat.files.filter(file => file.id !== fileId)
      } : cat)
    } : rec));
  };

  const updateCategoryOrder = (petId: string, newCategories: MedicalRecordCategory[]) => {
    setRecords(prev => prev.map(rec => rec.petId === petId ? { ...rec, categories: newCategories } : rec));
  };

  const addWeightEntry = (petId: string, entryData: Omit<WeightEntry, 'id'>) => {
    setRecords(prev => prev.map(rec => rec.petId === petId ? {
      ...rec,
      weightHistory: [...(rec.weightHistory || []), { ...entryData, id: Date.now().toString() }]
    } : rec));
  };

  const updateWeightEntry = (petId: string, updatedEntry: WeightEntry) => {
    setRecords(prev => prev.map(rec => rec.petId === petId ? {
      ...rec,
      weightHistory: (rec.weightHistory || []).map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
    } : rec));
  };

  const deleteWeightEntry = (petId: string, entryId: string) => {
    setRecords(prev => prev.map(rec => rec.petId === petId ? {
      ...rec,
      weightHistory: (rec.weightHistory || []).filter(entry => entry.id !== entryId)
    } : rec));
  };

  // ---------------------------------------------------------------------------
  // GLOBAL VOICE ALERT LOGIC (Moved from Layout.tsx)
  // ---------------------------------------------------------------------------

  // State to track which alerts are currently valid and triggered based on time
  const [activeAlertIds, setActiveAlertIds] = useState<string[]>([]);
  const lastSpokenAlertId = useRef<string | null>(null);

  // Helper to translate appointment types (needed for voice alert text)
  const getTranslatedType = (type: string) => {
    const key = type.toLowerCase().replace(/[^a-z0-9]/gi, '');
    const translations = translationData[language] || translationData.en;
    return translations[key] || type;
  };

  // 1. Time Checker: Identifies appointments that need alerting
  useEffect(() => {
    const checkTime = () => {
      const currentTime = new Date().getTime();
      const newTriggeredIds: string[] = [];

      [...appointments]
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
        .forEach(appt => {
          if (appt.status !== AppointmentStatus.Scheduled) return;

          const apptTime = new Date(appt.dateTime).getTime();
          const diffMs = apptTime - currentTime;
          // Use minutes for higher precision to match the visual countdowns exactly
          const diffMinutes = diffMs / (1000 * 60);

          // 24 Hours warning
          // Trigger exactly between 23h 59m and 24h 00m (1439 - 1440 minutes)
          // EXCEPTION: Do not trigger 24h alert for Medication
          if (diffMinutes >= 1439 && diffMinutes <= 1440 && appt.type !== 'Treatment/Medication') {
            newTriggeredIds.push(`${appt.id}-24h`);
          }

          // 1 Hour warning
          // Trigger for any time within the last hour (so we don't miss it if created late)
          if (diffMinutes > 0 && diffMinutes <= 60) {
            newTriggeredIds.push(`${appt.id}-1h`);
          }
        });

      // Update state if we found new alerts that aren't already tracked locally
      if (newTriggeredIds.length > 0) {
        setActiveAlertIds(prev => {
          const existingSet = new Set(prev);
          const hasNew = newTriggeredIds.some(id => !existingSet.has(id));

          if (!hasNew) return prev;

          const all = Array.from(new Set([...prev, ...newTriggeredIds]));

          // Transform all alert IDs into sorted objects
          const alertObjects = all.map(alertId => {
            const parts = alertId.split('-');
            const type = parts.pop();
            const apptId = parts.join('-');

            const appt = appointments.find(a => a.id === apptId);
            if (!appt) return null;

            const apptTime = new Date(appt.dateTime).getTime();
            const triggerTime =
              type === "24h"
                ? apptTime - 24 * 60 * 60 * 1000
                : apptTime - 60 * 60 * 1000;

            return { alertId, triggerTime };
          }).filter(Boolean);

          // Sort alerts by real alert time
          alertObjects.sort((a, b) => a.triggerTime - b.triggerTime);

          return alertObjects.map(a => a.alertId);
        });
      }

    };

    // Check every 10 seconds for better precision than 60s, ensures we hit the 1-minute window
    const intervalId = setInterval(checkTime, 10000);
    checkTime(); // Run immediately

    return () => clearInterval(intervalId);
  }, [appointments]);


  // 2. Audio Looper: Plays sound continuously for active, undismissed alerts
  // Cleanup on unmount ONLY
  // 2. Audio Looper: Plays sound continuously for active, undismissed alerts
  // Cleanup on unmount ONLY
  useEffect(() => {
    return () => {
      if (Capacitor.isNativePlatform()) {
        TextToSpeech.stop();
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // @ts-ignore
        window.currentUtterance = undefined;
      }
    };
  }, []);

  useEffect(() => {
    // Filter out alerts that the user has explicitly dismissed globally
    // Convert IDs to full alert objects with actual trigger times
    const pendingAlerts = activeAlertIds
      .filter(alertId => {
        const parts = alertId.split('-');
        parts.pop(); // remove type (1h or 24h)
        const apptId = parts.join('-');
        return !dismissedNotificationIds.includes(apptId);
      })
      .map(alertId => {
        const parts = alertId.split('-');
        const type = parts.pop();
        const apptId = parts.join('-');

        const appt = appointments.find(a => a.id === apptId);
        if (!appt) return null;

        const apptTime = new Date(appt.dateTime).getTime();

        const triggerTime = type === "24h"
          ? apptTime - 24 * 60 * 60 * 1000
          : apptTime - 60 * 60 * 1000;

        return { alertId, triggerTime };
      })
      .filter(Boolean)
      .sort((a, b) => a.triggerTime - b.triggerTime); // SORT BY ACTUAL ALERT TIME


    if (pendingAlerts.length === 0) {
      if (Capacitor.isNativePlatform()) {
        TextToSpeech.stop();
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // @ts-ignore
        window.currentUtterance = undefined;
      }
      lastSpokenAlertId.current = null;
      return;
    }

    // Pick the first pending alert to speak
    const currentAlertKey = pendingAlerts[0]?.alertId;

    // If we are already speaking THIS alert, do nothing (let it loop)
    // This prevents interruption when other alerts (like the one expiring) change the list
    if (lastSpokenAlertId.current === currentAlertKey) {
      if (!Capacitor.isNativePlatform() && window.speechSynthesis.speaking) return;
      // For native, we rely on the loop timeout, but checking 'speaking' state is harder sync.
      // We'll trust the loop logic below.
    }

    // If we are speaking a DIFFERENT alert, or nothing, start speaking this one
    lastSpokenAlertId.current = currentAlertKey;

    const parts = currentAlertKey.split('-');
    const type = parts.pop();
    const apptId = parts.join('-');

    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    const translatedType = getTranslatedType(appt.type);
    const translations = translationData[language] || translationData.en;

    const text = (type === '24h' ? translations.voiceAlertDay : translations.voiceAlertHour)
      .replace('{pet}', appt.petName)
      .replace('{type}', translatedType);

    let timer: ReturnType<typeof setTimeout>;
    let isActive = true;

    const speakLoop = async () => {
      if (!isActive) return;

      if (Capacitor.isNativePlatform()) {
        // NATIVE (Android/iOS)
        try {
          await TextToSpeech.stop(); // Stop potential previous
          await TextToSpeech.speak({
            text: text,
            lang: language === 'pt' ? 'pt-BR' : 'en-US',
            rate: 1.0,
            pitch: 1.0,
            category: 'ambient',
          });

          // When finished speaking (promise resolves), wait and loop
          if (isActive) {
            timer = setTimeout(speakLoop, 5000);
          }
        } catch (err) {
          console.error("TTS Error:", err);
        }

      } else {
        // WEB FALLBACK
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance(text);
          const targetLang = language === 'pt' ? 'pt-BR' : 'en-US';
          utterance.lang = targetLang;
          utterance.rate = 1;

          // Voice selection logic:
          const voices = window.speechSynthesis.getVoices();
          const maleVoice = voices.find(v =>
            v.lang === targetLang &&
            (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('masculino'))
          );
          const googleVoice = voices.find(v => v.lang === targetLang && v.name.includes('Google'));
          utterance.voice = maleVoice || googleVoice || voices.find(v => v.lang === targetLang) || null;

          // @ts-ignore
          window.currentUtterance = utterance;

          // When finished, wait 5 seconds and speak again (Loop)
          utterance.onend = () => {
            if (isActive) {
              timer = setTimeout(speakLoop, 5000);
            }
          };

          window.speechSynthesis.speak(utterance);
        }
      }
    };

    // For Web, ensure voices are loaded
    if (!Capacitor.isNativePlatform() && window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => speakLoop();
    } else {
      speakLoop();
    }

    return () => {
      isActive = false;
      clearTimeout(timer);
      if (Capacitor.isNativePlatform()) {
        TextToSpeech.stop().catch(() => { });
      } else {
        // IMPORTANT: Do NOT cancel speech here for Web if same alert (as per previous logic),
        // but for safety in this refactor we typically want cleaner unmounts.
        // However, keeping previous behavior for Web consistency:
        // "If the alert CHANGED, the next effect run will cancel it"
      }
    };
  }, [activeAlertIds, dismissedNotificationIds, appointments, language]);

  // Context value
  const value: AppContextType = {
    theme, toggleTheme,
    language, setLanguage,
    isAuthenticated, login, logout,
    pets, getPet, addPet, updatePet, deletePet,
    appointments, getAppointment, getAppointmentsForPet, addAppointment, addAppointments, updateAppointment, updateAppointmentStatus, deleteAppointment, deleteAppointments,
    records, getRecordForPet, addMedicalFile, renameMedicalFile, updateMedicalFileNote, deleteMedicalFile, updateCategoryOrder,
    addWeightEntry, updateWeightEntry, deleteWeightEntry,
    // vet history
    getVetHistory, addVetNote, updateVetNote, deleteVetNote,
    translations: translationData[language] || translationData.en,
    background, setBackground,
    isSettingsOpen, openSettings: () => setIsSettingsOpen(true), closeSettings: () => setIsSettingsOpen(false),
    dismissedNotificationIds, dismissNotification, spokenAlertIds,

    activeAlertIds,
    professionalLogo, setProfessionalLogo,
    userProfile, setUserProfile
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Settings modal component (mantive igual)
// Settings modal component
const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen, closeSettings, translations, theme, toggleTheme,

    language, setLanguage, professionalLogo, setProfessionalLogo
  } = useAppContext();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        let base64 = event.target?.result as string;
        try {
          // Compress to avoid localStorage limits
          base64 = await compressImage(base64, 300, 0.7);
          setProfessionalLogo(base64);
        } catch (err) {
          console.error("Logo compression failed", err);
          setProfessionalLogo(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={closeSettings}>
      <div className="bg-surface-light dark:bg-surface-dark text-text-light dark:text-white rounded-xl shadow-2xl w-full max-w-sm m-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">{translations.settings || 'Settings'}</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <span className="font-medium">{translations.theme || 'Theme'}</span>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            </button>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">{translations.language || 'Language'}</span>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-gray-500"
              >
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-200">
                <LanguagesIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700 my-4" />

          {/* Professional Logo Section */}
          <div className="space-y-3">
            <span className="font-medium block">{translations.professionalLogo}</span>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{translations.logoInfo}</p>

            <div className="flex items-center space-x-4">
              {professionalLogo ? (
                <div className="relative group">
                  <img src={professionalLogo} alt="Logo" className="h-16 w-16 object-contain rounded-md border border-gray-300 dark:border-gray-600 bg-white" />
                  <button
                    onClick={() => setProfessionalLogo(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                  <span className="text-xs text-gray-400">No Logo</span>
                </div>
              )}

              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary text-white hover:bg-primary-dark font-medium py-1.5 px-3 rounded text-sm transition shadow-sm"
                >
                  {translations.uploadLogo}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button onClick={closeSettings} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">
            {translations.save || 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  // Ask browser for notifications permission once on app load
  useEffect(() => {
    requestNotificationPermission();
  }, []);



  return (
    <HashRouter>
      <ScrollToTop />
      <AppProvider>
        <PrivacyBanner />
        <Routes>
          <Route path="/history/:petId" element={<VetHistory />} />
          <Route path="/" element={<HomeScreen />} />
          <Route path="/pets" element={<PetListScreen />} />
          <Route path="/pet/new" element={<PetFormScreen />} />
          <Route path="/pet/edit/:petId" element={<PetFormScreen />} />
          <Route path="/pet/:petId" element={<PetDetailScreen />} />
          <Route path="/pet/:petId/owner" element={<PetOwnerScreen />} />
          <Route path="/tutor" element={<PetOwnerScreen />} />
          <Route path="/schedule" element={<ScheduleScreen />} />
          <Route path="/appointment/new/:petId" element={<AppointmentFormScreen />} />
          <Route path="/appointment/edit/:appointmentId" element={<AppointmentFormScreen />} />
          <Route path="/record/:petId" element={<MedicalRecordScreen />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />
        </Routes>
        <SettingsModal />
      </AppProvider>
    </HashRouter>
  );
};
