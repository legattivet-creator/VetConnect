import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Share } from '@capacitor/share';
import { useAppContext } from '../src/App';
import { Layout } from '../components/Layout';
import type { MedicalFile, MedicalRecordCategory, WeightEntry } from '../types';
import { PencilIcon, TrashIcon, Bars3Icon, ShareIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon } from '../components/Icons';
import { compressImage } from '../utils';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';


const FileItem: React.FC<{
    file: MedicalFile,
    petName: string,
    onRename: (fileId: string, newName: string) => void,
    onDeleteRequest: (file: MedicalFile) => void,
    isMedicationCategory: boolean,
    onNoteChange: (fileId: string, note: string) => void,
    onView: (file: MedicalFile) => void
}> = ({ file, petName, onRename, onDeleteRequest, isMedicationCategory, onNoteChange, onView }) => {
    const { translations, background } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [note, setNote] = useState(file.note || '');

    const getFileParts = (filename: string) => {
        const lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex === -1 || lastDotIndex === 0) {
            return { baseName: filename, extension: '' };
        }
        return {
            baseName: filename.substring(0, lastDotIndex),
            extension: filename.substring(lastDotIndex),
        };
    };

    const { baseName: initialBaseName, extension: initialExtension } = getFileParts(file.name);
    const [editedBaseName, setEditedBaseName] = useState(initialBaseName);

    useEffect(() => {
        if (isEditing) {
            const { baseName } = getFileParts(file.name);
            setEditedBaseName(baseName);
            inputRef.current?.focus();
            setTimeout(() => inputRef.current?.select(), 0);
        }
    }, [isEditing, file.name]);

    const handleOpenFile = async () => {
        // 1. Se for uma imagem, o comportamento não muda: usa o visualizador interno.
        if (file.type === 'image') {
            onView(file);
            return;
        }

        // --- LÓGICA DEFINITIVA PARA DOCUMENTOS ---

        // 2. Se for um DOCUMENTO no CELULAR (Android/iOS)
        if (Capacitor.isNativePlatform() && file.url.startsWith('data:')) {
            try {
                const base64 = file.url.split(',')[1];
                const fileName = file.name;

                // Salva o arquivo no cache para ter um caminho físico
                await Filesystem.writeFile({
                    path: fileName,
                    data: base64,
                    directory: Directory.Cache
                });

                // Pega o caminho nativo do arquivo
                const fileUri = await Filesystem.getUri({
                    path: fileName,
                    directory: Directory.Cache
                });

                // USA A FERRAMENTA CERTA: FileOpener, FORÇANDO O TIPO PDF
                // TODO: Descomentar após instalar @capawesome/capacitor-file-opener
                /* await FileOpener.openFile({
                    path: fileUri.uri,
                    mimeType: 'application/pdf', 
                }); */

                // Open PDF nativamente usando FileOpener
                await FileOpener.open({
                    filePath: fileUri.uri,
                    contentType: 'application/pdf'
                });

            } catch (error: any) {
                console.error('Error opening file on native:', error);
                if (!String(error.message || error).includes('canceled')) {
                    alert('Não foi possível abrir o arquivo. Verifique se você tem um leitor de PDF instalado.');
                }
            }
        }
        // 3. Se for um DOCUMENTO na WEB
        else if (!Capacitor.isNativePlatform()) {
            try {
                const fetchRes = await fetch(file.url);
                const blob = await fetchRes.blob();
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
            } catch (e) {
                console.error("Error creating blob url, falling back to direct open", e);
                window.open(file.url, '_blank');
            }
        }
        // 4. Fallback para outros casos
        else {
            await Browser.open({ url: file.url });
        }
    };

    const handleShare = async () => {
        try {
            if (file.url.startsWith('data:') && Capacitor.isNativePlatform()) {
                const base64 = file.url.split(',')[1];
                const fileName = file.name;

                await Filesystem.writeFile({
                    path: fileName,
                    data: base64,
                    directory: Directory.Cache
                });

                const fileUri = await Filesystem.getUri({
                    path: fileName,
                    directory: Directory.Cache
                });

                await Share.share({
                    title: `${translations.medicalRecord} - ${petName}`,
                    text: `Arquivo: ${file.name}`,
                    files: [fileUri.uri]
                });
            } else {
                if (file.url.startsWith('data:')) {
                    try {
                        const fetchRes = await fetch(file.url);
                        const blob = await fetchRes.blob();
                        const fileObj = new File([blob], file.name, { type: blob.type });

                        if (navigator.canShare && navigator.canShare({ files: [fileObj] })) {
                            await navigator.share({
                                files: [fileObj],
                                title: `${translations.medicalRecord} - ${petName}`,
                                text: `Arquivo: ${file.name}`
                            });
                        } else {
                            throw new Error("Web Share files not supported");
                        }
                    } catch (webShareErr) {
                        console.warn("Web Share failed, falling back to download link", webShareErr);
                        const link = document.createElement('a');
                        link.href = file.url;
                        link.download = file.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                } else {
                    await Share.share({
                        title: `${translations.medicalRecord} - ${petName}`,
                        text: `Arquivo: ${file.name}`,
                        url: file.url,
                    });
                }
            }
        } catch (error) {
            console.error('Error sharing:', error);
            alert("Não foi possível compartilhar. Tentando baixar...");
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleRename = () => {
        setIsEditing(true);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedBaseName(e.target.value);
    };

    const saveRename = () => {
        const newBaseName = editedBaseName.trim();
        if (!newBaseName) {
            setEditedBaseName(initialBaseName);
            setIsEditing(false);
            return;
        }
        const newName = `${newBaseName}${initialExtension}`;
        if (newName !== file.name) {
            onRename(file.id, newName);
        }
        setIsEditing(false);
    };

    const handleNameBlur = () => {
        saveRename();
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveRename();
        } else if (e.key === 'Escape') {
            setEditedBaseName(initialBaseName);
            setIsEditing(false);
        }
    };

    const handleNoteBlur = () => {
        if (note !== (file.note || '')) {
            onNoteChange(file.id, note);
        }
    };

    return (
        <div className={`p-3 rounded-lg transition flex flex-col space-y-2 ${background ? 'bg-gray-100/80 dark:bg-gray-700/80' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <div className="flex items-start justify-between">
                <div className="flex-shrink-0 mr-3">
                    {file.type === 'image' ? (
                        <img
                            src={file.url}
                            alt={file.name}
                            onClick={handleOpenFile}
                            className="w-14 h-14 object-cover rounded-md border border-gray-200 dark:border-gray-600 bg-white"
                        />
                    ) : (
                        <span className="text-2xl w-14 h-14 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-md">
                            {file.type === 'document' ? '📄' : file.type === 'video' ? '🎬' : '🎵'}
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                    <button onClick={handleOpenFile} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-primary rounded-lg">
                        <span className="text-xs font-bold">Abrir</span>
                    </button>
                    <button onClick={handleShare} className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                        <ShareIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDeleteRequest(file)}
                        className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50"
                        aria-label={`${translations.delete} ${file.name}`}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="w-full mt-1">
                {isEditing ? (
                    <div className="flex items-stretch w-full">
                        <input
                            ref={inputRef}
                            type="text"
                            value={editedBaseName}
                            onChange={handleNameChange}
                            onBlur={handleNameBlur}
                            onKeyDown={handleNameKeyDown}
                            className={`font-semibold bg-white dark:bg-gray-600 border border-primary-light px-2 py-1 text-base w-full min-w-0 ${initialExtension ? 'rounded-l-md border-r-0' : 'rounded-md'}`}
                        />
                        {initialExtension && (
                            <span className="font-semibold bg-gray-200 dark:bg-gray-500 px-2 text-base rounded-r-md border border-l-0 border-primary-light flex items-center flex-shrink-0">{initialExtension}</span>
                        )}
                    </div>
                ) : (
                    <p className="font-semibold text-sm sm:text-base break-words" onDoubleClick={handleRename} onClick={handleRename}>{file.name}</p>
                )}
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">{file.createdAt.toLocaleDateString()}</p>
            </div>

            {isMedicationCategory && (
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={handleNoteBlur}
                    placeholder={translations.notes}
                    rows={2}
                    className="w-full px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-sm transition-colors focus:ring-primary focus:border-primary"
                />
            )}
        </div>
    );
};

// ... O RESTO DO ARQUIVO CONTINUA IGUAL, SEM ALTERAÇÕES ...
// (RecordCategory, WeightHistoryCategory, ImageViewer, MedicalRecordScreen)

const RecordCategory: React.FC<{
    category: MedicalRecordCategory;
    petId: string;
    onDeleteFileRequest: (file: MedicalFile) => void;
    isReorderMode: boolean;
    getCategoryTitle: (title: string) => string;
    onViewFile: (file: MedicalFile) => void;
}> = ({ category, petId, onDeleteFileRequest, isReorderMode, getCategoryTitle, onViewFile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { translations, addMedicalFile, renameMedicalFile, updateMedicalFileNote, getPet, background } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, explicitType?: 'image' | 'video' | 'audio') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            let fileType: 'document' | 'image' | 'video' | 'audio';
            if (explicitType) {
                fileType = explicitType;
            } else {
                const mime = file.type;
                if (mime.startsWith('image/')) fileType = 'image';
                else if (mime.startsWith('video/')) fileType = 'video';
                else if (mime.startsWith('audio/')) fileType = 'audio';
                else fileType = 'document';
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                let finalUrl = event.target?.result as string;
                if (fileType === 'image') {
                    try {
                        finalUrl = await compressImage(finalUrl, 800, 0.7);
                    } catch (e) {
                        console.error("Compression failed", e);
                    }
                }
                addMedicalFile(petId, category.title, {
                    name: file.name,
                    url: finalUrl,
                    type: fileType,
                    mimeType: file.type || 'application/octet-stream',
                });
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handleRenameFile = (fileId: string, newName: string) => {
        renameMedicalFile(petId, category.title, fileId, newName);
    };

    const handleNoteChange = (fileId: string, note: string) => {
        updateMedicalFileNote(petId, category.title, fileId, note);
    };

    return (
        <div className={`border rounded-lg ${background ? 'border-gray-200/50 dark:border-gray-700/50' : 'border-gray-200 dark:border-gray-700'}`}>
            <button
                onClick={() => !isReorderMode && setIsOpen(!isOpen)}
                className={`w-full p-4 text-left flex justify-between items-center transition-colors ${isReorderMode ? 'cursor-default' : 'hover:bg-gray-100/80 dark:hover:bg-gray-700/80'} ${background ? 'bg-surface-light dark:bg-surface-dark' : 'bg-gray-50 dark:bg-gray-800'}`}
            >
                <div className="flex items-center space-x-3">
                    {isReorderMode && <Bars3Icon className="w-6 h-6 text-text-secondary-light dark:text-text-secondary-dark" />}
                    <h3 className="text-lg font-semibold">{getCategoryTitle(category.title)}</h3>
                    {!isOpen && category.files.length > 0 && (
                        <span className="bg-primary/10 text-black dark:text-white text-sm font-bold px-2 py-0.5 rounded-full dark:bg-primary/20">
                            {category.files.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    {!isReorderMode && <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>}
                </div>
            </button>
            {!isReorderMode && isOpen && (
                <div className={`p-4 space-y-3 ${background ? 'bg-surface-light dark:bg-surface-dark' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    {category.files.length > 0 ? (
                        category.files.map(file => <FileItem
                            key={file.id}
                            file={file}
                            petName={getPet(petId)?.name || ''}
                            onRename={handleRenameFile}
                            onDeleteRequest={onDeleteFileRequest}
                            isMedicationCategory={category.title === 'Medicamentos'}
                            onNoteChange={handleNoteChange}
                            onView={onViewFile}
                        />)
                    ) : (
                        <p className="text-sm text-center text-text-secondary-light dark:text-text-secondary-dark">No files in this category.</p>
                    )}
                    <div className="pt-2 flex flex-wrap justify-end gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20">{translations.attachFile}</button>
                        <button onClick={() => photoInputRef.current?.click()} className="px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20">{translations.capturePhoto}</button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e)} className="hidden" />
                    <input type="file" accept="image/*" capture ref={photoInputRef} onChange={(e) => handleFileChange(e, 'image')} className="hidden" />
                </div>
            )}
        </div>
    );
};

const WeightHistoryCategory: React.FC<{
    petId: string;
    weightHistory: WeightEntry[];
    onDeleteRequest: (entry: WeightEntry) => void;
}> = ({ petId, weightHistory, onDeleteRequest }) => {
    const { translations, addWeightEntry, updateWeightEntry, language, background } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [weight, setWeight] = useState('');
    const [unit, setUnit] = useState<'kg' | 'lb' | 'g'>('kg');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [editingValues, setEditingValues] = useState<{ date: string, weight: string, unit: 'kg' | 'lb' | 'g' } | null>(null);

    const sortedHistory = [...(weightHistory || [])].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    const handleAdd = (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (weight && date) {
            addWeightEntry(petId, {
                date: new Date(date + 'T00:00:00'),
                weight: parseFloat(weight),
                unit,
            });
            setWeight('');
        }
    };

    const handleWeightKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleAdd(e);
    };

    const handleStartEdit = (entry: WeightEntry) => {
        setEditingEntryId(entry.id);
        setEditingValues({
            date: new Date(entry.date).toISOString().split('T')[0],
            weight: entry.weight.toString(),
            unit: entry.unit,
        });
    };

    const handleCancelEdit = () => {
        setEditingEntryId(null);
        setEditingValues(null);
    };

    const handleUpdate = () => {
        if (editingEntryId && editingValues) {
            updateWeightEntry(petId, {
                id: editingEntryId,
                date: new Date(editingValues.date + 'T00:00:00'),
                weight: parseFloat(editingValues.weight),
                unit: editingValues.unit,
            });
            handleCancelEdit();
        }
    };

    const handleEditingChange = (field: 'date' | 'weight' | 'unit', value: string) => {
        if (editingValues) {
            setEditingValues(prev => ({ ...prev!, [field]: value }));
        }
    };

    return (
        <div className={`border rounded-lg ${background ? 'border-gray-200/50 dark:border-gray-700/50' : 'border-gray-200 dark:border-gray-700'}`}>
            <button onClick={() => setIsOpen(!isOpen)} className={`w-full p-4 text-left flex justify-between items-center transition-colors ${background ? 'bg-gray-50/70 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-gray-100/80 dark:hover:bg-gray-700/80' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <h3 className="text-lg font-semibold">{translations.weight}</h3>
                <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className={`p-4 ${background ? 'bg-gray-50/70 dark:bg-gray-800/70 backdrop-blur-sm' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <div className="p-4 rounded-lg bg-surface-light dark:bg-surface-dark space-y-4">
                        <form onSubmit={handleAdd} className={`grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-3 rounded-lg ${background ? 'bg-gray-100/80 dark:bg-gray-900/80' : 'bg-gray-100 dark:bg-gray-900/50'}`}>
                            <div className="sm:col-span-1">
                                <label className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">{translations.date}</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm" required />
                            </div>
                            <div className="sm:col-span-1">
                                <label className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">{translations.weight}</label>
                                <input type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} onKeyDown={handleWeightKeyDown} placeholder="e.g. 10.5" className="mt-1 block w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm" required />
                            </div>
                            <div className="sm:col-span-1">
                                <label className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">{translations.unit}</label>
                                <select value={unit} onChange={e => setUnit(e.target.value as any)} className="mt-1 block w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm">
                                    <option value="kg">{translations.kg}</option>
                                    <option value="lb">{translations.lb}</option>
                                    <option value="g">{translations.g}</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg text-sm transition">{translations.addEntry}</button>
                        </form>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-text-light dark:text-white">
                                <thead className={`${background ? 'bg-gray-100/70 dark:bg-gray-700/70' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    <tr>
                                        <th className="p-2">
                                            <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="font-semibold flex items-center">
                                                {translations.date}
                                                {sortOrder === 'asc' ? ' ▲' : ' ▼'}
                                            </button>
                                        </th>
                                        <th className="p-2 font-semibold">{translations.weight}</th>
                                        <th className="p-2 font-semibold">{translations.actions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedHistory.map(entry => (
                                        editingEntryId === entry.id && editingValues ? (
                                            <tr key={entry.id} className="bg-blue-50 dark:bg-blue-900/20">
                                                <td className="p-2"><input type="date" value={editingValues.date} onChange={e => handleEditingChange('date', e.target.value)} className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md px-1 py-0.5" /></td>
                                                <td className="p-2 flex items-center gap-1">
                                                    <input type="number" step="0.01" value={editingValues.weight} onChange={e => handleEditingChange('weight', e.target.value)} className="w-20 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md px-1 py-0.5" />
                                                    <select value={editingValues.unit} onChange={e => handleEditingChange('unit', e.target.value)} className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md py-0.5">
                                                        <option value="kg">{translations.kg}</option>
                                                        <option value="lb">{translations.lb}</option>
                                                        <option value="g">{translations.g}</option>
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center space-x-2">
                                                        <button onClick={handleUpdate} className="text-green-600 hover:text-green-800">✓</button>
                                                        <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800">×</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            <tr key={entry.id} className={`border-b ${background ? 'border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                                                <td className="p-2">{new Date(entry.date).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-GB')}</td>
                                                <td className="p-2">{entry.weight} {entry.unit}</td>
                                                <td className="p-2">
                                                    <div className="flex items-center space-x-2">
                                                        <button onClick={() => handleStartEdit(entry)}><PencilIcon className="w-4 h-4 text-secondary-dark dark:text-secondary-light hover:text-primary dark:hover:text-primary-light" /></button>
                                                        <button onClick={() => onDeleteRequest(entry)}><TrashIcon className="w-4 h-4 text-secondary-dark dark:text-secondary-light hover:text-red-600 dark:hover:text-red-500" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    ))}
                                    {sortedHistory.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="text-center p-4 text-text-secondary-light dark:text-text-secondary-dark">No weight entries yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ImageViewer: React.FC<{ file: MedicalFile, onClose: () => void }> = ({ file, onClose }) => {
    const [scale, setScale] = useState(1);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-black/50 backdrop-blur-sm z-20">
                <p className="text-white font-semibold truncate px-4 flex-1">{file.name}</p>
                <div className="flex gap-4">
                    {file.type === 'image' && (
                        <div className="flex gap-2 mr-4">
                            <button onClick={handleZoomOut} className="bg-white/20 p-2 rounded-full text-white"><MagnifyingGlassMinusIcon className="w-6 h-6" /></button>
                            <button onClick={handleZoomIn} className="bg-white/20 p-2 rounded-full text-white"><MagnifyingGlassPlusIcon className="w-6 h-6" /></button>
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="w-full h-full flex items-center justify-center overflow-auto p-0 sm:p-4 bg-black/90">
                {file.type === 'image' ? (
                    <div style={{ transform: `scale(${scale})`, transition: 'transform 0.2s' }} className="origin-center">
                        <img
                            src={file.url}
                            alt={file.name}
                            className="max-w-full max-h-screen object-contain"
                        />
                    </div>
                ) : (
                    <div className="w-full h-full max-w-4xl bg-white flex flex-col items-center justify-center p-2 rounded-lg relative">
                        {file.type === 'document' || file.mimeType?.includes('pdf') ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white rounded-lg text-center space-y-4">
                                <p className="text-lg font-medium text-gray-700">Arquivo PDF</p>
                                {Capacitor.isNativePlatform() ? (
                                    <>
                                        <button
                                            onClick={async () => {
                                                if (file.url.startsWith('data:')) {
                                                    try {
                                                        const base64 = file.url.split(',')[1];
                                                        const fileName = file.name;
                                                        await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
                                                        const fileUri = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
                                                        await Share.share({ title: fileName, files: [fileUri.uri] });
                                                    } catch (e) {
                                                        console.error("Error opening PDF via Share", e);
                                                        alert("Erro ao abrir arquivo. Tente baixar.");
                                                    }
                                                } else {
                                                }
                                            }}
                                            className="bg-secondary text-white px-6 py-3 rounded-lg font-bold hover:bg-secondary-dark transition shadow-md w-full max-w-xs"
                                        >
                                            Ver (Abrir no App)
                                        </button>
                                    </>
                                ) : (
                                    <iframe
                                        src={file.url}
                                        className="w-full flex-grow border-0 rounded-md"
                                        title={file.name}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-gray-800">
                                <p className="mb-4 text-xl">Visualização não disponível para este tipo de arquivo.</p>
                                <button
                                    onClick={async () => {
                                        if (Capacitor.isNativePlatform() && file.url.startsWith('data:')) {
                                            try {
                                                const base64 = file.url.split(',')[1];
                                                await Filesystem.writeFile({
                                                    path: file.name,
                                                    data: base64,
                                                    directory: Directory.Documents
                                                });
                                                alert("Arquivo salvo em Documentos!");
                                            } catch (e) {
                                                console.error("Save failed", e);
                                                alert("Erro ao salvar arquivo.");
                                            }
                                        } else {
                                            const link = document.createElement('a');
                                            link.href = file.url;
                                            link.download = file.name;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }
                                    }}
                                    className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition"
                                >
                                    Baixar Arquivo
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};

export const MedicalRecordScreen: React.FC = () => {
    const { petId } = useParams<{ petId: string }>();
    const { getPet, getRecordForPet, translations, deleteMedicalFile, deleteWeightEntry, updateCategoryOrder } = useAppContext();
    const [fileToDelete, setFileToDelete] = useState<{ file: MedicalFile; categoryTitle: string } | null>(null);
    const [weightEntryToDelete, setWeightEntryToDelete] = useState<WeightEntry | null>(null);
    const [fileToView, setFileToView] = useState<MedicalFile | null>(null);

    if (!petId) return <Layout title="Error"><p>No Pet ID provided</p></Layout>;

    const pet = getPet(petId);
    const record = getRecordForPet(petId);

    const [categories, setCategories] = useState<MedicalRecordCategory[]>([]);
    const [isReorderMode, setIsReorderMode] = useState(false);

    const categoryTitleMap: Record<string, string> = {
        'Hemograma': 'cat_hemogram',
        'Bioquímicos': 'cat_biochemistry',
        'Hormônios': 'cat_hormones',
        'PCR': 'cat_pcr',
        'Sorologia': 'cat_serology',
        'Citologia': 'cat_cytology',
        'Histopatologia': 'cat_histopathology',
        'Urinálise/Cultura': 'cat_urinalysis',
        'Cultura de ouvidos': 'cat_ear_culture',
        'Cultura de pele e Outros': 'cat_skin_culture',
        'Raio – X': 'cat_xray',
        'Tomografia': 'cat_ct_scan',
        'Ressonância': 'cat_mri',
        'Endoscopia': 'cat_endoscopy',
        'Alimentação': 'cat_nutrition',
        'Medicamentos': 'cat_medications'
    };

    const getCategoryTitle = (title: string) => {
        const key = categoryTitleMap[title];
        return key ? (translations[key] || title) : title;
    };

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        if (record) {
            setCategories(record.categories);
        }
    }, [record]);


    if (!pet) {
        return <Layout title="Pet Not Found"><p>Pet not found.</p></Layout>;
    }
    if (!record) {
        return <Layout title={translations.medicalRecord}><p>No medical record found for this pet.</p></Layout>;
    }

    const handleConfirmDeleteFile = () => {
        if (fileToDelete && petId) {
            deleteMedicalFile(petId, fileToDelete.categoryTitle, fileToDelete.file.id);
            setFileToDelete(null);
        }
    };

    const handleConfirmDeleteWeightEntry = () => {
        if (weightEntryToDelete && petId) {
            deleteWeightEntry(petId, weightEntryToDelete.id);
            setWeightEntryToDelete(null);
        }
    };

    const handleReorderToggle = () => {
        if (isReorderMode) {
            updateCategoryOrder(petId, categories);
        }
        setIsReorderMode(!isReorderMode);
    };

    const handleDragStart = (index: number) => {
        dragItem.current = index;
    };

    const handleDragEnter = (index: number) => {
        dragOverItem.current = index;
    };

    const handleDrop = () => {
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const newCategories = [...categories];
            const draggedItemContent = newCategories.splice(dragItem.current, 1)[0];
            newCategories.splice(dragOverItem.current, 0, draggedItemContent);
            setCategories(newCategories);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="relative min-h-screen">
            <div className="relative z-10">
                <Layout title={`${translations.medicalRecord} - ${pet.name}`}>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={handleReorderToggle}
                            className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-transform transform hover:scale-105"
                        >
                            {isReorderMode ? translations.doneReordering : translations.reorder}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <WeightHistoryCategory petId={petId} weightHistory={record.weightHistory || []} onDeleteRequest={setWeightEntryToDelete} />
                        {categories.map((category, index) => (
                            <div
                                key={category.title}
                                draggable={isReorderMode}
                                onDragStart={() => handleDragStart(index)}
                                onDragEnter={() => handleDragEnter(index)}
                                onDragEnd={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                className={`transition-shadow rounded-lg ${isReorderMode ? 'cursor-move shadow-lg' : ''}`}
                            >
                                <RecordCategory
                                    category={category}
                                    petId={petId}
                                    onDeleteFileRequest={(file) => setFileToDelete({ file, categoryTitle: category.title })}
                                    isReorderMode={isReorderMode}
                                    getCategoryTitle={getCategoryTitle}
                                    onViewFile={setFileToView}
                                />
                            </div>
                        ))}
                    </div>

                    {/* File Delete Confirmation Modal */}
                    {fileToDelete && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-xl w-full max-w-sm">
                                <h3 className="text-lg font-bold mb-4">{translations.confirmDeleteFile}</h3>
                                <p className="mb-6 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                    {translations.areYouSureDeleteFile.replace('{fileName}', fileToDelete.file.name)}
                                </p>
                                <div className="flex justify-end space-x-4">
                                    <button onClick={() => setFileToDelete(null)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition">{translations.cancel}</button>
                                    <button onClick={handleConfirmDeleteFile} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">{translations.delete}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Weight Entry Delete Confirmation Modal */}
                    {weightEntryToDelete && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-xl w-full max-w-sm">
                                <h3 className="text-lg font-bold mb-4">{translations.confirmDeleteWeightEntry}</h3>
                                <p className="mb-6 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                    {translations.areYouSureDeleteWeightEntry}
                                </p>

                                <div className="flex justify-end space-x-4">
                                    <button onClick={() => setWeightEntryToDelete(null)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition">{translations.cancel}</button>
                                    <button onClick={handleConfirmDeleteWeightEntry} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">{translations.delete}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Image Viewer Modal with Zoom */}
                    {fileToView && (
                        <ImageViewer file={fileToView} onClose={() => setFileToView(null)} />
                    )}
                </Layout>
            </div>
        </div>
    );
};
