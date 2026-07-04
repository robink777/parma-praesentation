import { WertermittlungsDaten } from "@/types";

// 1:1 aus der Sprengnetter-Marktpreisermittlung (Word-Export) übernommen.
// Testdatensatz für das Objekt Holzstraße 52, 52349 Düren (Mehrfamilienhaus).
// Übergangslösung: manuell eingelesen — siehe Hinweis am Bewertung-Typ.
export const MOCK_WERTERMITTLUNG: WertermittlungsDaten = {
  objektart: "Mehrfamilienhaus (ab 3 Wohneinheiten)",
  adresse: "52349 Düren, Holzstraße 52",
  erstellungsdatum: "29.05.2026",
  wertermittlungsstichtag: "13.05.2026",

  grundstueck: [
    { label: "Gesamtgröße des Grundstücks", wert: "213 m²" },
    { label: "Gemeinde", wert: "Düren" },
    { label: "Einwohnerzahl", wert: "94.568" },
    { label: "Kreis", wert: "Düren" },
    { label: "Bundesland", wert: "Nordrhein-Westfalen" },
  ],

  lagescore: [
    { label: "Lagescore für den Kreis Düren", wert: "-1 (befriedigend)" },
    { label: "Lagescore für das Bundesland Nordrhein-Westfalen", wert: "0 (befriedigend)" },
    { label: "Lagescore für Deutschland", wert: "0 (befriedigend)" },
    { label: "Lagescore für die Objektlage (Mikrolage)", wert: "0 (befriedigend)" },
  ],

  gebaeudedaten: [
    { label: "Baujahr", wert: "1950" },
    { label: "Wohnfläche", wert: "398 m²" },
    { label: "Anzahl Wohneinheiten", wert: "6" },
    { label: "Anzahl der Geschosse (ohne DG und KG)", wert: "4" },
    { label: "Aufzug", wert: "nein" },
    { label: "Besondere Bauweise", wert: "keine Angabe" },
    { label: "Grundrissart", wert: "Einspänner" },
  ],

  mieteinheiten: [
    { bezeichnung: "EG", nutzung: "Wohnen", flaeche: 75, anzahl: 1, tatsaechlicheMiete: 425.0, geschosslage: "Erdgeschoss (ebenerdig)", balkon: "Nein", gartennutzung: "Ja" },
    { bezeichnung: "1.OG", nutzung: "Wohnen", flaeche: 84, anzahl: 1, tatsaechlicheMiete: 535.0, geschosslage: "1. Obergeschoss", balkon: "Nein", gartennutzung: "Nein" },
    { bezeichnung: "1.OG", nutzung: "Wohnen", flaeche: 84, anzahl: 1, tatsaechlicheMiete: 510.0, geschosslage: "2. Obergeschoss", balkon: "Nein", gartennutzung: "Nein" },
    { bezeichnung: "1.OG", nutzung: "Wohnen", flaeche: 84, anzahl: 1, tatsaechlicheMiete: 520.0, geschosslage: "3. Obergeschoss", balkon: "Nein", gartennutzung: "Nein" },
    { bezeichnung: "1.OG", nutzung: "Wohnen", flaeche: 32, anzahl: 1, tatsaechlicheMiete: 430.0, geschosslage: "4. Obergeschoss", balkon: "Nein", gartennutzung: "Nein" },
    { bezeichnung: "1.OG", nutzung: "Wohnen", flaeche: 39, anzahl: 1, tatsaechlicheMiete: 360.0, geschosslage: "4. Obergeschoss", balkon: "Nein", gartennutzung: "Nein" },
  ],

  energieeffizienz: [
    "Die zugrundeliegenden energetischen Eigenschaften des Gebäudes wurden bei der Bestimmung des Modernisierungsgrads und der Gebäudestandardermittlung berücksichtigt.",
    "Ein Energieausweis liegt zum Zeitpunkt der Wertermittlung nicht vor.",
  ],

  gebaeudestandardMerkmale: [
    { label: "Abstellraum", wert: "ja" },
    { label: "Separates Gäste-WC", wert: "nein" },
    { label: "Außenwände überwiegend gedämmt", wert: "nein" },
    { label: "Außenwohnbereiche", wert: "kein nutzbarer Balkon/Loggia" },
    { label: "Heizung", wert: "Gebäude- od. Wohnungszentralheizung" },
    { label: "Dacheindeckung", wert: "Dachpfannen/-ziegel" },
    { label: "Fenster", wert: "zweifach verglast" },
  ],

  modernisierungen: [
    { label: "Bodenbeläge, Wandverkleidungen und Treppenhaus", wert: "komplett" },
    { label: "Bäder und WCs (Fliesen und Sanitärobjekte)", wert: "keine" },
    { label: "Heizung (Brenner, ggf. Kessel)", wert: "teilweise" },
    { label: "Strom, Ab(Wasser), Heizungsleitungen und Heizkörper", wert: "keine" },
    { label: "Fenster (Rahmen und Isolierverglasung)", wert: "keine" },
    { label: "Wärmedämmung", wert: "keine" },
    { label: "Dach (Eindeckung und Wärmedämmung)", wert: "komplett" },
    { label: "Raumaufteilung (Grundriss, Zimmergrößen)", wert: "keine" },
  ],
  modernisierungsgrad: "mittlerer Modernisierungsgrad (7 von max. 20 Punkten)",

  bodenwert: {
    proM2: 420.0,
    lage: "Holzstraße 52, 52349 Düren, Deutschland",
    quelle: "Daten der Gutachterausschüsse für Grundstückswerte (BORIS-D)",
    grundstueck: 89460,
    gesamt: 89460,
  },

  gebaeudestandardRnd: {
    standardstufe: 2.79,
    baujahr: 1950,
    gnd: 69,
    rnd: 26,
  },

  nhkErmittlung: [
    { label: "NHK-2010-Typ", wert: "4.1" },
    { label: "NHK-2010-Grundwert", wert: "825 €/m²" },
    { label: "Zu-/Abschlag Gebäudestandard", wert: "-22 €/m²" },
    { label: "Zwischensumme", wert: "803 €/m²" },
    { label: "Anpassungsfaktor Wohnungsgröße", wert: "0,952" },
    { label: "Anpassungsfaktor Einspänner", wert: "1,050" },
    { label: "NHK-Wert (inkl. 19,00 % BNK)", wert: "803 €/m²" },
  ],
  gebaeudesachwertGesamt: 426004,

  rohertrag: [
    { nutzung: "Wohnen", bezeichnung: "EG", rndJahre: 26, lzsProzent: 3.05, flaeche: 75, tatsaechlicheMieteProM2: 425.0, tatsaechlicheMieteProJahr: 382500, angesetzterRohertragProM2: 7.41, angesetzterRohertragProJahr: 6669 },
    { nutzung: "Wohnen", bezeichnung: "1.OG", rndJahre: 26, lzsProzent: 3.05, flaeche: 84, tatsaechlicheMieteProM2: 535.0, tatsaechlicheMieteProJahr: 539280, angesetzterRohertragProM2: 7.24, angesetzterRohertragProJahr: 7298 },
    { nutzung: "Wohnen", bezeichnung: "1.OG", rndJahre: 26, lzsProzent: 3.05, flaeche: 84, tatsaechlicheMieteProM2: 510.0, tatsaechlicheMieteProJahr: 514080, angesetzterRohertragProM2: 7.34, angesetzterRohertragProJahr: 7399 },
    { nutzung: "Wohnen", bezeichnung: "1.OG", rndJahre: 26, lzsProzent: 3.05, flaeche: 84, tatsaechlicheMieteProM2: 520.0, tatsaechlicheMieteProJahr: 524160, angesetzterRohertragProM2: 7.40, angesetzterRohertragProJahr: 7459 },
    { nutzung: "Wohnen", bezeichnung: "1.OG", rndJahre: 26, lzsProzent: 3.05, flaeche: 32, tatsaechlicheMieteProM2: 430.0, tatsaechlicheMieteProJahr: 165120, angesetzterRohertragProM2: 8.34, angesetzterRohertragProJahr: 3203 },
    { nutzung: "Wohnen", bezeichnung: "1.OG", rndJahre: 26, lzsProzent: 3.05, flaeche: 39, tatsaechlicheMieteProM2: 360.0, tatsaechlicheMieteProJahr: 168480, angesetzterRohertragProM2: 8.18, angesetzterRohertragProJahr: 3828 },
  ],
  rohertragGesamt: { flaeche: 398, einheiten: 6, tatsaechlichProJahr: 2293620, angesetztProJahr: 35856 },

  vergleichsmiete: {
    wert: 7.28,
    quelle: "Sprengnetter",
    stichtag: "01.01.2026",
    spanne: "6,74 – 7,78 €/m²",
  },

  liegenschaftszins: {
    wert: 3.05,
    quelle: "Sprengnetter",
    stichtag: "01.01.2026",
    standardfehler: "3,70 %",
    konfidenzintervall: "2,83 – 3,27",
  },

  ertragswertBerechnung: [
    { label: "Jährlicher Rohertrag", wert: "35.856 €" },
    { label: "Summe Verwaltung, Instandhaltung, Mietausfallwagnis", wert: "24,13 %" },
    { label: "Bewirtschaftungskosten absolut", wert: "8.652 €" },
    { label: "Jährlicher Reinertrag", wert: "27.204 €" },
    { label: "Gewichteter Liegenschaftszinssatz", wert: "3,05 %" },
    { label: "Reinertragsanteil des Bodens (dem Gebäude zugeordnet)", wert: "- 2.729 €" },
    { label: "Ertrag der baulichen und sonstigen Anlagen", wert: "24.475 €" },
    { label: "Barwertfaktor/Vervielfältiger (RND 26 Jahre)", wert: "x 17,774" },
    { label: "Ertragswert der baulichen und sonstigen Anlagen", wert: "435.019 €" },
    { label: "Kapitalisierte Mehr-/Mindermiete", wert: "+ 18.000 €" },
    { label: "Bodenwert (dem Gebäude zugeordnet)", wert: "+ 89.460 €" },
    { label: "Ertragswert", wert: "542.479 € (rd. 542.000 €)" },
  ],

  ergebnis: {
    bodenwert: 89460,
    bodenwertProM2: 420,
    sachwert: undefined,
    ertragswert: 542000,
    ertragswertProM2: 1362,
    vervielfaeltiger: "15,1-facher RoE",
    vergleichswertIndirekt: "nicht gerechnet",
    vergleichswertDirekt: "nicht gerechnet",
    geschaetzterMarktpreis: 542000,
    geschaetzterMarktpreisStichtag: "13.05.2026",
  },

  erlaeuterungen: [
    {
      titel: "Verfahrenswahl",
      text: "Die Verfahrenswahl für die Marktwertermittlung erfolgte entsprechend den Vorgaben der Immobilienwertermittlungsverordnung (ImmoWertV) auf der Grundlage der üblichen Nutzung derartiger Immobilien sowie der Verfügbarkeit und Eignung der zu ihrer marktkonformen Bewertung wesentlichen Daten. Demnach wurde der Marktwert mit Hilfe des Ertragswertverfahrens ermittelt.",
    },
    {
      titel: "Bodenwert",
      text: "Die Bodenwertermittlung basiert auf einem durchschnittlichen Lagewert des Bodens, der für eine Mehrheit von Grundstücken gilt, die zu einer Zone zusammengefasst werden, für die im Wesentlichen gleiche Nutzungs- und Wertverhältnisse vorliegen. Er ist bezogen auf den Quadratmeter Grundstücksfläche und einen bestimmten Stichtag.",
    },
    {
      titel: "Rohertrag",
      text: "Der Rohertrag umfasst alle bei ordnungsgemäßer Bewirtschaftung und zulässiger Nutzung marktüblich erzielbaren Erträge aus dem Grundstück. Bei der Ermittlung des Rohertrags ist von den üblichen (nachhaltig gesicherten) Einnahmemöglichkeiten des Grundstücks auszugehen. In dieser Wertermittlung wurden die für das Objekt marktüblich erzielbaren Mieten angesetzt, basierend auf dem Sprengnetter-Vergleichsmietensystem.",
    },
    {
      titel: "Bewirtschaftungskosten",
      text: "Die Bewirtschaftungskosten sind marktüblich entstehende Aufwendungen, die für eine ordnungsgemäße Bewirtschaftung und zulässige Nutzung des Grundstücks laufend erforderlich sind. Sie umfassen Verwaltungskosten, Instandhaltungskosten und Mietausfallwagnis und basieren auf den in der ImmoWertV veröffentlichten Einzelkostenansätzen.",
    },
    {
      titel: "Liegenschaftszinssatz",
      text: "Der Liegenschaftszinssatz ist eine Rechengröße im Ertragswertverfahren. Der hierzu angesetzte Liegenschaftszinssatz wurde in massenhaften Kaufpreisanalysen durch Sprengnetter für die Lage des Bewertungsgrundstücks bestimmt.",
    },
    {
      titel: "Barwertfaktor/Kapitalisierungsfaktor",
      text: "Mit dem Barwertfaktor/Kapitalisierungsfaktor wird der jährliche Reinertrag der baulichen und sonstigen Anlagen über die Restnutzungsdauer mit dem Liegenschaftszinssatz kapitalisiert, d.h. es wird der Barwert des zeitlich befristeten Reinertrags der baulichen und sonstigen Anlagen bestimmt.",
    },
    {
      titel: "Gesamtnutzungsdauer (GND)",
      text: "Die übliche wirtschaftliche Nutzungsdauer (= Gesamtnutzungsdauer) beträgt je nach Gebäudeart und Gebäudestandard zwischen 60 und 80 Jahren.",
    },
    {
      titel: "Restnutzungsdauer (RND)",
      text: "Die Restnutzungsdauer ist die Zahl der Jahre, in denen die baulichen Anlagen bei ordnungsgemäßer Bewirtschaftung voraussichtlich noch wirtschaftlich genutzt werden können. Sie wurde auf Grundlage des Baujahres, des Gebäudestandards und der durchgeführten Modernisierungen ermittelt.",
    },
    {
      titel: "Marktpreis",
      text: "Als Marktpreis wurde der bei einem anstehenden Immobilienverkauf am wahrscheinlichsten zu erzielende Kaufpreis ermittelt — der Preis, den wirtschaftlich vernünftig handelnde Marktteilnehmer unter Beachtung aller wertbeeinflussenden Eigenschaften des Grundstücks zum Wertermittlungsstichtag durchschnittlich aushandeln würden.",
    },
  ],

  haftungsausschluss:
    "Die Marktpreisermittlung dient ausschließlich der Einschätzung des voraussichtlich für eine Immobilie zu erzielenden Marktpreises und unterscheidet sich insofern von einem formalen Gutachten. Sie ist ausschließlich zur Nutzung durch den Immobilieneigentümer bestimmt, stellt kein Gutachten im Sinne des geltenden deutschen Rechts dar und basiert auf den Angaben des Kunden sowie statistischen und weiteren Daten. Für etwaige Abweichungen von tatsächlich erzielten Kauf- und/oder Verkaufspreisen wird jedwede Haftung ausgeschlossen; sie ist insgesamt auf Vorsatz und grobe Fahrlässigkeit sowie auf den für die Erstellung erhobenen Betrag begrenzt.",
};
