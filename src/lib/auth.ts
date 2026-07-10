// Einfache, kontenlose Zugriffssperre für die gesamte App (siehe middleware.ts) — EIN
// gemeinsames Passwort (Umgebungsvariable APP_PASSWORD), kein Nutzer-/Account-System. Nach
// erfolgreichem Login (siehe app/login/page.tsx, app/api/login/route.ts) wird ein signiertes,
// zeitlich befristetes Session-Cookie gesetzt; die Middleware prüft bei jedem Request nur
// dessen Signatur und Ablaufdatum — es gibt keine serverseitige Session-Ablage/Datenbank.
//
// Web Crypto (crypto.subtle) statt Node's "crypto"-Modul, damit derselbe Code sowohl in der
// Middleware (läuft zwingend im Edge-Runtime, kein Zugriff auf Node-Module) als auch in der
// Login-Route (Node-Runtime) funktioniert — Node 20 stellt crypto.subtle ebenfalls global
// bereit, ein Import ist nicht nötig.

export const SESSION_COOKIE_NAME = "parma_session";
export const SESSION_MAX_AGE_SEKUNDEN = 60 * 60 * 24 * 60; // 60 Tage

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET ist nicht gesetzt (siehe .env.local bzw. die Umgebungsvariablen in Vercel)."
    );
  }
  return secret;
}

async function hmac(nachricht: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatur = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(nachricht));
  return Array.from(new Uint8Array(signatur))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Zeitkonstanter String-Vergleich — verhindert Timing-Angriffe sowohl beim Passwort- als auch
// beim Signaturvergleich. Ein naiver "==="/"!=="-Vergleich bricht bei der ersten abweichenden
// Stelle ab; über die minimal unterschiedliche Antwortzeit ließe sich dadurch theoretisch
// erraten, wie viele Zeichen bereits korrekt sind.
function zeitkonstantGleich(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let unterschied = 0;
  for (let i = 0; i < a.length; i++) {
    unterschied |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return unterschied === 0;
}

export function passwortIstKorrekt(eingabe: string): boolean {
  const erwartet = process.env.APP_PASSWORD;
  if (!erwartet) {
    throw new Error(
      "APP_PASSWORD ist nicht gesetzt (siehe .env.local bzw. die Umgebungsvariablen in Vercel)."
    );
  }
  return zeitkonstantGleich(eingabe, erwartet);
}

// Erzeugt ein neues, 60 Tage gültiges Session-Token: "<ablaufZeitstempel>.<hmacSignatur>".
// Bewusst kein zufälliges/opaques Token mit serverseitigem Nachschlagen (das würde eine
// Session-Ablage voraussetzen) — der Ablaufzeitstempel steckt direkt im signierten Wert,
// wodurch die Middleware ihn zustandslos verifizieren kann.
export async function erzeugeSessionToken(): Promise<string> {
  const ablauf = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEKUNDEN;
  const signatur = await hmac(`parma-session:${ablauf}`);
  return `${ablauf}.${signatur}`;
}

export async function istGueltigesSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [ablaufStr, signatur] = token.split(".");
  const ablauf = Number(ablaufStr);
  if (!ablaufStr || !signatur || !Number.isFinite(ablauf)) return false;
  if (ablauf < Math.floor(Date.now() / 1000)) return false;

  const erwarteteSignatur = await hmac(`parma-session:${ablauf}`);
  return zeitkonstantGleich(signatur, erwarteteSignatur);
}

// Zweite, unabhängige Zugriffssperre für den Admin-Bereich (Mitarbeiterstatistik, siehe
// app/admin/*) — bewusst ein GANZ EIGENES Passwort (Umgebungsvariable ADMIN_PASSWORD) und ein
// eigenes Session-Cookie, damit nicht jede Person mit App-weitem Zugriff (siehe oben) automatisch
// auch die Auslastungs-/Mitarbeiterstatistik sehen kann. Middleware verlangt für /admin-Pfade
// BEIDE Cookies gleichzeitig (siehe middleware.ts) — dieses hier kommt zusätzlich zur
// App-weiten Anmeldung oben, nicht statt ihr.
//
// Technisch exakt dasselbe Schema wie beim App-weiten Session-Token oben (signierter
// Ablaufzeitstempel, keine Server-Session-Ablage) — nur mit eigenem Cookie-Namen und eigenem
// HMAC-Nachrichten-Präfix ("parma-admin-session:" statt "parma-session:"), damit ein App-weites
// Token nicht versehentlich auch als gültiges Admin-Token durchgeht (und umgekehrt). Der
// AUTH_SECRET wird bewusst wiederverwendet — er ist ohnehin nur zum Signieren da, ein zweites
// Secret bringt keinen zusätzlichen Schutz, solange die Nachrichten-Präfixe unterschiedlich sind.
export const ADMIN_SESSION_COOKIE_NAME = "parma_admin_session";
export const ADMIN_SESSION_MAX_AGE_SEKUNDEN = 60 * 60 * 8; // 8 Stunden — bewusst kürzer als die
// 60 Tage der App-weiten Session: Der Admin-Bereich zeigt Auslastungsdaten einzelner
// Mitarbeiter/innen, ein kurzlebigeres Cookie verringert das Risiko eines liegen gelassenen,
// weiterhin gültigen Zugriffs auf einem gemeinsam genutzten Rechner.

export function adminPasswortIstKorrekt(eingabe: string): boolean {
  const erwartet = process.env.ADMIN_PASSWORD;
  if (!erwartet) {
    throw new Error(
      "ADMIN_PASSWORD ist nicht gesetzt (siehe .env.local bzw. die Umgebungsvariablen in Vercel)."
    );
  }
  return zeitkonstantGleich(eingabe, erwartet);
}

export async function erzeugeAdminSessionToken(): Promise<string> {
  const ablauf = Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SEKUNDEN;
  const signatur = await hmac(`parma-admin-session:${ablauf}`);
  return `${ablauf}.${signatur}`;
}

export async function istGueltigesAdminSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [ablaufStr, signatur] = token.split(".");
  const ablauf = Number(ablaufStr);
  if (!ablaufStr || !signatur || !Number.isFinite(ablauf)) return false;
  if (ablauf < Math.floor(Date.now() / 1000)) return false;

  const erwarteteSignatur = await hmac(`parma-admin-session:${ablauf}`);
  return zeitkonstantGleich(signatur, erwarteteSignatur);
}
