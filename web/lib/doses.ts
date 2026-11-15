import "server-only";
import { db } from "./supabase";
import { istDate, slot } from "./time";

/** Creates today's pending dose rows (safe to call repeatedly). Pass no id to cover every circle. */
export async function ensureTodayDoses(circleId?: string) {
  const date = istDate();
  let q = db.from("medications").select("id, circle_id, times").eq("active", true);
  if (circleId) q = q.eq("circle_id", circleId);
  const { data: meds } = await q;

  const rows = (meds ?? []).flatMap((m) =>
    (m.times as string[]).map((time) => ({
      medication_id: m.id,
      circle_id: m.circle_id,
      scheduled_for: slot(date, time),
    }))
  );
  if (rows.length) {
    await db
      .from("dose_logs")
      .upsert(rows, { onConflict: "medication_id,scheduled_for", ignoreDuplicates: true });
  }
}