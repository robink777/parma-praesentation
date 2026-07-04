import { Immobilie, MatchDetails, Vergleichsobjekt, VergleichsergebnisMeta } from "@/types";

const ZIEL_SCHWELLWERT = 80;
const MINDEST_TREFFER = 3;
const SCHWELLWERT_SCHRITT = 5;
const MINIMAL_SCHWELLWERT = 50;

function modernisierungsScore(anzahl: number): number {
  if (anzahl <= 0) return 40;
  if (anzahl === 1) return 60;
  if (anzahl === 2) return 80;
  return 100;
}

function lageScore(ziel: Immobilie, kandidat: Immobilie): number {
  if (ziel.ort && kandidat.ort && ziel.ort === kandidat.ort) return 100;
  if (ziel.plz && kandidat.plz && ziel.plz.slice(0, 3) === kandidat.plz.slice(0, 3)) return 70;
  return 35;
}

function naeheScore(ziel: number | undefined, kandidat: number | undefined, toleranzProzent: number): number {
  if (ziel === undefined || kandidat === undefined || ziel === 0) return 50;
  const abweichungProzent = (Math.abs(ziel - kandidat) / ziel) * 100;
  const score = 100 - (abweichungProzent / toleranzProzent) * 100;
  return Math.max(0, Math.min(100, score));
}

function baujahrScore(ziel: number | undefined, kandidat: number | undefined): number {
  if (ziel === undefined || kandidat === undefined) return 50;
  const diff = Math.abs(ziel - kandidat);
  const score = 100 - diff * 8;
  return Math.max(0, Math.min(100, score));
}

function bewerteKandidat(ziel: Immobilie, kandidat: Immobilie): MatchDetails {
  return {
    lage: lageScore(ziel, kandidat),
    wohnflaeche: naeheScore(ziel.wohnflaeche, kandidat.wohnflaeche, 25),
    baujahr: baujahrScore(ziel.baujahr, kandidat.baujahr),
    modernisierung: 100 - Math.abs(
      modernisierungsScore(ziel.modernisierungen?.length || 0) -
        modernisierungsScore(kandidat.modernisierungen?.length || 0)
    ),
  };
}

function gesamtScore(details: MatchDetails): number {
  return Math.round(
    (details.lage + details.wohnflaeche + details.baujahr + details.modernisierung) / 4
  );
}

/**
 * Sucht Vergleichsobjekte mit Zielschwelle 80% Übereinstimmung (Lage, Wohnfläche, Baujahr,
 * Modernisierungsstand, gleich gewichtet). Werden weniger als 3 Objekte über 80% gefunden,
 * wird die Schwelle in 5%-Schritten gesenkt, bis mindestens 3 Objekte vorliegen (oder das
 * Minimum von 50% erreicht ist).
 */
export function findeVergleichsobjekte(
  ziel: Immobilie,
  pool: Immobilie[]
): { ergebnisse: Vergleichsobjekt[]; meta: VergleichsergebnisMeta } {
  const bewertet: Vergleichsobjekt[] = pool
    .filter((kandidat) => kandidat.id !== ziel.id)
    .map((kandidat) => {
      const matchDetails = bewerteKandidat(ziel, kandidat);
      return { ...kandidat, matchDetails, matchScore: gesamtScore(matchDetails) };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  let schwellwert = ZIEL_SCHWELLWERT;
  let treffer = bewertet.filter((k) => k.matchScore >= schwellwert);

  while (treffer.length < MINDEST_TREFFER && schwellwert > MINIMAL_SCHWELLWERT) {
    schwellwert -= SCHWELLWERT_SCHRITT;
    treffer = bewertet.filter((k) => k.matchScore >= schwellwert);
  }

  return {
    ergebnisse: treffer,
    meta: { angewandterSchwellwert: schwellwert, gefundeneAnzahl: treffer.length },
  };
}
