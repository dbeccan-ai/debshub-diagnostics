import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "es" | "fr" | "zh";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  languageLabel: string;
}

const languageLabels: Record<Language, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  zh: "中文",
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("preferredLanguage");
    return (saved as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    console.log("LanguageContext: Setting language to", lang);
    setLanguageState(lang);
    localStorage.setItem("preferredLanguage", lang);
    console.log("LanguageContext: Language set, new state should be", lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        languageLabel: languageLabels[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const languageOptions = [
  { value: "en" as Language, label: "English", flag: "🇺🇸" },
  { value: "es" as Language, label: "Español", flag: "🇪🇸" },
  { value: "fr" as Language, label: "Français", flag: "🇫🇷" },
  { value: "zh" as Language, label: "中文", flag: "🇨🇳" },
];
