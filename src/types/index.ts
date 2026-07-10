export interface Immobilie {
  id: string;
  // Externe Objektnummer ("ImmoNr", OnOffice-Feld objektnr_extern — Live-Feldkatalog geprüft,
  // Juli 2026) — die kundenseitig sichtbare Kennung des Objekts, unabhängig von der internen
  // numerischen Id. Wird in der Objektauswahl-Suche zusätzlich zu Titel/Ort/PLZ durchsucht.
  immoNr?: string;
  bezeichnung: string;
  kaufpreis: number;
  wohnflaeche?: number;
  grundstuecksflaeche?: number;
  anzahlZimmer?: number;
  ort?: string;
  plz?: string;
  strasse?: string;
  // Hausnummer als eigenes OnOffice-Feld (getrennt von strasse) — Live-Feldkatalog geprüft,
  // Juli 2026. Wird für die Adress-Anzeige unter Objektdaten benötigt (siehe Objektdaten.tsx,
  // formatAdresse), die statt des Objekttitels nun die vollständige Anschrift als Seitentitel
  // zeigt.
  hausnummer?: string;
  bildUrl?: string;
  bilder?: string[];
  objektart?: string;
  // Feingranularerer Objekttyp (z.B. "Einfamilienhaus", "Doppelhaushälfte", "Eigentumswohnung")
  // — ergänzend zu objektart (grobe Kategorie wie "Haus"/"Wohnung"). OnOffice-Feld "objekttyp",
  // Singleselect mit ~130 möglichen Werten (Live-Feldkatalog geprüft, Juli 2026) — die
  // Klartext-Zuordnung roher Schlüssel (z.B. "hausbau_einfamilienhaus") zu Anzeigetext erfolgt
  // in mapping.ts (OBJEKTTYP_LABELS).
  objekttyp?: string;
  baujahr?: number;
  zustand?: string;
  energieklasse?: string;
  // Heizungsart(en) des Objekts — OnOffice-Feld "heizungsart", Multiselect (Live-Feldkatalog
  // geprüft, Juli 2026). Anders als das Multiselect-Feld ArtDaten im address-Modul liefert die
  // onOffice-API dieses Feld bereits als JSON-Array roher Schlüssel (z.B. ["zentral"]), nicht
  // als pipe-getrennten String — siehe mapEstateRecord in mapping.ts. Klartext-Zuordnung über
  // HEIZUNGSART_LABELS.
  heizungsart?: string[];
  // Befeuerungsart(en) (z.B. Gas, Öl, Erdwärme) — OnOffice-Feld "befeuerung", Multiselect,
  // gleiches Datenformat wie heizungsart (JSON-Array roher Schlüssel). Klartext-Zuordnung über
  // BEFEUERUNG_LABELS.
  befeuerung?: string[];
  modernisierungen?: string[];
  objektbeschreibung?: string;
  lat?: number;
  lng?: number;
  // Verkaufsdatum ("Verkauft/Vermietet am", OnOffice-Feld verkauft_am — Live-Feldkatalog
  // geprüft, Juli 2026). Nur für die manuelle Referenzobjekt-Suche im Vergleichswert-Reiter
  // relevant (siehe Vergleichswert.tsx) — bei anderen Immobilie-Abrufen bleibt das Feld leer,
  // da es dort nicht angezeigt wird, aber trotzdem für alle Estate-Abrufe mitgeladen wird (ein
  // zusätzliches, ungenutztes Feld schadet nicht, siehe ESTATE_FIELDS in mapping.ts).
  verkauftAm?: string;
  // Objektspezifischer Link zur DeepImmo-Plattform (OnOffice-Individualfeld
  // "DeepImmo-Link" unter "Technische Daten", Feldkatalog-Id ind_3450_Feld_ObjTech540 —
  // vom Kunden im Juli 2026 selbst angelegt, siehe DeepImmo.tsx). Wird pro Objekt manuell in
  // OnOffice gepflegt und bleibt bis dahin leer — die UI zeigt in diesem Fall einen
  // Leerzustand statt eines Links.
  deepImmoLink?: string;
}

// Ein automatisch über das OnOffice-Immo-Matching einem Objekt zugeordneter Interessent
// (siehe ladeAutomatischeInteressenten in onoffice/estate.ts). Bewusst NUR diese vier Felder
// (Übereinstimmung, Kundennummer, Wohnort, Kontaktart) — auf ausdrücklichen Nutzerwunsch
// (Juli 2026) KEIN Name/E-Mail/Telefon, da es sich um Drittdaten (fremde Interessenten, keine
// Vertragspartei der aktuellen Präsentation) handelt, die nicht in voller Detailtiefe vor dem
// Kunden/Verkäufer offengelegt werden sollen.
export interface Interessent {
  id: string;
  // Prozentuale Übereinstimmung des Interessenten-Suchprofils mit dem Objekt — dieselbe
  // Kennzahl, die OnOffice im Backend unter Objekt → Interessenten → "Automatisch zugeordnet"
  // als "Übereinstimmung" anzeigt (siehe ladeAutomatischeInteressenten, resourcetype
  // "qualifiedsuitors" — OnOffice übernimmt die Berechnung vollständig, es wird KEIN eigener
  // Abgleichs-/Gewichtungsalgorithmus im Code nachgebaut, auf ausdrücklichen Nutzerwunsch
  // Juli 2026).
  uebereinstimmung: number;
  kdNr?: number;
  ort?: string;
  kontaktart?: string[];
}

export interface Kunde {
  anrede?: string;
  vorname: string;
  nachname: string;
  email?: string;
  telefon?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
}

// Eine Vertragspartei (Auftraggeber/in) im Maklervertrag. Getrennt von `Kunde`, weil im
// Vertrag ggf. mehrere Auftraggeber (z.B. Ehepaar, Erbengemeinschaft) auftreten können und
// die Felder frei editierbar sein müssen — auch wenn sie initial aus onOffice vorausgefüllt
// wurden.
export interface MaklervertragPartei {
  name?: string;
  strasse?: string;
  plzOrt?: string;
  telefon?: string;
  email?: string;
}

// Alle im PDF-Vordruck "Maklervertrag Verkauf" freien/veränderlichen Felder. Wird beim
// Öffnen der Sektion aus den vorhandenen onOffice-Daten (Kunde/Immobilie/Bewertung)
// vorausgefüllt und ist während des Beratungstermins frei bearbeitbar (siehe
// Maklervertrag.tsx). Aktuell nur In-Memory (Zustand geht beim Reload verloren) — Speichern/
// Zurückschreiben nach onOffice ist ein separater, noch nicht umgesetzter Schritt.
export interface MaklervertragDaten {
  auftraggeber1: MaklervertragPartei;
  // Bis zu 3 weitere Eigentümer/innen (z.B. Erbengemeinschaft) — insgesamt max. 4 Parteien.
  weitereAuftraggeber: MaklervertragPartei[];
  objekt?: string;
  auftragsdauerVon?: string;
  auftragsdauerBis?: string;
  verkaufsobjektArt?: string;
  verkaufsobjektOrt?: string;
  startpreis?: number;
  wertermittlungVom?: string;
  maengel?: string;
  keineMaengelBekannt?: boolean;
  provisionProzent?: number;
  sonstigeVereinbarungen?: string;
  unterschriftOrt?: string;
  unterschriftDatum?: string;
}

export interface Bewertung {
  sachwert?: number;
  ertragswert?: number;
  vergleichswert?: number;
  empfohlenerAngebotspreis?: number;
  stand?: string;
  pdfUrl?: string;
  berechnetAutomatisch: boolean;
  // Vollständige Sprengnetter-Marktpreisermittlung (Word-Export), 1:1 ausgelesen und
  // angezeigt. Übergangslösung: Aktuell wird die Word-Datei manuell eingelesen und die
  // Werte hier eingetragen — perspektivisch soll dieser Schritt automatisiert werden
  // (z.B. direkter Import aus Sprengnetter/OnOffice statt manueller Übertragung).
  // Bleiben Teil des Typs (u.a. für Maklervertrag.tsx und den Mandat-PDF-Export weiterhin
  // genutzt), werden aber im Bewertung-Reiter selbst seit der Umstellung auf die
  // PriceHubble-Felder (siehe unten) nicht mehr angezeigt (Juli 2026, auf Kundenwunsch
  // erstmal ausgeblendet, nicht gelöscht).
  wertermittlung?: WertermittlungsDaten;
  // Automatische Marktwertschätzung von PriceHubble, live aus den OnOffice-Estate-Feldern
  // MPPricehubblePrice/-Min/-Max geladen (siehe ladePriceHubbleWerte in onoffice/estate.ts).
  // Anders als die übrigen Felder oben (aktuell manuell aus Sprengnetter gepflegt) ist das
  // hier die einzige tatsächlich live aus OnOffice geladene Bewertungsgröße.
  marktwertPH?: number;
  marktwertMinPH?: number;
  marktwertMaxPH?: number;
}

export interface WertermittlungKeyValue {
  label: string;
  wert: string;
}

export interface WertermittlungMieteinheit {
  bezeichnung: string;
  nutzung: string;
  flaeche: number;
  anzahl: number;
  tatsaechlicheMiete: number;
  geschosslage: string;
  balkon: string;
  gartennutzung: string;
}

export interface WertermittlungRohertragZeile {
  nutzung: string;
  bezeichnung: string;
  rndJahre: number;
  lzsProzent: number;
  flaeche: number;
  tatsaechlicheMieteProM2: number;
  tatsaechlicheMieteProJahr: number;
  angesetzterRohertragProM2: number;
  angesetzterRohertragProJahr: number;
}

export interface WertermittlungErgebnis {
  bodenwert?: number;
  bodenwertProM2?: number;
  sachwert?: number;
  ertragswert?: number;
  ertragswertProM2?: number;
  vervielfaeltiger?: string;
  vergleichswertIndirekt?: string;
  vergleichswertDirekt?: string;
  geschaetzterMarktpreis?: number;
  geschaetzterMarktpreisStichtag?: string;
}

// Vollständige Marktpreisermittlung (Sprengnetter-Report), 1:1 aus der Word-Datei
// übernommen. Struktur folgt der Gliederung des Originaldokuments.
export interface WertermittlungsDaten {
  objektart: string;
  adresse: string;
  erstellungsdatum: string;
  wertermittlungsstichtag: string;
  grundstueck: WertermittlungKeyValue[];
  lagescore: WertermittlungKeyValue[];
  gebaeudedaten: WertermittlungKeyValue[];
  mieteinheiten: WertermittlungMieteinheit[];
  energieeffizienz: string[];
  gebaeudestandardMerkmale: WertermittlungKeyValue[];
  modernisierungen: WertermittlungKeyValue[];
  modernisierungsgrad: string;
  bodenwert: {
    proM2: number;
    lage: string;
    quelle: string;
    grundstueck: number;
    gesamt: number;
  };
  gebaeudestandardRnd: {
    standardstufe: number;
    baujahr: number;
    gnd: number;
    rnd: number;
  };
  nhkErmittlung: WertermittlungKeyValue[];
  gebaeudesachwertGesamt: number;
  rohertrag: WertermittlungRohertragZeile[];
  rohertragGesamt: { flaeche: number; einheiten: number; tatsaechlichProJahr: number; angesetztProJahr: number };
  vergleichsmiete: { wert: number; quelle: string; stichtag: string; spanne: string };
  liegenschaftszins: { wert: number; quelle: string; stichtag: string; standardfehler: string; konfidenzintervall: string };
  ertragswertBerechnung: WertermittlungKeyValue[];
  ergebnis: WertermittlungErgebnis;
  erlaeuterungen: { titel: string; text: string }[];
  haftungsausschluss: string;
}

export interface TeamMitglied {
  name: string;
  rolle: string;
  standort?: string;
}

// Auslastungskennzahlen einer Person aus der TEAM-Liste (data/unternehmen.ts) für die
// Mitarbeiterstatistik im Admin-Bereich (siehe app/admin/page.tsx,
// components/admin/Mitarbeiterstatistik.tsx) — Entscheidungsgrundlage dafür, wer ein Objekt nach
// der Akquise (Bewertungspräsentation) übernimmt. Fünf Parameter, siehe Chat-Vorgabe:
//   1. aktiveObjekte        — Objekte mit Status 1 = Aktiv, absoluter Snapshot (kein Zeitfenster).
//   2. objekteInAufarbeitung — Objekte mit Status 1 = Inaktiv UND Status 2 = Vorbereitung,
//                              ebenfalls absoluter Snapshot.
//   3/4. termine*/besichtigungen* — jeweils zwei Werte (letzte 30 Tage UND laufendes
//        Kalenderjahr), da Termine/Besichtigungen Ereignisse über einen Zeitraum sind, kein
//        Snapshot.
//   5. kundenAktiv          — Kunden mit Adressstatus = Aktiv (Status2Adr), Snapshot; die genaue
//                             30-Tage-/Jahres-Interpretation dieses Parameters ist noch offen
//                             (siehe Chat) und wird erst beim Bauen dieses Parameters geklärt.
// Alle Felder `number | null` statt `number` — null bedeutet "noch nicht geladen/kein Live-Abruf
// erfolgt" (siehe Platzhalter-Darstellung in Mitarbeiterstatistik.tsx), analog zum bestehenden
// Muster bei unternehmenKennzahlen (siehe Praesentation weiter unten). Diese Kennzahlen selbst
// werden erst in den nächsten Schritten einzeln implementiert (siehe Chat, "eins nach dem
// anderen") — der Typ hier steckt bereits die volle, abgestimmte Form ab, damit die
// Tabellen-Skeleton-Komponente von Anfang an die richtige Form hat.
export interface MitarbeiterKennzahlen {
  aktiveObjekte: number | null;
  objekteInAufarbeitung: number | null;
  termine30Tage: number | null;
  termineJahr: number | null;
  besichtigungen30Tage: number | null;
  besichtigungenJahr: number | null;
  kundenAktiv: number | null;
}

// Einzelnes Objekt in der aufklappbaren Objektliste je Mitarbeiter (Admin-Bereich, siehe
// Mitarbeiterstatistik.tsx / api/admin/mitarbeiter-objekte) — bewusst ein schlanker Auszug statt
// des vollen Immobilie-Typs (siehe onoffice/mapping.ts), da hier ggf. mehrere Dutzend Objekte auf
// einmal geladen und angezeigt werden. Zeigt laut Chat-Vorgabe je Objekt: Titelbild, Objektnummer,
// Preis, Vermarktungsdauer. "titel" wird NICHT als eigene Spalte angezeigt, bleibt aber als
// Alt-Text fürs Titelbild und für Screenreader-Labels erhalten (kostet keinen zusätzlichen Abruf,
// da objekttitel ohnehin mitgeladen wird).
export interface MitarbeiterObjekt {
  id: string;
  titel: string;
  objektnr: string;
  preis: number;
  // Tage seit Auftragsbeginn (Feld "auftragvon", siehe estate.ts) — null, wenn kein
  // Auftragsdatum hinterlegt ist (OnOffice liefert dafür "0000-00-00" statt eines echten Datums).
  vermarktungsdauerTage: number | null;
  // URL des Titelbilds (siehe ladeTitelbilder in estate.ts) — null, wenn kein Bild hinterlegt ist.
  titelbildUrl: string | null;
}

// Unternehmensweite Summen über ALLE Mitarbeiter hinweg (nicht je Person), für die vier
// Infoboxen über der Mitarbeitertabelle (siehe Mitarbeiterstatistik.tsx, Chat-Vorgabe). Bewusst
// ein eigener, schlanker Typ statt einer Erweiterung von MitarbeiterKennzahlen — hier geht es um
// EINE einzige Gesamtsumme für den ganzen Bestand, nicht um Werte je Mitarbeiter. Ø-Vermarktungsdauer
// und Objektvolumen werden über BEIDE Gruppen (aktive Vermarktung UND Aufarbeitung) zusammen
// berechnet (siehe ladeObjektGesamtKennzahlen in onoffice/mitarbeiterstatistik.ts) — anders als
// die getrennt ausgewiesenen Zähler aufarbeitungGesamt/aktivGesamt, die bewusst pro Gruppe bleiben,
// analog zu den bereits getrennten Spalten "Aktive Objekte"/"Aufarbeitung" in der Tabelle.
export interface ObjektGesamtKennzahlen {
  aufarbeitungGesamt: number | null;
  aktivGesamt: number | null;
  // null, wenn kein Objekt im gesamten Bestand ein auswertbares Auftragsdatum hat.
  durchschnittVermarktungsdauerTage: number | null;
  objektvolumenGesamt: number | null;
}

export interface Standort {
  name: string;
  adresse?: string;
  telefon?: string;
  email?: string;
  // Nur beim Hauptstandort gesetzt (Juli 2026, Nutzerwunsch) — steuert in Unternehmen.tsx die
  // groß hervorgehobene Darstellung mit Bilder-Galerie statt der kompakten Karte.
  hauptstandort?: boolean;
  // Lokale Fotos unter public/standorte/ (nur beim Hauptstandort befüllt, siehe oben) — Pfade
  // sind root-relativ für next/image, z.B. "/standorte/dueren-1.jpg".
  bilder?: string[];
}

export interface Kennzahl {
  label: string;
  wert: string;
}

export type LeistungspaketId = "basis" | "komfort" | "premium";

export interface Leistungspaket {
  id: LeistungspaketId;
  name: string;
  provisionProzent: number;
  empfohlen?: boolean;
  beschreibung: string;
  highlights: string[];
}

export type LeistungsStatus = "ja" | "nein" | "optional";

export interface Leistungsposition {
  bezeichnung: string;
  basis: LeistungsStatus;
  komfort: LeistungsStatus;
  premium: LeistungsStatus;
}

export interface Leistungskategorie {
  nummer: string;
  titel: string;
  positionen: Leistungsposition[];
}

export interface Rahmenbedingung {
  nummer: string;
  titel: string;
  text: string;
}

// Der für das Objekt zuständige Mitarbeiter/die zuständige Mitarbeiterin (z.B. Immobilienberater/in).
// Wird über die OnOffice-Objekt-Mitarbeiter-Relation aufgelöst (siehe onoffice/estate.ts) —
// analog zur Eigentümer-Relation, die den Kunden für die Begrüßung liefert.
export interface Betreuer {
  // Adress-ID des OnOffice-Datensatzes (nicht die Objekt-ID) — wird nur intern verwendet, um
  // den Objekt-Betreuer aus der "weitere Mitarbeiter"-Liste herauszufiltern (Dubletten-Schutz),
  // nicht in der UI angezeigt.
  id?: string;
  anrede?: string;
  vorname: string;
  nachname: string;
  rolle?: string;
  firma?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  telefon?: string;
  mobil?: string;
  email?: string;
  url?: string;
  profilbildUrl?: string;
}

// Ein an das Objekt angehängtes internes Dokument aus OnOffice (resourcetype "file", z.B.
// Grundriss, Energieausweis, Exposé, Teilungserklärung). Nicht zu verwechseln mit Fotos/
// Titelbild — die werden über einen eigenen Weg geladen (ladeTitelbild in onoffice/estate.ts)
// und beim Abruf der Dokumente bewusst ausgefiltert (siehe ladeObjektDokumente).
export interface ObjektDokument {
  id: string;
  titel: string;
  dateiname?: string;
  // OnOffice-Kategorie des Dokuments (z.B. "Foto", "Grundriss", "Energieausweis") — frei
  // vergeben im Backend, keine feste Werteliste.
  typ?: string;
  groesseBytes?: number;
  // Direkte Download-/Anzeige-URL (kommt von OnOffice via includeImageUrl, oder im Mock-Modus
  // aus public/dokumente). Kann fehlen, falls OnOffice für diesen Datensatz keine URL liefert.
  url?: string;
}

export interface Praesentation {
  kunde: Kunde;
  immobilie: Immobilie;
  bewertung: Bewertung;
  betreuer: Betreuer;
  // Der "Setter" des Objekts (individuelles OnOffice-Feld unter "Grunddaten → Technische
  // Angaben", siehe onoffice/estate.ts, ladeSetterAddressId) — anders als betreuer OHNE
  // Mock-Fallback: null ist ein gültiger, echter Zustand (kein Setter für dieses Objekt
  // hinterlegt), Kontaktperson.tsx blendet den zugehörigen Block dann komplett aus.
  setter: Betreuer | null;
  // Weitere Kolleg:innen der Agentur, unabhängig vom Objekt (siehe "Weitere Mitarbeiter"-Slider
  // auf der Kontaktperson-Seite). Enthält nicht den Objekt-Betreuer (bereits oben separat
  // angezeigt) — Dublettenfilterung erfolgt anhand von Betreuer.id.
  weitereMitarbeiter: Betreuer[];
  // Ungefilterte Liste ALLER Mitarbeiter der Agentur (inkl. Objekt-Betreuer), objektunabhängig —
  // wird für den Team-Bereich im "Über uns"-Reiter benötigt (siehe Unternehmen.tsx), der anders
  // als der "weitere Mitarbeiter"-Slider auf der Kontaktperson-Seite bewusst alle elf Personen
  // zeigen soll. Dient dort ausschließlich dazu, echte Profilfotos (profilbildUrl) per
  // Namensabgleich an die statische TEAM-Liste (data/unternehmen.ts) anzureichern.
  alleMitarbeiter: Betreuer[];
  // Interne Dokumente des Objekts (siehe "Dokumente"-Reiter, Dokumente.tsx). Im Live-Betrieb
  // bewusst NICHT auf Demo-Daten zurückgefallen, wenn die Liste leer ist — ein Objekt ohne
  // hinterlegte Dokumente ist ein gültiger, echter Zustand und soll in einer echten
  // Kundenpräsentation nicht durch ein erfundenes Demo-Dokument verschleiert werden.
  dokumente: ObjektDokument[];
  // Live aus OnOffice ermittelte Unternehmenskennzahlen für den "Über uns"-Reiter (siehe
  // Unternehmen.tsx, zaehleVerkaufteObjekte/ladeLetzteKundennummer in onoffice/estate.ts).
  // null, wenn der jeweilige Live-Abruf fehlgeschlagen ist — Unternehmen.tsx zeigt dann einen
  // Platzhalter statt einer erfundenen Zahl. "Portalanfragen" ist NICHT Teil dieses Objekts:
  // Die onOffice-API liefert für resourcetype "statistic" in diesem Account durchgehend den
  // Fehler "missing configuration for resourceType" (live geprüft, Juli 2026, mehrere
  // Parameter-Varianten durchprobiert) — das Statistik-Modul ist für diesen Account nicht per
  // API freigeschaltet. Der Wert bleibt daher als manuell zu pflegende Konstante in
  // data/unternehmen.ts (PORTALANFRAGEN_JAHR), analog zu den Google-Rezensionen.
  unternehmenKennzahlen: { verkaufteObjekte: number | null; kundenNummer: number | null } | null;
  // Automatisch zugeordnete Interessenten (OnOffice-Immo-Matching) für den Objektdaten-Reiter
  // (siehe Objektdaten.tsx). Bereits auf Übereinstimmung 80–100% gefiltert und absteigend
  // sortiert (siehe ladeAutomatischeInteressenten) — Interessenten unter 80% sind hier gar
  // nicht erst enthalten (auf ausdrücklichen Nutzerwunsch Juli 2026). "gesamtAnzahl" ist die
  // Trefferzahl INNERHALB dieses 80–100%-Bereichs (kann trotzdem in die Hunderte gehen) —
  // "liste" ist bereits auf ein Anzeige-Limit gekappt. null, wenn der Live-Abruf fehlgeschlagen
  // ist oder im Mock-Modus bewusst kein Demo-Block gewünscht ist; Objektdaten.tsx blendet den
  // Block dann aus.
  automatischeInteressenten: { liste: Interessent[]; gesamtAnzahl: number } | null;
  quelle: "live" | "mock";
}
