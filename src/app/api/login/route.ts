import { NextRequest, NextResponse } from "next/server";
import { erzeugeSessionToken, passwortIstKorrekt, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SEKUNDEN } from "@/lib/auth";

// Einziger Endpunkt, der ohne gültiges Session-Cookie erreichbar bleibt (siehe middleware.ts,
// matcher). Prüft das eine gemeinsame Passwort (Umgebungsvariable APP_PASSWORD) und setzt bei
// Erfolg das signierte Session-Cookie — es gibt keine Nutzernamen, keine Accounts, keine
// Datenbank.
export async function POST(request: NextRequest) {
  let passwort: unknown;
  try {
    const body = await request.json();
    passwort = body?.passwort;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  if (typeof passwort !== "string" || passwort.length === 0) {
    return NextResponse.json({ error: "Passwort fehlt" }, { status: 400 });
  }

  if (!passwortIstKorrekt(passwort)) {
    return NextResponse.json({ error: "Falsches Passwort" }, { status: 401 });
  }

  const token = await erzeugeSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEKUNDEN,
  });
  return response;
}
