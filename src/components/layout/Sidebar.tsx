"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { NAV_ITEMS } from "./nav";

export function Sidebar({
  activeId,
  onSelect,
  kundeNamen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  // Bei mehreren Eigentümern (Miteigentum, Erbengemeinschaft) eine Zeile pro Person (siehe
  // PraesentationApp.tsx) — Array statt eines zusammengesetzten Strings, damit hier pro Name ein
  // eigener <p> gerendert werden kann (untereinander statt in einem Fließtext-Satz).
  kundeNamen?: string[];
}) {
  const router = useRouter();
  // Eingeklappter Zustand ist bewusst lokaler Component-State (statt in PraesentationApp
  // gehoben): Die Sidebar bleibt über die gesamte Lebensdauer der Präsentation gemountet,
  // ein Hochheben würde hier keinen Zweck erfüllen, aber unnötig Props durchreichen.
  const [eingeklappt, setEingeklappt] = useState(false);
  // Unterhalb der md-Breakpoint (< 768px) ist die Sidebar standardmäßig off-canvas und
  // öffnet sich per Hamburger-Button als Overlay-Drawer, statt dem Content dauerhaft
  // Breite wegzunehmen (siehe Mobile-Bug: Sidebar verschmälerte den Content auf < 100px).
  const [mobilOffen, setMobilOffen] = useState(false);

  const handleSelect = (id: string) => {
    onSelect(id);
    setMobilOffen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMobilOffen(true)}
        className="fixed left-sm top-sm z-30 flex h-10 w-10 items-center justify-center rounded-sm bg-stein text-walnuss shadow-md md:hidden"
        title="Navigation öffnen"
      >
        <Icon name="menu" size={20} />
      </button>

      {mobilOffen && (
        <div
          className="fixed inset-0 z-30 bg-anthrazit/40 md:hidden"
          onClick={() => setMobilOffen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-[280px] flex-shrink-0 flex-col bg-stein px-sm py-lg transition-transform duration-200 md:static md:translate-x-0 md:transition-[width] ${
          mobilOffen ? "translate-x-0" : "-translate-x-full"
        } ${eingeklappt ? "md:w-[72px]" : "md:w-[280px]"}`}
      >
        <div className={`mb-xl flex items-center justify-between ${eingeklappt ? "md:justify-center" : ""}`}>
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
          {/* Schließen-Button für den Mobile-Drawer */}
          <button
            type="button"
            onClick={() => setMobilOffen(false)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-walnuss/60 transition-colors hover:bg-reinweiss/60 hover:text-walnuss md:hidden"
            title="Navigation schließen"
          >
            <Icon name="close" size={18} />
          </button>
          {/* Ein-/Ausklapp-Button für den Desktop-Icon-Rail-Modus */}
          <button
            type="button"
            onClick={() => setEingeklappt((v) => !v)}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-sm text-walnuss/60 transition-colors hover:bg-reinweiss/60 hover:text-walnuss md:flex"
            title={eingeklappt ? "Navigation ausklappen" : "Navigation einklappen"}
          >
            <Icon name={eingeklappt ? "chevronRight" : "chevronLeft"} size={18} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-xs overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                title={eingeklappt ? item.label : undefined}
                className={`flex items-center gap-sm rounded-md px-sm py-xs text-left transition-colors ${
                  eingeklappt ? "md:justify-center" : ""
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

        {!eingeklappt && kundeNamen && kundeNamen.length > 0 && (
          <div className="mt-lg border-t border-sand pt-sm">
            <p className="label">Präsentation für</p>
            {kundeNamen.map((name, i) => (
              <p key={i} className="font-slab text-lg text-anthrazit">
                {name}
              </p>
            ))}
          </div>
        )}
      </aside>
    </>
  );
}
