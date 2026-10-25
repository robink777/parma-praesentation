"use client";

import { Icon } from "@/components/icons/Icon";
import { NavItem } from "@/components/layout/nav";

// Minimal-Navigation, schwebend über der Karte, statt einer vollbreiten Leiste — Chat-Vorgabe
// Oktober 2026, zuletzt: "Die Navigation soll so klein wie möglich zu sehen sein" (davor schon
// "Die Navi drunter aber breit nicht hoch"). Die Karte ist seitdem der alleinige Seiteninhalt
// (siehe Objektkarte.tsx, Mitarbeiterstatistik.tsx) — diese Leiste ist nur noch ein kompaktes,
// icon-only Dock zum Öffnen/Schließen der übrigen Bereiche als Vollbild-Overlay darüber, kein
// eigener Layout-Bereich mehr. Nicht die wiederverwendete Sidebar (components/layout/
// Sidebar.tsx): die trägt zugleich die Kundenpräsentation und muss dort vertikal/einklappbar
// bleiben, eine Admin-spezifische Anforderung soll deren Layout nicht mit beeinflussen.
//
// activeId ist hier bewusst "string | null" statt "string" — null bedeutet "kein Overlay offen,
// nur die Karte sichtbar" (der von der Chat-Vorgabe gewünschte Grundzustand). Ein Klick auf den
// bereits aktiven Punkt schließt das Overlay wieder (siehe onSelect-Logik in
// Mitarbeiterstatistik.tsx), statt dass ein separater Schließen-Mechanismus hier nötig wäre.
export function AdminNav({
  navItems,
  activeId,
  onSelect,
}: {
  navItems: NavItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="absolute bottom-md left-1/2 z-40 flex -translate-x-1/2 items-center gap-xs rounded-full bg-stein/95 p-xs shadow-[0_2px_12px_rgba(80,63,61,0.18)]">
      {navItems.map((item) => {
        const aktiv = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            title={item.label}
            aria-label={item.label}
            aria-pressed={aktiv}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              aktiv
                ? "bg-reinweiss text-walnuss"
                : "text-walnuss/60 hover:bg-reinweiss/60 hover:text-walnuss"
            }`}
          >
            <Icon name={item.icon} size={18} />
          </button>
        );
      })}
    </nav>
  );
}
