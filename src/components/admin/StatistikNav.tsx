"use client";

import { Icon } from "@/components/icons/Icon";
import { NavItem } from "@/components/layout/nav";

// Sekundär-Navigation INNERHALB des Statistik-Hauptbereichs (siehe ADMIN_NAV_ITEMS in
// adminNav.ts) — ersetzt die bisherige AdminNavigation.tsx. Bewusst groß/kontrastreich statt
// kompakt: AdminNavigation.tsx war auf Naharbeit im schmalen 1/3-Panel zugeschnitten
// ("wenn es nötig ist müssen wir die Navi noch mehr verkleinern"), diese Seite hier ist jetzt ein
// eigener, raumfüllender Hauptbereich für TV-Distanz (Oktober 2026 Chat-Vorgabe) — dafür braucht
// es größere Schrift/Icons und mehr Abstand statt der zuletzt bewusst verkleinerten Variante.
export function StatistikNav({
  navItems,
  activeId,
  onSelect,
}: {
  navItems: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="flex shrink-0 flex-wrap gap-xs border-b border-walnuss/10 px-lg py-sm">
      {navItems.map((item) => {
        const aktiv = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex items-center gap-xs rounded-full px-md py-xs text-lg font-medium transition-colors ${
              aktiv
                ? "bg-walnuss text-reinweiss"
                : "text-walnuss/60 hover:bg-stein hover:text-walnuss"
            }`}
          >
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
