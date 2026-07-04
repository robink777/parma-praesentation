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
// Such-Maske (live aus onOffice geladen, siehe /api/onoffice) aus. Die eigentliche
// OnOffice-Link-Übergabe per estateId/addressId-Query-Parameter (siehe app/page.tsx,
// praesentation.ts) bleibt davon unberührt — diese Seite erscheint nur, wenn KEINE
// estateId in der URL steckt, also beim manuellen Aufruf der Basis-URL.
function EinzelnesErgebnis({
  immobilie,
  onAuswaehlen,
}: {
  immobilie: Immobilie;
  onAuswaehlen: (immobilie: Immobilie) => void;
}) {
  const ortszeile = [immobilie.plz, immobilie.ort].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      onClick={() => onAuswaehlen(immobilie)}
      className="flex w-full items-center gap-md rounded-md border-2 border-transparent bg-stein p-sm text-left transition-colors hover:border-messing"
    >
      <PropertyImage
        src={immobilie.bildUrl}
        alt={immobilie.bezeichnung}
        className="h-16 w-16 shrink-0 overflow-hidden rounded-sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-anthrazit">{immobilie.bezeichnung}</p>
        <p className="mt-[2px] text-small text-anthrazit/60">
          {ortszeile}
          {immobilie.wohnflaeche && ` · ${immobilie.wohnflaeche} m²`}
          {immobilie.anzahlZimmer && ` · ${immobilie.anzahlZimmer} Zi.`}
        </p>
      </div>
      <p className="shrink-0 font-slab font-semibold text-anthrazit">
        {formatiereBetrag(immobilie.kaufpreis)}
      </p>
      <Icon name="chevronRight" size={20} className="shrink-0 text-walnuss/40" />
    </button>
  );
}

export function ObjektAuswahl() {
  const router = useRouter();
  const [suche, setSuche] = useState("");
  const [ergebnisse, setErgebnisse] = useState<Immobilie[]>([]);
  const [laden, setLaden] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [wirdGeladen, setWirdGeladen] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => sucheImmobilien(suche), suche ? 350 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suche]);

  async function sucheImmobilien(query: string) {
    setLaden(true);
    setFehler(null);
    try {
      const params = new URLSearchParams({ limit: "30" });
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

  function handleAuswaehlen(immobilie: Immobilie) {
    setWirdGeladen(immobilie.id);
    router.push(`/?estateId=${encodeURIComponent(immobilie.id)}`);
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-y-auto bg-reinweiss px-lg py-2xl">
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

        <div className="relative mb-md">
          <div className="pointer-events-none absolute inset-y-0 left-sm flex items-center text-walnuss/40">
            <Icon name="search" size={20} />
          </div>
          <input
            type="text"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Immobilie suchen (Titel, Ort, PLZ) …"
            className="w-full rounded-md border-2 border-asche bg-reinweiss py-sm pl-[48px] pr-sm text-body text-anthrazit outline-none transition-colors placeholder:text-anthrazit/40 focus:border-messing"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-xs">
          {laden ? (
            <div className="flex items-center justify-center gap-xs py-lg text-small text-anthrazit/60">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-asche border-t-messing" />
              Lade Immobilien …
            </div>
          ) : fehler ? (
            <div className="rounded-md border-2 border-messing/40 bg-stein p-sm text-small text-anthrazit">
              <strong className="font-medium">Fehler:</strong> {fehler}
            </div>
          ) : ergebnisse.length === 0 ? (
            <div className="py-lg text-center text-small text-anthrazit/50">
              Keine Immobilien gefunden.
            </div>
          ) : (
            ergebnisse.map((immobilie) => (
              <EinzelnesErgebnis
                key={immobilie.id}
                immobilie={immobilie}
                onAuswaehlen={handleAuswaehlen}
              />
            ))
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
