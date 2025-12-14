import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../App";

import TermsOfUsePT from "./TermsOfUse.pt";
import TermsOfUseEN from "./TermsOfUse.en";

const TermsOfUse: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useAppContext(); // pt / en

  return (
    <div className="pb-48">

      {/* Renderização pelo idioma */}
      {language === "en" ? <TermsOfUseEN /> : <TermsOfUsePT />}

      {/* Botão voltar no final da página */}
      <div className="max-w-3xl mx-auto py-8">
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

export default TermsOfUse;

