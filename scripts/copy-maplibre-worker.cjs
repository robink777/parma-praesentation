// Kopiert den vorgebauten MapLibre-Worker (ESM, lädt eigene Vektor-Kachel-/Geometrie-Logik in
// einem Web Worker) als statische Datei nach public/vendor — siehe components/admin/
// Objektkarte.tsx. Next.js/webpack erkennt das "new Worker(new URL(..., import.meta.url))"-Muster
// NUR in Quelltext, den es selbst kompiliert, nicht in einem bereits vorgebauten npm-Paket wie
// maplibre-gl — ohne diesen Schritt zeigt der Browser "Failed to load module script" (live
// beobachtet Oktober 2026), weil die vom Paket erwartete URL im Next-Build nicht existiert.
// Läuft als "postinstall" (package.json), damit die kopierte Datei automatisch zur jeweils
// installierten maplibre-gl-Version passt statt als manueller Schnappschuss zu veralten.
const fs = require("fs");
const path = require("path");

const quelle = path.join(__dirname, "..", "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs");
const ziel = path.join(__dirname, "..", "public", "vendor", "maplibre-gl-worker.js");

if (!fs.existsSync(quelle)) {
  console.warn("[copy-maplibre-worker] node_modules/maplibre-gl nicht gefunden, übersprungen.");
  process.exit(0);
}

fs.mkdirSync(path.dirname(ziel), { recursive: true });
fs.copyFileSync(quelle, ziel);
console.log(`[copy-maplibre-worker] ${path.relative(process.cwd(), ziel)} aktualisiert.`);
