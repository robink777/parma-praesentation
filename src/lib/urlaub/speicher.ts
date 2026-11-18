import { promises as fs } from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import { UrlaubsWarnung } from "./typen";

// Gedächtnis des Urlaubszählers. Anlass (Nutzer-Vorgabe November 2026): "falls ein mitarbeiter
// nachträglich einen urlaubstag löscht will ich einen warnhinweis haben". onOffice liefert
// gelöschte Termine nicht mehr aus, im Protokoll steht nur ihre Nummer (live geprüft) — ob ein
// gelöschter Termin Urlaub war, weiß deshalb nur, wer sich den vorherigen Stand gemerkt hat.
//
// Gespeichert wird EINE kleine JSON-Datei im privaten Vercel-Blob-Speicher (nicht öffentlich
// abrufbar). Ohne BLOB_READ_WRITE_TOKEN (Speicher noch nicht eingerichtet) gibt es keine
// Warnungen; in der lokalen Entwicklung wird stattdessen eine Datei unter .next/cache benutzt.

export interface UrlaubsStand {
  version: 1;
  jahr: number;
  beobachtetSeit: string; // ISO
  aktualisiert: string; // "YYYY-MM-DD HH:mm:ss" Berliner Zeit (für die Protokollabfrage)
  // Name → Datum → [Anteil, Termin-ID, Betreff]
  tage: Record<string, Record<string, [number, number, string]>>;
  warnungen: UrlaubsWarnung[];
}

const BLOB_PFAD = "urlaub/stand.json";
const LOKALE_DATEI = path.join(process.cwd(), ".next", "cache", "urlaub-stand.json");

export function speicherEingerichtet(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN) || process.env.NODE_ENV === "development";
}

export async function leseStand(): Promise<{ stand: UrlaubsStand | null; etag?: string }> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const ergebnis = await get(BLOB_PFAD, { access: "private", useCache: false });
    if (!ergebnis || !ergebnis.stream) return { stand: null };
    const text = await new Response(ergebnis.stream).text();
    return { stand: JSON.parse(text) as UrlaubsStand, etag: ergebnis.blob.etag };
  }
  if (process.env.NODE_ENV === "development") {
    try {
      return { stand: JSON.parse(await fs.readFile(LOKALE_DATEI, "utf8")) as UrlaubsStand };
    } catch {
      return { stand: null };
    }
  }
  return { stand: null };
}

// ifMatch verhindert, dass zwei gleichzeitig geöffnete Admin-Fenster sich gegenseitig
// überschreiben. Schlägt die Bedingung fehl, wird nicht gespeichert; der nächste Aufruf gleicht
// erneut ab.
export async function schreibeStand(stand: UrlaubsStand, etag?: string): Promise<void> {
  const inhalt = JSON.stringify(stand);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(BLOB_PFAD, inhalt, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
      ...(etag ? { ifMatch: etag } : {}),
    });
    return;
  }
  if (process.env.NODE_ENV === "development") {
    await fs.mkdir(path.dirname(LOKALE_DATEI), { recursive: true });
    await fs.writeFile(LOKALE_DATEI, inhalt);
  }
}
