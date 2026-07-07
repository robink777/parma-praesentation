import { Kennzahl, Standort, TeamMitglied } from "@/types";

// Quelle: Parma-Wissensdatei (parma_wissensbasis.md, Stand Mai 2026, Interview mit Robin Kolbe).
export const STANDORTE: Standort[] = [
  { name: "Düren", adresse: "Monschauer Straße 64, 52355 Düren" },
  { name: "Kreuzau", adresse: "Hauptstraße 80, 52372 Kreuzau" },
  { name: "Jülich", adresse: "Gereonstraße 1, 52428 Jülich" },
];

export const KENNZAHLEN: Kennzahl[] = [
  { label: "Jahre Erfahrung", wert: "6" },
  { label: "Standorte", wert: "3" },
  { label: "Team", wert: "11" },
  { label: "Google-Rezensionen (241)", wert: "5,0 ★" },
];

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
