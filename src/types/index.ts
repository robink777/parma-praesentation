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
  bildUrl?: string;
  bilder?: string[];
  objektart?: string;
  baujahr?: number;
  zustand?: string;
  energieklasse?: string;
  modernisierungen?: string[];
  objektbeschreibung?: string;
  lat?: number;
  lng?: number;
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
  wertermittlung?: WertermittlungsDaten;
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

export interface MatchDetails {
  lage: number;
  wohnflaeche: number;
  baujahr: number;
  modernisierung: number;
}

export interface Vergleichsobjekt extends Immobilie {
  matchScore: number;
  matchDetails: MatchDetails;
}

export interface VergleichsergebnisMeta {
  angewandterSchwellwert: number;
  gefundeneAnzahl: number;
}

export interface FinanzierungsDaten {
  kaufpreis: number;
  eigenkapital: number;
  zinssatz: number;
  laufzeitJahre: number;
  tilgungProzent: number;
  bundesland: string;
  mitMakler: boolean;
  maklerProzent: number;
}

export interface Nebenkosten {
  grunderwerbsteuer: number;
  notarkosten: number;
  grundbucheintrag: number;
  maklercourtage: number;
  gesamt: number;
}

export interface FinanzierungsErgebnis {
  darlehensbetrag: number;
  monatlicheRate: number;
  jaehrlicheRate: number;
  gesamtkosten: number;
  gesamtzinsen: number;
  nebenkosten: Nebenkosten;
  eigenkapitalanteilProzent: number;
  tilgungsplan: TilgungsplanZeile[];
}

export interface TilgungsplanZeile {
  jahr: number;
  restschuld: number;
  tilgung: number;
  zinsen: number;
  rate: number;
}

export type Bundesland =
  | "Baden-Württemberg"
  | "Bayern"
  | "Berlin"
  | "Brandenburg"
  | "Bremen"
  | "Hamburg"
  | "Hessen"
  | "Mecklenburg-Vorpommern"
  | "Niedersachsen"
  | "Nordrhein-Westfalen"
  | "Rheinland-Pfalz"
  | "Saarland"
  | "Sachsen"
  | "Sachsen-Anhalt"
  | "Schleswig-Holstein"
  | "Thüringen";

export interface Ablaufpunkt {
  uhrzeit: string;
  titel: string;
  beschreibung?: string;
}

export interface TeamMitglied {
  name: string;
  rolle: string;
  standort?: string;
}

export interface Standort {
  name: string;
  adresse?: string;
  telefon?: string;
  email?: string;
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

// Editierbarer Abschnitt (§10): Paketwahl und Unterschrift werden im Beratungstermin
// gemeinsam mit dem Kunden festgelegt — Auftragsnummer trägt das Präfix "PI-{Jahr}-".
export interface LeistungsversprechenVereinbarung {
  gewaehltesPaket?: LeistungspaketId;
  unterschriftOrt?: string;
  unterschriftDatum?: string;
  auftragsnummer?: string;
  beraterIn?: string;
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

export interface Praesentation {
  kunde: Kunde;
  immobilie: Immobilie;
  bewertung: Bewertung;
  betreuer: Betreuer;
  // Weitere Kolleg:innen der Agentur, unabhängig vom Objekt (siehe "Weitere Mitarbeiter"-Slider
  // auf der Kontaktperson-Seite). Enthält nicht den Objekt-Betreuer (bereits oben separat
  // angezeigt) — Dublettenfilterung erfolgt anhand von Betreuer.id.
  weitereMitarbeiter: Betreuer[];
  quelle: "live" | "mock";
}
