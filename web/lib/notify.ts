import "server-only";
import nodemailer from "nodemailer";
import { db } from "./supabase";
import { tf, type Key, type Lang } from "./i18n";

export type NotifType = "due" | "nudge" | "missed" | "missed_critical";
export type Severity = "info" | "warn" | "urgent";

const transporter =
  process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null;

/** Single place where notifications are sent: in-app first, then email. */
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

  if (!transporter) return;
  const { data: members } = await db
    .from("members")
    .select("email, language, channel_prefs")
    .in("id", memberIds);

  const results = await Promise.allSettled(
    (members ?? [])
      .filter((m) => m.email && m.channel_prefs?.email !== false)
      .map((m) =>
        transporter.sendMail({
          from: `CareCircle <${process.env.SMTP_USER}>`,
          to: m.email,
          subject: "CareCircle",
          text: tf(m.language as Lang, `n_${type}` as Key, params),
        })
      )
  );
  results.forEach((r) => {
    if (r.status === "rejected") console.error("email failed:", r.reason?.message);
  });
}