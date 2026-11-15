import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/session";

const Body = z.object({
  status: z.enum(["taken", "skipped"]),
  reason: z.string().trim().max(200).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await getSession();
  if (!s || s.role === "family")
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success)
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { status, reason } = parsed.data;

  // scoped to the caller's own circle, and only doses not yet logged
  const { data, error } = await db
    .from("dose_logs")
    .update({
      status,
      reason: reason ?? null,
      logged_by: s.memberId,
      logged_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("circle_id", s.circleId)
    .in("status", ["pending", "missed"])
    .select("id");

  if (error)
    return NextResponse.json({ error: "Could not update" }, { status: 500 });
  if (!data?.length)
    return NextResponse.json({ error: "Dose not found" }, { status: 404 });

  await db.from("audit_log").insert({
    circle_id: s.circleId,
    actor_id: s.memberId,
    action: `dose_${status}`,
    details: { dose_id: id },
  });
  return NextResponse.json({ ok: true });
}