import { berlinDatumIso, berlinDatumZeit } from "@/lib/zeitzone";
import { kurzzeitCache, kurzzeitCacheVerwerfen } from "@/lib/kurzzeitCache";
import { baueUrlaubsKonten, ladeKalenderProtokoll, ladeUrlaubsRohdaten, UrlaubsRohdaten } from "@/lib/onoffice/urlaub";
import { leseStand, schreibeStand, speicherEingerichtet, UrlaubsStand } from "./speicher";
import { UrlaubsUebersicht, UrlaubsWarnung } from "./typen";

// Urlaubszähler + Lösch-Warnung für den Admin-Bereich. Ablauf bei jedem Öffnen (höchstens alle
// 45 s, siehe kurzzeitCache):
// 1. Urlaubstage des Jahres frisch aus onOffice laden.
// 2. Mit dem gespeicherten Stand vergleichen: Jeder Tag, der vorher da war und jetzt fehlt (oder
//    von ganz auf halb geschrumpft ist), wird eine Warnung — egal ob der Termin gelöscht, verkürzt,
//    verschoben oder auf eine andere Terminart umgestellt wurde.
// 3. Wer/wann aus dem onOffice-Protokoll ergänzen und den neuen Stand speichern.
// Warnungen bleiben, bis sie im Admin-Bereich als gesehen markiert werden.
//
// Grenze: Erkannt wird nur, was zwischen zwei Abgleichen verschwindet. Ein Urlaubstag, der
// eingetragen und wieder gelöscht wird, ohne dass dazwischen jemand den Admin-Bereich öffnet,
// fällt nicht auf.

const CACHE_SCHLUESSEL = "urlaub-uebersicht";
const CACHE_MS = 45_000;

function standAusRoh(roh: UrlaubsRohdaten): UrlaubsStand["tage"] {
  const tage: UrlaubsStand["tage"] = {};
  for (const [name, nachDatum] of Object.entries(roh.tage)) {
    tage[name] = {};
    for (const t of Object.values(nachDatum)) tage[name][t.datum] = [t.anteil, t.terminId, t.betreff];
  }
  return tage;
}

function gleich(a: UrlaubsStand["tage"], b: UrlaubsStand["tage"]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function abgleichen(roh: UrlaubsRohdaten, jahr: number): Promise<{ warnungen: UrlaubsWarnung[]; beobachtetSeit?: string }> {
  const jetzt = new Date();
  const jetztBerlin = berlinDatumZeit(jetzt);
  const heute = berlinDatumIso(jetzt);
  const neueTage = standAusRoh(roh);
  const { stand, etag } = await leseStand();

  // Erster Lauf oder neues Jahr: aktuellen Stand als Ausgangspunkt merken, offene Warnungen
  // des Vorjahres behalten.
  if (!stand || stand.jahr !== jahr) {
    const neu: UrlaubsStand = {
      version: 1,
      jahr,
      beobachtetSeit: jetzt.toISOString(),
      aktualisiert: jetztBerlin,
      tage: neueTage,
      warnungen: (stand?.warnungen ?? []).filter((w) => !w.quittiertAm),
    };
    await schreibeStand(neu, etag);
    return { warnungen: neu.warnungen, beobachtetSeit: neu.beobachtetSeit };
  }

  const fehlend: Omit<UrlaubsWarnung, "geaendertVon" | "geaendertAm">[] = [];
  for (const [name, alteTage] of Object.entries(stand.tage)) {
    const jetztTage = neueTage[name] ?? {};
    for (const [datum, [anteil, terminId, betreff]] of Object.entries(alteTage)) {
      const neuAnteil = jetztTage[datum]?.[0] ?? 0;
      if (neuAnteil >= anteil) continue;
      const schluessel = `${name}|${datum}|${terminId}`;
      if (stand.warnungen.some((w) => w.schluessel === schluessel && !w.quittiertAm)) continue;
      fehlend.push({
        schluessel,
        name,
        datum,
        anteil: anteil - neuAnteil,
        terminId,
        betreff,
        grund: roh.terminIds.has(terminId) ? "geaendert" : "geloescht",
        vergangen: datum <= heute,
        erkanntAm: jetzt.toISOString(),
      });
    }
  }

  let neueWarnungen: UrlaubsWarnung[] = fehlend;
  if (fehlend.length > 0) {
    // Eine Minute Puffer vor dem letzten Abgleich, damit keine Änderung durchrutscht. Beide Zeiten
    // sind Berliner Ortszeit; gerechnet wird nur auf dem Text, ohne Zeitzonenumrechnung.
    const d = new Date(`${stand.aktualisiert.replace(" ", "T")}Z`);
    d.setUTCMinutes(d.getUTCMinutes() - 1);
    const seit = d.toISOString().slice(0, 19).replace("T", " ");
    const protokoll = await ladeKalenderProtokoll(seit).catch(() => new Map());
    neueWarnungen = fehlend.map((w) => {
      const eintrag = protokoll.get(w.terminId);
      return eintrag ? { ...w, geaendertVon: eintrag.nutzer, geaendertAm: eintrag.zeit } : w;
    });
  }

  const warnungen = [...stand.warnungen, ...neueWarnungen];
  if (neueWarnungen.length > 0 || !gleich(stand.tage, neueTage)) {
    await schreibeStand({ ...stand, aktualisiert: jetztBerlin, tage: neueTage, warnungen }, etag).catch((error) => {
      // Gleichzeitiger Schreibversuch eines zweiten Fensters (ifMatch) — der nächste Aufruf
      // gleicht erneut ab. Die erkannten Warnungen trotzdem jetzt schon anzeigen.
      console.warn("Urlaubsstand nicht gespeichert:", error);
    });
  }
  return { warnungen: warnungen.filter((w) => !w.quittiertAm), beobachtetSeit: stand.beobachtetSeit };
}

async function ladeFrisch(): Promise<UrlaubsUebersicht> {
  const jahr = Number(berlinDatumIso(new Date()).slice(0, 4));
  const roh = await ladeUrlaubsRohdaten(jahr);
  const konten = baueUrlaubsKonten(roh);
  if (!speicherEingerichtet()) {
    return { jahr, konten, warnungen: [], warnungenAktiv: false };
  }
  try {
    const { warnungen, beobachtetSeit } = await abgleichen(roh, jahr);
    return { jahr, konten, warnungen, warnungenAktiv: true, beobachtetSeit };
  } catch (error) {
    console.error("Urlaubs-Abgleich fehlgeschlagen:", error);
    return { jahr, konten, warnungen: [], warnungenAktiv: false };
  }
}

export function ladeUrlaubsUebersicht(): Promise<UrlaubsUebersicht> {
  return kurzzeitCache(CACHE_SCHLUESSEL, CACHE_MS, ladeFrisch);
}

// "Gesehen" im Admin-Bereich: Warnung bleibt im Speicher (Nachweis), wird aber nicht mehr gezeigt.
export async function quittiereUrlaubsWarnung(schluessel: string): Promise<boolean> {
  const { stand, etag } = await leseStand();
  if (!stand) return false;
  const warnung = stand.warnungen.find((w) => w.schluessel === schluessel && !w.quittiertAm);
  if (!warnung) return false;
  warnung.quittiertAm = new Date().toISOString();
  await schreibeStand(stand, etag);
  kurzzeitCacheVerwerfen(CACHE_SCHLUESSEL);
  return true;
}
