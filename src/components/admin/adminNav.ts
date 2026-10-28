import { NavItem } from "@/components/layout/nav";

// Sekundär-Navigationspunkte INNERHALB des Statistik-Hauptbereichs (siehe StatistikNav.tsx) —
// seit Oktober 2026 nicht mehr die einzige Navi-Ebene im Admin-Bereich: Karte und Statistik sind
// jetzt eigene Hauptbereiche (siehe HauptbereichSwitcher.tsx), diese fünf Punkte sitzen
// ausschließlich innerhalb von "Statistik". "Leadquellen" (Herkunft-Übersicht, siehe
// onoffice/estate.ts, ladeLeadquellenKennzahlen) bewusst zwischen "Mitarbeiter" und "Kontrolle"
// einsortiert, Chat-Vorgabe: "Mach zwischen Mitarbeiter und Kontrolle bitte noch eine Kachel mit
// Leadquellen". "Kontrolle" (Datenqualität je Status, siehe ladeKontrollObjekte), Chat-Vorgabe:
// "das mit den Objekten funktioniert irgendwie immer noch nicht ... vielleicht als 3. Punkt in
// der Navigation".
//
// "plz" (siehe components/admin/PlzObjekte.tsx) wird nicht nur per Klick hier, sondern auch
// automatisch aktiv, wenn auf der Karte (jetzt eigener Hauptbereich, siehe KartenAnsicht.tsx)
// eine PLZ-Fläche angeklickt wird — Chat-Vorgabe Oktober 2026: "ich will einen weiteren Navi
// Bereich. Ich will dass jedes Mal wenn man in den einzelnen PLZ Bereich geht, auf der rechten
// Seite sich zu dieser PLZ öffnet. Liste an Objekten usw" (siehe StatistikAnsicht.tsx).
//
// Kein eigener "neuzugaenge"-Punkt mehr: Die Neuzugänge-Wochenansicht (vormals ein eigener Punkt,
// davor zwei Kacheln auf "uebersicht") ist jetzt fest Teil von "uebersicht" selbst (siehe
// Uebersicht.tsx) — Chat-Vorgabe Oktober 2026 wollte die Statistik-Seite insgesamt als EINEN auf
// einen Blick lesbaren TV-Dashboard-Landingscreen, nicht als weiteren Klickschritt.
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: "uebersicht", label: "Übersicht", icon: "eye" },
  { id: "mitarbeiter", label: "Mitarbeiter", icon: "team" },
  { id: "leadquellen", label: "Leadquellen", icon: "globe" },
  { id: "kontrolle", label: "Kontrolle", icon: "warning" },
  { id: "plz", label: "PLZ", icon: "building" },
];
