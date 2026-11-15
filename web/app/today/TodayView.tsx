"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Key, type Lang } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import LangSwitch from "@/app/LangSwitch";

export type Dose = {
  id: string;
  status: "pending" | "taken" | "skipped" | "missed";
  time: string;
  name: string;
  dose: string | null;
  instructions: string | null;
  critical: boolean;
};

type Props = {
  initialLang: Lang;
  role: "elder" | "caretaker" | "family";
  memberName: string;
  elderName: string;
  doses: Dose[];
};

const chip: Record<Dose["status"], string> = {
  pending: "bg-saffron text-ink",
  taken: "bg-leaf text-white",
  skipped: "bg-mint text-ink",
  missed: "bg-berry text-white",
};

const post = (url: string, body: unknown) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const field =
  "w-full rounded-[14px] border-2 border-muted/60 bg-white px-4 py-3.5 text-xl focus:border-brand";
const labelCls = "mb-1.5 block text-lg font-medium";

export default function TodayView({ initialLang, role, memberName, elderName, doses }: Props) {
  const router = useRouter();
  const [lang, setLang] = useLang(initialLang);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const canAct = role === "elder" || role === "caretaker";
  const next = doses.find((d) => d.status === "pending" || d.status === "missed");
  const takenCount = doses.filter((d) => d.status === "taken").length;

  async function mark(id: string, status: "taken" | "skipped") {
    setBusyId(id);
    setError("");
    const res = await post(`/api/doses/${id}`, { status }).catch(() => null);
    setBusyId("");
    if (res?.ok) router.refresh();
    else setError(t(lang, "oops"));
  }

  async function addMed(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const times = String(f.get("times") ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => (/^\d:\d\d$/.test(x) ? `0${x}` : x));
    setError("");
    const res = await post("/api/medications", {
      name: f.get("name"),
      dose: f.get("dose"),
      instructions: f.get("instructions"),
      times,
      isCritical: f.get("isCritical") === "on",
    }).catch(() => null);
    if (res?.ok) {
      form.reset();
      router.refresh();
    } else setError(t(lang, "oops"));
  }

  async function logout() {
    await post("/api/logout", {});
    window.location.href = "/";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-7 px-5 py-8">
      <header className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg text-muted">{t(lang, "hello")}, {memberName}</p>
            <h1 className="text-4xl font-semibold">{t(lang, "today")}</h1>
            <p className="text-xl text-muted">{elderName}</p>
          </div>
          <button type="button" onClick={logout}
            className="rounded-xl px-4 py-2.5 text-lg font-medium text-brand underline-offset-4 hover:underline">
            {t(lang, "logout")}
          </button>
        </div>
        <LangSwitch lang={lang} onChange={setLang} />
      </header>

      {doses.length === 0 ? (
        <section className="rounded-[28px] bg-white p-6 ring-1 ring-brand/15">
          <p className="text-2xl font-medium">{t(lang, "noDoses")}</p>
          {role === "caretaker" && (
            <p className="mt-2 text-lg text-muted">{t(lang, "addFirst")}</p>
          )}
        </section>
      ) : next ? (
        <section aria-labelledby="next-heading" className="rounded-[28px] bg-brand p-6 text-white">
          <div className="flex items-center justify-between gap-3">
            <h2 id="next-heading" className="text-lg font-medium text-white/85">
              {t(lang, "nextDose")}
            </h2>
            {next.critical && (
              <span className="rounded-full bg-berry px-3 py-1 text-base font-medium">
                {t(lang, "critical")}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-6xl font-semibold tracking-tight">{next.time}</p>
            {next.status === "missed" && (
              <span className="rounded-full bg-saffron px-3 py-1 text-base font-medium text-ink">
                {t(lang, "missed")}
              </span>
            )}
          </div>
          <p className="mt-3 text-3xl font-medium">{next.name}</p>
          {(next.dose || next.instructions) && (
            <p className="mt-1 text-xl text-white/90">
              {[next.dose, next.instructions].filter(Boolean).join(", ")}
            </p>
          )}
          {canAct ? (
            <div className="mt-6 flex flex-col gap-3">
              <button type="button" disabled={busyId === next.id} onClick={() => mark(next.id, "taken")}
                className="rounded-2xl bg-white px-6 py-5 text-2xl font-semibold text-brand-deep transition-transform active:scale-[0.99] disabled:opacity-60">
                {t(lang, "markTaken")}
              </button>
              <button type="button" disabled={busyId === next.id} onClick={() => mark(next.id, "skipped")}
                className="rounded-2xl border-2 border-white/70 px-6 py-3.5 text-xl font-medium text-white disabled:opacity-60">
                {t(lang, "skip")}
              </button>
            </div>
          ) : (
            <p className="mt-5 text-lg text-white/90">{t(lang, "viewOnly")}</p>
          )}
        </section>
      ) : (
        <section className="flex items-center gap-4 rounded-[28px] bg-leaf p-6 text-white">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          <p className="text-3xl font-semibold">{t(lang, "allDone")}</p>
        </section>
      )}

      {error && <p role="alert" className="text-lg font-medium text-berry">{error}</p>}

      {doses.length > 0 && (
        <>
          <div>
            <div className="mb-2 flex justify-between text-lg font-medium">
              <span>{t(lang, "taken")}</span>
              <span>{takenCount}/{doses.length}</span>
            </div>
            <div role="progressbar" aria-label={t(lang, "taken")} aria-valuemin={0}
              aria-valuemax={doses.length} aria-valuenow={takenCount}
              className="h-3 overflow-hidden rounded-full bg-mint">
              <div className="h-full rounded-full bg-leaf transition-[width] duration-500"
                style={{ width: `${(takenCount / doses.length) * 100}%` }} />
            </div>
          </div>

          <section aria-labelledby="schedule-heading">
            <h2 id="schedule-heading" className="mb-4 text-2xl font-semibold">
              {t(lang, "schedule")}
            </h2>
            <ol className="ml-2 border-l-2 border-mint">
              {doses.map((d) => (
                <li key={d.id} aria-current={d.id === next?.id ? "true" : undefined}
                  className="relative pb-5 pl-6 last:pb-0">
                  <span aria-hidden="true"
                    className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full ring-4 ring-paper ${chip[d.status]}`} />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg text-muted">{d.time}</p>
                      <p className={`text-xl ${d.id === next?.id ? "font-semibold" : "font-medium"}`}>
                        {d.name}{d.dose ? `, ${d.dose}` : ""}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-base font-medium ${chip[d.status]}`}>
                      {t(lang, d.status as Key)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}

      {role === "caretaker" && (
        <details open={doses.length === 0} className="group rounded-[20px] bg-white ring-1 ring-brand/15">
          <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-2xl font-semibold">
            {t(lang, "addMed")}
            <span aria-hidden="true" className="text-3xl text-brand transition-transform group-open:rotate-45">+</span>
          </summary>
          <form onSubmit={addMed} className="flex flex-col gap-4 px-5 pb-5">
            <div>
              <label htmlFor="name" className={labelCls}>{t(lang, "medName")}</label>
              <input id="name" name="name" required maxLength={80} className={field} />
            </div>
            <div>
              <label htmlFor="dose" className={labelCls}>{t(lang, "doseLabel")}</label>
              <input id="dose" name="dose" maxLength={40} className={field} />
            </div>
            <div>
              <label htmlFor="times" className={labelCls}>{t(lang, "timesLabel")}</label>
              <input id="times" name="times" required placeholder="08:00, 20:00" className={field} />
            </div>
            <div>
              <label htmlFor="instructions" className={labelCls}>{t(lang, "instructionsLabel")}</label>
              <input id="instructions" name="instructions" maxLength={200} className={field} />
            </div>
            <label className="flex items-center gap-3 text-xl">
              <input type="checkbox" name="isCritical" className="h-6 w-6 accent-brand" />
              {t(lang, "critical")}
            </label>
            <button type="submit"
              className="rounded-2xl bg-brand px-6 py-4 text-xl font-semibold text-white hover:bg-brand-deep">
              {t(lang, "save")}
            </button>
          </form>
        </details>
      )}
    </main>
  );
}