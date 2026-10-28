import { NavItem } from "@/components/layout/nav";

// Navigationspunkte des Admin-Dashboards (siehe StatistikNav.tsx). Bis Oktober 2026 kurzzeitig
// auf zwei getrennte Hauptbereiche (Karte/Statistik, eigene Routen) aufgeteilt — Chat-Vorgabe
// direkt danach wollte das wieder zusammen: "Neben Übersicht hätte ich gerne den Navi Punkt
// Karte. Damit können wir uns den Bereich 'Karten/Statistik/Finanz' sparen" — Karte ist deshalb
// jetzt wieder ein normaler Punkt hier, kein eigener Hauptbereich-Umschalter mehr (siehe
// AdminDashboard.tsx, KarteBereich.tsx). "Leadquellen" (Herkunft-Übersicht, siehe
// onoffice/estate.ts, ladeLeadquellenKennzahlen) bewusst zwischen "Mitarbeiter" und "Kontrolle"
// einsortiert, Chat-Vorgabe: "Mach zwischen Mitarbeiter und Kontrolle bitte noch eine Kachel mit
// Leadquellen". "Kontrolle" (Datenqualität je Status, siehe ladeKontrollObjekte), Chat-Vorgabe:
// "das mit den Objekten funktioniert irgendwie immer noch nicht ... vielleicht als 3. Punkt in
// der Navigation".
//
// Kein eigener "plz"-Punkt mehr: Die PLZ-Objektliste (vormals eigener Reiter, siehe Git-Historie
// PlzObjekte.tsx) lebt jetzt fest als rechtes Viertel neben der Karte selbst (Chat-Vorgabe
// Oktober 2026: "die PLZ Navi kannst du oben auch raus nehmen und dann bei Karte in die ganz
// rechte 1/4 des Bildes legen") — ein Klick auf eine PLZ-Fläche aktualisiert sie direkt, ohne
// Reiterwechsel.
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: "uebersicht", label: "Übersicht", icon: "eye" },
  { id: "karte", label: "Karte", icon: "location" },
  { id: "mitarbeiter", label: "Mitarbeiter", icon: "team" },
  { id: "leadquellen", label: "Leadquellen", icon: "globe" },
  { id: "kontrolle", label: "Kontrolle", icon: "warning" },
];
