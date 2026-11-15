import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { runReminders } from "@/lib/engine";

export async function POST() {
  const s = await getSession();
  if (!s || s.role !== "caretaker")
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  return NextResponse.json(await runReminders(s.circleId));
}