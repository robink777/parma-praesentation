import plzGeocoordData from "@/data/plz-geocoord.json";

// PLZ (5-stellig, als String) -> [Breitengrad, Längengrad] (WGS84, geografischer Mittelpunkt
// der Postleitzahl). Datensatz: WZBSocialScienceCenter/plz_geocoord (Apache-2.0), basiert auf dem
// Gemeindeverzeichnis des Statistischen Bundesamts, Stand Januar 2019 — für eine Umkreis-Filterung
// auf PLZ-Ebene (Ziel: ~10 km Genauigkeit, siehe ladeAutomatischeInteressenten in
// onoffice/estate.ts) ausreichend präzise, auch wenn seither vereinzelt neue PLZ hinzugekommen
// sein können (fehlende PLZ ergeben schlicht "Distanz unbekannt", siehe distanzZwischenPlzKm unten).
const PLZ_GEOCOORD: Record<string, [number, number]> = plzGeocoordData as unknown as Record<
  string,
  [number, number]
>;

const ERDRADIUS_KM = 6371;

// Haversine-Formel für die Luftlinien-Entfernung zwischen zwei Geokoordinaten in km.
function haversineKm(a: [number, number], b: [number, number]): number {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * ERDRADIUS_KM * Math.asin(Math.sqrt(s));
}

// Normalisiert eine PLZ auf das erwartete 5-stellige String-Format (führende Nullen erhalten) —
// onOffice liefert PLZ teils als Zahl statt String zurück, was führende Nullen verschluckt
// (z.B. "01067" -> 1067).
function normalisierePlz(plz: string | number | null | undefined): string | null {
  if (plz === null || plz === undefined || plz === "") return null;
  const bereinigt = String(plz).trim().padStart(5, "0");
  return /^\d{5}$/.test(bereinigt) ? bereinigt : null;
}

// Ermittelt die Luftlinien-Entfernung zwischen zwei PLZ in km über deren PLZ-Mittelpunkte.
// Gibt null zurück, wenn eine der beiden PLZ ungültig ist oder im Datensatz fehlt (siehe
// PLZ_GEOCOORD oben) — Aufrufer behandeln das als "Entfernung unbekannt" (siehe
// ladeAutomatischeInteressenten), nicht als 0 km, um keine falschen Treffer vorzutäuschen.
export function distanzZwischenPlzKm(
  plzA: string | number | null | undefined,
  plzB: string | number | null | undefined
): number | null {
  const a = normalisierePlz(plzA);
  const b = normalisierePlz(plzB);
  if (!a || !b) return null;

  const koordA = PLZ_GEOCOORD[a];
  const koordB = PLZ_GEOCOORD[b];
  if (!koordA || !koordB) return null;

  return haversineKm(koordA, koordB);
}
