"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { NavItem, NavZustandEintrag, erstelleStandardNavZustand } from "./nav";

// Wiederverwendbare Sidebar-Chrome (Logo, Ein-/Ausklappen, Bearbeitungsmodus für Reihenfolge/
// Sichtbarkeit) — genutzt sowohl von der Kundenpräsentation (PraesentationApp.tsx, NAV_ITEMS aus
// nav.ts) als auch vom Admin-Bereich (Mitarbeiterstatistik.tsx, ADMIN_NAV_ITEMS aus
// admin/adminNav.ts). Chat-Vorgabe August 2026: "ich hätte gerne in der Statistik ein identisches
// Layout wie bei der Präsentation" — beide Bereiche teilen sich seitdem dieselbe Komponente statt
// zweier optisch/funktional auseinanderlaufender Nachbauten.
export function Sidebar({
  navItems,
  activeId,
  onSelect,
  logoHref = "/",
  kundeNamen,
}: {
  navItems: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  // Ziel des Logo-Klicks — Präsentation führt zurück zur Objektauswahl ("/"), der Admin-Bereich
  // übergibt stattdessen "/admin".
  logoHref?: string;
  // Bei mehreren Eigentümern (Miteigentum, Erbengemeinschaft) eine Zeile pro Person (siehe
  // PraesentationApp.tsx) — Array statt eines zusammengesetzten Strings, damit hier pro Name ein
  // eigener <p> gerendert werden kann (untereinander statt in einem Fließtext-Satz). Im
  // Admin-Bereich schlicht nicht übergeben, der Block dort bleibt dann ausgeblendet.
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

  // Reihenfolge + Sichtbarkeit der Navigationspunkte, live während der Präsentation anpassbar
  // (Chat-Vorgabe: "die Möglichkeit die Reihenfolge der Navigation live bei jedem Objekt
  // anzupassen und einzelne Punkte ein und auszublenden je nach Kunde"). Bewusst lokaler
  // Component-State ohne Persistierung (kein localStorage/Backend) — die Sidebar mountet pro
  // Präsentation/Objekt frisch (siehe app/page.tsx), der Zustand startet dadurch automatisch
  // wieder beim Default (alle Punkte sichtbar, Reihenfolge aus navItems), ohne dass eine
  // Anpassung für Kunde A versehentlich bei Kunde B weiterlebt.
  const [navZustand, setNavZustand] = useState<NavZustandEintrag[]>(() =>
    erstelleStandardNavZustand(navItems)
  );
  const [bearbeitungsModus, setBearbeitungsModus] = useState(false);

  const handleSelect = (id: string) => {
    onSelect(id);
    setMobilOffen(false);
  };

  // Öffnet den Bearbeitungsmodus über das Zahnrad — klappt eine eingeklappte Sidebar dafür
  // zuerst automatisch wieder auf, da die Bearbeitung (Label, Auf/Ab-Pfeile, Sichtbarkeits-Icon
  // je Punkt) im schmalen Icon-Rail-Modus keinen Platz hätte.
  const toggleBearbeitungsModus = () => {
    if (!bearbeitungsModus && eingeklappt) setEingeklappt(false);
    setBearbeitungsModus((v) => !v);
  };

  const verschieben = (index: number, richtung: -1 | 1) => {
    setNavZustand((prev) => {
      const ziel = index + richtung;
      if (ziel < 0 || ziel >= prev.length) return prev;
      const kopie = [...prev];
      [kopie[index], kopie[ziel]] = [kopie[ziel], kopie[index]];
      return kopie;
    });
  };

  // Mindestens ein Punkt muss sichtbar bleiben — sonst hätte die Präsentation keine erreichbare
  // Seite mehr und activeId liefe ins Leere.
  const umschalten = (id: string) => {
    setNavZustand((prev) => {
      const sichtbareAnzahl = prev.filter((e) => e.sichtbar).length;
      return prev.map((e) =>
        e.id === id && !(e.sichtbar && sichtbareAnzahl <= 1) ? { ...e, sichtbar: !e.sichtbar } : e
      );
    });
  };

  const zuruecksetzen = () => setNavZustand(erstelleStandardNavZustand(navItems));

  // Springt automatisch auf den ersten sichtbaren Punkt, falls der gerade aktive Punkt während
  // der Bearbeitung ausgeblendet wird — sonst zeigt der Content-Bereich weiter eine Seite, die
  // in der Navigation gar nicht mehr erreichbar ist.
  useEffect(() => {
    const aktiverEintrag = navZustand.find((e) => e.id === activeId);
    if (aktiverEintrag && !aktiverEintrag.sichtbar) {
      const ersterSichtbarer = navZustand.find((e) => e.sichtbar);
      if (ersterSichtbarer) onSelect(ersterSichtbarer.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navZustand, activeId]);

  const sichtbareNavItems = navZustand
    .filter((e) => e.sichtbar)
    .map((e) => navItems.find((item) => item.id === e.id))
    .filter((item): item is NavItem => !!item);

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
          {/* Klick aufs Logo führt zu logoHref (Präsentation: Objektauswahl "/", Admin-Bereich:
              "/admin") — im eingeklappten Zustand ausgeblendet, da für das Logo in der schmalen
              Breite keine Icon-only-Variante als Datei existiert (siehe parma-design Skill: Logo
              nie nachbauen/zuschneiden). */}
          {!eingeklappt && (
            <button
              type="button"
              onClick={() => router.push(logoHref)}
              className="transition-opacity hover:opacity-70"
              title="Zurück"
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
          {/* Schließen-Button für den Mobile-Drawer — bleibt oben, da er eine andere Funktion hat
              als der Zuklapp-Button unten (schließt den Overlay-Drawer, statt die Sidebar auf den
              Icon-Rail-Modus zu verschmälern). */}
          <button
            type="button"
            onClick={() => setMobilOffen(false)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-walnuss/60 transition-colors hover:bg-reinweiss/60 hover:text-walnuss md:hidden"
            title="Navigation schließen"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {bearbeitungsModus ? (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <p className="label mb-xs px-sm">Navigation anpassen</p>
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
                      onClick={() => verschieben(index, -1)}
                      disabled={index === 0}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm hover:bg-reinweiss/60 disabled:opacity-20"
                      title="Nach oben verschieben"
                    >
                      <Icon name="chevronUp" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => verschieben(index, 1)}
                      disabled={index === navZustand.length - 1}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm hover:bg-reinweiss/60 disabled:opacity-20"
                      title="Nach unten verschieben"
                    >
                      <Icon name="chevronDown" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => umschalten(item.id)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm hover:bg-reinweiss/60"
                      title={eintrag.sichtbar ? "Ausblenden" : "Einblenden"}
                    >
                      <Icon name={eintrag.sichtbar ? "eye" : "eyeOff"} size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="mt-sm flex items-center justify-between gap-xs border-t border-sand px-sm pt-sm">
              <button
                type="button"
                onClick={zuruecksetzen}
                className="text-[13px] text-walnuss/60 underline-offset-2 hover:text-walnuss hover:underline"
              >
                Zurücksetzen
              </button>
              <button
                type="button"
                onClick={() => setBearbeitungsModus(false)}
                className="rounded-md bg-walnuss px-sm py-xs text-[13px] font-medium text-reinweiss transition-colors hover:bg-anthrazit"
              >
                Fertig
              </button>
            </div>
          </div>
        ) : (
          <nav className="flex flex-1 flex-col gap-xs overflow-y-auto">
            {sichtbareNavItems.map((item) => {
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
        )}

        {/* Zuklapp-Button und Zahnrad bewusst hier unten platziert, als reine Symbolzeile direkt
            über dem Strich vor den Eigentümerdaten, statt oben in der Kopfzeile neben dem Logo
            (Chat-Vorgabe: "lege ... über den Strich der über den Eigentümern angezeigt wird...
            Bitte verwende nur Symbole"). Beide Buttons bleiben auch im Bearbeitungsmodus sichtbar
            (Zuklapp weiterhin bedienbar, Zahnrad dient dort zugleich als zweiter Weg, den Modus
            wieder zu schließen, neben dem "Fertig"-Button). */}
        <div className={`flex items-center gap-xs px-sm ${eingeklappt ? "md:justify-center" : ""}`}>
          <button
            type="button"
            onClick={() => setEingeklappt((v) => !v)}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-sm text-walnuss/60 transition-colors hover:bg-reinweiss/60 hover:text-walnuss md:flex"
            title={eingeklappt ? "Navigation ausklappen" : "Navigation einklappen"}
          >
            <Icon name={eingeklappt ? "chevronRight" : "chevronLeft"} size={18} />
          </button>
          <button
            type="button"
            onClick={toggleBearbeitungsModus}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-reinweiss/60 ${
              bearbeitungsModus ? "bg-reinweiss text-walnuss" : "text-walnuss/60 hover:text-walnuss"
            }`}
            title={bearbeitungsModus ? "Bearbeitung schließen" : "Navigation anpassen"}
          >
            <Icon name="settings" size={18} />
          </button>
        </div>

        {!bearbeitungsModus && !eingeklappt && kundeNamen && kundeNamen.length > 0 && (
          <div className="mt-sm border-t border-sand pt-sm">
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
