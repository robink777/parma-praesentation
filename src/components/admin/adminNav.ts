import { NavItem } from "@/components/layout/nav";

// Navigationspunkte des Admin-Bereichs — genutzt von der wiederverwendeten Sidebar-Komponente
// (siehe components/layout/Sidebar.tsx, Chat-Vorgabe August 2026: "ich hätte gerne in der
// Statistik ein identisches Layout wie bei der Präsentation"). "Leadquellen" (Herkunft-Übersicht,
// siehe onoffice/estate.ts, ladeLeadquellenKennzahlen) bewusst zwischen "Mitarbeiter" und
// "Kontrolle" einsortiert, Chat-Vorgabe: "Mach zwischen Mitarbeiter und Kontrolle bitte noch eine
// Kachel mit Leadquellen". "Kontrolle" (Datenqualität je Status, siehe ladeKontrollObjekte),
// Chat-Vorgabe: "das mit den Objekten funktioniert irgendwie immer noch nicht ... vielleicht als
// 3. Punkt in der Navigation".
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: "uebersicht", label: "Auf einen Blick", icon: "calculator" },
  { id: "mitarbeiter", label: "Mitarbeiter", icon: "team" },
  { id: "leadquellen", label: "Leadquellen", icon: "location" },
  { id: "kontrolle", label: "Kontrolle", icon: "warning" },
];
