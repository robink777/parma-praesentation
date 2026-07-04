"use client";

import { useState, useEffect, useRef } from "react";
import { Immobilie } from "@/types";
import { formatiereBetrag } from "@/lib/berechnung";

interface ImmobilienSucheProps {
  onAuswaehlen: (immobilie: Immobilie) => void;
  ausgewaehlt?: Immobilie | null;
}

export default function ImmobilienSuche({
  onAuswaehlen,
  ausgewaehlt,
}: ImmobilienSucheProps) {
  const [suche, setSuche] = useState("");
  const [ergebnisse, setErgebnisse] = useState<Immobilie[]>([]);
  const [laden, setLaden] = useState(false);
  const [offen, setOffen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sucheTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOffen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (sucheTimeout.current) clearTimeout(sucheTimeout.current);

    if (suche.length === 0) {
      sucheTimeout.current = setTimeout(() => sucheImmobilien(""), 300);
      return;
    }

    sucheTimeout.current = setTimeout(() => sucheImmobilien(suche), 400);
  }, [suche]);

  async function sucheImmobilien(query: string) {
    setLaden(true);
    setFehler(null);
    try {
      const params = new URLSearchParams({ limit: "15" });
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
      setFehler("Verbindung zur onOffice API fehlgeschlagen");
      setErgebnisse([]);
    } finally {
      setLaden(false);
    }
  }

  function handleFokus() {
    setOffen(true);
    if (ergebnisse.length === 0 && !laden) {
      sucheImmobilien(suche);
    }
  }

  function handleAuswaehlen(immobilie: Immobilie) {
    onAuswaehlen(immobilie);
    setSuche(immobilie.bezeichnung);
    setOffen(false);
  }

  function handleLoeschen() {
    setSuche("");
    setOffen(true);
    sucheImmobilien("");
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Immobilie aus onOffice laden
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          type="text"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          onFocus={handleFokus}
          placeholder="Immobilie suchen (Titel, Ort)..."
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />

        {(suche || ausgewaehlt) && (
          <button
            onClick={handleLoeschen}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {ausgewaehlt && !offen && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          {ausgewaehlt.bildUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ausgewaehlt.bildUrl}
              alt={ausgewaehlt.bezeichnung}
              className="w-14 h-14 object-cover rounded-md flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 truncate">
              {ausgewaehlt.bezeichnung}
            </p>
            <p className="text-xs text-blue-600">
              {[ausgewaehlt.plz, ausgewaehlt.ort].filter(Boolean).join(" ")}
              {ausgewaehlt.wohnflaeche &&
                ` · ${ausgewaehlt.wohnflaeche} m²`}
              {ausgewaehlt.anzahlZimmer &&
                ` · ${ausgewaehlt.anzahlZimmer} Zi.`}
            </p>
            <p className="text-sm font-semibold text-blue-800 mt-0.5">
              {formatiereBetrag(ausgewaehlt.kaufpreis)}
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              ✓ Übernommen
            </span>
          </div>
        </div>
      )}

      {offen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {laden ? (
            <div className="p-4 text-center text-sm text-gray-500">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
              Lade Immobilien...
            </div>
          ) : fehler ? (
            <div className="p-4 text-sm text-red-600 bg-red-50">
              <strong>Fehler:</strong> {fehler}
            </div>
          ) : ergebnisse.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              Keine Immobilien gefunden
            </div>
          ) : (
            <ul>
              {ergebnisse.map((immobilie) => (
                <li key={immobilie.id}>
                  <button
                    onClick={() => handleAuswaehlen(immobilie)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-0"
                  >
                    {immobilie.bildUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={immobilie.bildUrl}
                        alt={immobilie.bezeichnung}
                        className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {immobilie.bezeichnung}
                      </p>
                      <p className="text-xs text-gray-500">
                        {[immobilie.plz, immobilie.ort]
                          .filter(Boolean)
                          .join(" ")}
                        {immobilie.wohnflaeche &&
                          ` · ${immobilie.wohnflaeche} m²`}
                        {immobilie.anzahlZimmer &&
                          ` · ${immobilie.anzahlZimmer} Zi.`}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      {formatiereBetrag(immobilie.kaufpreis)}
                    </span>
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
