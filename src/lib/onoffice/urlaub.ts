import { TEAM } from "@/data/unternehmen";
import { callOnOfficeApi } from "./client";
import { berlinDatumIso } from "@/lib/zeitzone";
import { istArbeitstag, tageZwischen, tagesAnteil, verschiebeIso } from "@/lib/urlaub/arbeitstage";
import {
  URLAUBSANSPRUCH_ABWEICHUNGEN,
  URLAUBSANSPRUCH_TAGE,
  UrlaubsKonto,
  UrlaubsTag,
  UrlaubsVerdacht,
} from "@/lib/urlaub/typen";

// Urlaub aus dem onOffice-Kalender (Nutzer-Vorgabe November 2026). Grundlage ist ausschließlich
// die Terminart "Urlaub" — onOffice bleibt die Datenquelle. Live geprüft am 18.11.2026: 60
// Urlaubs-Termine für 2026, dazu einige Einträge mit "Urlaub" im Betreff, aber ohne oder mit
// anderer Terminart (z. B. Vanessa Krifft 09.–20.05., Jacqueline Henot 23.01.). Die zählen nicht,
// sondern erscheinen als "Terminart prüfen", damit sie in onOffice korrigiert werden.

export interface KalenderTermin {
  id: number;
  start_dt: string;
  end_dt: string;
  description: string;
  art: string;
  ganztags: boolean;
  user_ids: number[];
  rp_flag: boolean;
  rp_type?: string;
  rp_tage?: number;
  rp_beginn_datum?: string;
  rp_ende_datum?: string;
  rp_exception: string[];
}

interface KalenderElemente {
  start_dt?: string;
  end_dt?: string;
  description?: string;
  art?: Record<string, string> | string | null;
  ganztags?: boolean;
  user_ids?: number[];
  rp_flag?: boolean;
  rp_type?: string;
  rp_tage?: number;
  rp_beginn_datum?: string;
  rp_ende_datum?: string;
  rp_exception?: string[] | null;
}

function terminartAus(art: KalenderElemente["art"]): string {
  if (!art) return "";
  if (typeof art === "string") return art;
  return Object.keys(art)[0] ?? "";
}

const TEAM_NUTZER = TEAM.filter((m) => m.nutzerNr).map((m) => ({ name: m.name, nr: Number(m.nutzerNr) }));

async function ladeKalender(jahr: number, filter: Record<string, unknown>): Promise<KalenderTermin[]> {
  const termine: KalenderTermin[] = [];
  for (let offset = 0; offset < 5000; offset += 500) {
    const result = await callOnOfficeApi<{ id: number; elements: KalenderElemente }>([
      {
        actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
        resourcetype: "calendar",
        resourceid: "",
        identifier: "",
        cacheable: false,
        parameters: {
          // datestart/dateend/users als eigene Parameter (siehe zaehleTermine in estate.ts).
          // Serientermine liefert onOffice einmal mit ihrem ersten Datum, die Wiederholung steht
          // in rp_* (live geprüft: rp_type "t" = täglich, rp_tage = Abstand, rp_exception =
          // ausgelassene Tage).
          datestart: `${jahr - 1}-12-01 00:00:00`,
          dateend: `${jahr}-12-31 23:59:59`,
          users: TEAM_NUTZER.map((n) => n.nr),
          listlimit: 500,
          listoffset: offset,
          filter,
        },
      },
    ]);
    const records = result?.response?.results?.[0]?.data?.records ?? [];
    for (const r of records) {
      const e = r.elements;
      if (!e.start_dt || !e.end_dt) continue;
      termine.push({
        id: Number(r.id),
        start_dt: e.start_dt,
        end_dt: e.end_dt,
        description: e.description ?? "",
        art: terminartAus(e.art),
        ganztags: Boolean(e.ganztags),
        user_ids: (e.user_ids ?? []).map(Number),
        rp_flag: Boolean(e.rp_flag),
        rp_type: e.rp_type,
        rp_tage: e.rp_tage,
        rp_beginn_datum: e.rp_beginn_datum,
        rp_ende_datum: e.rp_ende_datum,
        rp_exception: e.rp_exception ?? [],
      });
    }
    if (records.length < 500) break;
  }
  return termine;
}

// Alle Tage eines Termins im Jahr mit ihrem Anteil (1 / 0,5), nur Arbeitstage.
export function urlaubsTageAusTermin(t: KalenderTermin, jahr: number): { datum: string; anteil: number }[] {
  const ergebnis: { datum: string; anteil: number }[] = [];
  const jahrVon = `${jahr}-01-01`;
  const jahrBis = `${jahr}-12-31`;

  // Vorkommen: bei täglichen Serien jedes rp_tage-te Datum, sonst der Termin selbst.
  const vorkommen: { start: string; ende: string }[] = [];
  if (t.rp_flag && t.rp_type === "t" && t.rp_beginn_datum && t.rp_ende_datum) {
    const abstand = Math.max(1, t.rp_tage ?? 1);
    const dauerTage = tageZwischen(t.start_dt.slice(0, 10), t.end_dt.slice(0, 10)).length - 1;
    const tage = tageZwischen(t.rp_beginn_datum, t.rp_ende_datum);
    tage.forEach((tag, i) => {
      if (i % abstand !== 0 || t.rp_exception.includes(tag)) return;
      vorkommen.push({
        start: `${tag} ${t.start_dt.slice(11)}`,
        ende: `${verschiebeIso(tag, dauerTage)} ${t.end_dt.slice(11)}`,
      });
    });
  } else {
    vorkommen.push({ start: t.start_dt, ende: t.end_dt });
  }

  for (const v of vorkommen) {
    const von = v.start.slice(0, 10) < jahrVon ? jahrVon : v.start.slice(0, 10);
    const bis = v.ende.slice(0, 10) > jahrBis ? jahrBis : v.ende.slice(0, 10);
    if (von > bis) continue;
    for (const tag of tageZwischen(von, bis)) {
      if (!istArbeitstag(tag)) continue;
      const anteil = tagesAnteil(tag, v.start, v.ende, t.ganztags);
      if (anteil > 0) ergebnis.push({ datum: tag, anteil });
    }
  }
  return ergebnis;
}

// Betreffe mit "Urlaub", die KEIN Urlaub sind (Übergaben, Urlaubssperren).
const KEIN_URLAUB = /übergabe|uebergabe|sperre/i;

export interface UrlaubsRohdaten {
  // Name → Datum → Tag (je Datum höchstens ein Eintrag, der größte Anteil gewinnt)
  tage: Record<string, Record<string, UrlaubsTag>>;
  verdacht: Record<string, UrlaubsVerdacht[]>;
  // IDs aller aktuell vorhandenen Urlaubs-Termine (für die Unterscheidung gelöscht / geändert)
  terminIds: Set<number>;
}

export async function ladeUrlaubsRohdaten(jahr: number): Promise<UrlaubsRohdaten> {
  const [urlaub, betreffUrlaub] = await Promise.all([
    ladeKalender(jahr, { art: [{ op: "=", val: "Urlaub" }] }),
    ladeKalender(jahr, { description: [{ op: "like", val: "%rlaub%" }] }),
  ]);

  const tage: UrlaubsRohdaten["tage"] = {};
  const verdacht: UrlaubsRohdaten["verdacht"] = {};
  for (const n of TEAM_NUTZER) {
    tage[n.name] = {};
    verdacht[n.name] = [];
  }

  for (const t of urlaub) {
    const tageImJahr = urlaubsTageAusTermin(t, jahr);
    for (const n of TEAM_NUTZER) {
      if (!t.user_ids.includes(n.nr)) continue;
      for (const { datum, anteil } of tageImJahr) {
        const vorhanden = tage[n.name][datum];
        if (!vorhanden || vorhanden.anteil < anteil) {
          tage[n.name][datum] = { datum, anteil, terminId: t.id, betreff: t.description };
        }
      }
    }
  }

  for (const t of betreffUrlaub) {
    if (t.art === "Urlaub" || KEIN_URLAUB.test(t.description)) continue;
    // Nur Einträge für EINE Person bzw. wenige Personen — Team-Termine (z. B. Übergaben an alle)
    // sind sicher kein Urlaub.
    if (t.user_ids.length > 3) continue;
    const arbeitstage = urlaubsTageAusTermin(t, jahr).reduce((s, x) => s + x.anteil, 0);
    if (arbeitstage === 0) continue;
    for (const n of TEAM_NUTZER) {
      if (!t.user_ids.includes(n.nr)) continue;
      verdacht[n.name].push({
        terminId: t.id,
        von: t.start_dt.slice(0, 10),
        bis: t.rp_flag && t.rp_ende_datum ? t.rp_ende_datum : t.end_dt.slice(0, 10),
        betreff: t.description,
        terminart: t.art || "ohne Terminart",
        arbeitstage,
      });
    }
  }

  return { tage, verdacht, terminIds: new Set(urlaub.map((t) => t.id)) };
}

export function baueUrlaubsKonten(roh: UrlaubsRohdaten, heute = berlinDatumIso(new Date())): Record<string, UrlaubsKonto> {
  const konten: Record<string, UrlaubsKonto> = {};
  for (const [name, tageNachDatum] of Object.entries(roh.tage)) {
    const tage = Object.values(tageNachDatum).sort((a, b) => a.datum.localeCompare(b.datum));
    const genommen = tage.filter((t) => t.datum <= heute).reduce((s, t) => s + t.anteil, 0);
    const geplant = tage.filter((t) => t.datum > heute).reduce((s, t) => s + t.anteil, 0);
    const anspruch = URLAUBSANSPRUCH_ABWEICHUNGEN[name] ?? URLAUBSANSPRUCH_TAGE;
    konten[name] = {
      name,
      anspruch,
      genommen,
      geplant,
      uebrig: anspruch - genommen - geplant,
      tage,
      verdacht: roh.verdacht[name] ?? [],
    };
  }
  return konten;
}

// onOffice-Protokoll: wer hat einen Kalendertermin wann gelöscht/geändert? Das Protokoll lässt
// sich nicht nach Termin-ID filtern (live geprüft: "Missing Mapping for fields resourceId"), wohl
// aber nach Zeitraum und Aktion — deshalb seit dem letzten Abgleich laden und selbst zuordnen.
export async function ladeKalenderProtokoll(
  seit: string
): Promise<Map<number, { aktion: string; nutzer: string; zeit: string }>> {
  const ergebnis = new Map<number, { aktion: string; nutzer: string; zeit: string }>();
  for (let offset = 0; offset < 3000; offset += 500) {
    const result = await callOnOfficeApi<{
      elements: { action?: string; userId?: string; dateTime?: string; resourceId?: string };
    }>([
      {
        actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
        resourcetype: "log",
        resourceid: "",
        identifier: "",
        cacheable: false,
        parameters: {
          data: ["action", "userId", "dateTime", "resourceId"],
          filter: {
            module: [{ op: "=", val: "calendar" }],
            action: [{ op: "IN", val: ["delete", "edit"] }],
            dateTime: [{ op: ">=", val: seit }],
          },
          listlimit: 500,
          listoffset: offset,
        },
      },
    ]);
    const records = result?.response?.results?.[0]?.data?.records ?? [];
    for (const r of records) {
      const e = r.elements;
      const id = Number(e.resourceId);
      if (!id || !e.dateTime) continue;
      const name = TEAM.find((m) => m.nutzerNr === String(e.userId))?.name ?? `Nutzer ${e.userId}`;
      const vorhanden = ergebnis.get(id);
      // Löschen schlägt Ändern, sonst gewinnt der jüngste Eintrag.
      if (!vorhanden || e.action === "delete" || (vorhanden.aktion !== "delete" && e.dateTime > vorhanden.zeit)) {
        ergebnis.set(id, { aktion: e.action ?? "", nutzer: name, zeit: e.dateTime });
      }
    }
    if (records.length < 500) break;
  }
  return ergebnis;
}
