"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dictionaries, type Copy, type Lang } from "./copy";

type LanguageValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Copy;
};

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const saved = window.localStorage.getItem("evasion-lang");
    if (saved === "fr" || saved === "nl" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem("evasion-lang", lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: setLangState, t: dictionaries[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useI18n outside provider");
  return value;
}
