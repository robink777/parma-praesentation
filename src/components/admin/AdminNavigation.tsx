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
  // Oktober 2026 Chat-Vorgabe: "wenn es nötig ist müssen wir die Navi noch mehr verkleinern" —
  // kleinere Schrift/Icons und engere Abstände als zuvor (bewusst unter der CI-Spacing-Skala,
  // siehe Nutzerfreigabe für den Admin-Bereich), damit mehr vom Panel für Inhalt bleibt.
  return (
    <nav className="flex shrink-0 flex-wrap gap-[2px] border-b border-walnuss/10 p-xs">
      {navItems.map((item) => {
        const aktiv = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex items-center gap-[4px] rounded-sm px-[6px] py-[4px] text-small transition-colors ${
              aktiv
                ? "bg-stein font-medium text-walnuss"
                : "text-walnuss/60 hover:bg-stein/60 hover:text-walnuss"
            }`}
          >
            <Icon name={item.icon} size={13} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
