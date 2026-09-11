"use client";

import { Icon } from "@/components/icons/Icon";
import { NavItem, NavZustandEintrag } from "./nav";

// Liste zum Anpassen von Reihenfolge/Sichtbarkeit der Navigationspunkte — ursprünglich Teil des
// Sidebar-Bearbeitungsmodus (schmale Variante dort unverändert weiter genutzt), jetzt als eigene
// Komponente extrahiert, damit auch der volle Vorbereitungsmodus-Screen (Vorbereitungsmodus.tsx)
// dieselbe Liste/Logik verwenden kann, statt sie nachzubauen.
export function NavZustandBearbeiten({
  navItems,
  navZustand,
  onVerschieben,
  onUmschalten,
  onZuruecksetzen,
  // Nur in der Sidebar gesetzt (schließt den überlagernden Bearbeitungsmodus dort) — im
  // Vorbereitungsmodus ist die Liste Teil des normalen Seiteninhalts, kein "Fertig" nötig.
  onFertig,
}: {
  navItems: NavItem[];
  navZustand: NavZustandEintrag[];
  onVerschieben: (index: number, richtung: -1 | 1) => void;
  onUmschalten: (id: string) => void;
  onZuruecksetzen: () => void;
  onFertig?: () => void;
}) {
  return (
    <div className="flex flex-col gap-[2px]">
      {navZustand.map((eintrag, index) => {
        const item = navItems.find((i) => i.id === eintrag.id);
        if (!item) return null;
        return (
          <div
            key={item.id}
            className={`flex items-center gap-xs rounded-md px-sm py-xs ${
              eintrag.sichtbar ? "text-walnuss" : "text-walnuss/40"
            }`}
          >
            <Icon name={item.icon} size={16} className="shrink-0" />
            <span className="flex-1 truncate text-[13px]">{item.label}</span>
            <button
              type="button"
              onClick={() => onVerschieben(index, -1)}
              disabled={index === 0}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm hover:bg-reinweiss/60 disabled:opacity-20"
              title="Nach oben verschieben"
            >
              <Icon name="chevronUp" size={14} />
            </button>
            <button
              type="button"
              onClick={() => onVerschieben(index, 1)}
              disabled={index === navZustand.length - 1}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm hover:bg-reinweiss/60 disabled:opacity-20"
              title="Nach unten verschieben"
            >
              <Icon name="chevronDown" size={14} />
            </button>
            <button
              type="button"
              onClick={() => onUmschalten(item.id)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm hover:bg-reinweiss/60"
              title={eintrag.sichtbar ? "Ausblenden" : "Einblenden"}
            >
              <Icon name={eintrag.sichtbar ? "eye" : "eyeOff"} size={14} />
            </button>
          </div>
        );
      })}
      <div className="mt-sm flex items-center justify-between gap-xs border-t border-sand px-sm pt-sm">
        <button
          type="button"
          onClick={onZuruecksetzen}
          className="text-[13px] text-walnuss/60 underline-offset-2 hover:text-walnuss hover:underline"
        >
          Zurücksetzen
        </button>
        {onFertig && (
          <button
            type="button"
            onClick={onFertig}
            className="rounded-md bg-walnuss px-sm py-xs text-[13px] font-medium text-reinweiss transition-colors hover:bg-anthrazit"
          >
            Fertig
          </button>
        )}
      </div>
    </div>
  );
}
