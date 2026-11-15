import "server-only";
import { db } from "./supabase";
import { istDate, slot } from "./time";

/** Creates today's pending dose rows for every active medication (safe to call repeatedly). */
export async function ensureTodayDoses(circleId: string) {
  const date = istDate();
  const { data: meds } = await db
    .from("medications")
    .select("id, times")
    .eq("circle_id", circleId)
    .eq("active", true);

  const rows = (meds ?? []).flatMap((m) =>
    (m.times as string[]).map((time) => ({
      medication_id: m.id,
      circle_id: circleId,
      scheduled_for: slot(date, time),
    }))
  );
  if (rows.length) {
    await db
      .from("dose_logs")
      .upsert(rows, { onConflict: "medication_id,scheduled_for", ignoreDuplicates: true });
  }
}