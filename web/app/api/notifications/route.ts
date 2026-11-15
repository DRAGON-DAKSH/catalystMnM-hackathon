import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data } = await db
    .from("notifications")
    .select("id, type, params, severity, read, created_at")
    .eq("member_id", s.memberId)
    .order("created_at", { ascending: false })
    .limit(20);
  return NextResponse.json({ items: data ?? [] });
}

export async function PATCH() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await db.from("notifications").update({ read: true }).eq("member_id", s.memberId).eq("read", false);
  return NextResponse.json({ ok: true });
}