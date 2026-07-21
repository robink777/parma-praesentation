import { AKQUISE_NAMEN, TEAM } from "@/data/unternehmen";
import { MitarbeiterKennzahlen, MitarbeiterObjekt, ObjektGesamtKennzahlen } from "@/types";
import {
  AKQUISE_TERMINARTEN,
  ladeAlleAktivenObjekte,
  ladeAlleObjekteInAufarbeitung,
  ladeAlleVerkauftenObjekte,
  ladeBenutzernameFuerMitarbeiter,
  ladeNutzerNrFuerMitarbeiter,
  zaehleAktiveKunden,
  zaehleAktiveObjekte,
  zaehleBesichtigungen,
  zaehleObjekteInAufarbeitung,
  zaehleTermine,
  zaehleTermineNachArt,
  zaehleVerkaufteObjekteFuerMitarbeiter,
} from "./estate";

// Formatiert ein Datum als "YYYY-MM-DD HH:mm:ss", wie von den datestart/dateend-Parametern des
// "calendar"-Resourcetype erwartet (siehe zaehleTermine in estate.ts). Bewusst mit lokalen
// Date-Methoden (getFullYear/getMonth/getDate) statt einer Zeitzonen-Bibliothek — bei einem
// reinen Tages-Fenster (30 Tage / Kalenderjahr, keine Uhrzeit-genaue Abfrage) ist die maximal
// ein- bis zweistündige Abweichung zwischen Serverzeit und Europe/Berlin für diese Kennzahl ohne
// praktische Relevanz.
function formatiereDatumZeit(datum: Date, uhrzeit: string): string {
  const jahr = datum.getFullYear();
  const monat = String(datum.getMonth() + 1).padStart(2, "0");
  const tag = String(datum.getDate()).padStart(2, "0");
  return `${jahr}-${monat}-${tag} ${uhrzeit}`;
}

// Liefert die beiden Zeitfenster, die für Parameter 3-5 (Termine, Besichtigungen, siehe
// Mitarbeiterstatistik.tsx) gebraucht werden: "letzte 30 Tage" (heute minus 30 Tage bis heute)
// und "aktuelles Kalenderjahr" (1. Januar bis 31. Dezember des laufenden Jahres) — siehe
// Chat-Vorgabe: beide Zeitfenster nebeneinander je Parameter, im Unterschied zu Parameter 1/2
// (reine Absolut-Snapshots ohne Zeitraum).
function ermittleZeitraeume() {
  const heute = new Date();
  const vor30Tagen = new Date(heute);
  vor30Tagen.setDate(vor30Tagen.getDate() - 30);
  const jahresanfang = new Date(heute.getFullYear(), 0, 1);
  const jahresende = new Date(heute.getFullYear(), 11, 31);

  return {
    von30Tage: formatiereDatumZeit(vor30Tagen, "00:00:00"),
    bis30Tage: formatiereDatumZeit(heute, "23:59:59"),
    vonJahr: formatiereDatumZeit(jahresanfang, "00:00:00"),
    bisJahr: formatiereDatumZeit(jahresende, "23:59:59"),
  };
}

// Datumsfenster (ohne Uhrzeitanteil) für das aktuelle Kalenderjahr, für die neue Kennzahl
// "Verkaufte Objekte" je Mitarbeiter (siehe zaehleVerkaufteObjekteFuerMitarbeiter in estate.ts,
// Juli 2026 Chat-Vorgabe: "die Zahl der verkauften Objekte pro Mitarbeiter in diesem Jahr ...
// Schreibe die Funktion allerdings so dass es jedes Jahr zurück gestellt wird"). Bewusst ein
// eigener Helfer statt einer Erweiterung von ermittleZeitraeume oben: Das Feld "verkauft_am" ist
// ein reines Datumsfeld (kein Kalendereintrag mit Uhrzeit), live geprüft funktioniert dafür das
// Format "YYYY-MM-DD" zuverlässig als Filterwert (siehe Kommentar in estate.ts) — anders als die
// "YYYY-MM-DD HH:mm:ss"-Formatierung, die zaehleTermine/zaehleBesichtigungen (resourcetype
// "calendar") benötigen. Das Jahr wird bei jedem Aufruf neu aus dem Systemdatum bestimmt, nie
// hartkodiert, damit die Kennzahl ohne jährliche Codeänderung plausibel bleibt.
// Exportiert (nicht mehr modul-lokal), damit auch api/admin/mitarbeiter-objekte/route.ts dasselbe
// Jahresfenster für die neue "Verkauft {Jahr}"-Dropdown-Gruppe verwenden kann, statt das
// Kalenderjahr dort ein zweites Mal zu bestimmen.
export function ermittleJahresDatumsfenster() {
  const jahr = new Date().getFullYear();
  return {
    vonJahr: `${jahr}-01-01`,
    bisJahr: `${jahr}-12-31`,
  };
}

// Aggregiert die Mitarbeiterstatistik-Kennzahlen (siehe MitarbeiterKennzahlen in types/index.ts
// und components/admin/Mitarbeiterstatistik.tsx) für alle TEAM-Mitglieder zu EINER
// Name-zu-Kennzahlen-Map. Alle 5 vereinbarten Parameter sind jetzt live angebunden: Parameter 1
// ("Aktive Objekte"), Parameter 2 ("Objekte in Aufarbeitung"), Parameter 3 ("Termine", 30 Tage /
// Jahr), Parameter 4 ("Besichtigungen", 30 Tage / Jahr, inkl. Folgebesichtigungen) und Parameter 5
// ("Kunden aktiv", einzelner Snapshot-Wert statt 30T/Jahr-Paar — siehe Chat-Vorgabe, da diese
// Kennzahl kein natürliches Zeitfenster hat).
//
// Pro Mitarbeiter unabhängig per .catch(() => null) abgesichert, damit ein einzelner
// fehlgeschlagener OnOffice-Abruf nicht die gesamte Tabelle auf Platzhalter zurückfallen lässt
// (Muster analog zu den einzelnen .catch(() => null)-Aufrufen in praesentation.ts).
export async function ladeMitarbeiterKennzahlen(): Promise<
  Record<string, MitarbeiterKennzahlen>
> {
  const { von30Tage, bis30Tage, vonJahr, bisJahr } = ermittleZeitraeume();
  const { vonJahr: vonJahrVerkauft, bisJahr: bisJahrVerkauft } = ermittleJahresDatumsfenster();

  const eintraege = await Promise.all(
    TEAM.map(async (mitglied) => {
      const nutzerNr = ladeNutzerNrFuerMitarbeiter(mitglied.name);
      const benutzername = ladeBenutzernameFuerMitarbeiter(mitglied.name);
      // Nur für die drei Akquise-Reiter-Mitglieder abgerufen (siehe AKQUISE_NAMEN in
      // data/unternehmen.ts) — sonst würden für alle elf TEAM-Mitglieder sechs zusätzliche
      // OnOffice-Kalenderabrufe ausgelöst, obwohl die Kennzahl nur drei Personen betrifft.
      const istAkquise = AKQUISE_NAMEN.includes(mitglied.name);

      const [
        aktiveObjekte,
        objekteInAufarbeitung,
        termine30Tage,
        termineJahr,
        besichtigungen30Tage,
        besichtigungenJahr,
        kundenAktiv,
        verkaufteObjekteJahr,
        akquiseErsttermin30Tage,
        akquiseErsttermineJahr,
        akquiseZweittermin30Tage,
        akquiseZweittermineJahr,
        akquiseVertragstermin30Tage,
        akquiseVertragstermineJahr,
      ] = await Promise.all([
        nutzerNr ? zaehleAktiveObjekte(nutzerNr).catch(() => null) : Promise.resolve(null),
        nutzerNr
          ? zaehleObjekteInAufarbeitung(nutzerNr).catch(() => null)
          : Promise.resolve(null),
        nutzerNr
          ? zaehleTermine(nutzerNr, von30Tage, bis30Tage).catch(() => null)
          : Promise.resolve(null),
        nutzerNr
          ? zaehleTermine(nutzerNr, vonJahr, bisJahr).catch(() => null)
          : Promise.resolve(null),
        nutzerNr
          ? zaehleBesichtigungen(nutzerNr, von30Tage, bis30Tage).catch(() => null)
          : Promise.resolve(null),
        nutzerNr
          ? zaehleBesichtigungen(nutzerNr, vonJahr, bisJahr).catch(() => null)
          : Promise.resolve(null),
        benutzername
          ? zaehleAktiveKunden(benutzername).catch(() => null)
          : Promise.resolve(null),
        nutzerNr
          ? zaehleVerkaufteObjekteFuerMitarbeiter(nutzerNr, vonJahrVerkauft, bisJahrVerkauft).catch(
              () => null
            )
          : Promise.resolve(null),
        nutzerNr && istAkquise
          ? zaehleTermineNachArt(nutzerNr, von30Tage, bis30Tage, AKQUISE_TERMINARTEN.ersttermin).catch(
              () => null
            )
          : Promise.resolve(null),
        nutzerNr && istAkquise
          ? zaehleTermineNachArt(nutzerNr, vonJahr, bisJahr, AKQUISE_TERMINARTEN.ersttermin).catch(
              () => null
            )
          : Promise.resolve(null),
        nutzerNr && istAkquise
          ? zaehleTermineNachArt(nutzerNr, von30Tage, bis30Tage, AKQUISE_TERMINARTEN.zweittermin).catch(
              () => null
            )
          : Promise.resolve(null),
        nutzerNr && istAkquise
          ? zaehleTermineNachArt(nutzerNr, vonJahr, bisJahr, AKQUISE_TERMINARTEN.zweittermin).catch(
              () => null
            )
          : Promise.resolve(null),
        nutzerNr && istAkquise
          ? zaehleTermineNachArt(
              nutzerNr,
              von30Tage,
              bis30Tage,
              AKQUISE_TERMINARTEN.vertragstermin
            ).catch(() => null)
          : Promise.resolve(null),
        nutzerNr && istAkquise
          ? zaehleTermineNachArt(nutzerNr, vonJahr, bisJahr, AKQUISE_TERMINARTEN.vertragstermin).catch(
              () => null
            )
          : Promise.resolve(null),
      ]);

      const kennzahlen: MitarbeiterKennzahlen = {
        aktiveObjekte,
        objekteInAufarbeitung,
        termine30Tage,
        termineJahr,
        besichtigungen30Tage,
        besichtigungenJahr,
        kundenAktiv,
        verkaufteObjekteJahr,
        akquiseErsttermin30Tage,
        akquiseErsttermineJahr,
        akquiseZweittermin30Tage,
        akquiseZweittermineJahr,
        akquiseVertragstermin30Tage,
        akquiseVertragstermineJahr,
      };

      return [mitglied.name, kennzahlen] as const;
    })
  );

  return Object.fromEntries(eintraege);
}

// Liefert die vier unternehmensweiten Summen für die Infoboxen über der Mitarbeitertabelle
// (siehe ObjektGesamtKennzahlen in types/index.ts, Mitarbeiterstatistik.tsx, Chat-Vorgabe:
// "Häuser in Aufarbeitung gesamt, Aktive Vermarktung gesamt, durchschnittliche Vermarktungsdauer
// gesamt, Objektvolumen gesamt"). Nutzt bewusst die beiden unternehmensweiten Lader
// (ladeAlleAktivenObjekte/ladeAlleObjekteInAufarbeitung, JE EIN Abruf statt einer Summe aus 11
// Einzelabrufen je Mitarbeiter) statt der reinen zaehle*-Zählfunktionen oben, weil für
// Ø-Vermarktungsdauer und Objektvolumen die echten Datensätze (Preis, Auftragsdatum) gebraucht
// werden, nicht nur eine Anzahl.
//
// Ø-Vermarktungsdauer und Objektvolumen werden über BEIDE Gruppen zusammen berechnet (aktive
// Vermarktung + Aufarbeitung) — anders als aufarbeitungGesamt/aktivGesamt, die bewusst getrennt
// bleiben, analog zu den bereits getrennten Tabellenspalten "Aktive Objekte"/"Aufarbeitung".
// Gesamter Aufruf per try/catch abgesichert in admin/page.tsx (analog zu ladeMitarbeiterKennzahlen
// oben) — schlägt er fehl, zeigen die Infoboxen "–" statt eines Fehlers.
export async function ladeObjektGesamtKennzahlen(): Promise<ObjektGesamtKennzahlen> {
  const { vonJahr, bisJahr } = ermittleJahresDatumsfenster();

  const [aktiv, aufarbeitung, verkauftJahr] = await Promise.all([
    ladeAlleAktivenObjekte(),
    ladeAlleObjekteInAufarbeitung(),
    ladeAlleVerkauftenObjekte(vonJahr, bisJahr),
  ]);

  const alle: MitarbeiterObjekt[] = [...aktiv, ...aufarbeitung];
  const dauerWerte = alle
    .map((objekt) => objekt.vermarktungsdauerTage)
    .filter((tage): tage is number => tage !== null);

  const durchschnittVermarktungsdauerTage =
    dauerWerte.length === 0
      ? null
      : Math.round(dauerWerte.reduce((summe, tage) => summe + tage, 0) / dauerWerte.length);

  const objektvolumenGesamt = alle.reduce((summe, objekt) => summe + objekt.preis, 0);

  // Provisionsvorlauf gesamt: Summe über alle Objekte mit auswertbarer Außen-/Innen-Provision
  // (siehe MitarbeiterObjekt.provisionsvorlauf/provisionsvorlaufFehlt in onoffice/estate.ts) —
  // Objekte ohne auswertbaren Wert fließen NICHT mit 0 in die Summe ein, sondern werden separat
  // gezählt (provisionsvorlaufFehltAnzahl), damit die Infobox auf fehlende Daten hinweisen kann.
  const provisionsWerte = alle
    .map((objekt) => objekt.provisionsvorlauf)
    .filter((wert): wert is number => wert !== null);
  const provisionsvorlaufGesamt =
    provisionsWerte.length === 0 ? null : provisionsWerte.reduce((summe, wert) => summe + wert, 0);
  const provisionsvorlaufFehltAnzahl = alle.filter((objekt) => objekt.provisionsvorlaufFehlt).length;

  // Neuer Block "Verkaufte Objekte {Jahr} / Provisionsvolumen {Jahr} / Gesamtvolumen {Jahr}"
  // (Juli 2026 Chat-Vorgabe) — gleiches Muster wie oben, aber ausschließlich über die im
  // laufenden Kalenderjahr verkauften Objekte (verkauftJahr), nicht über den Gesamtbestand.
  const objektvolumenVerkauftJahr = verkauftJahr.reduce((summe, objekt) => summe + objekt.preis, 0);
  const provisionsWerteVerkauftJahr = verkauftJahr
    .map((objekt) => objekt.provisionsvorlauf)
    .filter((wert): wert is number => wert !== null);
  const provisionsvolumenVerkauftJahr =
    provisionsWerteVerkauftJahr.length === 0
      ? null
      : provisionsWerteVerkauftJahr.reduce((summe, wert) => summe + wert, 0);
  const provisionsvolumenVerkauftJahrFehltAnzahl = verkauftJahr.filter(
    (objekt) => objekt.provisionsvorlaufFehlt
  ).length;

  return {
    aufarbeitungGesamt: aufarbeitung.length,
    aktivGesamt: aktiv.length,
    durchschnittVermarktungsdauerTage,
    objektvolumenGesamt,
    provisionsvorlaufGesamt,
    provisionsvorlaufFehltAnzahl,
    verkaufteObjekteJahrGesamt: verkauftJahr.length,
    objektvolumenVerkauftJahr,
    provisionsvolumenVerkauftJahr,
    provisionsvolumenVerkauftJahrFehltAnzahl,
  };
}
