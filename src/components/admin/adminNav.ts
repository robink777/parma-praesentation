import { NavItem } from "@/components/layout/nav";

// Navigationspunkte des Admin-Bereichs — genutzt von der horizontalen Admin-Nav (siehe
// components/admin/AdminNavigation.tsx, Chat-Vorgabe Oktober 2026: "Die Navi drunter aber breit nicht
// hoch"). "Leadquellen" (Herkunft-Übersicht, siehe onoffice/estate.ts, ladeLeadquellenKennzahlen)
// bewusst zwischen "Mitarbeiter" und "Kontrolle" einsortiert, Chat-Vorgabe: "Mach zwischen
// Mitarbeiter und Kontrolle bitte noch eine Kachel mit Leadquellen". "Kontrolle" (Datenqualität
// je Status, siehe ladeKontrollObjekte), Chat-Vorgabe: "das mit den Objekten funktioniert
// irgendwie immer noch nicht ... vielleicht als 3. Punkt in der Navigation".
//
// Kein eigener "Objektkarte"-Punkt mehr (bis Oktober 2026 hier als eigener Reiter): Die Karte
// (components/admin/Objektkarte.tsx) nimmt seit der Chat-Vorgabe "die Karte soll in 2/3 der
// Ansicht auftauchen" die linken zwei Drittel der Admin-Fläche dauerhaft ein, statt eines
// Navigationsziels im rechten Drittel-Panel (siehe Mitarbeiterstatistik.tsx).
//
// "plz" (siehe components/admin/PlzObjekte.tsx) wird nicht nur per Klick hier, sondern auch
// automatisch aktiv, wenn auf der Karte eine PLZ-Fläche angeklickt wird — Chat-Vorgabe Oktober
// 2026: "ich will einen weiteren Navi Bereich. Ich will dass jedes Mal wenn man in den
// einzelnen PLZ Bereich geht, auf der rechten Seite sich zu dieser PLZ öffnet. Liste an
// Objekten usw" (siehe onPlzKlick in Mitarbeiterstatistik.tsx).
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: "uebersicht", label: "Auf einen Blick", icon: "calculator" },
  { id: "mitarbeiter", label: "Mitarbeiter", icon: "team" },
  { id: "leadquellen", label: "Leadquellen", icon: "location" },
  { id: "kontrolle", label: "Kontrolle", icon: "warning" },
  { id: "plz", label: "PLZ", icon: "building" },
];
