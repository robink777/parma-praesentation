"use client";

import Image from "next/image";
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
  return (
    <aside className="flex h-full w-[280px] flex-shrink-0 flex-col bg-stein px-sm py-lg">
      <div className="mb-xl">
        <Image
          src="/logos/immobilien-quer.svg"
          alt="Parma Immobilien"
          width={168}
          height={42}
          priority
        />
      </div>

      <nav className="flex flex-1 flex-col gap-xs">
        {NAV_ITEMS.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex items-center gap-sm rounded-md px-sm py-xs text-left transition-colors ${
                active
                  ? "bg-reinweiss text-walnuss font-medium"
                  : "text-walnuss/70 hover:bg-reinweiss/60 hover:text-walnuss"
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="text-[15px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {kundeName && (
        <div className="mt-lg border-t border-sand pt-sm">
          <p className="label">Präsentation für</p>
          <p className="font-slab text-lg text-anthrazit">{kundeName}</p>
        </div>
      )}
    </aside>
  );
}
