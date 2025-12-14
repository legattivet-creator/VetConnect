import React from "react";

const TermsOfUsePT: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-white p-6">
      <div className="max-w-3xl mx-auto py-8">

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-primary">
          Termos de Uso – VetConnect
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Última atualização: 21 de novembro de 2025
        </p>

        <p className="mb-4">
          Bem-vindo ao <strong>VetConnect</strong>, uma aplicação destinada a ajudar tutores, veterinários e voluntários que atuam com animais a organizar
          informações de seus pets, como consultas, exames, arquivos e lembretes.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">1. Sobre o Aplicativo</h2>
        <p className="mb-4">
          O VetConnect funciona como um sistema pessoal de organização e não substitui o atendimento clínico veterinário.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Uso Permitido</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Registrar informações dos pets;</li>
          <li>Armazenar arquivos (fotos, vídeos, áudios, PDFs);</li>
          <li>Receber lembretes e notificações;</li>
          <li>Usar prontuário, agendamentos e Quick Start.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. Armazenamento de Dados</h2>
        <p className="mb-4">
          Os dados são armazenados e processados em servidores seguros na nuvem (Google Cloud Platform / Firestore), garantindo integridade e disponibilidade das informações.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Contato Oficial</h2>
        <p className="mb-2"><strong>Emerson Legatti</strong></p>
        <p className="mb-2">País: <strong>Portugal</strong></p>
        <p className="mb-2">NIF: <strong>309250641</strong></p>
        <p className="mb-6">E-mail: <strong>legattivet@gmail.com</strong></p>

      </div>
    </div>
  );
};

export default TermsOfUsePT;

