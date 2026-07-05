import { Betreuer, Bewertung, Immobilie, Kunde } from "@/types";
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
// Zweitdatensätze. Für Celin Borgwaldt und Tim Hartwich existiert in OnOffice keine
// verknüpfte Adresse, für Daniel Parma und Sarah Barth ist auf dem geschäftlichen Datensatz
// keine Telefonnummer hinterlegt — für sie bleibt telefon/email entsprechend unvollständig,
// statt Daten zu erfinden.
const WEITERE_MITARBEITER_KONTAKT: Record<string, { telefon?: string; email?: string }> = {
  "Daniel Parma": { email: "d.parma@parmaimmobilien.com" },
  "Kira Woldt": { telefon: "0151 61033905", email: "k.woldt@parmaimmobilien.com" },
  "Jacqueline Henot": { telefon: "0157 31935118", email: "j.henot@parmaimmobilien.com" },
  "Vanessa Krifft": { telefon: "0151 57879899", email: "v.krifft@parmaimmobilien.com" },
  "Sarah Barth": { email: "s.barth@parmaimmobilien.com" },
  "Stanimira Georgieva": { telefon: "02421 9748688", email: "s.georgieva@parmaimmobilien.com" },
  "Katharina Becker": { telefon: "02421 9748688", email: "k.becker@parmaimmobilien.com" },
  "Axel Wehmeier": { telefon: "0151 61837063", email: "a.wehmeier@parmaimmobilien.com" },
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
  // public/dokumente abgelegt. Wird 1:1 im PDF-Viewer der Objektbewertung-Sektion angezeigt.
  pdfUrl: "/dokumente/bewertung-demo-1001.pdf",
};

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
