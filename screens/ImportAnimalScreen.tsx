import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../src/App';
import { Layout } from '../components/Layout';
import { QrCodeIcon, MagnifyingGlassIcon } from '../components/Icons';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { Pet } from '../types';

export const ImportAnimalScreen: React.FC = () => {
    const { translations, addPet, pets, isAuthenticated } = useAppContext();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState('');

    const fetchAndSavePet = async (animalId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // Check if pet already exists locally
            if (pets.some(p => p.id === animalId)) {
                setError("Este animal já está cadastrado no seu dispositivo.");
                setIsLoading(false);
                return;
            }

            const docRef = doc(db, "animals", animalId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();

                if (!data.shareActive) {
                    setError("O compartilhamento para este animal foi desativado pelo proprietário.");
                    setIsLoading(false);
                    return;
                }

                // Transform firestore data to Pet type if necessary
                // Assuming firestore data matches Pet interface mostly
                const newPet: Pet = {
                    id: docSnap.id,
                    ...data as any // Type assertion for now. In a real app, validate schema with zod.
                };

                addPet(newPet);

                // Navigate to details
                navigate(`/pet/${newPet.id}`);

            } else {
                setError("Animal não encontrado. Verifique o código e tente novamente.");
            }
        } catch (err) {
            console.error("Erro ao importar animal:", err);
            setError("Erro ao buscar dados do animal. Verifique sua conexão.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleScan = async () => {
        setError(null);
        try {
            // Check permissions
            const { camera } = await BarcodeScanner.requestPermissions();

            if (camera === 'granted' || camera === 'limited') {
                const { barcodes } = await BarcodeScanner.scan();

                if (barcodes.length > 0) {
                    const scannedValue = barcodes[0].rawValue;
                    if (scannedValue) {
                        await fetchAndSavePet(scannedValue);
                    }
                }
            } else {
                setError("Permissão da câmera necessária para escanear QR Code.");
            }
        } catch (err) {
            console.error("Erro no scanner:", err);
            setError("Não foi possível iniciar o scanner. Tente inserir o código manualmente.");
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim()) {
            fetchAndSavePet(manualCode.trim());
        }
    };

    return (
        <Layout title="Importar Animal" backPath="/pets">
            <div className="space-y-6">
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg p-6 space-y-6 text-center">
                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                        <QrCodeIcon className="w-10 h-10 text-primary" />
                    </div>

                    <h2 className="text-xl font-bold">Importar Perfil de Animal</h2>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                        Escaneie o QR Code gerado por outro usuário do VetConnect para importar o perfil do animal para o seu dispositivo.
                    </p>

                    <button
                        onClick={handleScan}
                        disabled={isLoading}
                        className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg transition-transform transform active:scale-95 flex items-center justify-center space-x-2"
                    >
                        <QrCodeIcon className="w-6 h-6" />
                        <span>{isLoading ? 'Buscando...' : 'Escanear QR Code'}</span>
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Ou insira o código</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    </div>

                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="Código do Animal (ex: a1b2c3)"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                            <div className="absolute right-3 top-3 text-gray-400">
                                <MagnifyingGlassIcon className="w-6 h-6" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !manualCode.trim()}
                            className="w-full py-3 bg-secondary hover:bg-secondary-dark text-white rounded-xl font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Buscando...' : 'Buscar Manualmente'}
                        </button>
                    </form>

                    {error && (
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

