import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { ensureTodayDoses } from "@/lib/doses";

const Body = z.object({
  name: z.string().trim().min(1).max(80),
  dose: z.string().trim().max(40).optional(),
  instructions: z.string().trim().max(200).optional(),
  times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).min(1).max(8),
  isCritical: z.boolean().default(false),
});

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "caretaker")
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const b = parsed.data;

  const { error } = await db.from("medications").insert({
    circle_id: s.circleId,
    name: b.name,
    dose: b.dose || null,
    instructions: b.instructions || null,
    times: [...new Set(b.times)].sort(),
    is_critical: b.isCritical,
    created_by: s.memberId,
  });
  if (error)
    return NextResponse.json({ error: "Could not save" }, { status: 500 });

  await db.from("audit_log").insert({
    circle_id: s.circleId,
    actor_id: s.memberId,
    action: "medication_added",
    details: { name: b.name },
  });
  await ensureTodayDoses(s.circleId);
  return NextResponse.json({ ok: true });
}