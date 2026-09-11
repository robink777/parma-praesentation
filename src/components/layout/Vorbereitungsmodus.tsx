"use client";

import Image from "next/image";
import { Card } from "@/components/layout/SectionShell";
import { Vergleichswert } from "@/components/sections/Vergleichswert";
import { Immobilie } from "@/types";
import { NavItem, NavZustandEintrag } from "./nav";
import { NavZustandBearbeiten } from "./NavZustandBearbeiten";

// Der eigentlichen Präsentation vorgeschalteter Vorbereitungsschritt (Chat-Vorgabe September
// 2026: "eine Art Bearbeitungsmodus vorgeschaltet ... hier kann man dann die Vergleichsobjekte
// auswählen, die Auswahl der Navigationspunkte festlegen und weitere Optionen die wir später
// hinzufügen können"). Wird von PraesentationApp.tsx angezeigt, solange
// praesentationGestartet=false ist — für den geteilten Kunden-Link (readOnly, siehe
// lib/share.ts) wird dieser Schritt komplett übersprungen, der Kunde sieht nur das fertige
// Ergebnis.
//
// Baut bewusst auf bereits vorhandenen, vollständigen Komponenten auf statt sie nachzubauen:
// die Vergleichsobjekt-Auswahl ist exakt dieselbe <Vergleichswert>-Sektion wie im laufenden
// Präsentations-Reiter (inkl. Suche/automatischer Vorauswahl), die Navigationspunkte-Liste ist
// dieselbe <NavZustandBearbeiten>, die auch der Sidebar-Bearbeitungsmodus verwendet.
export function Vorbereitungsmodus({
  titel,
  kundenNamen,
  immobilie,
  referenzobjekte,
  onReferenzobjektAendern,
  vorauswahlLaedt,
  navItems,
  navZustand,
  onVerschieben,
  onUmschalten,
  onZuruecksetzen,
  onStart,
}: {
  titel: string;
  kundenNamen: string[];
  immobilie: Immobilie;
  referenzobjekte: (Immobilie | null)[];
  onReferenzobjektAendern: (index: number, objekt: Immobilie | null) => void;
  vorauswahlLaedt: boolean;
  navItems: NavItem[];
  navZustand: NavZustandEintrag[];
  onVerschieben: (index: number, richtung: -1 | 1) => void;
  onUmschalten: (id: string) => void;
  onZuruecksetzen: () => void;
  onStart: () => void;
}) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-y-auto bg-reinweiss">
      <header className="border-b border-sand px-xl py-lg">
        <Image src="/logos/immobilien-quer.svg" alt="Parma Immobilien" width={168} height={42} priority />
        <p className="label mb-xs mt-lg">Vorbereitung</p>
        <h1 className="text-[28px] font-slab font-bold leading-[1.2] text-anthrazit md:text-[36px]">
          {titel}
        </h1>
        {kundenNamen.length > 0 && (
          <p className="mt-xs text-body text-anthrazit/70">für {kundenNamen.join(", ")}</p>
        )}
      </header>

      <div className="mx-auto w-full max-w-content flex-1 px-xl py-xl">
        <Card className="mb-lg">
          <h3 className="mb-xs font-slab text-lg font-bold text-anthrazit">Vergleichsobjekte auswählen</h3>
          <p className="mb-md max-w-[65ch] text-small text-anthrazit/60">
            Diese Auswahl erscheint später im Vergleichswert-Reiter der Präsentation und lässt
            sich dort bei Bedarf weiter anpassen.
          </p>
          <div className="max-h-[70vh] overflow-y-auto rounded-md border border-sand">
            <Vergleichswert
              immobilie={immobilie}
              referenzobjekte={referenzobjekte}
              onReferenzobjektAendern={onReferenzobjektAendern}
              vorauswahlLaedt={vorauswahlLaedt}
            />
          </div>
        </Card>

        <Card className="mb-lg">
          <h3 className="mb-xs font-slab text-lg font-bold text-anthrazit">Navigationspunkte festlegen</h3>
          <p className="mb-md max-w-[65ch] text-small text-anthrazit/60">
            Reihenfolge und Sichtbarkeit gelten für die gesamte Präsentation — bei Bedarf später
            über das Zahnrad in der Navigation weiter anpassbar.
          </p>
          <div className="max-w-md">
            <NavZustandBearbeiten
              navItems={navItems}
              navZustand={navZustand}
              onVerschieben={onVerschieben}
              onUmschalten={onUmschalten}
              onZuruecksetzen={onZuruecksetzen}
            />
          </div>
        </Card>

        <Card className="mb-lg">
          <h3 className="mb-xs font-slab text-lg font-bold text-anthrazit">Weitere Optionen</h3>
          <p className="max-w-[65ch] text-small text-anthrazit/60">
            Hier folgen künftig weitere Einstellungen für die Präsentation.
          </p>
        </Card>
      </div>

      <footer className="sticky bottom-0 flex justify-end border-t border-sand bg-reinweiss px-xl py-md">
        <button
          type="button"
          onClick={onStart}
          className="rounded-md bg-messing px-lg py-sm font-medium text-reinweiss transition-colors hover:bg-messing/90"
        >
          Präsentation starten
        </button>
      </footer>
    </div>
  );
}
