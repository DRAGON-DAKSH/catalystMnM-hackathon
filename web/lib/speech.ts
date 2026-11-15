import { LANGS, type Lang } from "./i18n";

export function speak(text: string, lang: Lang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const code = LANGS.find((l) => l.code === lang)?.speech ?? "en-IN";
  const u = new SpeechSynthesisUtterance(text);
  u.lang = code;
  u.rate = 0.9; // slower is easier to follow
  const voices = speechSynthesis.getVoices();
  const voice =
    voices.find((v) => v.lang === code) ?? voices.find((v) => v.lang.startsWith(code.slice(0, 2)));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}