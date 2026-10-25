"use client";

import { Icon } from "@/components/icons/Icon";
import { NavItem } from "@/components/layout/nav";

// Navigation innerhalb des rechten Drittel-Panels statt schwebend über der Karte — Chat-Vorgabe
// Oktober 2026: "die Karte soll in 2/3 der Ansicht auftauchen und dann ein Overlay auf dem 1/3
// auf der rechten Seite. Im Overlay kann die Navi rein." Die Karte (linke zwei Drittel, siehe
// Objektkarte.tsx) bleibt dadurch IMMER vollständig und ungedeckt sichtbar; Navigation und der
// jeweils gewählte Inhalt leben zusammen im rechten Drittel (siehe Mitarbeiterstatistik.tsx).
// Nicht die wiederverwendete Sidebar (components/layout/Sidebar.tsx): die trägt zugleich die
// Kundenpräsentation und muss dort vertikal/einklappbar bleiben, eine Admin-spezifische
// Anforderung soll deren Layout nicht mit beeinflussen.
export function AdminNav({
  navItems,
  activeId,
  onSelect,
}: {
  navItems: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="flex shrink-0 flex-wrap gap-xs border-b border-walnuss/10 p-sm">
      {navItems.map((item) => {
        const aktiv = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex items-center gap-xs rounded-sm px-sm py-xs text-[14px] transition-colors ${
              aktiv
                ? "bg-stein font-medium text-walnuss"
                : "text-walnuss/60 hover:bg-stein/60 hover:text-walnuss"
            }`}
          >
            <Icon name={item.icon} size={16} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
