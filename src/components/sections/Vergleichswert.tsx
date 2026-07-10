"use client";

import { useEffect, useRef, useState } from "react";
import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { PropertyImage } from "@/components/PropertyImage";
import { ParmaLoader } from "@/components/ParmaLoader";
import { Immobilie } from "@/types";
import { formatiereBetrag } from "@/lib/berechnung";

// Kleine Trefferliste beim Fokussieren des leeren Suchfelds — analog zu ObjektAuswahl.tsx,
// dort aber "zuletzt angelegt", hier (verkauft=1) "zuletzt verkauft".
const NEUESTE_LIMIT = 10;
// Hohes Limit für die eigentliche Freitextsuche, siehe Begründung in /api/onoffice/route.ts —
// mit nur 232 verkauften Objekten insgesamt (Live-Account, Juli 2026) genügt hier deutlich
// weniger als das dortige RAW_LISTLIMIT für den vollen "kauf"-Bestand.
const LISTLIMIT = 250;

function berechneMittelwerte(objekte: Immobilie[]) {
  const kaufpreise = objekte.map((o) => o.kaufpreis).filter((p) => p > 0);
  const kaufpreis = kaufpreise.length ? kaufpreise.reduce((a, b) => a + b, 0) / kaufpreise.length : undefined;

  const flaechen = objekte.map((o) => o.wohnflaeche).filter((f): f is number => !!f);
  const wohnflaeche = flaechen.length ? flaechen.reduce((a, b) => a + b, 0) / flaechen.length : undefined;

  // Preis/m² je Objekt einzeln berechnen und davon den Mittelwert bilden (statt Summe der
  // Preise durch Summe der Flächen) — sonst würde ein einzelnes großes Objekt den Wert
  // überproportional dominieren.
  const preiseProM2 = objekte
    .filter((o) => o.kaufpreis > 0 && o.wohnflaeche)
    .map((o) => o.kaufpreis / o.wohnflaeche!);
  const preisProM2 = preiseProM2.length ? preiseProM2.reduce((a, b) => a + b, 0) / preiseProM2.length : undefined;

  return { kaufpreis, wohnflaeche, preisProM2 };
}

function ReferenzobjektSlot({
  objekt,
  ausgeschlosseneIds,
  onAuswaehlen,
  onEntfernen,
}: {
  objekt: Immobilie | null;
  ausgeschlosseneIds: string[];
  onAuswaehlen: (objekt: Immobilie) => void;
  onEntfernen: () => void;
}) {
  const [suche, setSuche] = useState("");
  const [ergebnisse, setErgebnisse] = useState<Immobilie[]>([]);
  const [laden, setLaden] = useState(false);
  const [offen, setOffen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geladenRef = useRef(false);

  // Klick außerhalb schließt das Dropdown wieder (identisches Muster wie in ObjektAuswahl.tsx).
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOffen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!offen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => sucheObjekte(suche), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suche]);

  async function sucheObjekte(query: string) {
    setLaden(true);
    setFehler(null);
    try {
      // verkauft=1: Serverseitig auf status2=verkauft gefiltert (siehe /api/onoffice/route.ts) —
      // die Suchmaske soll ausschließlich tatsächlich verkaufte Referenzobjekte anbieten.
      const params = query
        ? new URLSearchParams({ limit: String(LISTLIMIT), suche: query, verkauft: "1" })
        : new URLSearchParams({ limit: String(NEUESTE_LIMIT), neueste: "1", verkauft: "1" });

      const res = await fetch(`/api/onoffice?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setFehler(data.error || "Fehler beim Laden der Objekte");
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
      sucheObjekte(suche);
    }
  }

  function handleAuswaehlen(gewaehlt: Immobilie) {
    setOffen(false);
    setSuche("");
    onAuswaehlen(gewaehlt);
  }

  if (objekt) {
    return (
      <Card className="relative">
        <button
          type="button"
          onClick={onEntfernen}
          aria-label="Referenzobjekt entfernen"
          className="absolute right-sm top-sm rounded-full bg-reinweiss p-xs text-anthrazit/50 transition-colors hover:text-anthrazit"
        >
          <Icon name="close" size={16} />
        </button>
        <PropertyImage
          src={objekt.bildUrl}
          alt={objekt.bezeichnung}
          className="mb-sm h-32 w-full rounded-sm"
        />
        <p className="mb-xs font-medium text-anthrazit">{objekt.bezeichnung}</p>
        <p className="mb-sm text-small text-anthrazit/60">
          {[objekt.plz, objekt.ort].filter(Boolean).join(" ")}
          {!!objekt.wohnflaeche && ` · ${objekt.wohnflaeche} m²`}
          {!!objekt.baujahr && ` · Baujahr ${objekt.baujahr}`}
        </p>
        <p className="font-slab text-xl font-bold text-walnuss">{formatiereBetrag(objekt.kaufpreis)}</p>
        {objekt.verkauftAm && (
          <p className="mt-xs text-small text-anthrazit/50">
            Verkauft am {new Date(objekt.verkauftAm).toLocaleDateString("de-DE")}
          </p>
        )}
      </Card>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full">
      <Card className="flex h-full min-h-[220px] flex-col items-center justify-center gap-sm border-2 border-dashed border-asche bg-transparent text-center">
        <Icon name="search" size={24} className="text-anthrazit/30" />
        <input
          type="text"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          onFocus={handleFokus}
          placeholder="Verkauftes Objekt suchen …"
          className="w-full max-w-[220px] rounded-md border-2 border-asche bg-reinweiss px-sm py-xs text-center text-small text-anthrazit outline-none transition-colors placeholder:text-anthrazit/40 focus:border-messing"
        />
      </Card>

      {offen && (
        <div className="absolute z-50 mt-xs max-h-[360px] w-full min-w-[280px] overflow-y-auto rounded-md border-2 border-asche bg-reinweiss shadow-lg">
          {laden ? (
            <div className="flex items-center justify-center gap-xs py-lg text-small text-anthrazit/60">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-asche border-t-messing" />
              Lade Objekte …
            </div>
          ) : fehler ? (
            <div className="p-sm text-small text-anthrazit">
              <strong className="font-medium">Fehler:</strong> {fehler}
            </div>
          ) : ergebnisse.filter((o) => !ausgeschlosseneIds.includes(o.id)).length === 0 ? (
            <div className="py-lg text-center text-small text-anthrazit/50">
              Keine verkauften Objekte gefunden.
            </div>
          ) : (
            <ul>
              {ergebnisse
                .filter((o) => !ausgeschlosseneIds.includes(o.id))
                .map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => handleAuswaehlen(o)}
                      className="flex w-full items-center gap-sm border-b border-sand px-sm py-xs text-left transition-colors last:border-0 hover:bg-stein"
                    >
                      <PropertyImage
                        src={o.bildUrl}
                        alt={o.bezeichnung}
                        className="h-10 w-10 shrink-0 overflow-hidden rounded-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-small font-medium text-anthrazit">{o.bezeichnung}</p>
                        <p className="mt-[2px] truncate text-small text-anthrazit/60">
                          {[o.plz, o.ort].filter(Boolean).join(" ")}
                          {!!o.wohnflaeche && ` · ${o.wohnflaeche} m²`}
                        </p>
                      </div>
                      <p className="shrink-0 text-small font-semibold text-anthrazit">
                        {formatiereBetrag(o.kaufpreis)}
                      </p>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Referenzobjekt-Auswahl: Der Berater/die Beraterin wählt bis zu drei tatsächlich verkaufte
// Vergleichsobjekte aus dem echten OnOffice-Bestand aus (Suchmaske gefiltert auf status2=verkauft,
// siehe /api/onoffice/route.ts). Eine frühere automatische Ähnlichkeits-Bewertung gegen einen
// festen Demo-Objektpool lieferte keine zum jeweiligen Kundenobjekt passenden Treffer und wurde
// deshalb komplett ersetzt (Juli 2026) — die Auswahl war seitdem rein manuell.
// Seit Juli 2026 gibt es zusätzlich wieder eine automatische VORAUSWAHL (siehe
// lib/vergleichswert.ts, waehleVorauswahl, aufgerufen aus PraesentationApp.tsx): Sie arbeitet
// diesmal gegen den echten verkauften Bestand statt eines Demo-Pools und nutzt eine explizit
// vorgegebene, kaskadierende Filterlogik (PLZ exakt → Wohnfläche/Baujahr/Kaufpreis mit Toleranz)
// statt eines pauschalen Ähnlichkeits-Scores. Sie befüllt nur den leeren Ausgangszustand — die
// hier implementierte manuelle Suche bleibt unverändert vollständig erhalten, jede Auswahl (ob
// automatisch vorbefüllt oder manuell gewählt) ist jederzeit anpassbar und austauschbar. Die
// Auswahl liegt (wie gewaehltesPaket) in PraesentationApp.tsx, damit sie beim Wechsel zwischen
// Reitern erhalten bleibt.
export function Vergleichswert({
  referenzobjekte,
  onReferenzobjektAendern,
  vorauswahlLaedt,
}: {
  referenzobjekte: (Immobilie | null)[];
  onReferenzobjektAendern: (index: number, objekt: Immobilie | null) => void;
  // Läuft der automatische Vorauswahl-Abruf (siehe PraesentationApp.tsx) noch? Solange das der
  // Fall ist UND noch kein Objekt gewählt ist, wird unten ein kleiner Ladezustand (ParmaLoader,
  // kompakte Größe) statt der leeren Suchmasken gezeigt — vorher gab es hier gar keine visuelle
  // Rückmeldung, dass im Hintergrund noch etwas lädt.
  vorauswahlLaedt: boolean;
}) {
  const ausgewaehlt = referenzobjekte.filter((o): o is Immobilie => o !== null);
  const mittelwerte = ausgewaehlt.length > 0 ? berechneMittelwerte(ausgewaehlt) : null;
  const ausgewaehlteIds = ausgewaehlt.map((o) => o.id);
  // Sobald der Nutzer manuell etwas auswählt (auch während der Vorauswahl-Abruf noch läuft),
  // sofort die normale Slot-Ansicht zeigen statt weiter den Ladeplatzhalter — die manuelle
  // Auswahl soll nie hinter dem Ladezustand verschwinden.
  const zeigeLadeplatzhalter = vorauswahlLaedt && ausgewaehlt.length === 0;

  return (
    <SectionShell label="Marktvergleich" title="Vergleichbare, verkaufte Objekte">
      <p className="mb-lg max-w-[65ch] text-body text-anthrazit/80">
        Wir haben bereits bis zu drei passende, tatsächlich verkaufte Objekte vorausgewählt (nach
        PLZ, Wohnfläche, Baujahr und Kaufpreis) — Sie können die Auswahl jederzeit anpassen oder
        gegen ein anderes Objekt aus dem Bestand austauschen. Die Suchmaske zeigt ausschließlich
        abgeschlossene Verkäufe, keine aktuell angebotenen Objekte.
      </p>

      {mittelwerte && (
        <Card className="mb-lg border-2 border-messing">
          <p className="label mb-sm">
            Mittelwerte aus {ausgewaehlt.length} ausgewählten Objekt{ausgewaehlt.length === 1 ? "" : "en"}
          </p>
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-3">
            <div>
              <p className="label mb-xs">Ø Kaufpreis</p>
              <p className="font-slab text-2xl font-bold text-anthrazit">
                {mittelwerte.kaufpreis !== undefined ? formatiereBetrag(Math.round(mittelwerte.kaufpreis)) : "—"}
              </p>
            </div>
            <div>
              <p className="label mb-xs">Ø Wohnfläche</p>
              <p className="font-slab text-2xl font-bold text-anthrazit">
                {mittelwerte.wohnflaeche !== undefined ? `${Math.round(mittelwerte.wohnflaeche)} m²` : "—"}
              </p>
            </div>
            <div>
              <p className="label mb-xs">Ø Preis / m²</p>
              <p className="font-slab text-2xl font-bold text-anthrazit">
                {mittelwerte.preisProM2 !== undefined
                  ? `${Math.round(mittelwerte.preisProM2).toLocaleString("de-DE")} €/m²`
                  : "—"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {zeigeLadeplatzhalter ? (
        <Card className="flex min-h-[220px] flex-col items-center justify-center gap-sm border-2 border-dashed border-asche bg-transparent">
          <ParmaLoader label="Vergleichsobjekte werden geladen" size={72} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-sm md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <ReferenzobjektSlot
              key={index}
              objekt={referenzobjekte[index]}
              ausgeschlosseneIds={ausgewaehlteIds}
              onAuswaehlen={(objekt) => onReferenzobjektAendern(index, objekt)}
              onEntfernen={() => onReferenzobjektAendern(index, null)}
            />
          ))}
        </div>
      )}
    </SectionShell>
  );
}
