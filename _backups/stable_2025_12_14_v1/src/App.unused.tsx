// App.tsx
import { requestNotificationPermission } from "./notifications";
import { LocalNotifications } from '@capacitor/local-notifications';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';
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
  WeightEntry
} from '../types';
import { AppointmentStatus } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { PetListScreen } from '../screens/PetListScreen';
import { PetDetailScreen } from '../screens/PetDetailScreen';
import { PetFormScreen } from '../screens/PetFormScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { AppointmentFormScreen } from '../screens/AppointmentFormScreen';
import { MedicalRecordScreen } from '../screens/MedicalRecordScreen';
import { MOCK_PETS, MOCK_APPOINTMENTS, MOCK_RECORDS, generateCategories } from '../mockData';
import { MoonIcon, SunIcon, LanguagesIcon } from '../components/Icons';
import PrivacyPolicy from './pages/PrivacyPolicy.pt';
import { PrivacyBanner } from "./components/PrivacyBanner";
import TermsOfUse from "./pages/TermsOfUse";

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
  // Notification & Voice Alert Logic (Global Persistence)
  dismissedNotificationIds: string[];
  dismissNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

const translationData = {
  en: {
    /* ... (mantive os textos como no seu original; se quiser eu deixo exatamente iguais) ... */
    appName: "VetConnect",
    notifications: "Notifications",
    noNotifications: "No upcoming notifications (24h).",
    voiceAlertDay: "One day left for {pet}'s {type}.",
    voiceAlertHour: "One hour left for {pet}'s {type}.",
    dismiss: "Dismiss",
    back: "Back",
    save: "Save",
    petDetails: "Details",
    /* (restante das traduções) */
  },
  pt: {
    appName: "VetConnect",
    notifications: "Notificações",
    noNotifications: "Sem notificações (24h).",
    voiceAlertDay: "Falta um dia para {type} de {pet}.",
    voiceAlertHour: "Falta uma hora para {type} de {pet}.",
    dismiss: "Dispensar",
    back: "Voltar",
    save: "Salvar",
    petDetails: "Detalhes",
    others: "Fisioterapia",
    followup: "Acupuntura",
    /* (restante das traduções) */
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    // ensure vetHistory exists in records
    return MOCK_RECORDS.map(r => ({ ...r, vetHistory: r.vetHistory || [] }));
  });

  const [background, setBackground] = useState<string | null>(() => localStorage.getItem('background'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Persist dismissed notification IDs to avoid showing/playing them again in this session
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

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


  // Wrapper for LocalNotifications
  const scheduleAppointmentNotifications = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // 1. Check/Request Permissions
      const permissionStatus = await LocalNotifications.checkPermissions();
      if (permissionStatus.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      // 1b. Create High Priority Channel
      await LocalNotifications.createChannel({
        id: 'vetconnect-alerts',
        name: 'VetConnect Alerts',
        description: 'Alertas de voz para consultas e tratamentos',
        importance: 5, // MAX importance (Heads-up + Sound)
        visibility: 1, // Public
        sound: undefined, // Uses default system notification sound
        vibration: true,
      });

      // 2. Clear existing notifications to avoid duplicates (simplest strategy for this scale)
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }

      // 3. Prepare notifications
      const notificationsToSchedule: any[] = [];
      const now = new Date().getTime();

      appointments.forEach(appt => {
        if (appt.status !== AppointmentStatus.Scheduled) return;

        const apptTime = new Date(appt.dateTime).getTime();
        const petName = pets.find(p => p.id === appt.petId)?.name || 'Pet';
        const typeTranslated = translationData[language]?.voiceAlertHour ? (appt.type === 'Treatment/Medication' ? 'Tratamento' : appt.type) : appt.type;
        // Using basic translation logic for body text
        const bodyText = language === 'pt' ? `Consulta de ${petName}` : `Appointment for ${petName}`;

        // 1 Hour Before
        const trigger1h = apptTime - 60 * 60 * 1000;
        if (trigger1h > now) {
          notificationsToSchedule.push({
            id: Math.abs(hashCode(`${appt.id}-1h`)),
            title: 'VetConnect Alert',
            body: language === 'pt' ? `Falta 1 hora para: ${typeTranslated} de ${petName}` : `1 hour left for: ${typeTranslated} of ${petName}`,
            schedule: {
              at: new Date(trigger1h),
              allowWhileIdle: true,
              channelId: 'vetconnect-alerts'
            },
            extra: {
              textToSpeak: language === 'pt' ? `Falta 1 hora para: ${typeTranslated} de ${petName}` : `1 hour left for: ${typeTranslated} of ${petName}`
            }
          });
        }

        // 24 Hours Before
        const trigger24h = apptTime - 24 * 60 * 60 * 1000;
        if (trigger24h > now && appt.type !== 'Treatment/Medication') {
          notificationsToSchedule.push({
            id: Math.abs(hashCode(`${appt.id}-24h`)),
            title: 'VetConnect Alert',
            body: language === 'pt' ? `Falta 1 dia para: ${typeTranslated} de ${petName}` : `1 day left for: ${typeTranslated} of ${petName}`,
            schedule: {
              at: new Date(trigger24h),
              allowWhileIdle: true,
              channelId: 'vetconnect-alerts'
            },
            extra: {
              textToSpeak: language === 'pt' ? `Falta 1 dia para: ${typeTranslated} de ${petName}` : `1 day left for: ${typeTranslated} of ${petName}`
            }
          });
        }
      });

      if (notificationsToSchedule.length > 0) {
        await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      }

    } catch (error) {
      console.error("Error scheduling notifications:", error);
    }
  };

  // Schedule whenever appointments change
  useEffect(() => {
    scheduleAppointmentNotifications();
  }, [appointments, pets, language]);

  const deleteWeightEntry = (petId: string, entryId: string) => {
    setRecords(prev => prev.map(rec => rec.petId === petId ? {
      ...rec,
      weightHistory: (rec.weightHistory || []).filter(entry => entry.id !== entryId)
    } : rec));
  };

  // ---------------------------------------------------------------------------
  // GLOBAL VOICE ALERT LOGIC 
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // Listener for Local Notifications (Foreground & Background "wakeup")
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        if (notification.extra && notification.extra.textToSpeak) {
          console.log(`VetConnect Alert: ${notification.extra.textToSpeak}`);
          TextToSpeech.speak({
            text: notification.extra.textToSpeak,
            lang: language === 'pt' ? 'pt-BR' : 'en-US',
            rate: 1.0,
            pitch: 1.0,
            category: 'ambient',
          });
        }
      });
    }

    return () => {
      if (Capacitor.isNativePlatform()) {
        LocalNotifications.removeAllListeners();
      }
    };
  }, [language]);


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
    dismissedNotificationIds, dismissNotification
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Settings modal component (mantive igual)

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
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button onClick={closeSettings} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">
            {translations.save || 'Save'}
          </button>
        </div>

        {/* DEBUG SECTION */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
          <h3 className="font-bold text-red-500 mb-2">Debug Audio</h3>
          <div className="space-y-2 text-xs font-mono">
            <button
              onClick={async () => {
                const text = "Teste de áudio VetConnect. Um, dois, três.";
                if (Capacitor.isNativePlatform()) {
                  await TextToSpeech.speak({
                    text,
                    lang: language === 'pt' ? 'pt-BR' : 'en-US',
                    rate: 1.0,
                    pitch: 1.0,
                    category: 'ambient',
                  });
                } else {
                  const u = new SpeechSynthesisUtterance(text);
                  u.lang = language === 'pt' ? 'pt-BR' : 'en-US';
                  window.speechSynthesis.speak(u);
                }
              }}
              className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 mb-2"
            >
              🔊 Testar Voz (Fala)
            </button>
            <div>Voices Loaded: {window.speechSynthesis.getVoices().length}</div>
            <div>Voices Loaded: {window.speechSynthesis.getVoices().length}</div>
            <div className="break-all"></div>
          </div>
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
      <AppProvider>
        <PrivacyBanner />
        <Routes>
          <Route path="/pets/:id/vet-history" element={<VetHistory />} />
          <Route path="/" element={<HomeScreen />} />
          <Route path="/pets" element={<PetListScreen />} />
          <Route path="/pet/new" element={<PetFormScreen />} />
          <Route path="/pet/edit/:petId" element={<PetFormScreen />} />
          <Route path="/pet/:petId" element={<PetDetailScreen />} />
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

// Simple hash for ID generation
function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
