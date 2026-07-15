import { IconName } from "@/components/icons/Icon";

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  // Gesetzt, wenn dieser Punkt unter einem anderen (siehe NAV_ITEMS-Reihenfolge, direkt danach
  // einsortiert) gruppiert dargestellt werden soll — Sidebar.tsx zeigt ihn dafür eingerückt an
  // (Chat-Vorgabe Juli 2026: "Gliedere die beiden Punkte bitte unter DeepImmo"). Rein visuell,
  // keine eigene Klapp-/Baum-Logik: die Einrückung folgt einfach der Reihenfolge im Array.
  parentId?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "begruessung", label: "Begrüßung", icon: "greeting" },
  { id: "kontaktperson", label: "Ihr Ansprechpartner", icon: "contact" },
  { id: "unternehmen", label: "Über uns", icon: "building" },
  { id: "objekt", label: "Objektdaten", icon: "house" },
  { id: "dokumente", label: "Bewertungsunterlagen", icon: "document" },
  { id: "deepimmo", label: "DeepImmo", icon: "externalLink" },
  { id: "kaeuferverhalten", label: "Käuferverhalten", icon: "team", parentId: "deepimmo" },
  { id: "preis-des-wartens", label: "Preis des Wartens", icon: "clock", parentId: "deepimmo" },
  { id: "vergleich", label: "Vergleichswert", icon: "compare" },
  { id: "leistungsversprechen", label: "Leistungsversprechen", icon: "check" },
  { id: "maklervertrag", label: "Maklervertrag", icon: "document" },
];

// Reihenfolge + Sichtbarkeit EINES Navigationspunkts, wie sie der Berater/die Beraterin live
// während einer Präsentation über den Bearbeitungsmodus (siehe Sidebar.tsx, Chat-Vorgabe
// "die Möglichkeit die Reihenfolge der Navigation live bei jedem Objekt anzupassen und einzelne
// Punkte ein und auszublenden je nach Kunde") verändern kann. Bewusst getrennt von NAV_ITEMS
// oben (Label/Icon bleiben fest, nur Reihenfolge/Sichtbarkeit sind pro Präsentation variabel) —
// NAV_ITEMS bleibt die eine Quelle der Wahrheit für Label und Icon je Punkt, dieser Zustand
// referenziert sie nur über die id.
export interface NavZustandEintrag {
  id: string;
  sichtbar: boolean;
}

// Default-Zustand: alle Punkte sichtbar, in der in NAV_ITEMS hinterlegten Reihenfolge (Chat-Vorgabe:
// "Default sollte sein dass alle Punkte in der jetzigen Reihenfolge stehen und eingeblendet
// sind"). Wird bei jedem Mounten der Sidebar (also bei jedem neuen Objekt/jeder neuen
// Präsentation) frisch aufgebaut, NICHT persistiert — die Anpassung ist laut Chat-Vorgabe "live
// bei jedem Objekt", nicht dauerhaft über Objekte hinweg gültig.
export function erstelleStandardNavZustand(): NavZustandEintrag[] {
  return NAV_ITEMS.map((item) => ({ id: item.id, sichtbar: true }));
}
