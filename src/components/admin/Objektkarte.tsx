"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
// Zentrumsbasierte Marker statt einer Flächen-Einfärbung nach Objektzahl: Die drei Kategorien
// erscheinen als kompakte, weiße Stat-Karten an den PLZ-Mittelpunkten, nicht als unterschiedlich
// intensive Flächenfarben (das würde die Objektzahlen vortäuschen, als wäre die Karte selbst eine
// Heatmap). Die Flächenfüllung (plz-fill) trägt stattdessen einheitlich die Akzentfarbe Messing
// bei geringer Deckkraft — Chat-Vorgabe Oktober 2026: "der Kreis komplett in der Akzentfarbe ...
// mit geringer Deckkraft, beim Hover volle Deckkraft" — über Feature-State je PLZ-Fläche
// einzeln gesteuert (siehe PLZ_HOVER_STATE_* unten).
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

// Exakte Bounding Box der Kreisgeometrie (Nominatim-Verwaltungsgrenze, siehe
// src/data/geo/landkreis-dueren-umriss.json) — Grundlage für fitBounds: Chat-Vorgabe Oktober
// 2026: "die Karte muss auf der ganzen Seite zu sehen sein". Die Karte wird deshalb nicht mit
// festem center/zoom erzeugt, sondern passt sich beim Laden UND bei jeder späteren
// Fenstergrößenänderung (siehe "resize"-Handler unten) auf genau diese Fläche an — unabhängig
// davon, wie groß der verfügbare Platz gerade tatsächlich ist.
const KREIS_BBOX_EXAKT: [[number, number], [number, number]] = [
  [6.1935622, 50.5973696],
  [6.7183571, 51.0456677],
];

// Bounding Box mit etwas Rand um KREIS_BBOX_EXAKT — begrenzt zusammen mit minZoom in der
// MaplibreMap-Konstruktion, wie weit sich die "fixe" Karte überhaupt noch bewegen lässt (siehe
// Kommentar dort).
const KREIS_BOUNDS: [[number, number], [number, number]] = [
  [5.95, 50.42],
  [6.96, 51.22],
];

// Chat-Vorgabe Oktober 2026: "beim Klicken auf die PLZ Bereich soll die Karte ein bisschen
// reinzoomen" — fester Ziel-Zoom statt relativer Schritte, damit mehrfaches Klicken (auch auf
// dasselbe oder verschiedene Gebiete) immer zum gleichen, maßvollen Ausschnitt führt statt sich
// bei jedem Klick weiter aufzuaddieren.
const KLICK_ZOOM = 10.6;

// Rand um KREIS_BBOX_EXAKT beim Einpassen (fitBounds) — großzügiger als eine reine
// Kanten-an-Kante-Passung, damit die Karte im Ruhezustand spürbar weiter herausgezoomt wirkt
// (Chat-Vorgabe Oktober 2026: "die Karte müsste noch etwas mehr rausgezoomt sein").
const KARTE_FIT_PADDING = 56;

// Deckkraft der PLZ-Flächenfüllung (Messing) im Ruhezustand — "gering", wie gefordert, aber
// noch sichtbar genug, dass die Akzentfarbe über die gesamte Kreisfläche hinweg erkennbar bleibt.
const PLZ_FUELLUNG_RUHE = 0.12;
// Bei Hover bewusst nicht 100 %, sondern 60 % — darunter sollen Straßen/Orte der Kartenbasis
// weiterhin durchscheinen (Chat-Vorgabe Oktober 2026: "100% Füllung ist zu viel ... man soll die
// Straßen usw. noch sehen", nach 80% noch "immernoch recht viel").
const PLZ_FUELLUNG_HOVER = 0.6;

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
      // bounds statt festem center/zoom — die Karte passt sich damit beim Erzeugen auf die
      // tatsächliche Größe des Headers an, statt einen festen Ausschnitt anzunehmen (siehe
      // KREIS_BBOX_EXAKT oben).
      bounds: KREIS_BBOX_EXAKT,
      fitBoundsOptions: { padding: KARTE_FIT_PADDING },
      minZoom: 7.8,
      maxZoom: 11.4,
      maxBounds: KREIS_BOUNDS,
      attributionControl: { compact: true },
      // dragPan wieder aktiv — Chat-Vorgabe Oktober 2026: "ich kann mit der Maus nicht in der
      // Karte navigieren!" (die ursprüngliche "fixe Karte" aus einer früheren Chat-Vorgabe passte
      // zur damaligen kleinen Kopfzeile, nicht mehr zur jetzigen 2/3-Spalte, siehe
      // Mitarbeiterstatistik.tsx). Drehen/Kippen bleiben deaktiviert (für eine 2D-Übersichtskarte
      // nicht sinnvoll), minZoom/maxBounds bleiben als sanfte Leitplanken bestehen, damit man sich
      // nicht komplett aus dem Landkreis heraus verschieben/zoomen kann.
      dragPan: true,
      dragRotate: false,
      touchPitch: false,
      boxZoom: false,
      keyboard: true,
      doubleClickZoom: true,
    });
    // Pinch-Rotation auf Touch-Geräten bleibt deaktiviert (für eine 2D-Übersichtskarte nicht
    // sinnvoll), Pinch-Zoom bleibt erlaubt — dragRotate oben deckt nur die Maus-Variante ab.
    karte.touchZoomRotate.disableRotation();
    karte.addControl(new NavigationControl({ showCompass: false, showZoom: true }), "top-right");
    // "resize" feuert MapLibre-intern, sobald sich die tatsächliche Größe des Containers ändert
    // (z.B. Fenster verkleinert/vergrößert, Orientierungswechsel auf Mobilgeräten), nicht bei
    // normaler Interaktion (Klick-Zoom, Scroll-Zoom, Verschieben) — ein erneutes fitBounds stellt
    // dann wieder sicher, dass der gesamte Landkreis sichtbar bleibt, auch wenn das zuvor gewählte
    // Zoomlevel dafür nicht mehr passen würde.
    karte.on("resize", () => {
      karte.fitBounds(KREIS_BBOX_EXAKT, { padding: KARTE_FIT_PADDING, duration: 0 });
    });
    karte.on("load", () => {
      if (verworfen) return;
      // generateId: true — die GeoJSON-Features selbst tragen keine numerische "id" (nur
      // properties.plz als fachlicher Schlüssel), Feature-State (für den Hover-Effekt unten)
      // braucht aber eine id pro Feature; MapLibre vergibt sie damit automatisch.
      karte.addSource("plz", {
        type: "geojson",
        data: plzGeoJson as GeoJSON.FeatureCollection,
        generateId: true,
      });
      karte.addLayer({
        id: "plz-fill",
        type: "fill",
        source: "plz",
        paint: {
          "fill-color": "#CB8E49",
          // Chat-Vorgabe Oktober 2026: "der Kreis komplett in der Akzentfarbe ... mit geringer
          // Deckkraft. Wenn man drüber geht mit der Maus, soll der Bereich volle Deckkraft
          // haben." — über Feature-State je PLZ-Fläche gesteuert (siehe mousemove/mouseleave
          // unten), nicht global, damit nur die gerade überfahrene Fläche hervortritt.
          "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], PLZ_FUELLUNG_HOVER, PLZ_FUELLUNG_RUHE],
          "fill-opacity-transition": { duration: 150 },
        },
      });
      karte.addLayer({ id: "plz-outline", type: "line", source: "plz", paint: { "line-color": "#503F3D", "line-width": 1.5, "line-opacity": 0.75 } });

      // Äußere Kreisgrenze (ein einzelnes Polygon aus der OSM-Verwaltungsgrenze des Landkreises,
      // siehe src/data/geo/landkreis-dueren-umriss.json) zusätzlich als eigene Linie in Messing —
      // Chat-Vorgabe Oktober 2026: "Der Landkreis soll sich noch ein bisschen mehr abheben. Nutz
      // dafür die Akzentfarbe."
      karte.addSource("kreis-umriss", { type: "geojson", data: kreisUmrissGeoJson as GeoJSON.FeatureCollection });
      karte.addLayer({
        id: "kreis-umriss",
        type: "line",
        source: "kreis-umriss",
        paint: { "line-color": "#CB8E49", "line-width": 2.5, "line-opacity": 0.9 },
      });

      // Chat-Vorgabe Oktober 2026: "die einzelnen PLZ Gebiete sollen anklickbar sein ... beim
      // Klicken ... soll die Karte ein bisschen reinzoomen" — Klick auf eine PLZ-Fläche zoomt auf
      // einen festen, maßvollen Ziel-Zoom (KLICK_ZOOM) um die Klickposition herum. mousemove statt
      // mouseenter für den Hover-Zustand, damit beim Wechsel von einer Fläche direkt in die
      // nächste (ohne dazwischen die Karte zu verlassen) die vorherige zuverlässig zurückgesetzt
      // wird — mouseenter/mouseleave feuern pro Layer nur einmal beim Betreten/Verlassen der
      // gesamten Ebene, nicht pro einzelnem Feature.
      let gehoverteFlaecheId: number | string | undefined;
      karte.on("mousemove", "plz-fill", (e) => {
        karte.getCanvas().style.cursor = "pointer";
        const id = e.features?.[0]?.id;
        if (id === undefined || id === gehoverteFlaecheId) return;
        if (gehoverteFlaecheId !== undefined) {
          karte.setFeatureState({ source: "plz", id: gehoverteFlaecheId }, { hover: false });
        }
        gehoverteFlaecheId = id;
        karte.setFeatureState({ source: "plz", id }, { hover: true });
      });
      karte.on("mouseleave", "plz-fill", () => {
        karte.getCanvas().style.cursor = "";
        if (gehoverteFlaecheId !== undefined) {
          karte.setFeatureState({ source: "plz", id: gehoverteFlaecheId }, { hover: false });
        }
        gehoverteFlaecheId = undefined;
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

  // Die Karte nimmt die linken zwei Drittel des Admin-Bereichs ein, nicht mehr nur einen Header
  // oder einen eigenen Reiter (Chat-Vorgabe Oktober 2026, in mehreren Schritten verfeinert, zuletzt:
  // "die Karte soll in 2/3 der Ansicht auftauchen und dann ein Overlay auf dem 1/3 auf der
  // rechten Seite. Im Overlay kann die Navi rein" — siehe Mitarbeiterstatistik.tsx für die
  // Zwei-Spalten-Aufteilung). Objektkarte füllt dabei per absolute inset-0 ihre eigene Spalte
  // komplett; Label, Objektzahlen und Legende liegen als schwebende, halbtransparente Chips über
  // der Karte statt sie durch ein gestapeltes Layout zu verkleinern. Navigation und die übrigen
  // Bereiche (Mitarbeiter/Leadquellen/Kontrolle/Übersicht) leben im rechten Drittel-Panel
  // (AdminNavigation.tsx, Mitarbeiterstatistik.tsx) — "erstmal so, langfristig eigene Seiten"
  // laut Chat-Vorgabe.
  //
  // Logo sitzt im linken Chip statt in der Admin-Nav — Chat-Vorgabe: "Das Logo muss auch
  // umplatziert werden".
  const router = useRouter();

  return (
    <div className="absolute inset-0">
      {/* h-full/w-full statt "absolute inset-0": MapLibre setzt auf seinem Container selbst
          position:relative per Inline-Style (live beobachtet Oktober 2026 — der Container blieb
          dadurch 0px hoch, "inset-0" wirkt nur bei position:absolute/fixed). h-full/w-full
          braucht dafür nur ein Elternelement mit definierter Höhe, unabhängig vom eigenen
          position-Wert — das übernimmt der äußere "absolute inset-0"-Wrapper oben. */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Logo + Label + Objektzahlen, oben links schwebend über der Karte. */}
      <div className="absolute left-md top-md z-10 flex items-center gap-sm rounded-md bg-stein/95 px-sm py-xs shadow-[0_2px_12px_rgba(80,63,61,0.18)]">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="shrink-0 transition-opacity hover:opacity-70"
          title="Zurück zur Startseite"
        >
          <Image src="/logos/immobilien-quer.svg" alt="Parma Immobilien" width={104} height={26} priority />
        </button>
        <div className="h-5 w-px shrink-0 bg-walnuss/15" />
        <div>
          <p className="label text-anthrazit/50">Landkreis Düren · Objektkarte</p>
          {daten !== undefined ? (
            <p className="text-small text-anthrazit/60">
              {gesamtSumme} Objekt{gesamtSumme === 1 ? "" : "e"} zugeordnet
              {daten.ohnePlz > 0 && ` · ${daten.ohnePlz} ohne PLZ`}
            </p>
          ) : (
            <p className="text-small text-anthrazit/50">Objektzahlen nicht geladen</p>
          )}
        </div>
      </div>

      {/* Legende, unten links schwebend — Quellenangabe für die Kartenkacheln/Geodaten steckt
          bereits im MapLibre-Attribution-Control ("i"-Symbol unten rechts), hier keine zweite,
          redundante Angabe. */}
      <div className="absolute bottom-md left-md z-10 flex flex-wrap items-center gap-md rounded-md bg-stein/95 px-sm py-xs shadow-[0_2px_12px_rgba(80,63,61,0.18)]">
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
  );
}
