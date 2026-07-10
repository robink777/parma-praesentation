import { Kennzahl, Standort, TeamMitglied } from "@/types";

// Quelle: Parma-Wissensdatei (parma_wissensbasis.md, Stand Mai 2026, Interview mit Robin Kolbe).
// Düren ist der Hauptstandort (auf Nutzerwunsch Juli 2026 groß hervorgehoben, siehe
// Unternehmen.tsx) — Fotos liegen lokal unter public/standorte/ (vom Nutzer bereitgestellt).
// Jeder Standort zeigt auf ausdrücklichen Nutzerwunsch genau EIN Foto (kein Galerie-Raster mehr).
//
// Kreuzau und Jülich haben noch KEINE eigenen Standort-Fotos — bis echte Fotos vorliegen, zeigen
// sie laut ausdrücklicher Nutzeranweisung übergangsweise je eines der drei Düren-Fotos als
// Platzhalter. Sobald Fotos von Kreuzau/Jülich vorliegen, hier austauschen.
export const STANDORTE: Standort[] = [
  {
    name: "Düren",
    adresse: "Monschauer Straße 64, 52355 Düren",
    hauptstandort: true,
    bilder: ["/standorte/dueren-1.jpg"],
  },
  { name: "Kreuzau", adresse: "Hauptstraße 80, 52372 Kreuzau", bilder: ["/standorte/dueren-2.jpg"] },
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
export const TEAM: TeamMitglied[] = [
  { name: "Daniel Parma", rolle: "Gründer, Geschäftsführer, DEKRA-zert. Immobilienmakler, IHK-Immobilienbewerter" },
  { name: "Robin Kolbe", rolle: "Stellv. Geschäftsleitung, IHK-Immobilienbewerter, Marketing, Digitalisierung" },
  { name: "Jacqueline Henot", rolle: "Bürokauffrau, Immobilienmaklerin (EIA)" },
  { name: "Kira Woldt", rolle: "Kauffrau Büromanagement (IHK), Immobilienmaklerin (IHK), Wohnflächenberechnung, Visualisierung" },
  { name: "Vanessa Krifft", rolle: "Kauffrau Büromanagement (IHK), Immobilienmaklerin" },
  { name: "Sarah Barth", rolle: "Bankkauffrau (IHK), Office Managerin" },
  { name: "Stanimira Georgieva", rolle: "Juniormaklerin" },
  { name: "Katharina Becker", rolle: "Back Office, Social Media" },
  { name: "Axel Wehmeier", rolle: "Immobilienmakler, Bankkaufmann, zert. Bauspar- und Finanzierungsfachmann" },
  { name: "Tim Hartwich", rolle: "Auszubildender zum Immobilienkaufmann (IHK)" },
  { name: "Dawid Parma", rolle: "Immobilienmakler" },
];
