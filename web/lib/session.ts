import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const key = new TextEncoder().encode(process.env.SESSION_SECRET!);

export type Role = "elder" | "caretaker" | "family";
export type Session = { memberId: string; circleId: string; role: Role };

export async function createSession(s: Session) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(key);
  (await cookies()).set("cc_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get("cc_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}