import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SEKUNDEN,
  adminPasswortIstKorrekt,
  erzeugeAdminSessionToken,
} from "@/lib/auth";

// Zweiter, separater Login-Endpunkt für den Admin-Bereich (Mitarbeiterstatistik, siehe
// app/admin/*) — bewusst analog zu api/login/route.ts, aber mit eigenem Passwort
// (ADMIN_PASSWORD) und eigenem Cookie (ADMIN_SESSION_COOKIE_NAME). Diese Route selbst verlangt
// weiterhin die App-weite Anmeldung (siehe middleware.ts, matcher unten schließt sie NICHT aus)
// — nur wer bereits in der Haupt-App angemeldet ist, darf überhaupt versuchen, sich zusätzlich
// für den Admin-Bereich anzumelden.
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

  if (!adminPasswortIstKorrekt(passwort)) {
    return NextResponse.json({ error: "Falsches Passwort" }, { status: 401 });
  }

  const token = await erzeugeAdminSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SEKUNDEN,
  });
  return response;
}
