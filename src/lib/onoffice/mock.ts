import { Betreuer, Bewertung, Immobilie, Kunde, ObjektDokument } from "@/types";
import { MOCK_WERTERMITTLUNG } from "@/data/wertermittlung";
import { TEAM } from "@/data/unternehmen";

// Demo-Datensatz für die Entwicklung, solange die Live-Anbindung (siehe config.ts) blockiert ist.
export const MOCK_KUNDE: Kunde = {
  anrede: "Frau",
  vorname: "Nicole",
  nachname: "Hartmann",
  email: "nicole.hartmann@beispiel.de",
};

// Werte 1:1 aus dem OnOffice-Impressum-Formular des Benutzer-Accounts übernommen (vom Kunden
// per Screenshot bestätigt, Juli 2026). Kein Profilbild hinterlegt (profilbildUrl bleibt
// undefined) — die Kontaktperson-Sektion zeigt in diesem Fall bewusst einen Initialen-Avatar
// statt eines Platzhalterfotos.
export const MOCK_BETREUER: Betreuer = {
  anrede: "Herr",
  vorname: "Robin",
  nachname: "Kolbe",
  rolle: "Geschäftsführer, Marketing, Immobilienbewerter IHK",
  firma: "Parma Immobilien",
  strasse: "Monschauer Straße 64",
  plz: "52355",
  ort: "Düren / Altes Stadtgebiet",
  telefon: "(+49) 2421 9748688",
  mobil: "(+49) 157 38311348",
  email: "r.kolbe@parmaimmobilien.com",
  url: "www.parmaimmobilien.de",
};

// Telefon/E-Mail live gegen den echten OnOffice-Account geprüft (Juli 2026, siehe
// ladeAlleMitarbeiter in estate.ts für dieselbe Zuordnung im Live-Betrieb) — bewusst nur die
// geschäftliche Adresse/Rufnummer (Firmensitz Monschauer Straße 64), keine privaten
// Zweitdatensätze. Für Tim Hartwich existiert auf dem geschäftlichen Datensatz keine
// Telefonnummer, für Daniel Parma, Sarah Barth und Dawid Parma ebenso wenig — für sie bleibt
// telefon/email entsprechend unvollständig, statt Daten zu erfinden. Celin Borgwaldt wurde
// (Stand Juli 2026, laut OnOffice zum 30.06.2026 deaktiviert) aus TEAM entfernt und taucht
// hier daher nicht mehr auf.
const WEITERE_MITARBEITER_KONTAKT: Record<string, { telefon?: string; email?: string }> = {
  "Daniel Parma": { email: "d.parma@parmaimmobilien.com" },
  "Kira Woldt": { telefon: "0151 61033905", email: "k.woldt@parmaimmobilien.com" },
  "Jacqueline Henot": { telefon: "0157 31935118", email: "j.henot@parmaimmobilien.com" },
  "Vanessa Krifft": { telefon: "0151 57879899", email: "v.krifft@parmaimmobilien.com" },
  "Sarah Barth": { email: "s.barth@parmaimmobilien.com" },
  "Stanimira Georgieva": { telefon: "02421 9748688", email: "s.georgieva@parmaimmobilien.com" },
  "Katharina Becker": { telefon: "02421 9748688", email: "k.becker@parmaimmobilien.com" },
  "Axel Wehmeier": { telefon: "0151 61837063", email: "a.wehmeier@parmaimmobilien.com" },
  "Dawid Parma": { email: "da.parma@parmaimmobilien.com" },
};

// "Weitere Mitarbeiter"-Slider auf der Kontaktperson-Seite: nutzt dieselbe Team-Quelle wie die
// Über-uns-Sektion (TEAM aus data/unternehmen.ts, dort Quellenangabe Parma-Wissensdatei),
// abzüglich des Objekt-Betreuers (Robin Kolbe), der bereits oben als Hauptkontakt angezeigt
// wird, angereichert um die oben verifizierten Kontaktdaten. Profilbild bleibt für alle
// undefined (im address-Modul dieses Accounts existiert kein Bild-Feld) — die
// Kontaktperson-Sektion zeigt in diesem Fall bewusst einen Initialen-Avatar.
export const MOCK_WEITERE_MITARBEITER: Betreuer[] = TEAM.filter((t) => t.name !== "Robin Kolbe").map(
  (t) => {
    const teile = t.name.split(" ");
    return {
      vorname: teile.slice(0, -1).join(" "),
      nachname: teile[teile.length - 1],
      rolle: t.rolle,
      ...WEITERE_MITARBEITER_KONTAKT[t.name],
    };
  }
);

// Ungefilterte Team-Liste (alle elf Personen inkl. Robin Kolbe) für den "Über uns"-Reiter
// (siehe Unternehmen.tsx und Praesentation.alleMitarbeiter) — dort soll anders als im
// "weitere Mitarbeiter"-Slider auf der Kontaktperson-Seite bewusst niemand aus der
// Team-Übersicht herausgefiltert werden.
export const MOCK_ALLE_MITARBEITER: Betreuer[] = [MOCK_BETREUER, ...MOCK_WEITERE_MITARBEITER];

export const MOCK_IMMOBILIE: Immobilie = {
  id: "demo-1001",
  immoNr: "PI-1001",
  bezeichnung: "Freistehendes Einfamilienhaus, Düren-Rölsdorf",
  kaufpreis: 385000,
  wohnflaeche: 145,
  grundstuecksflaeche: 520,
  anzahlZimmer: 5,
  ort: "Düren",
  plz: "52355",
  strasse: "Am Rölsdorfer Feld 12",
  objektart: "Einfamilienhaus",
  baujahr: 1998,
  zustand: "gepflegt",
  energieklasse: "C",
  modernisierungen: ["Bad 2016 saniert", "Fenster 2019 erneuert", "Heizung 2021 modernisiert"],
  objektbeschreibung:
    "Fünf Zimmer, 145 m², ruhige Wohnlage am Ortsrand. Boden gepflegt, Bad 2016 saniert.",
  // Demo-Wert für den seit Juli 2026 im "DeepImmo"-Reiter angezeigten Link (siehe DeepImmo.tsx)
  // — im Live-Betrieb aktuell bei keinem Objekt hinterlegt (Individualfeld ind_3450_Feld_ObjTech540,
  // erst kürzlich vom Kunden angelegt), hier aber mit dem vom Kunden selbst genannten
  // Beispiel-Link befüllt, damit sich der befüllte Zustand im Demo-Modus testen lässt.
  deepImmoLink: "https://realestateos.deepimmo.com/property/mg0-1uw/overview",
};

// Werte 1:1 aus der Sprengnetter-Marktpreisermittlung (Word-Export) übernommen — siehe
// src/data/wertermittlung.ts. Übergangslösung für den Test; Sachwert/Vergleichswert wurden
// im Originalbericht nicht berechnet (Ertragswertverfahren gewählt) und bleiben daher leer.
export const MOCK_BEWERTUNG: Bewertung = {
  sachwert: undefined,
  ertragswert: 542000,
  vergleichswert: undefined,
  empfohlenerAngebotspreis: 542000,
  stand: "13.05.2026",
  berechnetAutomatisch: false,
  wertermittlung: MOCK_WERTERMITTLUNG,
  // Original PDF-Export der Sprengnetter-Marktpreisermittlung, vorab hochgeladen und unter
  // public/dokumente abgelegt. Wird direkt über den "Bewertung"-Reiter verlinkt (Bewertung.tsx).
  pdfUrl: "/dokumente/bewertung-demo-1001.pdf",
  // Demo-Werte für die im Bewertung-Reiter seit Juli 2026 angezeigten PriceHubble-Felder —
  // grob passend zum Kaufpreis aus MOCK_IMMOBILIE (385.000 €), damit der Demo-Modus eine
  // plausible Marktwertspanne zeigt statt echter, live geladener Zahlen.
  marktwertPH: 392000,
  marktwertMinPH: 368000,
  marktwertMaxPH: 415000,
};

// Demo-Datensatz für den "Dokumente"-Reiter (nur im Mock-Modus verwendet, siehe
// praesentation.ts — im Live-Betrieb wird bei fehlenden Dokumenten bewusst NICHT auf diese
// Demo-Daten zurückgefallen, sondern der echte leere Zustand angezeigt). Nutzt bewusst
// dieselbe real unter public/dokumente hinterlegte PDF wie MOCK_BEWERTUNG.pdfUrl oben, damit
// der Reiter im Demo-Modus ein tatsächlich existierendes, klickbares Dokument zeigt statt
// einer erfundenen Datei ohne echten Inhalt dahinter.
export const MOCK_DOKUMENTE: ObjektDokument[] = [
  {
    id: "demo-doc-1",
    titel: "Marktpreisermittlung (Sprengnetter)",
    dateiname: "bewertung-demo-1001.pdf",
    typ: "Gutachten",
    groesseBytes: 636291,
    url: "/dokumente/bewertung-demo-1001.pdf",
  },
];

export const MOCK_VERGLEICHSPOOL: Immobilie[] = [
  {
    id: "demo-2001",
    immoNr: "PI-2001",
    bezeichnung: "Einfamilienhaus, Düren-Rölsdorf",
    kaufpreis: 379000,
    wohnflaeche: 150,
    ort: "Düren",
    plz: "52355",
    objektart: "Einfamilienhaus",
    baujahr: 2000,
    modernisierungen: ["Bad 2018 saniert", "Fenster 2020 erneuert"],
  },
  {
    id: "demo-2002",
    immoNr: "PI-2002",
    bezeichnung: "Einfamilienhaus, Düren-Mitte",
    kaufpreis: 399000,
    wohnflaeche: 138,
    ort: "Düren",
    plz: "52349",
    objektart: "Einfamilienhaus",
    baujahr: 1995,
    modernisierungen: ["Heizung 2019 modernisiert"],
  },
  {
    id: "demo-2003",
    immoNr: "PI-2003",
    bezeichnung: "Doppelhaushälfte, Kreuzau",
    kaufpreis: 342000,
    wohnflaeche: 132,
    ort: "Kreuzau",
    plz: "52372",
    objektart: "Doppelhaushälfte",
    baujahr: 1994,
    modernisierungen: ["Bad 2015 saniert"],
  },
  {
    id: "demo-2004",
    immoNr: "PI-2004",
    bezeichnung: "Einfamilienhaus, Jülich",
    kaufpreis: 365000,
    wohnflaeche: 148,
    ort: "Jülich",
    plz: "52428",
    objektart: "Einfamilienhaus",
    baujahr: 2001,
    modernisierungen: ["Bad 2017 saniert", "Fenster 2021 erneuert", "Dach 2022 erneuert"],
  },
  {
    id: "demo-2005",
    immoNr: "PI-2005",
    bezeichnung: "Einfamilienhaus, Düren-Rölsdorf",
    kaufpreis: 410000,
    wohnflaeche: 160,
    ort: "Düren",
    plz: "52355",
    objektart: "Einfamilienhaus",
    baujahr: 2005,
    modernisierungen: ["Heizung 2020 modernisiert", "Fenster 2020 erneuert"],
  },
  {
    id: "demo-2006",
    immoNr: "PI-2006",
    bezeichnung: "Reihenendhaus, Niederzier",
    kaufpreis: 298000,
    wohnflaeche: 118,
    ort: "Niederzier",
    plz: "52382",
    objektart: "Reihenhaus",
    baujahr: 1988,
    modernisierungen: [],
  },
  {
    id: "demo-2007",
    immoNr: "PI-2007",
    bezeichnung: "Einfamilienhaus, Düren-Birkesdorf",
    kaufpreis: 355000,
    wohnflaeche: 140,
    ort: "Düren",
    plz: "52353",
    objektart: "Einfamilienhaus",
    baujahr: 1992,
    modernisierungen: ["Bad 2014 saniert", "Fenster 2018 erneuert"],
  },
  {
    id: "demo-2008",
    immoNr: "PI-2008",
    bezeichnung: "Bungalow, Merzenich",
    kaufpreis: 320000,
    wohnflaeche: 110,
    ort: "Merzenich",
    plz: "52399",
    objektart: "Bungalow",
    baujahr: 1985,
    modernisierungen: ["Heizung 2017 modernisiert"],
  },
];
