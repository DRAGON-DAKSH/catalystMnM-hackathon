import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/supabase";
import { createSession } from "@/lib/session";

const Body = z
  .object({
    elderName: z.string().trim().min(1).max(60),
    caretakerName: z.string().trim().min(1).max(60),
    elderPasscode: z.string().min(4).max(32),
    caretakerPasscode: z.string().min(4).max(32),
    language: z.enum(["en", "hi", "mr"]).default("en"),
    email: z.string().email().optional(),
  })
  // login matches on passcode alone, so passcodes must differ within a circle
  .refine((b) => b.elderPasscode !== b.caretakerPasscode, {
    message: "Passcodes must be different",
    path: ["elderPasscode"],
  });

// no 0/O/1/I so codes are easy to read out loud
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const makeCode = () =>
  Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const b = parsed.data;

  // create the circle, retrying if the random code collides
  let circle: { id: string; code: string } | null = null;
  for (let i = 0; i < 5 && !circle; i++) {
    const { data, error } = await db
      .from("circles")
      .insert({ code: makeCode(), elder_name: b.elderName })
      .select("id, code")
      .single();
    if (data) circle = data;
    else if (error?.code !== "23505") break; // not a duplicate-code error
  }
  if (!circle)
    return NextResponse.json({ error: "Could not create circle" }, { status: 500 });

  const [elderHash, caretakerHash] = await Promise.all([
    bcrypt.hash(b.elderPasscode, 10),
    bcrypt.hash(b.caretakerPasscode, 10),
  ]);

  const { data: members, error } = await db
    .from("members")
    .insert([
      { circle_id: circle.id, name: b.elderName, role: "elder",
        passcode_hash: elderHash, language: b.language },
      { circle_id: circle.id, name: b.caretakerName, role: "caretaker",
        passcode_hash: caretakerHash, language: b.language, email: b.email ?? null },
    ])
    .select("id, role");

  if (error || !members) {
    await db.from("circles").delete().eq("id", circle.id); // clean up
    return NextResponse.json({ error: "Could not create members" }, { status: 500 });
  }

  const caretaker = members.find((m) => m.role === "caretaker")!;
  await createSession({
    memberId: caretaker.id,
    circleId: circle.id,
    role: "caretaker",
  });

  return NextResponse.json({ ok: true, code: circle.code });
}