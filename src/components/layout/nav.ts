import { IconName } from "@/components/icons/Icon";

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "begruessung", label: "Begrüßung", icon: "greeting" },
  { id: "kontaktperson", label: "Ihre Kontaktperson", icon: "contact" },
  { id: "unternehmen", label: "Über uns", icon: "building" },
  { id: "ablauf", label: "Ablauf heute", icon: "calendar" },
  { id: "objekt", label: "Objektdaten", icon: "house" },
  { id: "bewertung", label: "Bewertung", icon: "scale" },
  { id: "objektbewertung", label: "Objektbewertung", icon: "document" },
  { id: "vergleich", label: "Vergleichswert", icon: "compare" },
  { id: "finanzierung", label: "Finanzierung", icon: "calculator" },
  { id: "leistungsversprechen", label: "Leistungsversprechen", icon: "check" },
  { id: "maklervertrag", label: "Maklervertrag", icon: "document" },
];
