import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../App";
import PrivacyPolicyPT from "./PrivacyPolicy.pt";
import PrivacyPolicyEN from "./PrivacyPolicy.en";

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useAppContext();  // <-- CORRETO

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark px-4 pb-40 pt-4">       {/* Renderização automática */}
      {language === "en" ? <PrivacyPolicyEN /> : <PrivacyPolicyPT />}
      {/* Botão voltar — AGORA NO FINAL */}
      <div className="max-w-3xl mx-auto py-8">

        {/* Botão voltar */}
        <button
          onClick={() => navigate("/")}
          className="mt-1 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105"
        >
          {language === "en" ? "Back" : "Voltar"}
        </button>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

