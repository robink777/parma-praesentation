// Steuert, ob echte OnOffice-Daten oder Demo-/Mock-Daten verwendet werden.
// .env.local enthält bisher nur Platzhalter (DEIN_API_TOKEN_HIER / DEIN_API_SECRET_HIER),
// keine echten Zugangsdaten. Sobald echter Token + Secret aus dem OnOffice-Backend
// (Einstellungen > Schnittstellen/API) eingetragen sind, ONOFFICE_MODE=live setzen.
export const ONOFFICE_MODE: "live" | "mock" =
  process.env.ONOFFICE_MODE === "live" ? "live" : "mock";

export const ONOFFICE_API_URL =
  process.env.ONOFFICE_API_URL || "https://api.onoffice.de/api/latest/api.php";
export const ONOFFICE_TOKEN = process.env.ONOFFICE_TOKEN || "";
export const ONOFFICE_SECRET = process.env.ONOFFICE_SECRET || "";
