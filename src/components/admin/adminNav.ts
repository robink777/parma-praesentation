import { NavItem } from "@/components/layout/nav";

// Navigationspunkte des Admin-Bereichs — genutzt von der wiederverwendeten Sidebar-Komponente
// (siehe components/layout/Sidebar.tsx, Chat-Vorgabe August 2026: "ich hätte gerne in der
// Statistik ein identisches Layout wie bei der Präsentation"). "Kontrolle" (Datenqualität je
// Status, siehe onoffice/estate.ts, ladeKontrollObjekte) als dritter Punkt, Chat-Vorgabe: "das
// mit den Objekten funktioniert irgendwie immer noch nicht ... vielleicht als 3. Punkt in der
// Navigation".
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: "uebersicht", label: "Auf einen Blick", icon: "calculator" },
  { id: "mitarbeiter", label: "Mitarbeiter", icon: "team" },
  { id: "kontrolle", label: "Kontrolle", icon: "warning" },
];
