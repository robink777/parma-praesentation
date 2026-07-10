import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

// Löscht das Session-Cookie wieder — kleines Gegenstück zu /api/login. Aktuell von keiner UI
// verlinkt (nicht Teil der Anfrage), steht aber für einen späteren "Abmelden"-Link bereit.
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}
