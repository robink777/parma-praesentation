import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  istGueltigesAdminSessionToken,
  istGueltigesSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

// Schützt die komplette App (Seiten UND API-Routen) hinter dem einen gemeinsamen Passwort aus
// lib/auth.ts — es gibt bewusst kein Konten-/Nutzersystem, nur diese eine Sperre gegen
// unautorisierten Zugriff aus dem offenen Internet (insbesondere auf /api/onoffice, das sonst
// ungeschützt Objekt-/Kundendaten aus onOffice ausliefern würde). /login und /api/login selbst
// bleiben zwangsläufig ausgenommen (siehe matcher unten) — sonst könnte niemand die Login-Seite
// überhaupt erreichen, um sich anzumelden.
//
// Für den Admin-Bereich (Mitarbeiterstatistik, siehe app/admin/*) kommt zusätzlich zu dieser
// App-weiten Prüfung noch eine zweite, unabhängige Prüfung obenauf (siehe unten) — bewusst
// dieselbe Middleware-Funktion statt einer zweiten, da beide Prüfungen ohnehin nacheinander für
// denselben Request gelten müssen und die Reihenfolge (erst App-weit, dann Admin) so am
// eindeutigsten im Code sichtbar bleibt.
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const istApiPfad = request.nextUrl.pathname.startsWith("/api/");

  if (!(await istGueltigesSessionToken(token))) {
    // API-Routen bekommen bei fehlendem/ungültigem Login bewusst einen 401 statt einer
    // Redirect-Response: Ein fetch() gegen z.B. /api/onoffice folgt Redirects unsichtbar und
    // würde anschließend versuchen, das HTML der Login-Seite als JSON zu parsen — das äußert
    // sich im Client als kryptischer Parse-Fehler statt als erkennbares "nicht angemeldet".
    if (istApiPfad) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("von", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Zweite, separate Sperre für den Admin-Bereich: /admin/login und /api/admin-login selbst
  // bleiben ausgenommen (sonst könnte niemand das zweite Passwort überhaupt eingeben) — beide
  // verlangen aber weiterhin die App-weite Anmeldung oben, da sie nicht im matcher unten
  // ausgeschlossen sind. Nur wer BEIDE Cookies besitzt, kommt in den eigentlichen Admin-Bereich.
  const istAdminSeite =
    request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.pathname !== "/admin/login";
  const istAdminApiPfad =
    request.nextUrl.pathname.startsWith("/api/admin") && request.nextUrl.pathname !== "/api/admin-login";

  if (istAdminSeite || istAdminApiPfad) {
    const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!(await istGueltigesAdminSessionToken(adminToken))) {
      if (istApiPfad) {
        return NextResponse.json({ error: "Admin-Anmeldung erforderlich" }, { status: 401 });
      }
      const adminLoginUrl = new URL("/admin/login", request.url);
      adminLoginUrl.searchParams.set("von", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Statische Assets (_next, Logos, Standort-Fotos, Demo-Dokumente, favicon) sowie /login und
  // /api/login selbst laufen bewusst NICHT durch die Middleware — Logos/Dokumente werden auch
  // auf der Login-Seite gebraucht, bevor überhaupt ein Session-Cookie existiert. "standorte"
  // (Fotos der Büro-Standorte, siehe data/unternehmen.ts) muss ebenfalls ausgenommen werden:
  // sonst leitet die Middleware next/image's internen Abruf der Bilddatei auf /login um, und
  // der Bildoptimierer bekommt HTML statt Bilddaten geliefert ("requested resource isn't a
  // valid image", live beobachtet Juli 2026).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logos|standorte|dokumente|login|api/login).*)"],
};
