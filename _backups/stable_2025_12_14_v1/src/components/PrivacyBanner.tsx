import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../App";

export const PrivacyBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { language } = useAppContext();  // <-- PEGA O IDIOMA CORRETO

  useEffect(() => {
    const accepted = localStorage.getItem("privacyAccepted");
    if (!accepted) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("privacyAccepted", "true");
    setVisible(false);
    navigate("/");
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        background: "#1e40af",
        color: "white",
        padding: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <span>
        {language === "en"
          ? "We use personal data only for app functionality. Read our "
          : "Usamos dados pessoais apenas para funcionamento do app. Leia nossa "}

        <Link
          to="/privacy"
          style={{ textDecoration: "underline", color: "#c7d2fe" }}
        >
          {language === "en" ? "Privacy Policy" : "Política de Privacidade"}
        </Link>

        {language === "en" ? " and " : " e "}

        <Link
          to="/terms"
          style={{ textDecoration: "underline", color: "#c7d2fe" }}
        >
          {language === "en" ? "Terms of Use" : "Termos de Uso"}
        </Link>
        .
      </span>

      <button
        onClick={accept}
        style={{
          background: "white",
          color: "#1e40af",
          padding: "8px 14px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {language === "en" ? "Accept" : "Aceitar"}
      </button>
    </div>
  );
};
