import "server-only";
import { db } from "./supabase";
import { ensureTodayDoses } from "./doses";
import { fmtTime } from "./time";
import { notify } from "./notify";
import { targetLevel } from "./escalation";

type Row = {
  id: string;
  circle_id: string;
  scheduled_for: string;
  escalation_level: number;
  medications: { name: string; is_critical: boolean } | null;
  circles: { elder_name: string } | null;
};

export async function runReminders(circleId?: string, now = new Date()) {
  await ensureTodayDoses(circleId);

  let q = db
    .from("dose_logs")
    .select("id, circle_id, scheduled_for, escalation_level, medications(name, is_critical), circles(elder_name)")
    .in("status", ["pending", "missed"])
    .lte("scheduled_for", now.toISOString())
    .gte("scheduled_for", new Date(now.getTime() - 6 * 3600 * 1000).toISOString());
  if (circleId) q = q.eq("circle_id", circleId);

  const rows = ((await q).data ?? []) as unknown as Row[];
  if (!rows.length) return { checked: 0, sent: 0 };

  const circleIds = [...new Set(rows.map((r) => r.circle_id))];
  const { data: members } = await db
    .from("members")
    .select("id, circle_id, role")
    .in("circle_id", circleIds);

  let sent = 0;
  for (const r of rows) {
    const critical = r.medications?.is_critical ?? false;
    const late = (now.getTime() - new Date(r.scheduled_for).getTime()) / 60000;
    const level = targetLevel(late, critical);
    if (level <= r.escalation_level) continue;

    // claim this step first, so overlapping runs can never send it twice
    const { data: claimed } = await db
      .from("dose_logs")
      .update({ escalation_level: level, ...(level >= 3 ? { status: "missed" } : {}) })
      .eq("id", r.id)
      .eq("escalation_level", r.escalation_level)
      .in("status", ["pending", "missed"])
      .select("id");
    if (!claimed?.length) continue;

    const ids = (...roles: string[]) =>
      (members ?? [])
        .filter((m) => m.circle_id === r.circle_id && roles.includes(m.role))
        .map((m) => m.id);
    const params = {
      med: r.medications?.name ?? "",
      time: fmtTime(r.scheduled_for),
      elder: r.circles?.elder_name ?? "",
    };

    if (level === 1) await notify(ids("elder"), "due", params, "info");
    else if (level === 2) await notify(ids("elder"), "nudge", params, "warn");
    else if (level === 3) await notify(ids("caretaker"), "missed", params, "warn");
    else await notify(ids("family", "caretaker"), "missed_critical", params, "urgent");
    sent++;
  }
  return { checked: rows.length, sent };
}