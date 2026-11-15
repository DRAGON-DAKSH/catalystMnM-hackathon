import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/supabase";
import { createSession } from "@/lib/session";

const Body = z.object({
  circleCode: z.string().trim().min(4).max(20),
  passcode: z.string().min(4).max(32),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { circleCode, passcode } = parsed.data;
  const { data: circle } = await db
    .from("circles").select("id").eq("code", circleCode.toUpperCase()).single();

  const fail = () =>
    NextResponse.json({ error: "Wrong code or passcode" }, { status: 401 });
  if (!circle) return fail();

  const { data: members } = await db
    .from("members").select("id, role, passcode_hash").eq("circle_id", circle.id);

  for (const m of members ?? []) {
    if (await bcrypt.compare(passcode, m.passcode_hash)) {
      await createSession({ memberId: m.id, circleId: circle.id, role: m.role });
      return NextResponse.json({ ok: true, role: m.role });
    }
  }
  return fail();
}