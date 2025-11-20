

import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import type { Pet, Appointment, Language, Theme, MedicalRecord, MedicalFile, MedicalRecordCategory, WeightEntry } from './types';
import { AppointmentStatus } from './types';
import { HomeScreen } from './screens/HomeScreen';
import { PetListScreen } from './screens/PetListScreen';
import { PetDetailScreen } from './screens/PetDetailScreen';
import { PetFormScreen } from './screens/PetFormScreen';
import { ScheduleScreen } from './screens/ScheduleScreen';
import { AppointmentFormScreen } from './screens/AppointmentFormScreen';
import { MedicalRecordScreen } from './screens/MedicalRecordScreen';
import { MOCK_PETS, MOCK_APPOINTMENTS, MOCK_RECORDS, generateCategories } from './mockData';
import { MoonIcon, SunIcon, LanguagesIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from './components/Icons';

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
        login: "Login",
        register: "Register",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm Password",
        showPassword: "Show Password",
        passwordsMismatch: "Passwords do not match.",
        haveAccount: "Already have an account? Login",
        noAccount: "Don't have an account? Register",
        biometricLogin: "Biometric Login",
        pets: "My Pets",
        all: "All",
        canine: "Canine",
        feline: "Feline",
        exotic: "Exotic",
        addPet: "Add Pet",
        editPet: "Edit Pet",
        removePet: "Remove Pet",
        schedule: "Schedule",
        open: "Open",
        appointments: "Appointments",
        medicalRecord: "Medical Record",
        home: "Home",
        back: "Back",
        language: "Language",
        save: "Save",
        petDetails: "Pet Details",
        name: "Name",
        microchip: "Microchip",
        species: "Species",
        breed: "Breed",
        gender: "Gender",
        color: "Color",
        sterilized: "Sterilized?",
        yes: "Yes",
        no: "No",
        behaviorWithAnimals: "Behavior with Animals",
        behaviorWithPeople: "Behavior with People",
        docile: "Docile",
        friendly: "Friendly",
        brave: "Brave",
        aggressive: "Aggressive",
        choosePhoto: "Choose Photo",
        specifyBreedPlaceholder: "Specify breed...",
        other: "Other",
        cancel: "Cancel",
        newAppointment: "New Appointment",
        editAppointment: "Edit Appointment",
        appointmentType: "Appointment Type",
        consultation: "Consultation",
        surgery: "Surgery",
        vaccination: "Vaccination",
        application: "Application",
        grooming: "Grooming",
        controlanalysis: "Control Analysis",
        urgency: "Urgency",
        dentaltreatment: "Dental Treatment",
        imagingexam: "Imaging Exam",
        followup: "Follow-up",
        treatmentmedication: "Treatment/Medication",
        therapeuticbath: "Therapeutic Bath",
        chemotherapy: "Chemotherapy",
        others: "Others",
        date: "Date and Time",
        notes: "Notes",
        upcoming: "Upcoming",
        history: "History",
        noUpcomingAppointments: "No upcoming appointments.",
        noAppointmentHistory: "No appointment history found.",
        confirmCancelAppointment: "Confirm Cancellation",
        areYouSureCancel: "Are you sure you want to cancel this appointment?",
        confirmDeleteAppointment: "Confirm Deletion",
        areYouSureDeleteAppointment: "Are you sure you want to permanently delete this appointment from the history?",
        delete: "Delete",
        attended: "Attended",
        didNotAttend: "Did Not Attend",
        administered: "Administered",
        notAdministered: "Not Administered",
        awaitingStatus: "Awaiting status...",
        select: "Select",
        cancelSelection: "Cancel",
        selectAll: "Select All",
        deleteSelected: "Delete Selected",
        confirmDeleteSelected: "Confirm Deletion",
        areYouSureDeleteSelected: "Are you sure you want to delete the {count} selected appointments?",
        filterByPet: "Filter by pet",
        allPets: "All Pets",
        animalWeight: "Animal Weight",
        unit: "Unit",
        kg: "kg",
        lb: "lb",
        g: "g",
        weight: "Weight",
        addEntry: "Add Entry",
        actions: "Actions",
        confirmDeleteWeightEntry: "Confirm Weight Entry Deletion",
        areYouSureDeleteWeightEntry: "Are you sure you want to delete this weight entry? This action cannot be undone.",
        rename: "Rename",
        share: "Share",
        confirmDeleteFile: "Confirm File Deletion",
        areYouSureDeleteFile: "Are you sure you want to delete the file {fileName}?",
        attachFile: "Attach File",
        capturePhoto: "Capture Photo",
        captureVideo: "Capture Video",
        recordAudio: "Record Audio",
        reorder: "Reorder",
        doneReordering: "Done",
        logout: "Logout",
        settings: "Settings",
        theme: "Theme",
        selectPet: "Select a pet to see more options.",
        confirmDelete: "Confirm Deletion",
        frequency: "Frequency",
        every24hours: "Every 24 hours",
        every12hours: "Every 12 hours",
        every8hours: "Every 8 hours",
        every6hours: "Every 6 hours",
        treatmentDuration: "Treatment Duration",
        quantity: "Quantity",
        durationDays: "days",
        durationWeeks: "weeks",
        durationMonths: "months",
        days: "d",
        hours: "h",
        minutes: "m",
        seconds: "s",
        lastDose: "Last Dose",
        lastBath: "Last Bath",
        checkSchedule: "Check Schedule",
        bathFrequency: "Bath Frequency",
        onceAWeek: "Once a week",
        twiceAWeek: "Twice a week",
        thriceAWeek: "Thrice a week",
        selectDays: "Select Days",
        sunday: "Sunday",
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        setHomeBg: "Change Background",
        clearBg: "Clear",
        addToCalendar: "Add to Calendar",
        notifications: "Notifications",
        noNotifications: "No upcoming notifications (24h).",
        voiceAlertDay: "One day left for {pet}'s appointment.",
        voiceAlertHour: "One hour left for {pet}'s appointment.",
        dismiss: "Dismiss"
    },
    pt: {
        appName: "VetConnect",
        login: "Entrar",
        register: "Cadastrar",
        email: "E-mail",
        password: "Senha",
        confirmPassword: "Confirmar Senha",
        showPassword: "Mostrar Senha",
        passwordsMismatch: "As senhas não coincidem.",
        haveAccount: "Já tem uma conta? Entrar",
        noAccount: "Não tem uma conta? Cadastre-se",
        biometricLogin: "Login Biométrico",
        pets: "Meus Pets",
        all: "Todos",
        canine: "Canino",
        feline: "Felino",
        exotic: "Exótico",
        addPet: "Adicionar Pet",
        editPet: "Editar Pet",
        removePet: "Remover Pet",
        schedule: "Agenda",
        open: "Abrir",
        appointments: "Consultas",
        medicalRecord: "Prontuário",
        home: "Início",
        back: "Voltar",
        language: "Idioma",
        save: "Salvar",
        petDetails: "Detalhes do Pet",
        name: "Nome",
        microchip: "Microchip",
        species: "Espécie",
        breed: "Raça",
        gender: "Gênero",
        color: "Cor",
        sterilized: "Castrado(a)?",
        yes: "Sim",
        no: "Não",
        behaviorWithAnimals: "Comportamento (c/ animais)",
        behaviorWithPeople: "Comportamento (c/ pessoas)",
        docile: "Dócil",
        friendly: "Amigável",
        brave: "Corajoso",
        aggressive: "Agressivo",
        choosePhoto: "Escolher Foto",
        specifyBreedPlaceholder: "Especifique a raça...",
        other: "Outro",
        cancel: "Cancelar",
        newAppointment: "Nova Consulta",
        editAppointment: "Editar Consulta",
        appointmentType: "Tipo de Consulta",
        consultation: "Consulta",
        surgery: "Cirurgia",
        vaccination: "Vacinação",
        application: "Aplicação",
        grooming: "Banho e Tosa",
        controlanalysis: "Análise de Controle",
        urgency: "Urgência",
        dentaltreatment: "Tratamento Dentário",
        imagingexam: "Exame de Imagem",
        followup: "Retorno",
        treatmentmedication: "Tratamento/Medicação",
        therapeuticbath: "Banho Terapêutico",
        chemotherapy: "Quimioterapia",
        others: "Outros",
        date: "Data e Hora",
        notes: "Observações",
        upcoming: "Próximas",
        history: "Histórico",
        noUpcomingAppointments: "Nenhuma consulta agendada.",
        noAppointmentHistory: "Nenhum histórico de consultas.",
        confirmCancelAppointment: "Confirmar Cancelamento",
        areYouSureCancel: "Tem certeza que deseja cancelar esta consulta?",
        confirmDeleteAppointment: "Confirmar Exclusão",
        areYouSureDeleteAppointment: "Tem certeza que deseja excluir permanentemente esta consulta do histórico?",
        delete: "Excluir",
        attended: "Compareceu",
        didNotAttend: "Não Compareceu",
        administered: "Administrado",
        notAdministered: "Não Administrado",
        awaitingStatus: "Aguardando status...",
        select: "Selecionar",
        cancelSelection: "Cancelar",
        selectAll: "Selecionar Tudo",
        deleteSelected: "Excluir Selecionados",
        confirmDeleteSelected: "Confirmar Exclusão",
        areYouSureDeleteSelected: "Tem certeza que deseja excluir os {count} agendamentos selecionados?",
        filterByPet: "Filtrar por pet",
        allPets: "Todos os Pets",
        animalWeight: "Peso do Animal",
        unit: "Unidade",
        kg: "kg",
        lb: "lb",
        g: "g",
        weight: "Peso",
        addEntry: "Adicionar",
        actions: "Ações",
        confirmDeleteWeightEntry: "Confirmar Exclusão de Peso",
        areYouSureDeleteWeightEntry: "Tem certeza de que deseja excluir este registro de peso? Esta ação não pode ser desfeita.",
        rename: "Renomear",
        share: "Compartilhar",
        confirmDeleteFile: "Confirmar Exclusão de Arquivo",
        areYouSureDeleteFile: "Tem certeza que deseja excluir o arquivo {fileName}?",
        attachFile: "Anexar Arquivo",
        capturePhoto: "Capturar Foto",
        captureVideo: "Capturar Vídeo",
        recordAudio: "Gravar Áudio",
        reorder: "Reordenar",
        doneReordering: "Concluir",
        logout: "Sair",
        settings: "Configurações",
        theme: "Modo",
        selectPet: "Selecione um pet para ver mais opções.",
        confirmDelete: "Confirmar Exclusão",
        frequency: "Frequência",
        every24hours: "A cada 24 horas",
        every12hours: "A cada 12 horas",
        every8hours: "A cada 8 horas",
        every6hours: "A cada 6 horas",
        treatmentDuration: "Duração do Tratamento",
        quantity: "Quantidade",
        durationDays: "dias",
        durationWeeks: "semanas",
        durationMonths: "meses",
        days: "d",
        hours: "h",
        minutes: "m",
        seconds: "s",
        lastDose: "Última Dose",
        lastBath: "Último Banho",
        checkSchedule: "Verificar Agenda",
        bathFrequency: "Frequência do Banho",
        onceAWeek: "1x por semana",
        twiceAWeek: "2x por semana",
        thriceAWeek: "3x por semana",
        selectDays: "Selecione os dias",
        sunday: "Domingo",
        monday: "Segunda",
        tuesday: "Terça",
        wednesday: "Quarta",
        thursday: "Quinta",
        friday: "Sexta",
        saturday: "Sábado",
        setHomeBg: "Alterar plano de fundo",
        clearBg: "Limpar",
        addToCalendar: "Adicionar à Agenda",
        notifications: "Notificações",
        noNotifications: "Sem notificações (24h).",
        voiceAlertDay: "Falta um dia para consulta de {pet}.",
        voiceAlertHour: "Falta uma hora para consulta de {pet}.",
        dismiss: "Dispensar"
    }
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('theme') as Theme;
        return savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    });

    const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'pt');
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('isAuthenticated'));
    
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
        return MOCK_RECORDS;
    });
    
    const [background, setBackground] = useState<string | null>(() => localStorage.getItem('background'));
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Persist dismissed notification IDs to avoid showing/playing them again in this session
    const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
    
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
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
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
    
    const getPet = (id: string) => pets.find(p => p.id === id);
    
    const addPet = (petData: Omit<Pet, 'id'>) => {
        const newPet = { ...petData, id: Date.now().toString() };
        setPets(prev => [...prev, newPet]);
        setRecords(prev => [...prev, { petId: newPet.id, categories: generateCategories(), weightHistory: [] }]);
    };

    const updatePet = (updatedPet: Pet) => {
        setPets(prev => prev.map(p => (p.id === updatedPet.id ? updatedPet : p)));
    };

    const deletePet = (id: string) => {
        setPets(prev => prev.filter(p => p.id !== id));
        setAppointments(prev => prev.filter(a => a.petId !== id));
        setRecords(prev => prev.filter(r => r.petId !== id));
    };

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
        setAppointments(prev => prev.map(a => (a.id === updatedAppointment.id ? updatedAppointment : a)));
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
    
    const addMedicalFile = (petId: string, categoryTitle: string, fileData: Omit<MedicalFile, 'id'|'createdAt'>) => {
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
                files: cat.files.map(file => file.id === fileId ? {...file, name: newName} : file)
            } : cat)
        } : rec));
    };

    const updateMedicalFileNote = (petId: string, categoryTitle: string, fileId: string, note: string) => {
         setRecords(prev => prev.map(rec => rec.petId === petId ? {
            ...rec,
            categories: rec.categories.map(cat => cat.title === categoryTitle ? {
                ...cat,
                files: cat.files.map(file => file.id === fileId ? {...file, note} : file)
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

    const value: AppContextType = {
        theme, toggleTheme,
        language, setLanguage,
        isAuthenticated, login, logout,
        pets, getPet, addPet, updatePet, deletePet,
        appointments, getAppointment, getAppointmentsForPet, addAppointment, addAppointments, updateAppointment, updateAppointmentStatus, deleteAppointment, deleteAppointments,
        records, getRecordForPet, addMedicalFile, renameMedicalFile, updateMedicalFileNote, deleteMedicalFile, updateCategoryOrder,
        addWeightEntry, updateWeightEntry, deleteWeightEntry,
        translations: translationData[language] || translationData.en,
        background, setBackground,
        isSettingsOpen, openSettings: () => setIsSettingsOpen(true), closeSettings: () => setIsSettingsOpen(false),
        dismissedNotificationIds, dismissNotification, spokenAlertIds
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const SettingsModal: React.FC = () => {
    const { 
        isSettingsOpen, closeSettings, translations, theme, toggleTheme,
        language, setLanguage
    } = useAppContext();

    if (!isSettingsOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={closeSettings}>
            <div className="bg-surface-light dark:bg-surface-dark text-text-light dark:text-white rounded-xl shadow-2xl w-full max-w-sm m-4" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold">{translations.settings}</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <span className="font-medium">{translations.theme}</span>
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                        </button>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium">{translations.language}</span>
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
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button onClick={closeSettings} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">
                        {translations.save}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const App: React.FC = () => {
    return (
        <HashRouter>
            <AppProvider>
                <Routes>
                    <Route path="/" element={<HomeScreen />} />
                    <Route path="/pets" element={<PetListScreen />} />
                    <Route path="/pet/new" element={<PetFormScreen />} />
                    <Route path="/pet/edit/:petId" element={<PetFormScreen />} />
                    <Route path="/pet/:petId" element={<PetDetailScreen />} />
                    <Route path="/schedule" element={<ScheduleScreen />} />
                    <Route path="/appointment/new/:petId" element={<AppointmentFormScreen />} />
                    <Route path="/appointment/edit/:appointmentId" element={<AppointmentFormScreen />} />
                    <Route path="/record/:petId" element={<MedicalRecordScreen />} />
                </Routes>
                <SettingsModal />
            </AppProvider>
        </HashRouter>
    );
};