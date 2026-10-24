import { NavItem } from "@/components/layout/nav";

// Navigationspunkte des Admin-Bereichs — genutzt von der horizontalen Admin-Nav (siehe
// components/admin/AdminNavigation.tsx, Chat-Vorgabe Oktober 2026: "Die Navi drunter aber breit nicht
// hoch"). "Leadquellen" (Herkunft-Übersicht, siehe onoffice/estate.ts, ladeLeadquellenKennzahlen)
// bewusst zwischen "Mitarbeiter" und "Kontrolle" einsortiert, Chat-Vorgabe: "Mach zwischen
// Mitarbeiter und Kontrolle bitte noch eine Kachel mit Leadquellen". "Kontrolle" (Datenqualität
// je Status, siehe ladeKontrollObjekte), Chat-Vorgabe: "das mit den Objekten funktioniert
// irgendwie immer noch nicht ... vielleicht als 3. Punkt in der Navigation".
//
// Kein "Objektkarte"-Punkt mehr (bis Oktober 2026 hier als eigener Reiter): Die Karte
// (components/admin/Objektkarte.tsx) ist seit der Chat-Vorgabe "ich hätte gerne die Karte als
// fixen Header-Bereich ... der Header soll immer da sein" ein permanenter Header über der
// gesamten Admin-Fläche statt eines Navigationsziels (siehe Mitarbeiterstatistik.tsx).
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: "uebersicht", label: "Auf einen Blick", icon: "calculator" },
  { id: "mitarbeiter", label: "Mitarbeiter", icon: "team" },
  { id: "leadquellen", label: "Leadquellen", icon: "location" },
  { id: "kontrolle", label: "Kontrolle", icon: "warning" },
];
