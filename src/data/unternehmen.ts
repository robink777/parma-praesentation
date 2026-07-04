import { Kennzahl, Standort, TeamMitglied } from "@/types";

// Quelle: Parma-Wissensdatei (parma_wissensbasis.md, Stand Mai 2026, Interview mit Robin Kolbe).
export const STANDORTE: Standort[] = [
  { name: "Düren", adresse: "Monschauer Straße 64, 52355 Düren" },
  { name: "Kreuzau", adresse: "Ladenlokal" },
  { name: "Jülich", adresse: "Zweiter operativer Standort" },
];

export const KENNZAHLEN: Kennzahl[] = [
  { label: "Jahre Erfahrung", wert: "6" },
  { label: "Standorte", wert: "3" },
  { label: "Team", wert: "11" },
  { label: "Google-Rezensionen (241)", wert: "5,0 ★" },
];

export const TEAM: TeamMitglied[] = [
  { name: "Daniel Parma", rolle: "Gründer, Geschäftsführer, DEKRA-zert. Immobilienmakler, IHK-Immobilienbewerter" },
  { name: "Robin Kolbe", rolle: "Stellv. Geschäftsleitung, IHK-Immobilienbewerter, Marketing, Digitalisierung" },
  { name: "Jacqueline Henot", rolle: "Bürokauffrau, Immobilienmaklerin (EIA)" },
  { name: "Kira Woldt", rolle: "Kauffrau Büromanagement (IHK), Immobilienmaklerin (IHK), Wohnflächenberechnung, Visualisierung" },
  { name: "Vanessa Krifft", rolle: "Kauffrau Büromanagement (IHK), Immobilienmaklerin" },
  { name: "Sarah Barth", rolle: "Bankkauffrau (IHK), Office Managerin" },
  { name: "Celin Borgwaldt", rolle: "Assistenz der Geschäftsführung" },
  { name: "Stanimira Georgieva", rolle: "Juniormaklerin" },
  { name: "Katharina Becker", rolle: "Back Office, Social Media" },
  { name: "Axel Wehmeier", rolle: "Immobilienmakler, Bankkaufmann, zert. Bauspar- und Finanzierungsfachmann" },
  { name: "Tim Hartwich", rolle: "Auszubildender zum Immobilienkaufmann (IHK)" },
];
