"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { NAV_ITEMS } from "./nav";

export function Sidebar({
  activeId,
  onSelect,
  kundeName,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  kundeName?: string;
}) {
  const router = useRouter();
  // Eingeklappter Zustand ist bewusst lokaler Component-State (statt in PraesentationApp
  // gehoben): Die Sidebar bleibt über die gesamte Lebensdauer der Präsentation gemountet,
  // ein Hochheben würde hier keinen Zweck erfüllen, aber unnötig Props durchreichen.
  const [eingeklappt, setEingeklappt] = useState(false);

  return (
    <aside
      className={`flex h-full flex-shrink-0 flex-col bg-stein px-sm py-lg transition-[width] duration-200 ${
        eingeklappt ? "w-[72px]" : "w-[280px]"
      }`}
    >
      <div className={`mb-xl flex items-center ${eingeklappt ? "justify-center" : "justify-between"}`}>
        {/* Klick aufs Logo führt zurück zur Objektauswahl (Basis-URL ohne estateId, siehe
            app/page.tsx) — im eingeklappten Zustand ausgeblendet, da für das Logo in der
            schmalen Breite keine Icon-only-Variante als Datei existiert (siehe parma-design
            Skill: Logo nie nachbauen/zuschneiden). */}
        {!eingeklappt && (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="transition-opacity hover:opacity-70"
            title="Zurück zur Objektauswahl"
          >
            <Image
              src="/logos/immobilien-quer.svg"
              alt="Parma Immobilien"
              width={168}
              height={42}
              priority
            />
          </button>
        )}
        <button
          type="button"
          onClick={() => setEingeklappt((v) => !v)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-walnuss/60 transition-colors hover:bg-reinweiss/60 hover:text-walnuss"
          title={eingeklappt ? "Navigation ausklappen" : "Navigation einklappen"}
        >
          <Icon name={eingeklappt ? "chevronRight" : "chevronLeft"} size={18} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-xs">
        {NAV_ITEMS.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              title={eingeklappt ? item.label : undefined}
              className={`flex items-center gap-sm rounded-md px-sm py-xs text-left transition-colors ${
                eingeklappt ? "justify-center" : ""
              } ${
                active
                  ? "bg-reinweiss text-walnuss font-medium"
                  : "text-walnuss/70 hover:bg-reinweiss/60 hover:text-walnuss"
              }`}
            >
              <Icon name={item.icon} size={20} />
              {!eingeklappt && <span className="text-[15px]">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!eingeklappt && kundeName && (
        <div className="mt-lg border-t border-sand pt-sm">
          <p className="label">Präsentation für</p>
          <p className="font-slab text-lg text-anthrazit">{kundeName}</p>
        </div>
      )}
    </aside>
  );
}
