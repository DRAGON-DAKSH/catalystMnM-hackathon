import "server-only";
import { db } from "./supabase";

export type NotifType = "due" | "nudge" | "missed" | "missed_critical";
export type Severity = "info" | "warn" | "urgent";

/** Single place where notifications are sent. Email will plug in here later. */
export async function notify(
  memberIds: string[],
  type: NotifType,
  params: Record<string, string>,
  severity: Severity
) {
  if (!memberIds.length) return;
  await db
    .from("notifications")
    .insert(memberIds.map((member_id) => ({ member_id, type, params, severity })));
}