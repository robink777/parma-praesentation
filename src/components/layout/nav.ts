import { IconName } from "@/components/icons/Icon";

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "begruessung", label: "Begrüßung", icon: "greeting" },
  { id: "kontaktperson", label: "Ihr Ansprechpartner", icon: "contact" },
  { id: "unternehmen", label: "Über uns", icon: "building" },
  { id: "objekt", label: "Objektdaten", icon: "house" },
  { id: "deepimmo", label: "DeepImmo", icon: "externalLink" },
  { id: "dokumente", label: "Dokumente", icon: "document" },
  { id: "vergleich", label: "Vergleichswert", icon: "compare" },
  { id: "leistungsversprechen", label: "Leistungsversprechen", icon: "check" },
  { id: "maklervertrag", label: "Maklervertrag", icon: "document" },
];
