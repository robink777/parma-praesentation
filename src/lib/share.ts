import { erzeugeShareSignatur, shareSignaturIstGueltig } from "./auth";
import { NavZustandEintrag } from "@/components/layout/nav";
import { LeistungspaketId, MaklervertragDaten } from "@/types";

// Konfiguration, die eine geteilte Präsentation festhält (Chat-Vorgabe September 2026: "Die
// geteilte Präsentation müsste unveränderbar sein") — genau die Auswahl, die der Berater/die
// Beraterin im Vorbereitungsmodus getroffen hat (siehe Vorbereitungsmodus.tsx), plus die
// Objekt-Referenz, über die die eigentlichen Präsentationsdaten weiterhin live aus onOffice
// geladen werden (siehe lib/praesentation.ts, ladePraesentationsDaten — bewusst kein
// vollständiger Datensatz-Snapshot, nur diese Auswahl-Konfiguration, siehe app/geteilt/page.tsx).
export interface PraesentationConfig {
  estateId: string;
  addressId?: string;
  referenzobjektIds: string[];
  navZustand: NavZustandEintrag[];
  gewaehltesPaket?: LeistungspaketId;
  // Die im Maklervertrag-Formular erfassten/bearbeiteten Vertragsdaten (siehe Maklervertrag.tsx,
  // PraesentationApp.tsx) — ohne dieses Feld würde der geteilte Link beim Laden erneut die
  // automatischen Standardwerte erzeugen (baueInitialdaten) und dabei jede manuelle Anpassung
  // aus dem Beratungstermin verlieren (z.B. eingetragene Mängel, individuelle Vereinbarungen).
  maklervertragDaten?: MaklervertragDaten;
}

export function istPraesentationConfig(wert: unknown): wert is PraesentationConfig {
  if (!wert || typeof wert !== "object") return false;
  const config = wert as Record<string, unknown>;
  return (
    typeof config.estateId === "string" &&
    Array.isArray(config.referenzobjektIds) &&
    config.referenzobjektIds.every((id) => typeof id === "string") &&
    Array.isArray(config.navZustand) &&
    config.navZustand.every(
      (e) =>
        e &&
        typeof e === "object" &&
        typeof (e as NavZustandEintrag).id === "string" &&
        typeof (e as NavZustandEintrag).sichtbar === "boolean"
    ) &&
    // maklervertragDaten nur grob (Objekt oder fehlend) geprüft, nicht feldweise — die Signatur
    // (siehe pruefeShareParameter) stellt bereits sicher, dass die Konfiguration unverändert von
    // /api/share stammt, eine erfundene/manipulierte Payload würde die Signaturprüfung davor
    // schon verwerfen.
    (config.maklervertragDaten === undefined || typeof config.maklervertragDaten === "object")
  );
}

// Base64url statt normalem Base64 — "+"/"/" müssten sonst in der URL prozentkodiert werden,
// Base64url (RFC 4648 §5, "-"/"_" statt "+"/"/", kein Padding) ist direkt URL-sicher. Node
// unterstützt "base64url" als Encoding-Name seit v15, hier auf Node-Runtime beschränkt
// (siehe API-Routen/app/geteilt/page.tsx, jeweils runtime="nodejs" bzw. Server Component ohne
// Edge-Zwang — anders als middleware.ts, die diese Funktionen deshalb bewusst NICHT nutzt).
function kodiere(config: PraesentationConfig): string {
  return Buffer.from(JSON.stringify(config), "utf-8").toString("base64url");
}

function dekodiere(d: string): PraesentationConfig | null {
  try {
    const wert = JSON.parse(Buffer.from(d, "base64url").toString("utf-8"));
    return istPraesentationConfig(wert) ? wert : null;
  } catch {
    return null;
  }
}

// Baut den vollständigen, signierten Share-Link (siehe "Präsentation teilen" in
// Maklervertrag.tsx / /api/share/route.ts).
export async function erstelleShareLink(basisUrl: string, config: PraesentationConfig): Promise<string> {
  const d = kodiere(config);
  const sig = await erzeugeShareSignatur(d);
  const url = new URL("/geteilt", basisUrl);
  url.searchParams.set("d", d);
  url.searchParams.set("sig", sig);
  return url.toString();
}

// Prüft ein d/sig-Paar (aus der URL eines geteilten Links, siehe app/geteilt/page.tsx und die
// /api/pdf/*-Routen) und liefert bei gültiger Signatur die enthaltene Konfiguration zurück —
// null bei fehlenden, manipulierten oder unlesbaren Parametern, ohne weitere Fehlermeldung
// (der Aufrufer entscheidet, wie er "kein gültiger Share-Zugriff" behandelt).
export async function pruefeShareParameter(
  d: string | null,
  sig: string | null
): Promise<PraesentationConfig | null> {
  if (!d || !(await shareSignaturIstGueltig(d, sig))) return null;
  return dekodiere(d);
}
