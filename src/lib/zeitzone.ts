// Zeitzonensichere "heute"/"jetzt"-Berechnung für Europe/Berlin — unabhängig davon, in welcher
// Zeitzone der ausführende Prozess selbst läuft.
//
// Live-Diagnose November 2026 (Nutzer-Meldung: "Die zahlen scheinen nicht richtig erkannt zu
// werden ... es sind speziell die telefonate bei den mitarbeitern ... Kann es ein Cache Problem
// oder so sein?"): War KEIN Cache-Problem (x-vercel-cache: MISS, age: 0, mehrfach live bestätigt)
// — ein zeitgleicher direkter Abruf gegen onOffice lieferte z.B. für Kira Woldt "7 Telefonate
// heute", die Produktionsseite zeigte stabil "4". Ursache: Date.prototype.getHours()/
// getFullYear()/getDate()/setHours() & Co. liefern IMMER die Zeitzone des AUSFÜHRENDEN PROZESSES,
// nicht zwingend Europe/Berlin. Vercel führt Serverless Functions standardmäßig in UTC aus (ohne
// eine TZ-Umgebungsvariable, die dieses Projekt nirgends setzt), während diese lokale
// Entwicklungsumgebung zufällig in Europe/Berlin läuft (live geprüft:
// Intl.DateTimeFormat().resolvedOptions().timeZone === "Europe/Berlin") — der Fehler war dadurch
// lokal unsichtbar und zeigte sich nur live in Produktion. Aktuell (November, CET) macht das
// einen Versatz von 1 Stunde: Die obere Fenstergrenze für "heute"/"jetzt" lag in Produktion
// dadurch systematisch rund eine Stunde zu früh, neuere Anrufe/Termine wurden nicht mitgezählt —
// exakt das gemeldete Symptom, bei JEDEM "heute"/"jetzt"-Wert in der App (Telefonate, Termine,
// Wettkampf-Punkte, Neuzugänge-Tagesfenster), nicht nur bei Telefonaten.
//
// Dieses Modul ersetzt die bisherigen, pro Datei duplizierten formatiereDatumZeit/
// formatiereDatumIso/formatiereDatumZeitVoll-Helfer (wettkampf.ts, mitarbeiterstatistik.ts,
// estate.ts) durch EINE gemeinsame, nachweislich zeitzonenfeste Implementierung.
const BERLIN_ZEITZONE = "Europe/Berlin";

interface BerlinKomponenten {
  jahr: string;
  monat: string;
  tag: string;
  stunde: string;
  minute: string;
  sekunde: string;
}

// Zerlegt ein Date-Objekt (ein zeitzonenunabhängiger absoluter Zeitpunkt) in seine
// Europe/Berlin-lokalen Kalender-/Uhrzeit-Bestandteile. Intl.DateTimeFormat mit explizitem
// timeZone ist dafür der einzige verlässliche Weg, der NICHT von der Prozess-Zeitzone abhängt.
function berlinKomponenten(datum: Date): BerlinKomponenten {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BERLIN_ZEITZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const teile = Object.fromEntries(formatter.formatToParts(datum).map((t) => [t.type, t.value]));
  // hour12:false liefert bei exakt Mitternacht in manchen Implementierungen "24" statt "00".
  const stunde = teile.hour === "24" ? "00" : teile.hour;
  return {
    jahr: teile.year,
    monat: teile.month,
    tag: teile.day,
    stunde,
    minute: teile.minute,
    sekunde: teile.second,
  };
}

// "YYYY-MM-DD" in Europe/Berlin — Ersatz für das bisherige formatiereDatumIso (date.getFullYear()
// & Co.), das die Prozess-Zeitzone statt Berlin verwendete.
export function berlinDatumIso(datum: Date): string {
  const { jahr, monat, tag } = berlinKomponenten(datum);
  return `${jahr}-${monat}-${tag}`;
}

// "YYYY-MM-DD HH:mm:ss" in Europe/Berlin — mit optional fester Uhrzeit (z.B. "00:00:00"/
// "23:59:59" für Tagesanfang/-ende) oder, ohne zweites Argument, der ECHTEN aktuellen Berliner
// Uhrzeit von `datum` (Ersatz für formatiereDatumZeitVoll).
export function berlinDatumZeit(datum: Date, uhrzeit?: string): string {
  const { jahr, monat, tag, stunde, minute, sekunde } = berlinKomponenten(datum);
  return `${jahr}-${monat}-${tag} ${uhrzeit ?? `${stunde}:${minute}:${sekunde}`}`;
}

// Date-Objekt für Mitternacht (00:00:00) Europe/Berlin des Kalendertags von `datum`, optional um
// `tageVersatz` Tage verschoben — Ersatz für `neuesDate.setHours(0,0,0,0)` bzw.
// `new Date(jahr, monat, tag)`, die beide Mitternacht in der PROZESS-Zeitzone liefern, nicht
// zwingend Berlin. Ermittelt den Berlin-UTC-Versatz (1h CET / 2h CEST) dynamisch über das Datum
// selbst, dadurch automatisch korrekt über Zeitumstellungen hinweg.
export function berlinMitternacht(datum: Date, tageVersatz = 0): Date {
  const { jahr, monat, tag } = berlinKomponenten(datum);
  const kandidat = new Date(Date.UTC(Number(jahr), Number(monat) - 1, Number(tag) + tageVersatz));
  const versatzStunden = Number(berlinKomponenten(kandidat).stunde);
  return new Date(kandidat.getTime() - versatzStunden * 60 * 60 * 1000);
}

// Wie berlinMitternacht, aber direkt aus Jahr/Monat(0-basiert)/Tag gebaut — für feste
// Kalenderdaten wie den Wettkampf-Saisonstart (siehe ERSTE_SAISON_START in onoffice/wettkampf.ts),
// die nicht von einem bestehenden Date-Objekt abgeleitet werden.
export function berlinMitternachtVon(jahr: number, monatIndex0: number, tag: number): Date {
  return berlinMitternacht(new Date(Date.UTC(jahr, monatIndex0, tag)));
}

// Montag 00:00 Europe/Berlin der Kalenderwoche von `datum` (Mo-So-Woche) — Date.getDay() liefert
// den Wochentag in Prozess-Zeitzone, deshalb wird der Wochentag hier stattdessen rein aus den
// Berlin-Kalenderkomponenten (jahr/monat/tag) bestimmt: new Date(Date.UTC(jahr, monat-1, tag))
// zeigt exakt auf UTC-Mitternacht DIESES Kalendertags, dessen Wochentag unabhängig von jeder
// Zeitzonen-Verschiebung ist (reine Kalenderrechnung) — anders als bei berlinMitternacht() selbst,
// deren Rückgabewert je nach Jahreszeit auf den UTC-Abend des VORTAGS fallen kann und dessen
// .getUTCDay() deshalb den falschen (vorherigen) Wochentag liefern würde.
export function berlinMontagDerWoche(datum: Date): Date {
  const { jahr, monat, tag } = berlinKomponenten(datum);
  const wochentag = new Date(Date.UTC(Number(jahr), Number(monat) - 1, Number(tag))).getUTCDay();
  const differenzZuMontag = wochentag === 0 ? -6 : 1 - wochentag;
  return berlinMitternachtVon(Number(jahr), Number(monat) - 1, Number(tag) + differenzZuMontag);
}
