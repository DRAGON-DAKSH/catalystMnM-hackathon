"use client";
import { useEffect, useState } from "react";
import { LANGS, type Lang } from "./i18n";

export function useLang(initial: Lang = "en") {
  const [lang, setLang] = useState<Lang>(initial);

  useEffect(() => {
    const saved = localStorage.getItem("cc_lang") as Lang | null;
    if (saved && LANGS.some((l) => l.code === saved)) setLang(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const change = (l: Lang) => {
    setLang(l);
    localStorage.setItem("cc_lang", l);
  };
  return [lang, change] as const;
}