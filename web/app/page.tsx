"use client";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import LangSwitch from "./LangSwitch";

const field =
  "w-full rounded-[14px] border-2 border-muted/60 bg-white px-4 py-3.5 text-xl focus:border-brand";
const labelCls = "mb-1.5 block text-lg font-medium";

function PillBox() {
  return (
    <svg viewBox="0 0 120 40" width="84" height="28" aria-hidden="true">
      <rect x="1" y="1" width="118" height="38" rx="10" fill="#e2efec" stroke="#0e5a6b" strokeWidth="2" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={7 + i * 28} y="7" width="24" height="26" rx="6" fill="#fff" stroke="#0e5a6b" strokeWidth="1.5" />
      ))}
      <circle cx="19" cy="20" r="5" fill="#f0a030" />
      <circle cx="47" cy="20" r="5" fill="#0e5a6b" />
      <circle cx="75" cy="20" r="5" fill="#2b7a4b" />
    </svg>
  );
}

export default function Home() {
  const [lang, setLang] = useLang();
  const [mode, setMode] = useState<"join" | "create">("join");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [createdCode, setCreatedCode] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const body =
      mode === "join"
        ? { circleCode: f.get("circleCode"), passcode: f.get("passcode") }
        : {
            elderName: f.get("elderName"),
            caretakerName: f.get("caretakerName"),
            elderPasscode: f.get("elderPasscode"),
            email: String(f.get("email") ?? "") || undefined,
            caretakerPasscode: f.get("caretakerPasscode"),
            language: lang,
          };
    try {
      const res = await fetch(mode === "join" ? "/api/join" : "/api/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 401 ? t(lang, "wrong") : data.error ?? t(lang, "oops"));
      } else if (mode === "create") {
        setCreatedCode(data.code);
      } else {
        window.location.href = "/today";
      }
    } catch {
      setError(t(lang, "oops"));
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PillBox />
          <span className="text-2xl font-semibold text-brand">CareCircle</span>
        </div>
        <LangSwitch lang={lang} onChange={setLang} />
      </header>

      <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{t(lang, "tagline")}</h1>

      {createdCode ? (
        <section className="rounded-[28px] bg-white p-6 ring-1 ring-brand/15">
          <p className="text-xl">{t(lang, "created")}</p>
          <div role="img" aria-label={createdCode} className="my-6 flex gap-2">
            {createdCode.split("").map((c, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="flex h-16 w-12 items-center justify-center rounded-xl bg-mint text-3xl font-semibold text-brand"
              >
                {c}
              </span>
            ))}
          </div>
          <a
            href="/today"
            className="inline-block rounded-2xl bg-brand px-8 py-4 text-xl font-semibold text-white hover:bg-brand-deep"
          >
            {t(lang, "continue")}
          </a>
        </section>
      ) : (
        <section className="flex flex-col gap-6 rounded-[28px] bg-white p-6 ring-1 ring-brand/15">
          <div role="tablist" className="grid grid-cols-2 gap-1 rounded-2xl bg-mint p-1">
            {(["join", "create"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`rounded-xl px-3 py-3 text-lg transition-colors ${
                  mode === m ? "bg-white font-semibold text-brand" : "font-medium"
                }`}
              >
                {t(lang, m)}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === "join" ? (
              <>
                <div>
                  <label htmlFor="circleCode" className={labelCls}>{t(lang, "circleCode")}</label>
                  <input id="circleCode" name="circleCode" required maxLength={20} autoComplete="off"
                    className={`${field} uppercase tracking-widest`} />
                </div>
                <div>
                  <label htmlFor="passcode" className={labelCls}>{t(lang, "passcode")}</label>
                  <input id="passcode" name="passcode" type="password" required minLength={4}
                    maxLength={32} autoComplete="off" className={field} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="elderName" className={labelCls}>{t(lang, "elderName")}</label>
                  <input id="elderName" name="elderName" required maxLength={60} className={field} />
                </div>
                <div>
                  <label htmlFor="elderPasscode" className={labelCls}>{t(lang, "elderPasscode")}</label>
                  <input id="elderPasscode" name="elderPasscode" type="password" required minLength={4}
                    maxLength={32} autoComplete="off" className={field} />
                </div>
                <div>
                  <label htmlFor="caretakerName" className={labelCls}>{t(lang, "caretakerName")}</label>
                  <input id="caretakerName" name="caretakerName" required maxLength={60} className={field} />
                </div>
                                <div>
                  <label htmlFor="email" className={labelCls}>{t(lang, "emailLabel")}</label>
                  <input id="email" name="email" type="email" autoComplete="email" className={field} />
                </div>
                <div>
                  <label htmlFor="caretakerPasscode" className={labelCls}>{t(lang, "caretakerPasscode")}</label>
                  <input id="caretakerPasscode" name="caretakerPasscode" type="password" required
                    minLength={4} maxLength={32} autoComplete="off" className={field} />
                </div>
              </>
            )}

            {error && (
              <p role="alert" className="text-lg font-medium text-berry">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="rounded-2xl bg-brand px-6 py-4 text-xl font-semibold text-white transition-transform hover:bg-brand-deep active:scale-[0.99] disabled:opacity-60"
            >
              {mode === "join" ? t(lang, "continue") : t(lang, "createBtn")}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}