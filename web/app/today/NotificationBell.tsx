"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { t, tf, type Key, type Lang } from "@/lib/i18n";
import { speak } from "@/lib/speech";

type Item = {
  id: string;
  type: string;
  params: Record<string, string>;
  severity: "info" | "warn" | "urgent";
  read: boolean;
  created_at: string;
};

const dot = { info: "bg-brand", warn: "bg-saffron", urgent: "bg-berry" };

export default function NotificationBell({ lang }: { lang: Lang }) {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [voice, setVoice] = useState(false);
  const known = useRef<Set<string> | null>(null);
  const voiceRef = useRef(false);
  const langRef = useRef<Lang>(lang);

  useEffect(() => { voiceRef.current = voice; }, [voice]);
  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { setVoice(localStorage.getItem("cc_voice") === "1"); }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications").catch(() => null);
    if (!res?.ok) return;
    const data: { items: Item[] } = await res.json();
    setItems(data.items);

    // first load: remember what exists so old alerts are never read aloud
    if (known.current === null) {
      known.current = new Set(data.items.map((i) => i.id));
      return;
    }
    const seen = known.current;
    const fresh = data.items.filter((i) => !seen.has(i.id));
    fresh.forEach((i) => seen.add(i.id));
    if (voiceRef.current) {
      fresh.slice(0, 2).forEach((i) =>
        speak(tf(langRef.current, `n_${i.type}` as Key, i.params), langRef.current)
      );
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    window.addEventListener("cc:notify", load);
    return () => {
      clearInterval(timer);
      window.removeEventListener("cc:notify", load);
    };
  }, [load]);

  const unread = items.filter((i) => !i.read).length;

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await fetch("/api/notifications", { method: "PATCH" }).catch(() => null);
      setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    }
  }

  function toggleVoice() {
    const next = !voice;
    setVoice(next);
    localStorage.setItem("cc_voice", next ? "1" : "0");
    if (next) speak(t(lang, "voiceOn"), lang); // the tap also unlocks audio in the browser
  }

  return (
    <div className="relative">
      <button type="button" onClick={toggleOpen} aria-expanded={open} aria-label={t(lang, "bell")}
        className="relative rounded-xl p-2.5 text-brand">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-berry px-1 text-xs font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-[min(22rem,88vw)] rounded-2xl bg-white p-3 ring-1 ring-brand/20">
          <button type="button" onClick={toggleVoice}
            className={`mb-3 w-full rounded-xl px-4 py-3 text-lg font-medium ${
              voice ? "bg-leaf text-white" : "bg-mint text-ink"
            }`}>
            {t(lang, voice ? "voiceOn" : "voiceOff")}
          </button>
          {items.length === 0 ? (
            <p className="p-2 text-lg text-muted">{t(lang, "noNotifs")}</p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-2 overflow-auto">
              {items.map((i) => (
                <li key={i.id} className="flex gap-3 rounded-xl bg-paper p-3">
                  <span aria-hidden="true" className={`mt-2 h-3 w-3 shrink-0 rounded-full ${dot[i.severity]}`} />
                  <div>
                    <p className="text-lg leading-snug">{tf(lang, `n_${i.type}` as Key, i.params)}</p>
                    <p className="text-base text-muted">
                      {new Date(i.created_at).toLocaleTimeString("en-IN", {
                        hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}