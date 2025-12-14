import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../src/App';
import type { Appointment } from '../types';
import { AppointmentType } from '../types';
import { Layout } from '../components/Layout';

export const AppointmentFormScreen: React.FC = () => {
    const { petId: petIdFromParams, appointmentId } = useParams<{ petId: string; appointmentId: string }>();
    const navigate = useNavigate();
    const { getPet, addAppointment, addAppointments, updateAppointment, getAppointment, translations, language } = useAppContext();

    const [petId, setPetId] = useState<string | undefined>(petIdFromParams);
    const [type, setType] = useState<AppointmentType>(AppointmentType.Consultation);
    const [dateTime, setDateTime] = useState('');
    const [notes, setNotes] = useState('');

    // State for Treatment/Medication specific fields
    const [frequency, setFrequency] = useState<'24h' | '12h' | '8h' | '6h'>('24h');
    const [durationValue, setDurationValue] = useState<number | ''>('');
    const [durationUnit, setDurationUnit] = useState<'days' | 'weeks' | 'months'>('days');

    // State for Therapeutic Bath specific fields
    const [bathFrequency, setBathFrequency] = useState<'1' | '2' | '3'>('1');
    const [bathDays, setBathDays] = useState<Set<string>>(new Set());


    const isEditing = !!appointmentId;

    useEffect(() => {
        if (appointmentId) {
            const appointment = getAppointment(appointmentId);
            if (appointment) {
                setPetId(appointment.petId);
                setType(appointment.type);
                setDateTime(new Date(appointment.dateTime).toISOString().slice(0, 16));
                setNotes(appointment.notes);
                if (appointment.type === AppointmentType.TreatmentMedication) {
                    setFrequency(appointment.frequency || '24h');
                    setDurationValue(appointment.durationValue || '');
                    setDurationUnit(appointment.durationUnit || 'days');
                }
                if (appointment.type === AppointmentType.TherapeuticBath) {
                    setBathFrequency(appointment.bathFrequency || '1');
                    setBathDays(new Set(appointment.bathDays || []));
                    setDurationValue(appointment.durationValue || '');
                    setDurationUnit(appointment.durationUnit || 'weeks');
                }
            }
        }
    }, [appointmentId, getAppointment]);

    useEffect(() => {
        if (type === AppointmentType.TreatmentMedication) {
            setDurationUnit('days');
        } else if (type === AppointmentType.TherapeuticBath) {
            setDurationUnit('weeks');
        }
    }, [type]);

    const pet = petId ? getPet(petId) : undefined;

    const handleBathDayChange = (day: string) => {
        setBathDays(prev => {
            const newDays = new Set(prev);
            if (newDays.has(day)) {
                newDays.delete(day);
            } else {
                newDays.add(day);
            }
            return newDays;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pet || !dateTime) return;

        // --- Recurring Medication Logic ---
        if (!isEditing && type === AppointmentType.TreatmentMedication && durationValue && durationUnit === 'days') {
            const newAppointments: Omit<Appointment, 'id' | 'status'>[] = [];
            const startDate = new Date(dateTime);
            const numValue = Number(durationValue);

            const frequencyHours = {
                '24h': 24, '12h': 12, '8h': 8, '6h': 6,
            }[frequency];

            const totalHours = numValue * 24;
            const numberOfAppointments = Math.floor(totalHours / frequencyHours);
            const lastDoseText = `(${translations.lastDose})`;

            for (let i = 0; i < numberOfAppointments; i++) {
                const appointmentDate = new Date(startDate.getTime() + i * frequencyHours * 60 * 60 * 1000);
                const isLastDose = i === numberOfAppointments - 1;
                const finalNotes = isLastDose ? (notes ? `${notes}\n${lastDoseText}` : lastDoseText) : notes;

                newAppointments.push({
                    petId: pet.id, petName: pet.name, petPhotoUrl: pet.photoUrl,
                    type, dateTime: appointmentDate, notes: finalNotes,
                    frequency, durationValue: numValue, durationUnit,
                });
            }

            if (newAppointments.length > 0) {
                addAppointments(newAppointments);
                navigate(`/schedule`, { state: { petId: pet.id } });
                return;
            }
        }

        // --- Recurring Therapeutic Bath Logic ---
        if (!isEditing && type === AppointmentType.TherapeuticBath && durationValue) {
            const newAppointments: Omit<Appointment, 'id' | 'status'>[] = [];
            const startDate = new Date(dateTime);
            const numValue = Number(durationValue);

            if (bathFrequency === '1') {
                let totalWeeks = durationUnit === 'weeks' ? numValue : numValue * 4; // Assumption for months
                for (let i = 0; i < totalWeeks; i++) {
                    const appointmentDate = new Date(startDate);
                    appointmentDate.setDate(startDate.getDate() + i * 7);
                    newAppointments.push({
                        petId: pet.id, petName: pet.name, petPhotoUrl: pet.photoUrl,
                        type, dateTime: appointmentDate, notes,
                        durationValue: numValue, durationUnit, bathFrequency,
                    });
                }
            } else if (bathDays.size > 0) { // For 2x or 3x a week
                const numBathFrequency = parseInt(bathFrequency, 10);
                const totalWeeks = durationUnit === 'weeks' ? numValue : numValue * 4;
                const totalAppointmentsToCreate = numBathFrequency * totalWeeks;

                const dayNameToIndex: { [key: string]: number } = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
                const selectedDayIndexes = Array.from(bathDays).map((day: string) => dayNameToIndex[day]);

                let currentDate = new Date(startDate);

                while (newAppointments.length < totalAppointmentsToCreate) {
                    if (selectedDayIndexes.includes(currentDate.getDay())) {
                        newAppointments.push({
                            petId: pet.id, petName: pet.name, petPhotoUrl: pet.photoUrl,
                            type, dateTime: new Date(currentDate), notes,
                            durationValue: numValue, durationUnit, bathFrequency, bathDays: Array.from(bathDays),
                        });
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }

            if (newAppointments.length > 0) {
                const lastBathText = `(${translations.lastBath})`;
                const lastAppointment = newAppointments[newAppointments.length - 1];
                lastAppointment.notes = lastAppointment.notes ? `${lastAppointment.notes}\n${lastBathText}` : lastBathText;

                addAppointments(newAppointments);
                navigate(`/schedule`, { state: { petId: pet.id } });
                return;
            }
        }


        // --- Default logic for single appointment or editing ---
        const baseAppointmentData = {
            petId: pet.id, petName: pet.name, petPhotoUrl: pet.photoUrl,
            type, dateTime: new Date(dateTime), notes,
        };

        const appointmentData = type === AppointmentType.TreatmentMedication
            ? { ...baseAppointmentData, frequency, durationValue: durationValue ? Number(durationValue) : undefined, durationUnit }
            : type === AppointmentType.TherapeuticBath
                ? { ...baseAppointmentData, durationValue: durationValue ? Number(durationValue) : undefined, durationUnit, bathFrequency, bathDays: Array.from(bathDays) }
                : baseAppointmentData;

        if (isEditing && appointmentId) {
            const originalAppointment = getAppointment(appointmentId);
            if (originalAppointment) {
                updateAppointment({ ...appointmentData, id: appointmentId, status: originalAppointment.status });
            }
        } else {
            addAppointment(appointmentData);
        }
        navigate(`/schedule`, { state: { petId: pet.id } });
    };

    if (!pet) {
        return (
            <Layout title="Pet Not Found">
                <p>The pet you are looking for does not exist.</p>
            </Layout>
        );
    }

    const title = appointmentId
        ? `${translations.editAppointment}`
        : `${translations.newAppointment} - ${pet.name}`;

    const getTranslationKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/gi, '');

    // Fix: Explicitly type `a` and `b` to resolve type inference issue.
    const sortedAppointmentTypes = Object.values(AppointmentType).sort((a: AppointmentType, b: AppointmentType) => {
        const translationA = translations[getTranslationKey(a)] || a;
        const translationB = translations[getTranslationKey(b)] || b;
        return translationA.localeCompare(translationB);
    });

    const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    return (
        <div className="relative min-h-screen">
            <div
                className="absolute inset-0 w-full h-full bg-cover bg-center bg-fixed transition-all duration-500 z-0"
                style={{ backgroundImage: `url(${pet.photoUrl})` }}
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"></div>

            <div className="relative z-10">
                <Layout title={title} overrideBackground={true}>
                    <form onSubmit={handleSubmit} className="space-y-6 p-6 rounded-lg shadow-md bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm">
                        {/* PAST DATE WARNING */}
                        {dateTime && new Date(dateTime).getTime() < new Date().getTime() && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700 dark:text-yellow-200">
                                            {language === 'pt'
                                                ? "Atenção: A data selecionada já passou. Se for para amanhã, verifique o dia."
                                                : "Warning: The selected date is in the past. If this is for tomorrow, please check the day."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{translations.appointmentType}</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as AppointmentType)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            >
                                {sortedAppointmentTypes.map(t => <option key={t} value={t}>{translations[getTranslationKey(t)] || t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{translations.date}</label>
                            <input
                                type="datetime-local"
                                value={dateTime}
                                onChange={(e) => setDateTime(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:text-white dark:[color-scheme:dark]"
                                required
                            />
                        </div>

                        {type === AppointmentType.TreatmentMedication && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{translations.frequency}</label>
                                    <select
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value as any)}
                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    >
                                        <option value="24h">{translations.every24hours}</option>
                                        <option value="12h">{translations.every12hours}</option>
                                        <option value="8h">{translations.every8hours}</option>
                                        <option value="6h">{translations.every6hours}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{translations.treatmentDuration}</label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <input
                                            type="number"
                                            value={durationValue}
                                            onChange={(e) => setDurationValue(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                            min="1"
                                            className="flex-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                            placeholder={translations.quantity}
                                            disabled={isEditing}
                                        />
                                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark text-sm">
                                            {translations.durationDays}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        {type === AppointmentType.TherapeuticBath && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{translations.bathFrequency}</label>
                                    <select
                                        value={bathFrequency}
                                        onChange={(e) => setBathFrequency(e.target.value as any)}
                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                                    >
                                        <option value="1">{translations.onceAWeek}</option>
                                        <option value="2">{translations.twiceAWeek}</option>
                                        <option value="3">{translations.thriceAWeek}</option>
                                    </select>
                                </div>

                                {(bathFrequency === '2' || bathFrequency === '3') && (
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{translations.selectDays}</label>
                                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {weekDays.map(day => (
                                                <label key={day} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={bathDays.has(day)}
                                                        onChange={() => handleBathDayChange(day)}
                                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                    />
                                                    <span>{translations[day] || day}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{translations.treatmentDuration}</label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <input
                                            type="number"
                                            value={durationValue}
                                            onChange={(e) => setDurationValue(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                            min="1"
                                            className="flex-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                            placeholder={translations.quantity}
                                            disabled={isEditing}
                                        />
                                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark text-sm">
                                            {translations.durationWeeks}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}


                        <div>
                            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{translations.notes}</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            />
                        </div>
                        <div className="flex justify-end space-x-4">
                            <button type="button" onClick={() => navigate(-1)} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover-bg-gray-500 text-text-light dark:text-text-dark font-bold py-2 px-6 rounded-lg transition">
                                {translations.cancel}
                            </button>
                            <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">
                                {translations.save}
                            </button>
                        </div>
                    </form>
                </Layout>
            </div>
        </div>
    );
};
