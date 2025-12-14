// src/pages/VetHistory.tsx
import React, { useEffect, useState, useRef } from "react";
import { Layout } from "../../components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import jsPDF from "jspdf";
import { useAppContext } from "../App";
import { CogIcon } from "../../components/Icons";

// Ícones (caminho correto)
import { PencilIcon, TrashIcon } from "../../components/Icons";

import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

type Note = {
  id: string;
  title?: string;
  text?: string;
  createdAt?: any;
  localCreatedAt?: string;
};

export default function VetHistory() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { translations, language, openSettings, getPet, getRecordForPet, professionalLogo, userProfile } = useAppContext() as any;
  const pet = petId ? getPet(petId) : null;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Seleção múltipla
  const [selectMode, setSelectMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);



  const isVet = true;

  /* ------------------------- SCROLL AO TOPO ------------------------- */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  /* ------------------------- CARREGAR NOTAS ------------------------- */
  useEffect(() => {
    if (!petId) return;

    const q = query(
      collection(db, "pets", petId, "vetHistory"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const arr: Note[] = [];
      snap.forEach((docSnap) =>
        arr.push({ id: docSnap.id, ...(docSnap.data() as any) })
      );
      setNotes(arr);
      setLoading(false);
    });

    return () => unsub();
  }, [petId]);

  /* ------------------------- SALVAR NOTA ------------------------- */
  const saveNote = async () => {
    if (!title.trim() && !text.trim()) {
      alert("Digite título ou texto");
      return;
    }

    const tempTitle = title;
    const tempText = text;

    setTitle("");
    setText("");
    setEditingId(null);

    if (editingId) {
      await updateDoc(doc(db, "pets", petId!, "vetHistory", editingId), {
        title: tempTitle,
        text: tempText,
      });
    } else {
      await addDoc(collection(db, "pets", petId!, "vetHistory"), {
        title: tempTitle,
        text: tempText,
        localCreatedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
    }
  };

  /* ------------------------- EDITAR / APAGAR ------------------------- */
  const startEdit = (n: Note) => {
    setEditingId(n.id);
    setTitle(n.title || "");
    setText(n.text || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeNote = async (id: string) => {
    if (!confirm("Apagar esta anotação?")) return;
    await deleteDoc(doc(db, "pets", petId!, "vetHistory", id));
  };

  /* ------------------------- BUSCA ------------------------- */
  const filtered = notes.filter((n) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (n.title || "").toLowerCase().includes(s) ||
      (n.text || "").toLowerCase().includes(s)
    );
  });

  const highlight = (t: string) => {
    if (!searchTerm) return t;
    return t.replace(
      new RegExp(`(${searchTerm})`, "gi"),
      "<mark>$1</mark>"
    );
  };

  /* ------------------------- HELPER: IDADE ------------------------- */
  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return "---";
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }
    if (months < 0) months += 12; // Adjust if day difference caused negative month

    const yearsStr = years > 0 ? `${years} ${translations.years || (language === 'pt' ? 'anos' : 'years')}` : '';
    const monthsStr = months > 0 ? `${months} ${translations.months || (language === 'pt' ? 'meses' : 'months')}` : '';

    if (years > 0 && months > 0) return `${yearsStr} ${translations.and || (language === 'pt' ? 'e' : 'and')} ${monthsStr}`;
    if (years > 0) return yearsStr;
    if (months > 0) return monthsStr;
    return translations.lessThanOneMonth || (language === 'pt' ? 'Menos de 1 mês' : 'Less than 1 month');
  };
  /* ------------------------- HELPER: TRADUÇÃO VALORES ------------------------- */
  const translateValue = (val: string) => {
    if (!val) return "---";
    const lower = val.toLowerCase();
    // Tenta encontrar chave direta
    if (translations[lower]) return translations[lower];
    // Mapeamentos específicos se necessário (ex: Enums)
    if (lower === 'canine') return translations.canine || 'Canino';
    if (lower === 'feline') return translations.feline || 'Felino';
    if (lower === 'male') return translations.male || 'Macho';
    if (lower === 'female') return translations.female || 'Fêmea';
    return val;
  };

  /* ------------------------- HELPER: IMAGEM CIRCULAR (CANVAS) ------------------------- */
  const getCircularImageBase64 = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        // Desenha círculo
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Desenha imagem centralizada
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, size, size);

        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        console.error("Erro ao carregar imagem para canvas");
        resolve(null);
      };
    });
  };

  /* ------------------------- HELPER: GRÁFICO DE PESO ------------------------- */
  const drawWeightChart = (pdf: jsPDF, weightHistory: any[], x: number, y: number, width: number, height: number) => {
    if (!weightHistory || weightHistory.length < 2) return y; // Need at least 2 points for a line

    // Sort by date
    const sorted = [...weightHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Config
    const padding = 20;
    const titleSpacing = 30; // Extra space to separate title from chart
    const chartLeft = x + padding + 10; // Extra for axis labels
    const chartTop = y + padding + titleSpacing;
    const chartWidth = width - (padding * 2) - 10;
    const chartHeight = height - (padding * 2) - 20 - titleSpacing; // Extra for bottom labels
    const chartBottom = chartTop + chartHeight;

    // Min/Max
    const dates = sorted.map(w => new Date(w.date).getTime());
    const weights = sorted.map(w => parseFloat(w.weight));
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    // Y-Axis padding logic to match Screen Chart
    const actualMinWeight = Math.min(...weights);
    const minWeight = Math.max(0, actualMinWeight - 5);

    const actualMaxWeight = Math.max(...weights);
    const maxWeight = actualMaxWeight + 5;

    // Scale Helpers
    const getX = (dateTs: number) => {
      if (maxDate === minDate) return chartLeft + chartWidth / 2;
      return chartLeft + ((dateTs - minDate) / (maxDate - minDate)) * chartWidth;
    };
    const getY = (w: number) => {
      if (maxWeight === minWeight) return chartBottom - chartHeight / 2;
      return chartBottom - ((w - minWeight) / (maxWeight - minWeight)) * chartHeight;
    };

    // Draw Title
    pdf.setFontSize(12);
    pdf.setFont(undefined, "bold");
    const title = translations.weightHistory || (language === 'pt' ? "Acompanhamento de Peso" : "Weight Tracking");
    pdf.text(title, x + width / 2, y + 15, { align: "center" });

    // Draw Axes
    pdf.setLineWidth(1);
    pdf.setDrawColor(50, 50, 50);
    // Y Axis
    pdf.line(chartLeft, chartTop, chartLeft, chartBottom);
    // X Axis
    pdf.line(chartLeft, chartBottom, chartLeft + chartWidth, chartBottom);

    // Draw Line
    pdf.setLineWidth(2);
    pdf.setDrawColor(29, 78, 216); // Blue color (primary)

    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];

      const x1 = getX(new Date(p1.date).getTime());
      const y1 = getY(parseFloat(p1.weight));
      const x2 = getX(new Date(p2.date).getTime());
      const y2 = getY(parseFloat(p2.weight));

      pdf.line(x1, y1, x2, y2);

      // Draw Points
      pdf.setFillColor(29, 78, 216);
      pdf.circle(x1, y1, 3, 'F');
    }
    // Last point
    const last = sorted[sorted.length - 1];
    pdf.circle(getX(new Date(last.date).getTime()), getY(parseFloat(last.weight)), 3, 'F');

    // Draw Labels (Simplified)
    pdf.setFontSize(8);
    pdf.setFont(undefined, "normal");
    pdf.setTextColor(100, 100, 100);

    // Y Axis Labels (Min / Max)
    pdf.text(`${minWeight}${sorted[0].unit}`, chartLeft - 5, chartBottom, { align: "right" });
    pdf.text(`${maxWeight}${sorted[0].unit}`, chartLeft - 5, chartTop + 5, { align: "right" });

    // X Axis Labels (Start / End Date)
    const formatDate = (ts: number) => new Date(ts).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { day: '2-digit', month: '2-digit' });
    pdf.text(formatDate(minDate), chartLeft, chartBottom + 10, { align: "center" });
    pdf.text(formatDate(maxDate), chartLeft + chartWidth, chartBottom + 10, { align: "center" });

    // First and Last Data Point Labels (Weight)
    pdf.setTextColor(0, 0, 0);
    // First point
    if (sorted.length > 0) {
      const first = sorted[0];
      const fx = getX(new Date(first.date).getTime());
      const fy = getY(parseFloat(first.weight));
      pdf.text(`${first.weight}`, fx, fy - 5, { align: 'center' });
    }
    // Last point
    if (sorted.length > 1) {
      const last = sorted[sorted.length - 1];
      const lx = getX(new Date(last.date).getTime());
      const ly = getY(parseFloat(last.weight));
      pdf.text(`${last.weight}`, lx, ly - 5, { align: 'center' });
    }

    // Reset styles
    pdf.setTextColor(0, 0, 0);

    return y + height + 20; // Return new Y cursor
  };

  /* ------------------------- PDF ------------------------- */
  const generatePdf = (rows: Note[], petPhotoBase64: string | null) => {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });

    const margin = 40;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const logoWidth = 120;
    const logoHeight = 60;
    const logoX = (pageWidth - logoWidth) / 2; // centralizado

    const drawHeader = (isFirstPage: boolean) => {
      let y = 40;

      // 1. LOGO (apenas se existir)
      // Use the logo from context (which is effectively from localStorage 'professionalLogo')
      if (professionalLogo) {
        try {
          // Fix Aspect Ratio
          const imgProps = pdf.getImageProperties(professionalLogo);
          const ratio = imgProps.height / imgProps.width;
          const newHeight = logoWidth * ratio;

          pdf.addImage(professionalLogo, "PNG", logoX, y, logoWidth, newHeight);
          y += newHeight + 20;
        } catch (e) {
          console.log("logo error", e);
          y += logoHeight + 30; // Fallback
        }
      } else {
        y += 30;
      }

      // 2. DATA DE GERAÇÃO
      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.text(
        `Documento gerado em ${new Date().toLocaleString()}`,
        margin,
        y
      );
      y += 30;

      // 3. TÍTULO "HISTÓRICO"
      pdf.setFontSize(16);
      pdf.setFont(undefined, "bold");
      const titleText = `Histórico de ${pet?.name || ""}`;
      pdf.text(titleText,
        pageWidth / 2,
        y,
        { align: "center" }
      );
      y += 30;

      // 4. DADOS DO ANIMAL (Somente na primeira página)
      if (isFirstPage && pet) {
        y += 10;

        const photoSize = 100;
        if (petPhotoBase64) {
          try {
            pdf.addImage(petPhotoBase64, "PNG", margin, y, photoSize, photoSize);
          } catch (e) {
            console.error("Error adding pet photo to PDF", e);
          }
        } else {
          pdf.setDrawColor(200, 200, 200);
          pdf.circle(margin + (photoSize / 2), y + (photoSize / 2), photoSize / 2, 'S');
          pdf.text("Sem foto", margin + 25, y + 50);
        }

        const infoX = margin + photoSize + 20;
        const col2X = infoX + 150;
        const lineHeight = 14;
        let infoY = y + 10;

        pdf.setFontSize(10);
        const drawField = (label: string, value: string, x: number, curY: number) => {
          pdf.setFont(undefined, "bold");
          pdf.text(label, x, curY);
          const labelWidth = pdf.getTextWidth(label);
          pdf.setFont(undefined, "normal");
          pdf.text(value, x + labelWidth + 5, curY);
        };

        // Col 1
        drawField(`${translations.name || "Nome"}:`, pet.name, infoX, infoY);
        infoY += lineHeight;
        drawField(`${translations.species || "Espécie"}:`, translateValue(pet.species), infoX, infoY);
        infoY += lineHeight;
        drawField(`${translations.breed || "Raça"}:`, pet.breed, infoX, infoY);
        infoY += lineHeight;
        drawField(`${translations.gender || "Sexo"}:`, translateValue(pet.gender), infoX, infoY);

        // Col 2
        infoY = y + 10;
        drawField(`${translations.age || "Idade"}:`, calculateAge(pet.birthDate), col2X, infoY);
        infoY += lineHeight;
        drawField(`${translations.sterilized || "Castrado"}:`, pet.isSterilized ? (translations.yes || "Sim") : (translations.no || "Não"), col2X, infoY);
        infoY += lineHeight;
        drawField(`${translations.microchip || "Microchip"}:`, pet.microchip || "---", col2X, infoY);



        // Calculate Y position for Tutor Data (below Column 1 which is longest)
        // 4 lines of animal data * 14 lineHeight = 56. Start Y + margin + 56 + whitespace
        let tutorY = y + 10 + (4 * 14) + 15;

        // 5. DADOS DO TUTOR (Se houver)
        // Prefer pet.owner if available (Pet Owner), fallback to userProfile (Logged User/Vet)
        const owner = pet.owner || userProfile;

        if (owner) {
          pdf.setFontSize(12);
          pdf.setFont(undefined, "bold");
          pdf.text(translations.owner || "Tutor", infoX, tutorY);
          tutorY += 15;

          pdf.setFontSize(10);
          pdf.setFont(undefined, "normal");

          // print name, NIF, phone
          let tutorText = `${owner.name || ''}`;
          if (owner.nif) tutorText += ` - NIF: ${owner.nif}`;
          if (owner.phone) tutorText += ` - ${owner.phone}`;

          pdf.text(tutorText, infoX, tutorY);
          tutorY += 14;

          let addressText = owner.address || '';
          if (owner.email) addressText += `${addressText ? ' - ' : ''}${owner.email}`;

          pdf.text(addressText, infoX, tutorY);
          tutorY += 10;
        }

        // Update main Y to be below the photo OR the text, whichever is taller
        y = Math.max(y + photoSize + 20, tutorY + 20);

        // --- GRÁFICO DE PESO ---
        const record = getRecordForPet(petId);
        if (record && record.weightHistory && record.weightHistory.length > 1) {
          // Passando altura um pouco maior: 220
          y = drawWeightChart(pdf, record.weightHistory, margin, y, pageWidth - (margin * 2), 220);
        }

      }

      pdf.setFont(undefined, "normal");
      return y;
    };

    let cursorY = drawHeader(true);

    rows.forEach((n) => {
      // Título da anotação
      const title = `${n.title || "Sem título"} — ${n.localCreatedAt
        ? new Date(n.localCreatedAt).toLocaleString()
        : n.createdAt?.toDate().toLocaleString()
        }`;

      pdf.setFontSize(12);
      pdf.setFont(undefined, "bold");
      pdf.text(title, margin, cursorY);

      cursorY += 20;

      pdf.setFont(undefined, "normal");
      pdf.setFontSize(11);
      const lines = pdf.splitTextToSize(
        n.text || "",
        pageWidth - margin * 2
      );

      for (const line of lines) {
        if (cursorY > pageHeight - 40) {
          pdf.addPage();
          cursorY = drawHeader(false); // Cabeçalho simples nas próximas páginas
        }
        pdf.text(line, margin, cursorY);
        cursorY += 14;
      }

      cursorY += 20;
    });

    return pdf;
  };

  /* ------------------------- EXPORTAR ------------------------- */
  /* ------------------------- EXPORTAR (Download PDF) ------------------------- */
  const exportSelected = async () => {
    if (selectedNotes.length === 0) {
      alert("Selecione pelo menos uma anotação.");
      return;
    }

    let petPhotoBase64: string | null = null;
    if (pet?.photoUrl) {
      petPhotoBase64 = await getCircularImageBase64(pet.photoUrl);
    }

    const rows = notes.filter((n) => selectedNotes.includes(n.id));
    const pdf = generatePdf(rows, petPhotoBase64);
    const filename = `historico_${pet?.name || 'pet'}_${new Date().toISOString().slice(0, 10)}.pdf`;

    if (Capacitor.isNativePlatform()) {
      try {
        const base64 = pdf.output('datauristring').split(',')[1];

        // Save to Documents directory on Android
        const savedFile = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Documents
        });

        // On Android 11+ (API 30), direct access to Documents might be restricted. 
        // But usually writing to Documents is the way to "Download".
        // Alternatively, we can use the share sheet just to "Save to Files", 
        // but the user specifically asked for "Download" on one button and "Share" on the other.
        // Opening the file immediately might be a good feedback.

        // Let's try to open it to confirm download
        const fileUri = await Filesystem.getUri({
          path: filename,
          directory: Directory.Documents
        });

        alert(translations.pdfSaved || (language === 'pt' ? 'PDF salvo em Documentos' : 'PDF saved in Documents'));

        setSelectedNotes([]);
        setSelectMode(false);
      } catch (e) {
        console.error("Erro ao exportar PDF nativo", e);
        alert("Erro ao salvar PDF.");
      }
    } else {
      // Web
      pdf.save(filename);
      setSelectedNotes([]);
      setSelectMode(false);
    }
  };

  /* ------------------------- COMPARTILHAR ------------------------- */
  const shareSelected = async () => {
    // Reutilizar a mesma lógica de exportação, pois no mobile "Exportar" e "Compartilhar" 
    // acabam usando o Share Sheet do sistema de qualquer forma para salvar ou enviar.
    // Mas se quiser separar, pode manter. Para simplicidade, vou direcionar para exportSelected 
    // se for nativo, ou manter a lógica web se for web.

    if (Capacitor.isNativePlatform()) {
      if (selectedNotes.length === 0) {
        alert("Selecione pelo menos uma anotação.");
        return;
      }

      let petPhotoBase64: string | null = null;
      if (pet?.photoUrl) {
        petPhotoBase64 = await getCircularImageBase64(pet.photoUrl);
      }

      const rows = notes.filter((n) => selectedNotes.includes(n.id));
      const pdf = generatePdf(rows, petPhotoBase64);
      const filename = `historico_${pet?.name || 'pet'}_${new Date().toISOString().slice(0, 10)}.pdf`;

      try {
        const base64 = pdf.output('datauristring').split(',')[1];

        await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Cache // Use Cache for temporary sharing
        });

        const fileUri = await Filesystem.getUri({
          path: filename,
          directory: Directory.Cache
        });

        await Share.share({
          title: 'Histórico Veterinário',
          text: `Histórico de ${pet?.name}`,
          files: [fileUri.uri],
          dialogTitle: 'Compartilhar Histórico'
        });

        setSelectedNotes([]);
        setSelectMode(false);
      } catch (e) {
        console.error("Erro ao compartilhar PDF nativo", e);
        alert("Erro ao compartilhar PDF.");
      }
      return;
    }

    if (selectedNotes.length === 0) {
      alert("Selecione pelo menos uma anotação.");
      return;
    }

    let petPhotoBase64: string | null = null;
    if (pet?.photoUrl) {
      petPhotoBase64 = await getCircularImageBase64(pet.photoUrl);
    }

    const rows = notes.filter((n) => selectedNotes.includes(n.id));
    const pdf = generatePdf(rows, petPhotoBase64);
    const filename = `historico_${pet?.name || 'pet'}_${new Date().toISOString().slice(0, 10)}.pdf`;

    const blob = pdf.output("blob");
    const file = new File([blob], filename, { type: "application/pdf" });

    if ((navigator as any).canShare?.({ files: [file] })) {
      try {
        await (navigator as any).share({
          files: [file],
          title: "Histórico Veterinário",
        });
        setSelectedNotes([]);
        setSelectMode(false);
        return;
      } catch (e) { }
    }

    pdf.save(filename);
  };



  /* ============================================================
     RENDER
     ============================================================*/
  /* ============================================================
     RENDER
     ============================================================*/
  // Se não tiver pet carregado ainda, pode exibir loader ou null.
  // Mas como a lógica de loading está dentro, vamos manter.
  // O layout precisa do pet para o título e background.

  if (!pet) return null; // ou um loader

  return (
    <div className="relative min-h-screen">
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-fixed transition-all duration-500 z-0"
        style={{ backgroundImage: `url(${pet.photoUrl})` }}
      />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"></div>

      <div className="relative z-10">
        <Layout
          title={`${translations.history ?? (language === 'pt' ? 'Histórico' : 'History')} - ${pet.name}`}
          overrideBackground={true}
          backPath={`/pet/${petId}`}
        >
          {/* Busca */}
          <div className="mb-4 relative">
            <input
              className="p-3 border-none rounded-xl w-full pr-10 bg-white/90 dark:bg-gray-800/90 shadow-sm backdrop-blur-sm focus:ring-2 focus:ring-primary"
              placeholder={translations.search ?? (language === 'pt' ? 'Pesquisar...' : 'Search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 text-lg text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Formulário */}
          <div className="mb-6 p-6 rounded-xl shadow-lg bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm">
            <input
              className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-3 bg-white/50 dark:bg-gray-900/50"
              placeholder={translations.title ?? (language === 'pt' ? 'Título' : 'Title')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 bg-white/50 dark:bg-gray-900/50"
              rows={4}
              placeholder={translations.writeNote ?? (language === 'pt' ? 'Escreva a anotação...' : 'Write the note...')}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="flex flex-col gap-3">
              {/* Linha 1: Salvar e Cancelar */}
              <div className="flex gap-2">
                <button
                  className="flex-1 px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium shadow-sm text-xs"
                  onClick={saveNote}
                >
                  {editingId
                    ? (translations.save ?? (language === 'pt' ? 'Salvar' : 'Save'))
                    : (translations.newNote ?? (language === 'pt' ? 'Nova nota' : 'New note'))}
                </button>

                <button
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium text-xs"
                  onClick={() => {
                    setEditingId(null);
                    setTitle("");
                    setText("");
                  }}
                >
                  {translations.cancel ?? (language === 'pt' ? 'Cancelar' : 'Cancel')}
                </button>
              </div>

              {/* Botões de Ação Secundários */}
              <div className="flex flex-col gap-2 w-full">
                {/* Linha 2: Selecionar (Largura total) */}
                <button
                  className={`w-full px-3 py-2 rounded-lg transition-colors font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs ${selectMode ? "bg-primary/10 border-primary text-primary" : ""}`}
                  onClick={() => {
                    setSelectMode(!selectMode);
                    setSelectedNotes([]);
                  }}
                >
                  {selectMode
                    ? (translations.cancel ?? (language === 'pt' ? "Cancelar Seleção" : "Cancel Selection"))
                    : (translations.select ?? (language === 'pt' ? "Selecionar" : "Select"))}
                </button>

                {/* Linha 3: PDF e Compartilhar */}
                <div className="flex gap-2 w-full">
                  <button
                    className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-sm text-xs"
                    onClick={exportSelected}
                    title={translations.export ?? (language === 'pt' ? "Exportar" : "Export")}
                  >
                    PDF
                  </button>

                  <button
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-sm text-xs"
                    onClick={shareSelected}
                    title={translations.share ?? (language === 'pt' ? "Compartilhar" : "Share")}
                  >
                    {translations.share ?? (language === 'pt' ? "Compartilhar" : "Share")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Seleção em Massa */}
          {selectMode && (
            <div className="flex items-center gap-3 p-4 border border-primary/20 rounded-xl mb-4 bg-surface-light/90 dark:bg-surface-dark/90 shadow-md backdrop-blur-sm">
              <input
                type="checkbox"
                className="w-5 h-5 text-primary rounded focus:ring-primary"
                checked={
                  selectedNotes.length === filtered.length &&
                  filtered.length > 0
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedNotes(filtered.map((n) => n.id));
                  } else {
                    setSelectedNotes([]);
                  }
                }}
              />
              <span className="font-medium text-primary">
                {translations.selectAll ?? (language === 'pt' ? "Selecionar todas" : "Select all")}
              </span>

              {selectedNotes.length > 0 && (
                <button
                  className="ml-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium shadow-sm"
                  onClick={() => {
                    selectedNotes.forEach((id) => {
                      deleteDoc(doc(db, "pets", petId!, "vetHistory", id));
                    });
                    setSelectedNotes([]);
                    setSelectMode(false);
                  }}
                >
                  {translations.deleteSelected ?? (language === 'pt' ? "Excluir selecionadas" : "Delete selected")}
                </button>
              )}
            </div>
          )}

          {/* Lista de anotações */}
          <div className="space-y-4 pb-20">
            {loading ? (
              <div className="text-center p-8 text-white">
                {translations.loading ?? (language === 'pt' ? "Carregando..." : "Loading...")}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center p-8 text-white/70 bg-black/20 rounded-xl backdrop-blur-sm">
                {translations.noNotes ?? (language === 'pt' ? "Nenhuma anotação encontrada." : "No notes found.")}
              </div>
            ) : (
              filtered.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl shadow-md transition-all ${selectMode && selectedNotes.includes(n.id)
                    ? "bg-surface-light/95 dark:bg-surface-dark/95 border-2 border-primary backdrop-blur-sm"
                    : "bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-sm hover:transform hover:scale-[1.01]"
                    }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    {selectMode && (
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-primary rounded focus:ring-primary"
                          checked={selectedNotes.includes(n.id)}
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedNotes((prev) => [...prev, n.id]);
                            else
                              setSelectedNotes((prev) =>
                                prev.filter((id) => id !== n.id)
                              );
                          }}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <span className="font-bold text-lg text-text-light dark:text-text-dark truncate">
                          {n.title || (translations.untitled ?? "Sem título")}
                        </span>
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                          {n.localCreatedAt
                            ? new Date(n.localCreatedAt).toLocaleString()
                            : n.createdAt?.toDate().toLocaleString()}
                        </span>
                      </div>

                      <div
                        className="text-text-light/90 dark:text-text-dark/90 whitespace-pre-wrap leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: highlight(n.text || ""),
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-2 opacity-80 hover:opacity-100">
                      <button
                        onClick={() => startEdit(n)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                        title={translations.edit ?? "Editar"}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => removeNote(n.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                        title={translations.delete ?? "Excluir"}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Layout>
      </div>
    </div>
  );
}
