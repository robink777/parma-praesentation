import { NavItem } from "@/components/layout/nav";

// Navigationspunkte des Admin-Bereichs — genutzt von der wiederverwendeten Sidebar-Komponente
// (siehe components/layout/Sidebar.tsx, Chat-Vorgabe August 2026: "ich hätte gerne in der
// Statistik ein identisches Layout wie bei der Präsentation"). "Kontrolle" (Datenqualität je
// Status, siehe Chat) kommt als weiterer Eintrag dazu, sobald diese Seite gebaut ist.
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: "uebersicht", label: "Auf einen Blick", icon: "calculator" },
  { id: "mitarbeiter", label: "Mitarbeiter", icon: "team" },
];
