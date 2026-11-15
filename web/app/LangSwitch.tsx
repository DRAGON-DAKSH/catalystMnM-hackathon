"use client";
import { LANGS, t, type Lang } from "@/lib/i18n";

export default function LangSwitch({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div role="group" aria-label={t(lang, "language")} className="flex gap-1.5">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => onChange(l.code)}
          aria-pressed={lang === l.code}
          className={`rounded-full px-4 py-2.5 text-base font-medium transition-colors ${
            lang === l.code ? "bg-brand text-white" : "bg-mint text-ink hover:bg-mint/70"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}