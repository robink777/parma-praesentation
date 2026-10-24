"use client";

import { useEffect, useRef, useState } from "react";
// Named statt Default-Import: maplibre-gl 6 exportiert keinen Default mehr (siehe dist/
// maplibre-gl.d.ts) — "Map" bewusst zu "MaplibreMap" umbenannt, um nicht die eingebaute
// JS-Klasse "Map" zu verschatten.
import { Map as MaplibreMap, Marker, NavigationControl, setWorkerUrl, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ObjektkarteDaten } from "@/types";
import plzGeoJson from "@/data/geo/landkreis-dueren-plz.json";
import plzOrte from "@/data/geo/landkreis-dueren-plz-orte.json";
import kreisUmrissGeoJson from "@/data/geo/landkreis-dueren-umriss.json";

// Objektkarte: zeigt, wo im Landkreis Düren Objekte in Akquise, aktivem Verkauf und bereits
// verkauft sind (Chat-Vorgabe Oktober 2026) — Zahlen aus onOffice (siehe onoffice/estate.ts,
// ladeObjektkarteDaten), Geometrie aus einem früheren Projekt (Standort-Karte-Skill,
// ~/.claude/skills/standort-karte/landkreis-dueren/plz_clipped.json: 18 PLZ-Gebiete des
// Landkreises, aus OpenStreetMap/Overpass gezogen und an die Kreisgrenze geschnitten — hier als
// src/data/geo/landkreis-dueren-plz.json übernommen, damit die Karte ohne Live-Abruf gegen OSM
// sofort lädt). Kartenkacheln kommen live von OpenFreeMap (siehe KARTENSTIL unten) — ein
// OSM-basierter, kostenloser Kachel-Dienst ohne API-Key, bereits im Vorprojekt erprobt.
//
// Bewusst zentrumsbasierte Marker statt einer Flächen-Einfärbung nach Objektzahl: Eine
// durchgehende Farbverlaufs-Füllung über alle 18 Gebiete würde der CI-Regel "Messing max. einmal
// pro Sichtbereich" widersprechen (viele unterschiedlich intensive Messing-Töne gleichzeitig).
// Stattdessen bleiben die Flächen neutral (Stein-Füllung, Walnuss-Umriss), die drei Kategorien
// erscheinen nur als kompakte, weiße Stat-Karten an den PLZ-Mittelpunkten — "Verkaufen" ist dabei
// bewusst der einzige Messing-Akzent der Karte (aktiver Vermarktungsstatus), Akquise und Verkauft
// nutzen gedeckte Walnuss-/Asche-Töne.
interface PlzFeatureProps {
  plz: string;
  st: string;
  label: [number, number];
}

const FARBE = {
  akquise: "#503F3D",
  verkaufen: "#CB8E49",
  verkauft: "#A9A29A",
} as const;

const KATEGORIEN: { key: keyof typeof FARBE; label: string }[] = [
  { key: "akquise", label: "Akquise" },
  { key: "verkaufen", label: "Verkaufen" },
  { key: "verkauft", label: "Verkauft" },
];

// Vektor-Kachelstil von OpenFreeMap (tiles.openfreemap.org/planet, frei nutzbar ohne Key) — auf
// die für eine Übersichtskarte nötigen Ebenen reduziert und in CI-Tönen statt der
// OpenFreeMap-Standardfarben gehalten, damit die Karte wie ein Parma-Dokument wirkt statt wie ein
// generischer Kartenausschnitt.
// MapLibre lädt seine Geometrie-/Kachel-Verarbeitung in einem eigenen Web Worker, den das Paket
// intern über "new Worker(new URL(..., import.meta.url))" referenziert — ein Muster, das
// Next.js/webpack nur in selbst kompiliertem Quelltext auflöst, nicht in einem bereits
// vorgebauten npm-Paket. Ohne diese Zeile schlägt das Laden des Workers im Next-Build mit
// "Failed to load module script" fehl (live beobachtet Oktober 2026) — die Zieldatei wird von
// scripts/copy-maplibre-worker.cjs (siehe dort) bei jedem "npm install" aus node_modules nach
// public/vendor kopiert.
setWorkerUrl("/vendor/maplibre-gl-worker.js");

const KARTENMITTE: [number, number] = [6.47, 50.82];

// Bounding Box der vollständigen Kreisgeometrie (aus landkreis-dueren-plz.json berechnet,
// Oktober 2026) mit etwas Rand — begrenzt zusammen mit minZoom in der MaplibreMap-Konstruktion,
// wie weit sich die "fixe" Karte überhaupt noch bewegen lässt (siehe Kommentar dort).
const KREIS_BOUNDS: [[number, number], [number, number]] = [
  [5.95, 50.42],
  [6.96, 51.22],
];

// Chat-Vorgabe Oktober 2026: "beim Klicken auf die PLZ Bereich soll die Karte ein bisschen
// reinzoomen" — fester Ziel-Zoom statt relativer Schritte, damit mehrfaches Klicken (auch auf
// dasselbe oder verschiedene Gebiete) immer zum gleichen, maßvollen Ausschnitt führt statt sich
// bei jedem Klick weiter aufzuaddieren. maxZoom auf der Karte selbst knapp darüber, da ohne
// dragPan (siehe MaplibreMap-Konstruktion) ein stärker hineingezoomter Ausschnitt nicht mehr
// verschoben werden könnte.
const KLICK_ZOOM = 10.6;

const KARTENSTIL: StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: { osm: { type: "vector", url: "https://tiles.openfreemap.org/planet" } },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#FCFCFB" } },
    {
      id: "water",
      type: "fill",
      source: "osm",
      "source-layer": "water",
      paint: { "fill-color": "#E1D6C1", "fill-opacity": 0.4 },
    },
    {
      id: "landuse",
      type: "fill",
      source: "osm",
      "source-layer": "landuse",
      paint: { "fill-color": "#F2F1ED", "fill-opacity": 0.6 },
    },
    {
      id: "roads",
      type: "line",
      source: "osm",
      "source-layer": "transportation",
      minzoom: 9,
      paint: { "line-color": "#A9A29A", "line-width": 0.6, "line-opacity": 0.5 },
    },
    {
      id: "places",
      type: "symbol",
      source: "osm",
      "source-layer": "place",
      filter: ["in", "class", "city", "town"],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
      },
      paint: { "text-color": "#503F3D", "text-opacity": 0.35, "text-halo-color": "#FCFCFB", "text-halo-width": 1 },
    },
  ],
};

function formatiereKarte(daten: ObjektkarteDaten | undefined) {
  const zaehlerByPlz = new Map((daten?.jePlz ?? []).map((e) => [e.plz, e]));
  const features = (plzGeoJson as GeoJSON.FeatureCollection<GeoJSON.Polygon, PlzFeatureProps>).features;

  const summe = { akquise: 0, verkaufen: 0, verkauft: 0 };
  const orte = features.map((feature) => {
    const eintrag = zaehlerByPlz.get(feature.properties.plz);
    const akquise = eintrag?.akquise ?? 0;
    const verkaufen = eintrag?.verkaufen ?? 0;
    const verkauft = eintrag?.verkauft ?? 0;
    summe.akquise += akquise;
    summe.verkaufen += verkaufen;
    summe.verkauft += verkauft;
    return { plz: feature.properties.plz, ort: feature.properties.st, label: feature.properties.label, akquise, verkaufen, verkauft };
  });

  return { orte, summe };
}

function erzeugeMarkerElement(ort: ReturnType<typeof formatiereKarte>["orte"][number]) {
  const gesamt = ort.akquise + ort.verkaufen + ort.verkauft;
  const el = document.createElement("div");
  el.style.cssText = "display:flex;flex-direction:column;align-items:center;pointer-events:none;";

  const karte = document.createElement("div");
  karte.style.cssText =
    "pointer-events:auto;background:#FCFCFB;border:1px solid rgba(80,63,61,0.15);border-radius:8px;" +
    "box-shadow:0 2px 8px rgba(80,63,61,0.18);padding:6px 9px;min-width:84px;text-align:center;" +
    "font-family:Inter,system-ui,sans-serif;";

  const kopf = document.createElement("p");
  kopf.style.cssText =
    "margin:0 0 4px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.06em;color:#503F3D;opacity:0.7;white-space:nowrap;";
  kopf.textContent = `${ort.plz} · ${ort.ort}`;
  karte.appendChild(kopf);

  const zeilen = document.createElement("div");
  zeilen.style.cssText = "display:flex;gap:6px;justify-content:center;";
  for (const kat of KATEGORIEN) {
    const anzahl = ort[kat.key];
    const chip = document.createElement("div");
    chip.style.cssText = "display:flex;align-items:center;gap:3px;";
    chip.title = `${kat.label}: ${anzahl}`;
    const dot = document.createElement("span");
    dot.style.cssText = `display:inline-block;width:7px;height:7px;border-radius:50%;background:${FARBE[kat.key]};opacity:${anzahl > 0 ? 1 : 0.25};`;
    const zahl = document.createElement("span");
    zahl.style.cssText = `font-family:'Roboto Slab',serif;font-weight:700;font-size:12px;color:#503F3D;opacity:${anzahl > 0 ? 1 : 0.35};`;
    zahl.textContent = String(anzahl);
    chip.appendChild(dot);
    chip.appendChild(zahl);
    zeilen.appendChild(chip);
  }
  karte.appendChild(zeilen);
  el.appendChild(karte);

  if (gesamt === 0) karte.style.opacity = "0.55";

  const stiel = document.createElement("div");
  stiel.style.cssText = "width:1.5px;height:10px;background:rgba(80,63,61,0.35);";
  el.appendChild(stiel);

  return el;
}

export function Objektkarte({ daten }: { daten?: ObjektkarteDaten }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const kartenRef = useRef<MaplibreMap | null>(null);
  const [bereit, setBereit] = useState(false);

  useEffect(() => {
    if (!containerRef.current || kartenRef.current) return;

    // "verworfen" statt sich auf kartenRef.current===karte zu verlassen: Im React-Strict-Mode
    // (Dev) läuft dieser Effekt beim ersten Mount sofort inkl. Cleanup noch einmal durch, bevor
    // der "load" der ERSTEN Karteninstanz überhaupt gefeuert hat — ohne diese Markierung würden
    // Quelle/Ebenen sonst versehentlich auf der bereits entfernten ersten Instanz angelegt
    // (live beobachtet Oktober 2026: Marker erschienen, die PLZ-Flächen/-Umrisse nicht).
    let verworfen = false;

    const karte = new MaplibreMap({
      container: containerRef.current,
      style: KARTENSTIL,
      center: KARTENMITTE,
      zoom: 9.3,
      minZoom: 8.6,
      maxZoom: 11.4,
      maxBounds: KREIS_BOUNDS,
      attributionControl: { compact: true },
      // Chat-Vorgabe Oktober 2026: "die Karte fix sein und nur bis zu einem gewissen Punkt
      // rauszoombar" — die Karte dient hier als feste Übersicht, nicht als frei erkundbare
      // Navigationskarte. Verschieben/Drehen/Kippen daher komplett deaktiviert, Zoomen bleibt
      // erlaubt (begrenzt durch minZoom oben), aber immer um die Kartenmitte statt um den
      // Mauszeiger/Pinch-Punkt (sonst würde die Kartenmitte beim Zoomen trotzdem "wandern").
      dragPan: false,
      dragRotate: false,
      touchPitch: false,
      boxZoom: false,
      keyboard: false,
      doubleClickZoom: false,
      scrollZoom: { around: "center" },
      touchZoomRotate: { around: "center" },
    });
    karte.touchZoomRotate.disableRotation();
    karte.addControl(new NavigationControl({ showCompass: false, showZoom: true }), "top-right");
    karte.on("load", () => {
      if (verworfen) return;
      karte.addSource("plz", { type: "geojson", data: plzGeoJson as GeoJSON.FeatureCollection });
      karte.addLayer({ id: "plz-fill", type: "fill", source: "plz", paint: { "fill-color": "#F2F1ED", "fill-opacity": 0.6 } });
      karte.addLayer({ id: "plz-outline", type: "line", source: "plz", paint: { "line-color": "#503F3D", "line-width": 1.5, "line-opacity": 0.75 } });

      // Äußere Kreisgrenze (ein einzelnes Polygon aus der OSM-Verwaltungsgrenze des Landkreises,
      // siehe src/data/geo/landkreis-dueren-umriss.json) in Messing statt Walnuss — Chat-Vorgabe
      // Oktober 2026: "Der Landkreis soll sich noch ein bisschen mehr abheben. Nutz dafür die
      // Akzentfarbe." Einzige Messing-Verwendung der Karte (CI-Regel "max. 1× pro Sichtbereich"),
      // "Verkaufen" in der Legende nutzt bewusst einen anderen Ton (siehe FARBE unten).
      karte.addSource("kreis-umriss", { type: "geojson", data: kreisUmrissGeoJson as GeoJSON.FeatureCollection });
      karte.addLayer({
        id: "kreis-umriss",
        type: "line",
        source: "kreis-umriss",
        paint: { "line-color": "#CB8E49", "line-width": 2.5, "line-opacity": 0.9 },
      });

      // Chat-Vorgabe Oktober 2026: "die einzelnen PLZ Gebiete sollen anklickbar sein ... beim
      // Klicken ... soll die Karte ein bisschen reinzoomen" — Klick auf eine PLZ-Fläche zoomt auf
      // einen festen, maßvollen Ziel-Zoom (KLICK_ZOOM) um die Klickposition herum.
      karte.on("mouseenter", "plz-fill", () => {
        karte.getCanvas().style.cursor = "pointer";
      });
      karte.on("mouseleave", "plz-fill", () => {
        karte.getCanvas().style.cursor = "";
      });
      karte.on("click", "plz-fill", (e) => {
        karte.easeTo({ center: e.lngLat, zoom: KLICK_ZOOM, duration: 500 });
      });

      setBereit(true);
    });
    kartenRef.current = karte;

    return () => {
      verworfen = true;
      karte.remove();
      kartenRef.current = null;
    };
  }, []);

  const { orte, summe } = formatiereKarte(daten);
  const gesamtSumme = summe.akquise + summe.verkaufen + summe.verkauft;

  // Nur die Marker (nicht Quelle/Ebenen, siehe Effekt oben) — läuft erneut, wenn sich die
  // geladenen Objektzahlen ändern (z.B. nach einem erneuten Live-Abruf), ohne die Karte selbst
  // neu aufzubauen.
  useEffect(() => {
    const karte = kartenRef.current;
    if (!karte || !bereit) return;

    const marker: Marker[] = [];
    for (const ort of orte) {
      marker.push(
        new Marker({ element: erzeugeMarkerElement(ort), anchor: "bottom" })
          .setLngLat(ort.label)
          .addTo(karte)
      );
    }

    return () => {
      marker.forEach((m) => m.remove());
    };
  }, [bereit, orte]);

  // Eigenes Vollbild-Layout statt des gemeinsamen SectionShell/Card-Aufbaus der übrigen
  // Admin-Reiter (Chat-Vorgabe Oktober 2026: "optische Abgrenzung zu den anderen Bereichen") —
  // dieser Reiter füllt den gesamten <main>-Bereich mit Stein statt Reinweiß, damit der Wechsel
  // auf "Objektkarte" sofort als eigener, klar abgegrenzter Bereich erkennbar ist, nicht nur als
  // eine weitere Karte auf der üblichen Seite.
  return (
    <div className="h-full overflow-y-auto bg-stein">
      <div className="mx-auto max-w-content px-xl pt-xl">
        <p className="label mb-xs">Admin-Bereich</p>
        <h1 className="mb-sm [hyphens:auto] break-words text-[40px] leading-[1.2] md:text-[56px]">
          Objektkarte
        </h1>
        <p className="mb-lg max-w-[65ch] text-body text-anthrazit/70">
          Objekte im Landkreis Düren nach PLZ, aufgeteilt nach Akquise, aktivem Verkauf und
          bereits verkauften Objekten.
        </p>
      </div>

      <div className="mx-auto max-w-content px-xl pb-xl">
        <div className="mb-md flex flex-wrap items-end justify-between gap-sm">
          <p className="label text-anthrazit/50">Landkreis Düren</p>
          {daten !== undefined && (
            <p className="text-small text-anthrazit/60">
              {gesamtSumme} Objekt{gesamtSumme === 1 ? "" : "e"} zugeordnet
              {daten.ohnePlz > 0 && ` · ${daten.ohnePlz} ohne PLZ`}
            </p>
          )}
        </div>

        {daten === undefined && (
          <p className="mb-sm text-small text-anthrazit/50">
            Objektzahlen konnten nicht aus onOffice geladen werden — die Karte zeigt nur die
            Gebietsgrenzen.
          </p>
        )}

        <div
          ref={containerRef}
          className="h-[560px] w-full overflow-hidden rounded-sm border border-walnuss/20 shadow-[0_2px_16px_rgba(80,63,61,0.14)]"
        />

        {/* Quellenangabe für die Kartenkacheln/Geodaten steckt bereits im eingeblendeten
            MapLibre-Attribution-Control oben rechts in der Karte ("OpenFreeMap © OpenMapTiles ·
            Data from OpenStreetMap") — hier keine zweite, redundante Angabe. */}
        <div className="mt-md flex flex-wrap items-center gap-lg border-t border-walnuss/15 pt-sm">
          {KATEGORIEN.map((kat) => (
            <div key={kat.key} className="flex items-center gap-xs">
              <span
                className="inline-block h-[10px] w-[10px] rounded-full"
                style={{ background: FARBE[kat.key] }}
              />
              <span className="text-small text-anthrazit/80">
                {kat.label}
                {daten !== undefined && (
                  <span className="ml-xs font-medium text-anthrazit">{summe[kat.key]}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
