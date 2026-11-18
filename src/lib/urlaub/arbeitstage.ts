// Arbeitstage-Logik für den Urlaubszähler (Nutzer-Vorgabe November 2026: "die haben alle 25 tage
// urlaub. Kannst du einen counter einbauen der die urlaubstage zählt"). Reine Datumsrechnung ohne
// onOffice-Zugriff, damit sie sich isoliert prüfen lässt.
//
// Ein Urlaubstag zählt nur an Arbeitstagen: Montag bis Freitag, ohne die gesetzlichen Feiertage
// in Nordrhein-Westfalen (alle Standorte liegen im Kreis Düren). Heiligabend und Silvester sind
// keine gesetzlichen Feiertage und zählen deshalb normal.

function isoDatum(jahr: number, monat: number, tag: number): string {
  return `${jahr}-${String(monat).padStart(2, "0")}-${String(tag).padStart(2, "0")}`;
}

// Gaußsche Osterformel (gregorianisch, Variante nach Lichtenberg).
function ostersonntag(jahr: number): { monat: number; tag: number } {
  const a = jahr % 19;
  const b = Math.floor(jahr / 100);
  const c = jahr % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31);
  const tag = ((h + l - 7 * m + 114) % 31) + 1;
  return { monat, tag };
}

function verschiebeIso(iso: string, tage: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + tage);
  return d.toISOString().slice(0, 10);
}

const feiertagsCache = new Map<number, Map<string, string>>();

// Gesetzliche Feiertage NRW, Datum → Name.
export function feiertageNrw(jahr: number): Map<string, string> {
  const vorhanden = feiertagsCache.get(jahr);
  if (vorhanden) return vorhanden;
  const ostern = ostersonntag(jahr);
  const o = isoDatum(jahr, ostern.monat, ostern.tag);
  const feiertage = new Map<string, string>([
    [isoDatum(jahr, 1, 1), "Neujahr"],
    [verschiebeIso(o, -2), "Karfreitag"],
    [verschiebeIso(o, 1), "Ostermontag"],
    [isoDatum(jahr, 5, 1), "Tag der Arbeit"],
    [verschiebeIso(o, 39), "Christi Himmelfahrt"],
    [verschiebeIso(o, 50), "Pfingstmontag"],
    [verschiebeIso(o, 60), "Fronleichnam"],
    [isoDatum(jahr, 10, 3), "Tag der Deutschen Einheit"],
    [isoDatum(jahr, 11, 1), "Allerheiligen"],
    [isoDatum(jahr, 12, 25), "1. Weihnachtstag"],
    [isoDatum(jahr, 12, 26), "2. Weihnachtstag"],
  ]);
  feiertagsCache.set(jahr, feiertage);
  return feiertage;
}

export function istArbeitstag(iso: string): boolean {
  const wochentag = new Date(`${iso}T12:00:00Z`).getUTCDay();
  if (wochentag === 0 || wochentag === 6) return false;
  return !feiertageNrw(Number(iso.slice(0, 4))).has(iso);
}

// Alle Kalendertage von `von` bis `bis` (jeweils "YYYY-MM-DD", inklusive).
export function tageZwischen(von: string, bis: string): string[] {
  const tage: string[] = [];
  for (let tag = von; tag <= bis; tag = verschiebeIso(tag, 1)) tage.push(tag);
  return tage;
}

export { verschiebeIso };

// Bezugszeit eines Arbeitstags für Teil-Tage: 8 bis 17 Uhr.
const ARBEITSBEGINN_MIN = 8 * 60;
const ARBEITSENDE_MIN = 17 * 60;

function minutenAmTag(zeit: string): number {
  // "HH:mm:ss" → Minuten seit Mitternacht
  const [h, m] = zeit.split(":").map(Number);
  return h * 60 + (m || 0);
}

// Wie viel eines Urlaubstags ein Termin an `tag` abdeckt: 1 (ganzer Tag), 0,5 (halber Tag) oder 0.
// - Ganztägige Termine zählen voll.
// - Sonst zählt die Überschneidung mit 8–17 Uhr: ab 6 Stunden ein ganzer Tag, ab 2 Stunden ein
//   halber Tag, darunter nichts. Damit zählt ein Ende kurz nach Mitternacht (z. B. "bis 00:30" am
//   Rückreisetag, live mehrfach so eingetragen) nicht als weiterer Urlaubstag, "frei ab mittags"
//   (13–20 Uhr) dagegen als halber Tag.
export function tagesAnteil(
  tag: string,
  startDt: string,
  endDt: string,
  ganztags: boolean
): number {
  if (ganztags) return 1;
  const startTag = startDt.slice(0, 10);
  const endTag = endDt.slice(0, 10);
  const von = tag === startTag ? minutenAmTag(startDt.slice(11)) : 0;
  const bis = tag === endTag ? minutenAmTag(endDt.slice(11)) : 24 * 60;
  const ueberschneidung = Math.max(0, Math.min(bis, ARBEITSENDE_MIN) - Math.max(von, ARBEITSBEGINN_MIN));
  if (ueberschneidung >= 6 * 60) return 1;
  if (ueberschneidung >= 2 * 60) return 0.5;
  return 0;
}
