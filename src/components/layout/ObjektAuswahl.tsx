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
// Beim Klick in die noch leere Suchleiste werden bewusst nur die zuletzt angelegten Objekte
// gezeigt (statt der vollen, alphabetisch sortierten Liste) — das ist die praktisch relevantere
// Vorauswahl direkt nach dem Öffnen, siehe sucheImmobilien()/handleFokus() unten.
const NEUESTE_LIMIT = 10;

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
            {/* !! statt direktem && — sonst rendert React bei wohnflaeche/anzahlZimmer === 0
                die Zahl "0" als sichtbaren Text, statt (wie bei fehlendem Wert) nichts anzuzeigen. */}
            {!!immobilie.wohnflaeche && ` · ${immobilie.wohnflaeche} m²`}
            {!!immobilie.anzahlZimmer && ` · ${immobilie.anzahlZimmer} Zi.`}
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
  // Aktuell ausgewähltes Objekt (Klick auf ein Dropdown-Ergebnis, siehe handleAuswaehlen) —
  // erst wenn dieser State gesetzt ist, wird "Präsentation erstellen" klickbar (siehe Button
  // unten und Chat-Vorgabe: Auswahl und Erstellung sind zwei getrennte Schritte). Wird wieder auf
  // null zurückgesetzt, sobald der Suchtext manuell verändert wird (siehe onChange am Input).
  const [ausgewaehlt, setAusgewaehlt] = useState<Immobilie | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geladenRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      // Leere Suche (Klick ins frische Feld oder Text wieder gelöscht) zeigt bewusst nicht die
      // volle, alphabetisch sortierte Liste, sondern gezielt die zuletzt angelegten Objekte
      // (siehe NEUESTE_LIMIT oben und "neueste"-Zweig in /api/onoffice/route.ts).
      const params = query
        ? new URLSearchParams({ limit: String(LISTLIMIT), suche: query })
        : new URLSearchParams({ limit: String(NEUESTE_LIMIT), neueste: "1" });

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

  // "Präsentation erstellen"-Button: navigiert erst dann tatsächlich zur Präsentation, wenn
  // zuvor ein Objekt ausgewählt wurde (siehe ausgewaehlt-State und handleAuswaehlen unten) —
  // Auswahl und Erstellung sind bewusst zwei getrennte Schritte (siehe Chat-Vorgabe). Ohne
  // Auswahl ist der Button disabled (siehe JSX unten) und dieser Handler feuert gar nicht erst.
  function handlePraesentationErstellen() {
    if (!ausgewaehlt) return;
    setWirdGeladen(ausgewaehlt.id);
    router.push(`/?estateId=${encodeURIComponent(ausgewaehlt.id)}`);
  }

  // Klick auf ein Dropdown-Ergebnis wählt das Objekt nur aus (Suchfeld zeigt seinen Namen,
  // Dropdown schließt, "Präsentation erstellen" wird klickbar) — die eigentliche Navigation
  // passiert erst durch den zusätzlichen Klick auf den Button (handlePraesentationErstellen).
  function handleAuswaehlen(immobilie: Immobilie) {
    setOffen(false);
    setSuche(immobilie.bezeichnung);
    setAusgewaehlt(immobilie);
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
              ref={inputRef}
              type="text"
              value={suche}
              // Manuelle Texteingabe verwirft eine zuvor per Dropdown getroffene Auswahl wieder
              // (siehe ausgewaehlt-State oben) — wer den Text ändert, sucht erkennbar ein anderes
              // Objekt, "Präsentation erstellen" wird also wieder inaktiv, bis erneut ausgewählt
              // wird.
              onChange={(e) => {
                setSuche(e.target.value);
                setAusgewaehlt(null);
              }}
              onFocus={handleFokus}
              placeholder="Immobilie suchen (Titel, ImmoNr, Ort, PLZ, Straße) …"
              className="w-full rounded-md border-2 border-asche bg-reinweiss py-sm pl-[48px] pr-sm text-body text-anthrazit outline-none transition-colors placeholder:text-anthrazit/40 focus:border-messing"
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

        {/* Zwei Einstiegspunkte unter der Suchleiste: "Präsentation erstellen" ist erst
            klickbar, nachdem oben ein Objekt ausgewählt wurde (siehe ausgewaehlt-State,
            handleAuswaehlen, handlePraesentationErstellen) — ohne Auswahl disabled und auf
            40% Deckkraft gedimmt als optisches Feedback, bei Auswahl volle 100% Deckkraft.
            "Admin-Bereich" führt zu /admin, das zusätzlich zur bestehenden App-weiten Anmeldung
            noch ein zweites, separates Passwort verlangt (siehe lib/auth.ts-Pendant für den
            Admin-Bereich) — daher optisch zurückhaltender (Outline statt Messing-Fläche) und
            mit Schloss-Icon markiert. */}
        <div className="mt-md flex flex-col gap-sm sm:flex-row">
          <button
            type="button"
            onClick={handlePraesentationErstellen}
            disabled={!ausgewaehlt}
            className={`flex flex-1 items-center justify-center gap-xs rounded-md bg-messing px-lg py-sm font-medium text-reinweiss transition-opacity ${
              ausgewaehlt
                ? "opacity-100 hover:opacity-90"
                : "cursor-not-allowed opacity-40 hover:opacity-40"
            }`}
          >
            <Icon name="document" size={20} />
            Präsentation erstellen
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="flex flex-1 items-center justify-center gap-xs rounded-sm border-2 border-asche bg-reinweiss px-lg py-sm font-medium text-anthrazit transition-colors hover:border-messing"
          >
            <Icon name="lock" size={20} />
            Admin-Bereich
          </button>
        </div>
      </div>
    </div>
  );
}
