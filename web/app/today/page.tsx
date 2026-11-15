import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/supabase";
import { ensureTodayDoses } from "@/lib/doses";
import { dayRange, fmtTime, istDate } from "@/lib/time";
import type { Lang } from "@/lib/i18n";
import TodayView, { type Dose } from "./TodayView";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  status: Dose["status"];
  scheduled_for: string;
  medications: {
    name: string;
    dose: string | null;
    instructions: string | null;
    is_critical: boolean;
  } | null;
};

export default async function TodayPage() {
  const s = await getSession();
  if (!s) redirect("/");

  await ensureTodayDoses(s.circleId);
  const { start, end } = dayRange(istDate());

  const [{ data: member }, { data: circle }, { data: rows }] = await Promise.all([
    db.from("members").select("name, language").eq("id", s.memberId).single(),
    db.from("circles").select("elder_name").eq("id", s.circleId).single(),
    db
      .from("dose_logs")
      .select("id, status, scheduled_for, medications(name, dose, instructions, is_critical)")
      .eq("circle_id", s.circleId)
      .gte("scheduled_for", start)
      .lt("scheduled_for", end)
      .order("scheduled_for"),
  ]);
  if (!member || !circle) redirect("/");

  const doses: Dose[] = ((rows ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    status: r.status,
    time: fmtTime(r.scheduled_for),
    name: r.medications?.name ?? "",
    dose: r.medications?.dose ?? null,
    instructions: r.medications?.instructions ?? null,
    critical: r.medications?.is_critical ?? false,
  }));

  return (
    <TodayView
      initialLang={member.language as Lang}
      role={s.role}
      memberName={member.name}
      elderName={circle.elder_name}
      doses={doses}
    />
  );
}