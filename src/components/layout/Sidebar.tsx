"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { NavItem, NavZustandEintrag } from "./nav";
import { NavZustandBearbeiten } from "./NavZustandBearbeiten";

// Wiederverwendbare Sidebar-Chrome (Logo, Ein-/Ausklappen, Bearbeitungsmodus für Reihenfolge/
// Sichtbarkeit) — genutzt sowohl von der Kundenpräsentation (PraesentationApp.tsx, NAV_ITEMS aus
// nav.ts) als auch vom Admin-Bereich (Mitarbeiterstatistik.tsx, ADMIN_NAV_ITEMS aus
// admin/adminNav.ts). Chat-Vorgabe August 2026: "ich hätte gerne in der Statistik ein identisches
// Layout wie bei der Präsentation" — beide Bereiche teilen sich seitdem dieselbe Komponente statt
// zweier optisch/funktional auseinanderlaufender Nachbauten.
// Ein Eigentümer/Auftraggeber-Kontakt im "Präsentation für"-Block der Sidebar (siehe
// kundenKontakte unten) — email/telefon optional, da in onOffice nicht für jede Person gepflegt.
export interface SidebarKontakt {
  name: string;
  email?: string;
  telefon?: string;
}

export function Sidebar({
  navItems,
  activeId,
  onSelect,
  logoHref = "/",
  kundenKontakte,
  navZustand,
  onVerschieben,
  onUmschalten,
  onZuruecksetzen,
  // Blendet das Zahnrad (Bearbeitungsmodus-Zugang) aus — für den geteilten, unveränderbaren
  // Kunden-Link (siehe PraesentationApp.tsx readOnly-Prop, lib/share.ts): Der Kunde soll die
  // vom Berater/von der Beraterin im Vorbereitungsmodus getroffene Auswahl nicht mehr ändern
  // können.
  bearbeitungErlaubt = true,
  onZurVorbereitung,
}: {
  navItems: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  // Ziel des Logo-Klicks — Präsentation führt zurück zur Objektauswahl ("/"), der Admin-Bereich
  // übergibt stattdessen "/admin".
  logoHref?: string;
  // Bei mehreren Eigentümern (Miteigentum, Erbengemeinschaft) ein Block pro Person (siehe
  // PraesentationApp.tsx) — inkl. E-Mail/Telefon (Chat-Vorgabe: "blende die Mailadresse und
  // Telefonnummer der Kunden in der dauerhaften Navi links ein"). Im Admin-Bereich schlicht nicht
  // übergeben, der Block dort bleibt dann ausgeblendet.
  kundenKontakte?: SidebarKontakt[];
  // Reihenfolge + Sichtbarkeit der Navigationspunkte — seit dem Vorbereitungsmodus (siehe
  // Vorbereitungsmodus.tsx) kontrollierter Zustand der jeweiligen Elternseite (useNavZustand-
  // Hook, siehe nav.ts) statt lokalem State hier, damit Vorbereitungsmodus und Sidebar dieselbe
  // Auswahl teilen.
  navZustand: NavZustandEintrag[];
  onVerschieben: (index: number, richtung: -1 | 1) => void;
  onUmschalten: (id: string) => void;
  onZuruecksetzen: () => void;
  bearbeitungErlaubt?: boolean;
  // Führt zurück in den Vorbereitungsmodus (Vergleichsobjekte, Navigation, ...) — die
  // Präsentation startet bei bereits gespeichertem Stand direkt, ohne Umweg über die Vorbereitung
  // (siehe PraesentationApp.tsx). Nicht übergeben im geteilten Kunden-Link/Admin-Bereich.
  onZurVorbereitung?: () => void;
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

        {bearbeitungsModus && bearbeitungErlaubt ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <p className="label mb-xs px-sm">Navigation anpassen</p>
            <NavZustandBearbeiten
              navItems={navItems}
              navZustand={navZustand}
              onVerschieben={onVerschieben}
              onUmschalten={onUmschalten}
              onZuruecksetzen={onZuruecksetzen}
              onFertig={() => setBearbeitungsModus(false)}
            />
          </div>
        ) : (
          <nav className="flex min-h-0 flex-1 flex-col gap-xs overflow-y-auto">
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
          {onZurVorbereitung && (
            <button
              type="button"
              onClick={onZurVorbereitung}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-walnuss/60 transition-colors hover:bg-reinweiss/60 hover:text-walnuss"
              title="Zurück zur Vorbereitung"
              aria-label="Zurück zur Vorbereitung"
            >
              <Icon name="sliders" size={18} />
            </button>
          )}
          {bearbeitungErlaubt && (
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
          )}
        </div>

        {/* max-h + overflow-y-auto statt frei wachsender Höhe: Bei mehreren Eigentümern
            (Miteigentum/Erbengemeinschaft, bis zu 4 Personen à Name + E-Mail + Telefon, siehe
            Chat-Vorgabe-Check "bis zu 4 Eigentümer") würde dieser Block sonst die Navigation
            darüber zusammenstauchen oder unten aus der fest positionierten Sidebar herauslaufen,
            da "aside" oben eine feste Höhe hat und nur "nav" selbst scrollt. Ein eigener
            Scroll-Bereich hält den Block bei vielen Personen kompakt, ohne die Nav-Liste zu
            verdrängen. */}
        {!bearbeitungsModus && !eingeklappt && kundenKontakte && kundenKontakte.length > 0 && (
          <div className="mt-sm max-h-[240px] shrink-0 overflow-y-auto border-t border-sand pt-sm">
            <p className="label mb-xs">Präsentation für</p>
            {kundenKontakte.map((kontakt, i) => (
              <div key={i} className={i > 0 ? "mt-sm" : ""}>
                <p className="truncate font-slab text-lg text-anthrazit">{kontakt.name}</p>
                {kontakt.email && (
                  <p className="flex items-center gap-xs text-small text-anthrazit/60">
                    <Icon name="mail" size={12} className="shrink-0" />
                    <span className="truncate">{kontakt.email}</span>
                  </p>
                )}
                {kontakt.telefon && (
                  <p className="flex items-center gap-xs text-small text-anthrazit/60">
                    <Icon name="phone" size={12} className="shrink-0" />
                    <span className="truncate">{kontakt.telefon}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>
    </>
  );
}
