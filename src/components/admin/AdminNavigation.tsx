"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { NavItem } from "@/components/layout/nav";

// Eigene, horizontale Admin-Navigation statt der wiederverwendeten Sidebar (components/layout/
// Sidebar.tsx) — Chat-Vorgabe Oktober 2026: "Die Navi drunter aber breit nicht hoch". Die
// Sidebar-Komponente ist bewusst NICHT dafür umgebaut worden, da sie zugleich die
// Kundenpräsentation trägt (PraesentationApp.tsx) und dort vertikal/einklappbar bleiben muss —
// ein eigenes, schlankes Bauteil nur für den Admin-Bereich vermeidet, dass eine Admin-Anforderung
// das Layout der Kundenpräsentation mit beeinflusst. Die Reihenfolge/Sichtbarkeits-Bearbeitung,
// die die Sidebar für die Kundenpräsentation anbietet, entfällt hier bewusst (admin-interne
// Navigation, keine für Kunden vorbereitete Auswahl) — ADMIN_NAV_ITEMS wird unverändert in
// fester Reihenfolge angezeigt.
export function AdminNav({
  navItems,
  activeId,
  onSelect,
}: {
  navItems: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <nav className="flex h-14 shrink-0 items-center gap-sm overflow-x-auto border-b border-walnuss/10 bg-stein px-lg md:px-xl">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="shrink-0 transition-opacity hover:opacity-70"
        title="Zurück zur Startseite"
      >
        <Image src="/logos/immobilien-quer.svg" alt="Parma Immobilien" width={120} height={30} priority />
      </button>
      <div className="h-6 w-px shrink-0 bg-walnuss/15" />
      {navItems.map((item) => {
        const aktiv = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex shrink-0 items-center gap-xs rounded-sm px-sm py-xs text-[15px] transition-colors ${
              aktiv
                ? "bg-reinweiss font-medium text-walnuss"
                : "text-walnuss/70 hover:bg-reinweiss/60 hover:text-walnuss"
            }`}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
