"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { PropertyImage } from "@/components/PropertyImage";
import { Immobilie } from "@/types";
import { formatiereBetrag } from "@/lib/berechnung";

// Vorgeschaltete Startseite, bevor die eigentliche Präsentation lädt: Der Berater/die
// Beraterin wählt hier vor dem Kundentermin die zu präsentierende Immobilie aus einer
// Dropdown-Such-Maske (live aus onOffice geladen, siehe /api/onoffice) aus. Die eigentliche
// OnOffice-Link-Übergabe per estateId/addressId-Query-Parameter (siehe app/page.tsx,
// praesentation.ts) bleibt davon unberührt — diese Seite erscheint nur, wenn KEINE
// estateId in der URL steckt, also beim manuellen Aufruf der Basis-URL.
//
// Wichtig: Das Dropdown-Panel ist absolut positioniert (überlagert den Inhalt, statt ihn
// nach unten zu verschieben). Würde die Ergebnisliste stattdessen im normalen Textfluss unter
// dem Suchfeld gerendert, verändert sich bei jeder Tastatureingabe die Layouthöhe — das führte
// dazu, dass die Eingabe im Suchfeld "abriss" (Fokus/Cursor sprang durch das Reflow). Mit einem
// überlagernden Panel bleibt das Eingabefeld an fester Position, die Eingabe funktioniert
// durchgängig.
// Hoher Listlimit (200), damit auch bei größerem Objektbestand wirklich alle Treffer aus
// onOffice geladen werden, statt an einer künstlich niedrigen Vorauswahl abgeschnitten zu sein.
const LISTLIMIT = 200;

function DropdownErgebnis({
  immobilie,
  onAuswaehlen,
}: {
  immobilie: Immobilie;
  onAuswaehlen: (immobilie: Immobilie) => void;
}) {
  const ortszeile = [immobilie.plz, immobilie.ort].filter(Boolean).join(" ");

  return (
    <li>
      <button
        type="button"
        onClick={() => onAuswaehlen(immobilie)}
        className="flex w-full items-center gap-sm border-b border-sand px-sm py-xs text-left transition-colors last:border-0 hover:bg-stein"
      >
        <PropertyImage
          src={immobilie.bildUrl}
          alt={immobilie.bezeichnung}
          className="h-12 w-12 shrink-0 overflow-hidden rounded-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-anthrazit">{immobilie.bezeichnung}</p>
          <p className="mt-[2px] truncate text-small text-anthrazit/60">
            {immobilie.immoNr && <span className="font-mono">{immobilie.immoNr}</span>}
            {immobilie.immoNr && ortszeile && " · "}
            {ortszeile}
            {immobilie.wohnflaeche && ` · ${immobilie.wohnflaeche} m²`}
            {immobilie.anzahlZimmer && ` · ${immobilie.anzahlZimmer} Zi.`}
          </p>
        </div>
        <p className="shrink-0 text-small font-semibold text-anthrazit">
          {formatiereBetrag(immobilie.kaufpreis)}
        </p>
      </button>
    </li>
  );
}

export function ObjektAuswahl() {
  const router = useRouter();
  const [suche, setSuche] = useState("");
  const [ergebnisse, setErgebnisse] = useState<Immobilie[]>([]);
  const [laden, setLaden] = useState(false);
  const [offen, setOffen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [wirdGeladen, setWirdGeladen] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geladenRef = useRef(false);

  // Klick außerhalb des Suchfelds/Dropdowns schließt das Panel wieder.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOffen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Öffnet das Dropdown und lädt einmalig die Startliste direkt beim Mounten — bewusst NICHT
  // über das onFocus-Event des Inputs, da das Feld per autoFocus-Attribut bereits vom Browser
  // fokussiert wird, während/bevor React nach der Hydration seinen synthetischen Fokus-Handler
  // registriert. Der resultierende native "focus" verpufft dadurch ungesehen, das Dropdown
  // blieb beim ersten Laden der Seite dauerhaft zu, obwohl das Feld sichtbar fokussiert war.
  // Ein separater Mount-Effect ist von dieser Race-Condition unabhängig. onFocus bleibt für den
  // Fall erhalten, dass Nutzer/innen das Feld verlassen und danach erneut anklicken.
  useEffect(() => {
    handleFokus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced Nachladen bei Eingabe — nur, solange das Dropdown bereits offen ist (verhindert
  // einen doppelten Abruf direkt nach dem initialen Laden beim Fokussieren, siehe handleFokus).
  useEffect(() => {
    if (!offen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => sucheImmobilien(suche), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suche]);

  async function sucheImmobilien(query: string) {
    setLaden(true);
    setFehler(null);
    try {
      const params = new URLSearchParams({ limit: String(LISTLIMIT) });
      if (query) params.set("suche", query);

      const res = await fetch(`/api/onoffice?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setFehler(data.error || "Fehler beim Laden der Immobilien");
        setErgebnisse([]);
        return;
      }

      setErgebnisse(Array.isArray(data) ? data : []);
    } catch {
      setFehler("Verbindung zur onOffice-API fehlgeschlagen");
      setErgebnisse([]);
    } finally {
      setLaden(false);
    }
  }

  function handleFokus() {
    setOffen(true);
    if (!geladenRef.current) {
      geladenRef.current = true;
      sucheImmobilien(suche);
    }
  }

  function handleAuswaehlen(immobilie: Immobilie) {
    setOffen(false);
    setSuche(immobilie.bezeichnung);
    setWirdGeladen(immobilie.id);
    router.push(`/?estateId=${encodeURIComponent(immobilie.id)}`);
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-reinweiss px-lg py-2xl">
      <div className="w-full max-w-[640px]">
        <Image
          src="/logos/immobilien-quer.svg"
          alt="Parma Immobilien"
          width={200}
          height={50}
          className="mb-xl"
          priority
        />

        <p className="label mb-xs">Präsentation starten</p>
        <h1 className="mb-sm text-[32px] leading-[1.2] md:text-[40px]">
          Welche Immobilie möchten Sie präsentieren?
        </h1>
        <p className="mb-lg max-w-[55ch] text-body text-anthrazit/60">
          Wählen Sie das Objekt für den heutigen Kundentermin aus — die Präsentation lädt
          anschließend automatisch mit den passenden Objekt-, Bewertungs- und Kontaktdaten.
        </p>

        <div ref={containerRef} className="relative">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-sm flex items-center text-walnuss/40">
              <Icon name="search" size={20} />
            </div>
            <input
              type="text"
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              onFocus={handleFokus}
              placeholder="Immobilie suchen (Titel, ImmoNr, Ort, PLZ) …"
              className="w-full rounded-md border-2 border-asche bg-reinweiss py-sm pl-[48px] pr-sm text-body text-anthrazit outline-none transition-colors placeholder:text-anthrazit/40 focus:border-messing"
              autoFocus
            />
          </div>

          {offen && (
            <div className="absolute z-50 mt-xs max-h-[420px] w-full overflow-y-auto rounded-md border-2 border-asche bg-reinweiss shadow-lg">
              {laden ? (
                <div className="flex items-center justify-center gap-xs py-lg text-small text-anthrazit/60">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-asche border-t-messing" />
                  Lade Immobilien …
                </div>
              ) : fehler ? (
                <div className="p-sm text-small text-anthrazit">
                  <strong className="font-medium">Fehler:</strong> {fehler}
                </div>
              ) : ergebnisse.length === 0 ? (
                <div className="py-lg text-center text-small text-anthrazit/50">
                  Keine Immobilien gefunden.
                </div>
              ) : (
                <ul>
                  {ergebnisse.map((immobilie) => (
                    <DropdownErgebnis
                      key={immobilie.id}
                      immobilie={immobilie}
                      onAuswaehlen={handleAuswaehlen}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {wirdGeladen && (
          <div className="mt-md flex items-center gap-xs text-small text-anthrazit/60">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-asche border-t-messing" />
            Präsentation wird geladen …
          </div>
        )}
      </div>
    </div>
  );
}
