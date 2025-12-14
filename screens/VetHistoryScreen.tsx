    console.log(">> VetHistoryScreen CARREGOU!");

    import React, { useState, useEffect } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import { Layout } from '../components/Layout';
    import { useAppContext } from "../App";

    export const VetHistoryScreen: React.FC = () => {
        const { petId } = useParams<{ petId: string }>();
        const { getPet, getVetHistory, addVetNote, updateVetNote, deleteVetNote } = useAppContext();
        const navigate = useNavigate();

        const pet = petId ? getPet(petId) : undefined;

        const [notes, setNotes] = useState<any[]>([]);

        // form fields
        const [title, setTitle] = useState("");
        const [content, setContent] = useState("");

        const [search, setSearch] = useState("");

        const [editMode, setEditMode] = useState(false);
        const [editId, setEditId] = useState<string | null>(null);

        // Load notes on screen open
        useEffect(() => {
            if (petId) {
                const list = getVetHistory(petId);
                setNotes(list || []);
            }
        }, [petId]);

        if (!pet) {
            return (
                <Layout title="Pet não encontrado">
                    <p>Pet não existe.</p>
                </Layout>
            );
        }

        // SAVE or UPDATE
        const handleSave = () => {
            if (!title.trim() || !content.trim()) return;

            if (editMode && editId) {
                updateVetNote(petId!, editId, {
                    title,
                    content,
                });
            } else {
                addVetNote(petId!, title, content);
            }

            setTitle("");
            setContent("");
            setEditId(null);
            setEditMode(false);

            const list = getVetHistory(petId!);
            setNotes(list || []);
        };

        const handleEdit = (note: any) => {
            setEditMode(true);
            setEditId(note.id);
            setTitle(note.title);
            setContent(note.content);
        };

        const handleDelete = (id: string) => {
            deleteVetNote(petId!, id);
            const list = getVetHistory(petId!);
            setNotes(list || []);
        };

        const filteredNotes = notes.filter(n =>
            n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.content.toLowerCase().includes(search.toLowerCase())
        );

        return (
            <Layout title="Histórico Veterinário">
                <div className="space-y-6">

                    {/* SEARCH */}
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Pesquisar..."
                        className="w-full px-3 py-2 rounded-lg bg-surface-light dark:bg-surface-dark border border-gray-300 dark:border-gray-700"
                    />

                    {/* CREATE / EDIT */}
                    <div className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark shadow-md space-y-3">
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Título"
                            className="w-full px-3 py-2 rounded-lg bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-700"
                        />

                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Digite ou fale algo..."
                            className="w-full px-3 py-2 rounded-lg h-40 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-700"
                        />

                        <button
                            onClick={handleSave}
                            className="w-full py-2 rounded-lg bg-primary text-white font-semibold"
                        >
                            {editMode ? "Salvar Alterações" : "Salvar Anotação"}
                        </button>
                    </div>

                    {/* NOTES LIST */}
                    <div className="space-y-4">
                        {filteredNotes.map(note => (
                            <div
                                key={note.id}
                                className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark shadow-md"
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold">{note.title}</h3>

                                    <div className="flex space-x-3">
                                        <button
                                            className="text-blue-500"
                                            onClick={() => handleEdit(note)}
                                        >
                                            Editar
                                        </button>

                                        <button
                                            className="text-red-500"
                                            onClick={() => handleDelete(note.id)}
                                        >
                                            Apagar
                                        </button>
                                    </div>
                                </div>

                                <p className="mt-2 whitespace-pre-wrap">{note.content}</p>
    <p className="text-xs text-gray-500 mt-2">
    {note.createdAt ? new Date(note.createdAt).toLocaleString() : "—"}
    </p>

                            </div>
                        ))}
                    </div>

                </div>
            </Layout>
        );
    };

