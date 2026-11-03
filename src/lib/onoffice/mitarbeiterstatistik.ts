import { AKQUISE_NAMEN, TEAM } from "@/data/unternehmen";
import {
  MitarbeiterKennzahlen,
  MitarbeiterObjekt,
  NeuzugaengeTag,
  ObjektGesamtKennzahlen,
} from "@/types";
import {
  berlinDatumIso,
  berlinDatumZeit,
  berlinMitternacht,
  berlinMitternachtVon,
  berlinMontagDerWoche,
} from "@/lib/zeitzone";
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
  zaehleNeueKunden,
  zaehleNeueObjekte,
  zaehleObjekteInAufarbeitung,
  zaehleTelefonate,
  zaehleTermine,
  zaehleTermineNachArt,
  zaehleVerkaufteObjekteFuerMitarbeiter,
} from "./estate";

// KORREKTUR November 2026 (Nutzer-Meldung: "Die zahlen scheinen nicht richtig erkannt zu werden
// ... es sind speziell die telefonate bei den mitarbeitern ... Kann es ein Cache Problem oder so
// sein?"): War KEIN Cache-Problem, sondern ein Zeitzonen-Bug — die bisherigen lokalen Helfer
// (Date.getHours/getFullYear & Co.) lieferten IMMER die Zeitzone des ausführenden PROZESSES.
// Vercel führt Serverless Functions standardmäßig in UTC aus, wodurch "heute"/"jetzt" live auf
// Produktion rund eine Stunde zu früh lagen (aktuell, CET) — neuere Anrufe/Termine fehlten dadurch
// systematisch, obwohl sie in onOffice längst erfasst waren (live gegengeprüft). Lokal unsichtbar,
// weil diese Entwicklungsumgebung zufällig in Europe/Berlin läuft. formatiereDatumZeit/
// formatiereDatumZeitVoll/montagDerWoche/formatiereDatumIso sind deshalb durch die explizit
// Europe/Berlin-sicheren Helfer aus lib/zeitzone.ts ersetzt (siehe dort für die volle Begründung).

// Liefert die beiden Zeitfenster, die für Parameter 3-5 (Termine, Besichtigungen, siehe
// Mitarbeiterstatistik.tsx) gebraucht werden: "letzte 30 Tage" (heute minus 30 Tage bis heute)
// und "aktuelles Kalenderjahr" (1. Januar bis 31. Dezember des laufenden Jahres) — siehe
// Chat-Vorgabe: beide Zeitfenster nebeneinander je Parameter, im Unterschied zu Parameter 1/2
// (reine Absolut-Snapshots ohne Zeitraum).
//
// KORREKTUR November 2026 (Nutzer-Entscheidung, siehe ermittleJahresDatumsfenster unten und
// ermittleHeuteWocheZeitraeume unten): "Jahr" lief bisher bis zum 31.12., auch wenn das Jahr noch
// nicht zu Ende ist — bereits vorgebuchte Termine/Besichtigungen der restlichen Jahreshälfte
// wären dadurch mitgezählt, bevor sie stattgefunden haben. bisJahr ist jetzt min(31.12., heute).
//
// KORREKTUR November 2026 (Folgefund, Nutzer: "Termine zählen generell erst wenn Sie
// stattgefunden haben"): Die reine Tages-Deckelung allein reichte nicht — "bis heute 23:59:59"
// zählte auch heute noch bevorstehende Termine/Besichtigungen sofort mit. bis30Tage/bisJahr
// nutzen daher jetzt formatiereDatumZeitVoll, die die ECHTE aktuelle Uhrzeit trägt statt immer
// Tagesende. jahresendeDatum bekommt dafür explizit 23:59:59 als Uhrzeit (statt Mitternacht),
// damit diese Funktion auch für den bereits-abgelaufenen Jahresende-Fall korrekt "Tagesende"
// statt "Tagesbeginn" liefert.
function ermittleZeitraeume() {
  const heute = new Date();
  const vor30Tagen = new Date(heute.getTime() - 30 * 24 * 60 * 60 * 1000);
  const jahr = Number(berlinDatumIso(heute).slice(0, 4));
  const jahresanfang = berlinMitternachtVon(jahr, 0, 1);
  const jahresendeTag = berlinMitternachtVon(jahr, 11, 31);
  const istJahresende = heute >= jahresendeTag;

  return {
    von30Tage: berlinDatumZeit(vor30Tagen, "00:00:00"),
    bis30Tage: berlinDatumZeit(heute),
    vonJahr: berlinDatumZeit(jahresanfang, "00:00:00"),
    bisJahr: istJahresende ? berlinDatumZeit(jahresendeTag, "23:59:59") : berlinDatumZeit(heute),
  };
}

// Zeitfenster für Telefonate UND Termine im Vertrieb-Überblick (Oktober 2026 Chat-Vorgabe: "ich
// will Anrufe pro Tag und pro Monat! Keine Durchschnittswert" — als Korrektur zu einer zunächst
// gebauten 30-Tage-Durchschnittsrate, die als Kommazahl "keinen Sinn" ergab —, direkt darauf
// präzisiert auf "Anrufe heute, Anrufe Woche ... Termine pro Tag und Termine pro Woche", daher
// "Woche" statt des zunächst gebauten Monats). "Heute" = Mitternacht bis Tagesende, "Woche" = die
// laufende Kalenderwoche (Montag-Sonntag, montagDerWoche weiter unten — dieselbe Mo-So-Woche wie
// im Neuzugänge-Verlauf) von Montag 00:00 bis Sonntag 23:59.
//
// KORREKTUR November 2026 ("Aber bei Termine in der Woche sollen auch nur die Termine erscheinen
// die stattgefunden haben"): Die ursprüngliche Annahme oben ("Datensätze aus der Zukunft gibt es
// ohnehin nicht") stimmt nicht — Termine werden in OnOffice regelmäßig Tage/Wochen im Voraus
// eingetragen (siehe dieselbe Erkenntnis bei ladeWettkampfRangliste in onoffice/wettkampf.ts,
// live verifiziert). Das Wochenfenster-Ende ist deshalb jetzt min(Sonntag, heute) statt immer
// Sonntag — an jedem Tag außer Sonntag selbst (letzter Wochentag) blieben sonst bereits
// vorgebuchte Termine der restlichen Woche fälschlich mitgezählt, bevor sie stattgefunden haben.
//
// KORREKTUR November 2026 (Folgefund, Nutzer: "Termine zählen generell erst wenn Sie
// stattgefunden haben"): Die reine Tages-Deckelung allein reichte nicht — live bestätigt zählten
// "Termine heute/Woche" morgens bereits Termine mit, die erst am Nachmittag/Abend desselben Tages
// beginnen. bisHeute/bisWoche nutzen daher jetzt formatiereDatumZeitVoll (echte aktuelle Uhrzeit
// statt immer Tagesende) statt formatiereDatumZeit(..., "23:59:59").
function ermittleHeuteWocheZeitraeume() {
  const heute = new Date();
  const heuteMitternacht = berlinMitternacht(heute);
  const montag = berlinMontagDerWoche(heute);
  const sonntagDerWoche = berlinMitternacht(montag, 6);
  const istWochenende = heute >= berlinMitternacht(sonntagDerWoche, 1);

  return {
    vonHeute: berlinDatumZeit(heuteMitternacht, "00:00:00"),
    bisHeute: berlinDatumZeit(heute),
    vonWoche: berlinDatumZeit(montag, "00:00:00"),
    bisWoche: istWochenende ? berlinDatumZeit(sonntagDerWoche, "23:59:59") : berlinDatumZeit(heute),
  };
}

// Zeitfenster der Aktivitätenliste (app/admin/aktivitaeten/page.tsx) — "heute" und "woche" sind
// exakt die Fenster der Kacheln "Anrufe heute"/"Anrufe Woche", damit Zahl und Liste übereinstimmen.
export type AktivitaetenZeitraum = "heute" | "woche" | "30t";

export function ermittleAktivitaetenZeitraum(zeitraum: AktivitaetenZeitraum): { von: string; bis: string } {
  const { vonHeute, bisHeute, vonWoche, bisWoche } = ermittleHeuteWocheZeitraeume();
  if (zeitraum === "heute") return { von: vonHeute, bis: bisHeute };
  if (zeitraum === "woche") return { von: vonWoche, bis: bisWoche };
  const heute = new Date();
  return { von: berlinDatumZeit(berlinMitternacht(heute, -30), "00:00:00"), bis: berlinDatumZeit(heute) };
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
//
// KORREKTUR November 2026 (Nutzer-Entscheidung, nach demselben Fund bei "Termine Woche" und den
// Wettkampf-Zählern: "ja, gleich mit fixen"): bisJahr war bisher immer der 31.12., auch wenn das
// Jahr noch nicht zu Ende ist — "verkauft_am" kann vorab auf ein zukünftiges Datum gesetzt werden
// (z.B. ein bereits terminierter, aber noch nicht vollzogener Notartermin), wodurch "Verkaufte
// Objekte {Jahr}" schon vor dem tatsächlichen Verkauf mitgezählt worden wäre. Jetzt min(31.12.,
// heute) — bewusst OHNE die "Folgetag"-Anpassung aus ladeNeuzugaengeVerlauf (die betraf NUR
// datetime-Felder wie erstellt_am, deren "<="-Truncation-Bug hier nicht gilt: verkauft_am/
// auftragvon sind reine Datumsfelder ohne Uhrzeitanteil, ein "<="-Vergleich gegen das heutige
// Datum deckt den heutigen Tag bereits vollständig ab).
export function ermittleJahresDatumsfenster() {
  const heute = new Date();
  const heuteDatum = berlinDatumIso(heute);
  const jahr = heuteDatum.slice(0, 4);
  const jahresendeDatum = `${jahr}-12-31`;
  return {
    vonJahr: `${jahr}-01-01`,
    bisJahr: heuteDatum < jahresendeDatum ? heuteDatum : jahresendeDatum,
  };
}

// Anzahl Tage im "Neuzugänge"-Verlauf (siehe ladeNeuzugaengeVerlauf unten) — Nutzer-Vorgabe
// November 2026: "die Objekte und auch die Adressen hätte ich gerne jeweils für den Tag
// angezeigt, immer die letzten 6 Tage und der aktuelle Tag" (ersetzt die zuvor gezeigten 8
// Kalenderwochen).
const NEUZUGAENGE_TAGE_ANZAHL = 7;

// "20.10." für die Anzeige-Beschriftung je Tageszeile (siehe Neuzugaenge.tsx) — aus den
// Berlin-ISO-Komponenten (nicht d.getDate()/getMonth(), die die Prozess-Zeitzone verwenden
// würden) zusammengesetzt, damit die Beschriftung zum tatsächlichen Berlin-Kalendertag passt.
function formatiereDatumKurz(iso: string): string {
  const [, monat, tag] = iso.split("-");
  return `${tag}.${monat}.`;
}

// Liefert das GESAMTE Zeitfenster, das der Neuzugänge-Verlauf oben über alle
// NEUZUGAENGE_TAGE_ANZAHL Tage hinweg abdeckt (heute minus 6 Tage bis einschließlich heute) — für
// die Admin-Detailseite app/admin/neuzugaenge/page.tsx (Nutzer-Vorgabe November 2026: "Zugriff
// auf die Objekte und Adressen die neu rein kommen, gerne als neue Liste wie bei den anderen
// Feldern"). Exakt dasselbe Fenster wie die Summe der einzelnen Tages-Aufrufe in
// ladeNeuzugaengeVerlauf unten, nur als EIN von/bis-Paar statt sieben Einzeltage — die Liste
// zeigt dadurch garantiert dieselben Datensätze, die auch in den Diagramm-Balken stecken. Gleicher
// "Folgetag als oberes Fenster-Ende"-Kommentar wie dort (Mitternacht-Truncation-Bug bei
// erstellt_am/Eintragsdatum).
export function ermittleNeuzugaengeZeitraum(): { von: string; bis: string } {
  const heute = new Date();
  const vonDatum = berlinMitternacht(heute, -(NEUZUGAENGE_TAGE_ANZAHL - 1));
  const folgetag = berlinMitternacht(heute, 1);
  return { von: berlinDatumIso(vonDatum), bis: berlinDatumIso(folgetag) };
}

// Lädt den Neuzugänge-Verlauf (Objekte/Kunden je Tag, neueste zuerst) für den "Neuzugänge"-
// Baustein im Admin-Bereich (siehe NeuzugaengeTag in types/index.ts) — ursprünglich echte
// Kalenderwochen, auf Nutzerwunsch November 2026 ("die Objekte und auch die Adressen hätte ich
// gerne jeweils für den Tag angezeigt, immer die letzten 6 Tage und der aktuelle Tag") auf
// NEUZUGAENGE_TAGE_ANZAHL (7) einzelne Kalendertage umgestellt — heute sowie die sechs Tage davor.
// Der heutige, noch nicht abgeschlossene Tag bleibt in der Liste (sonst würde "heute" komplett
// fehlen) und bekommt stattdessen den Zusatz "(laufend)" in seinem label.
//
// Pro Tag BEIDE Zählungen gleichzeitig (Promise.all) UND alle Tage gleichzeitig (Promise.all
// außen) statt nacheinander — unabhängige Abrufe, ein sequenzielles await würde die Ladezeit
// unnötig auf 2 × NEUZUGAENGE_TAGE_ANZAHL Abrufe hintereinander strecken. Jede Zählung einzeln
// per .catch(() => null) abgesichert (Muster wie ladeMitarbeiterKennzahlen oben) — schlägt eine
// einzelne Tages-/Kennzahl fehl, zeigt nur diese Zelle "–" statt der ganzen Liste.
export async function ladeNeuzugaengeVerlauf(): Promise<NeuzugaengeTag[]> {
  const jetzt = new Date();
  const heute = berlinMitternacht(jetzt);

  const tage = Array.from({ length: NEUZUGAENGE_TAGE_ANZAHL }, (_, i) => {
    const datum = berlinMitternacht(heute, -i);
    return { datum, istHeute: i === 0 };
  });

  return Promise.all(
    tage.map(async ({ datum, istHeute }) => {
      const datumStr = berlinDatumIso(datum);
      // Live gegen den Account geprüft (November 2026): Der "<="-Operator gegen ein reines Datum
      // (ohne Uhrzeit) vergleicht bei erstellt_am/Eintragsdatum offenbar gegen Mitternacht
      // (00:00:00) dieses Tages, nicht gegen dessen Ende — "erstellt_am <= '2026-10-30'" lieferte
      // live 0 Treffer für einen Datensatz, der nachweislich am 30.10. um 10:43 Uhr angelegt
      // wurde, "erstellt_am <= '2026-10-31'" fand ihn dagegen. Als oberes Fenster-Ende deshalb
      // bewusst der FOLGETag statt des Tages selbst — deckt den ganzen Tag ab, unabhängig von der
      // Uhrzeit der einzelnen Datensätze.
      const folgetagStr = berlinDatumIso(berlinMitternacht(datum, 1));
      const [neueObjekte, neueKunden] = await Promise.all([
        zaehleNeueObjekte(datumStr, folgetagStr).catch(() => null),
        zaehleNeueKunden(datumStr, folgetagStr).catch(() => null),
      ]);
      return {
        von: datumStr,
        bis: datumStr,
        label: `${formatiereDatumKurz(datumStr)}${istHeute ? " (laufend)" : ""}`,
        neueObjekte: neueObjekte?.gesamt ?? null,
        neueObjekteVerteilung: neueObjekte?.verteilung ?? [],
        neueKunden: neueKunden?.gesamt ?? null,
        neueKundenVerteilung: neueKunden?.verteilung ?? [],
      };
    })
  );
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
  const { vonHeute, bisHeute, vonWoche, bisWoche } = ermittleHeuteWocheZeitraeume();

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
        telefonateHeute,
        telefonateWoche,
        termineHeute,
        termineWoche,
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
        nutzerNr ? zaehleTelefonate(nutzerNr, vonHeute, bisHeute).catch(() => null) : Promise.resolve(null),
        nutzerNr ? zaehleTelefonate(nutzerNr, vonWoche, bisWoche).catch(() => null) : Promise.resolve(null),
        nutzerNr ? zaehleTermine(nutzerNr, vonHeute, bisHeute).catch(() => null) : Promise.resolve(null),
        nutzerNr ? zaehleTermine(nutzerNr, vonWoche, bisWoche).catch(() => null) : Promise.resolve(null),
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
        telefonateHeute,
        telefonateWoche,
        termineHeute,
        termineWoche,
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
  // verkauftJahr enthält seit November 2026 auch die Vermietungen des Jahres: Sie zählen nur beim
  // Provisionsvolumen, nicht als Verkauf und nicht im Gesamtvolumen (Kaltmiete ≠ Kaufpreis).
  const verkaeufe = verkauftJahr.filter((objekt) => !objekt.istVermietung);
  const objektvolumenVerkauftJahr = verkaeufe.reduce((summe, objekt) => summe + objekt.preis, 0);
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
    verkaufteObjekteJahrGesamt: verkaeufe.length,
    vermietungenJahrGesamt: verkauftJahr.length - verkaeufe.length,
    objektvolumenVerkauftJahr,
    provisionsvolumenVerkauftJahr,
    provisionsvolumenVerkauftJahrFehltAnzahl,
  };
}

// Die vier Objekt-Mengen, aus denen sich SÄMTLICHE acht KPI-Kacheln der Übersicht speisen (siehe
// baueUebersichtKacheln in components/shared/KpiKachel.tsx): "aktiv" (Aktive Vermarktung gesamt),
// "aufarbeitung" (In Aufarbeitung gesamt), "alle" (= aktiv+aufarbeitung — Objektvolumen gesamt,
// Provisionsvorlauf gesamt, Ø Vermarktungsdauer) und "verkauftJahr" (Verkaufte Objekte/
// Gesamtvolumen/Provisionsvolumen {Jahr}) — siehe ladeObjektGesamtKennzahlen oben, das dieselben
// drei Ladefunktionen für die SUMMEN nutzt. Eigene Funktion statt Inline-Code in der Admin-
// Detailseite (app/admin/objektliste/page.tsx), damit beide Seiten (Summen UND Einzelliste) exakt
// dieselbe Objektmenge sehen und nie auseinanderlaufen können.
//
// KORREKTUR November 2026 (Nutzer-Vorgabe: "Ich hätte gerne dass man aus der Gesamtübersicht in
// die jeweiligen Listen navigieren kann. Ähnlich wie bei den Fehlermeldungen ... aber überall"):
// Vorher gab es nur ladeObjekteOhneProvisionsangabe (einen gefilterten Spezialfall für die
// "N ohne Angabe"-Hinweise). Diese Funktion liefert jetzt die VOLLSTÄNDIGE, ungefilterte Menge je
// Kategorie — ladeObjekteOhneProvisionsangabe unten baut darauf auf, statt die
// aktiv+aufarbeitung-Kombination ein zweites Mal selbst zu laden.
export async function ladeObjektlisteFuerKategorie(
  kategorie: "aktiv" | "aufarbeitung" | "alle" | "verkauftJahr"
): Promise<MitarbeiterObjekt[]> {
  if (kategorie === "verkauftJahr") {
    const { vonJahr, bisJahr } = ermittleJahresDatumsfenster();
    return ladeAlleVerkauftenObjekte(vonJahr, bisJahr);
  }
  if (kategorie === "aktiv") {
    return ladeAlleAktivenObjekte();
  }
  if (kategorie === "aufarbeitung") {
    return ladeAlleObjekteInAufarbeitung();
  }

  const [aktiv, aufarbeitung] = await Promise.all([
    ladeAlleAktivenObjekte(),
    ladeAlleObjekteInAufarbeitung(),
  ]);
  return [...aktiv, ...aufarbeitung];
}

// Liefert die EINZELNEN Objekte hinter provisionsvorlaufFehltAnzahl/
// provisionsvolumenVerkauftJahrFehltAnzahl oben (gleicher Filter: provisionsvorlaufFehlt) — für
// die Admin-Detailseite app/admin/provisionsfehler/page.tsx (Oktober 2026 Chat-Vorgabe: "beim
// Hovern über die ... Objekte ohne Provisionseintrag eine neue Seite öffnen wo genau diese Objekte
// angezeigt werden, damit man die Fehler direkt in OnOffice suchen kann"). Lädt bewusst NICHT aus
// derselben Promise.all wie ladeObjektGesamtKennzahlen (die nur die Summen zurückgibt, nicht die
// Rohdaten) — ein eigener, separater Live-Abruf, nur wenn die Detailseite tatsächlich aufgerufen
// wird, analog zu ladeKontrollObjekte in estate.ts.
export async function ladeObjekteOhneProvisionsangabe(
  quelle: "gesamt" | "verkauftJahr"
): Promise<MitarbeiterObjekt[]> {
  const objekte = await ladeObjektlisteFuerKategorie(quelle === "verkauftJahr" ? "verkauftJahr" : "alle");
  return objekte.filter((objekt) => objekt.provisionsvorlaufFehlt);
}
