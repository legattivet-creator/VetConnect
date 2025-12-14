import React from "react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicyPT: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-white p-6">
      <div className="max-w-3xl mx-auto py-8">



        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-primary">
          Política de Privacidade – VetConnect
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Última atualização: 21 de novembro de 2025
        </p>

        <p className="mb-4">
          O <strong>VetConnect</strong> é uma aplicação voltada para tutores de animais, veterinários e voluntários que atuam com animais,
          permitindo organizar informações como consultas, registros médicos, arquivos,
          lembretes e dados de saúde do pet.
        </p>

        <p className="mb-4">
          Esta Política de Privacidade descreve como tratamos as informações
          fornecidas e armazenadas dentro do aplicativo.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">1. Informações Coletadas</h2>

        <p className="mb-4">O VetConnect pode armazenar:</p>

        <ul className="list-disc pl-6 mb-4">
          <li>E-mail cadastrado no login;</li>
          <li>Dados dos pets (nome, raça, idade, foto etc.);</li>
          <li>Consultas, procedimentos, lembretes e histórico;</li>
          <li>Arquivos enviados (PDF, foto, vídeo, áudio);</li>
          <li>Arquivos capturados por Quick Start (foto, vídeo, áudio);</li>
          <li>Preferências do usuário (tema, idioma, plano de fundo);</li>
          <li>Configurações de notificação;</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Onde os Dados São Armazenados</h2>

        <p className="mb-4">
          Todos os dados são armazenados de forma segura na nuvem, utilizando a infraestrutura do
          <strong> Google Firebase (Firestore e Storage)</strong>.
        </p>

        <ul className="list-disc pl-6 mb-4">
          <li><strong>Firestore:</strong> para dados de cadastro, pets, consultas e prontuários;</li>
          <li><strong>Firebase Storage:</strong> para arquivos de mídia (fotos, vídeos, áudios e PDFs).</li>
        </ul>

        <p className="mb-4">
          Isso permite que você acesse suas informações de diferentes dispositivos de forma sincronizada.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">
          3. Uso das Informações
        </h2>

        <p className="mb-4">As informações são utilizadas exclusivamente para:</p>

        <ul className="list-disc pl-6 mb-4">
          <li>Organização e sincronização de dados dos pets;</li>
          <li>Agendamento e lembretes;</li>
          <li>Criação e exibição do prontuário;</li>
          <li>Armazenamento seguro de arquivos do usuário;</li>
          <li>Funcionalidade de Quick Start;</li>
        </ul>

        <p className="mb-4">
          O aplicativo <strong>não</strong> compartilha, vende ou usa dados para fins comerciais sem o seu consentimento.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Segurança</h2>

        <p className="mb-4">
          Utilizamos protocolos de segurança padrão da indústria fornecidos pelo Google, incluindo:
        </p>

        <ul className="list-disc pl-6 mb-4">
          <li>Criptografia de dados em trânsito e em repouso;</li>
          <li>Autenticação segura de usuários;</li>
          <li>Controles de acesso rigorosos aos servidores.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">5. Direitos do Usuário</h2>
        <p className="mb-4">
          O usuário pode, a qualquer momento:
        </p>

        <ul className="list-disc pl-6 mb-4">
          <li>apagar dados do aplicativo;</li>
          <li>desinstalar o app;</li>
          <li>remover pets, arquivos ou consultas individualmente;</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">6. Alterações na Política</h2>

        <p className="mb-4">
          Atualizações podem ocorrer para melhorar o funcionamento, atender leis
          ou corrigir problemas. A versão atualizada sempre estará disponível no aplicativo.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">7. Contato Oficial</h2>

        <p className="mb-2"><strong>Emerson Legatti</strong></p>
        <p className="mb-2">País: <strong>Portugal</strong></p>
        <p className="mb-2">NIF: <strong>309250641</strong></p>
        <p className="mb-6">E-mail: <strong>legattivet@gmail.com</strong></p>

        <p className="mt-10 text-gray-600 dark:text-gray-300">
          Ao utilizar o VetConnect, você concorda com esta Política de Privacidade.
        </p>

      </div>
    </div>
  );
};

export default PrivacyPolicyPT;

