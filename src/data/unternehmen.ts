import { Kennzahl, Standort, TeamMitglied } from "@/types";

// Quelle: Parma-Wissensdatei (parma_wissensbasis.md, Stand Mai 2026, Interview mit Robin Kolbe).
// Düren ist der Hauptstandort (auf Nutzerwunsch Juli 2026 groß hervorgehoben, siehe
// Unternehmen.tsx) — Fotos liegen lokal unter public/standorte/ (vom Nutzer bereitgestellt).
// Jeder Standort zeigt auf ausdrücklichen Nutzerwunsch genau EIN Foto (kein Galerie-Raster mehr).
//
// Kreuzau hat seit August 2026 ein eigenes Standort-Foto (kreuzau-1.jpg, vom Nutzer bereitgestellt
// — Empfangs-/Loungebereich mit "Parma Immobilien"-Neonschrift an der Pflanzenwand), ersetzt den
// vorherigen Düren-Platzhalter. Jülich hat weiterhin KEIN eigenes Foto — bis eines vorliegt, zeigt
// es laut ausdrücklicher Nutzeranweisung übergangsweise eines der Düren-Fotos als Platzhalter.
export const STANDORTE: Standort[] = [
  {
    name: "Düren",
    adresse: "Monschauer Straße 64, 52355 Düren",
    hauptstandort: true,
    bilder: ["/standorte/dueren-1.jpg"],
  },
  { name: "Kreuzau", adresse: "Hauptstraße 80, 52372 Kreuzau", bilder: ["/standorte/kreuzau-1.jpg"] },
  { name: "Jülich", adresse: "Gereonstraße 1, 52428 Jülich", bilder: ["/standorte/dueren-3.jpg"] },
];

export const KENNZAHLEN: Kennzahl[] = [
  { label: "Jahre Erfahrung", wert: "6" },
  { label: "Standorte", wert: "3" },
  { label: "Team", wert: "11" },
];

// Google-Bewertung: bewusst NICHT Teil der KENNZAHLEN-Karten-Grid, sondern eigener Abschnitt mit
// eigenem Untertitel zwischen den Unternehmenskennzahlen und "Standorte" (siehe Unternehmen.tsx)
// — Sterne-Bewertung und Rezensionsanzahl gehören inhaltlich zusammen und werden dort wieder
// gemeinsam dargestellt.
export const GOOGLE_BEWERTUNG = { sterne: 5.0, anzahlRezensionen: 241 };

// "Portalanfragen Gesamt" aus dem OnOffice-Statistikreiter — anders als "Verkaufte Objekte" und
// "Kunden" NICHT live aus der API abrufbar: resourcetype "statistic" liefert für diesen Account
// durchgehend den Fehler "missing configuration for resourceType" (live geprüft, Juli 2026,
// mehrere Actionid-/Parameter-Varianten durchprobiert) — das Statistik-Modul ist dort nicht per
// API freigeschaltet, nur im OnOffice-Backend selbst einsehbar. Wert daher manuell gepflegt, bei
// Bedarf im OnOffice-Backend unter dem Statistikreiter nachschlagen und hier aktualisieren.
// Stand laut Nutzerangabe: Juli 2026.
export const PORTALANFRAGEN_JAHR = 16004;

// Team-Roster, Stand Juli 2026: Live gegen den OnOffice-Account abgeglichen (resourcetype
// "user"). Celin Borgwaldt wurde dabei zum 30.06.2026 als deaktiviert festgestellt (Benutzerkonto
// nicht mehr aktiv) und auf Nutzerwunsch aus der Liste entfernt. Dawid Parma wurde ergänzt: aktiver
// Benutzer in OnOffice (da.parma@parmaimmobilien.com, Adress-ID 44851), der zuvor nicht in dieser
// Liste stand. Für ihn ist wie für alle anderen kein "jobPosition"-Feld in OnOffice gepflegt
// (das Feld ist dort für jeden bisher geprüften Mitarbeiter leer) — Rolle daher auf Nutzerangabe
// "Immobilienmakler" gesetzt, kein Profilfoto in OnOffice hinterlegt (erscheint vorerst mit
// Initialen-Avatar, siehe Unternehmen.tsx).
//
// adressId/nutzerNr/benutzername (Juli 2026 hierher konsolidiert, siehe TeamMitglied in
// types/index.ts für die Herleitung/den Grund): drei unterschiedliche OnOffice-ID-Räume für
// dieselbe Person — adressId fürs address-Modul (Kontaktdaten), nutzerNr fürs user-Modul
// (Objekt-Betreuer-Zuordnung, Statistik), benutzername der dort zusätzlich verwendete
// Kurz-Login-Name. Celin Borgwaldt/Christian Rother/Tabea Erz/Nilgün Akbay/Santino Giese haben
// bewusst KEINEN Eintrag (siehe Datenschutz-/Status-Hinweis, der früher bei
// MITARBEITER_LIVE_ADRESS_IDS in onoffice/estate.ts stand): mehrere Personen haben in OnOffice
// zusätzlich einen privaten Adressdatensatz (Wohnanschrift/private Kontaktdaten) — hier ist
// ausschließlich die geschäftliche Adress-ID hinterlegt, damit niemals private Daten auf der
// öffentlichen Präsentationsseite erscheinen. Tim Hartwich/Dawid Parma haben kein Profilfoto in
// OnOffice hinterlegt (erscheinen mit Initialen-Avatar).
export const TEAM: TeamMitglied[] = [
  {
    name: "Daniel Parma",
    rolle: "Gründer, Geschäftsführer, DEKRA-zert. Immobilienmakler, IHK-Immobilienbewerter",
    adressId: "119",
    nutzerNr: "21",
    benutzername: "Daniel",
  },
  {
    name: "Robin Kolbe",
    rolle: "Stellv. Geschäftsleitung, IHK-Immobilienbewerter, Marketing, Digitalisierung",
    adressId: "123",
    nutzerNr: "23",
    benutzername: "Robin",
  },
  {
    name: "Jacqueline Henot",
    rolle: "Bürokauffrau, Immobilienmaklerin (EIA)",
    adressId: "20483",
    nutzerNr: "39",
    benutzername: "Jacqueline",
  },
  {
    name: "Kira Woldt",
    rolle: "Kauffrau Büromanagement (IHK), Immobilienmaklerin (IHK), Wohnflächenberechnung, Visualisierung",
    adressId: "125",
    nutzerNr: "25",
    benutzername: "Kira",
  },
  {
    name: "Vanessa Krifft",
    rolle: "Kauffrau Büromanagement (IHK), Immobilienmaklerin",
    adressId: "20105",
    nutzerNr: "37",
    benutzername: "Vanessa",
  },
  {
    name: "Sarah Barth",
    rolle: "Bankkauffrau (IHK), Office Managerin",
    adressId: "31077",
    nutzerNr: "59",
    benutzername: "Sarah",
  },
  {
    name: "Stanimira Georgieva",
    rolle: "Juniormaklerin",
    adressId: "32669",
    nutzerNr: "63",
    benutzername: "Stanimira",
  },
  {
    name: "Katharina Becker",
    rolle: "Back Office, Social Media",
    adressId: "6181",
    nutzerNr: "35",
    benutzername: "Katharina",
  },
  {
    name: "Axel Wehmeier",
    rolle: "Immobilienmakler, Bankkaufmann, zert. Bauspar- und Finanzierungsfachmann",
    adressId: "28831",
    nutzerNr: "55",
    benutzername: "Axel",
  },
  {
    name: "Tim Hartwich",
    rolle: "Auszubildender zum Immobilienkaufmann (IHK)",
    adressId: "31313",
    nutzerNr: "41",
    benutzername: "Tim",
  },
  {
    name: "Dawid Parma",
    rolle: "Immobilienmakler",
    adressId: "44851",
    nutzerNr: "79",
    benutzername: "Dawid",
  },
];

// Reiter-Zuordnung der Mitarbeiterstatistik im Admin-Bereich (siehe Mitarbeiterstatistik.tsx,
// onoffice/mitarbeiterstatistik.ts) — August 2026 Chat-Vorgabe: "ich brauche bei Mitarbeiter
// neben Vertrieb noch zwei weitere Reiter mit unterschiedlichen Angaben. Akquise (Daniel, Robin,
// Axel) und Setting (Sarah, Kathi)". Bewusst hier (statt lokal in der jeweiligen Komponente/dem
// jeweiligen Lader) definiert: sowohl die UI (welche Tabelle zeigt wen) als auch der
// OnOffice-Lader (wer bekommt die zusätzlichen Akquise-Kennzahlen berechnet, siehe
// ladeMitarbeiterKennzahlen) müssen dieselbe Zuordnung verwenden. Axel Wehmeier bewusst in BEIDEN
// Listen (Vertrieb UND Akquise) — laut Chat-Vorgabe nicht aus Vertrieb entfernt, sondern
// zusätzlich für Akquise vorgesehen. Alle TEAM-Mitglieder, die in keiner der drei Listen stehen,
// landen weiterhin in "Weitere Mitarbeiter" (siehe teileTeamAuf in Mitarbeiterstatistik.tsx).
export const VERTRIEB_NAMEN = [
  "Vanessa Krifft",
  "Jacqueline Henot",
  "Kira Woldt",
  "Dawid Parma",
  "Axel Wehmeier",
  "Stanimira Georgieva",
];

export const AKQUISE_NAMEN = ["Daniel Parma", "Robin Kolbe", "Axel Wehmeier"];

// "Kathi" = Katharina Becker (siehe TEAM oben).
export const SETTING_NAMEN = ["Sarah Barth", "Katharina Becker"];
