import { Immobilie } from "@/types";

/**
 * Automatische Vorauswahl von Vergleichsobjekten für den Vergleichswert-Reiter (siehe
 * Vergleichswert.tsx). Ersetzt NICHT die manuelle Suche — sie bleibt vollständig erhalten und
 * bedienbar (siehe ReferenzobjektSlot in Vergleichswert.tsx). Diese Funktion liefert lediglich
 * einen sinnvollen Startwert, den der Berater/die Beraterin wie jede manuelle Auswahl jederzeit
 * anpassen oder austauschen kann.
 *
 * Hinweis zur Historie: Eine frühere automatische Ähnlichkeits-Suche wurde im Juli 2026 komplett
 * entfernt (siehe Git-Historie / Kommentar in Vergleichswert.tsx), weil sie gegen einen festen
 * Demo-Objektpool keine zum jeweiligen Kundenobjekt passenden Treffer lieferte. Diese neue
 * Variante arbeitet stattdessen gegen den echten, tatsächlich verkauften Bestand (bzw. im
 * Mock-Modus gegen MOCK_VERGLEICHSPOOL) und nutzt eine explizit vom Nutzer vorgegebene,
 * kaskadierende Filterlogik — kein pauschales Ähnlichkeits-Scoring "irgendwelcher" Felder.
 *
 * Kaskadierende Filterreihenfolge (jede Stufe verengt den Kandidatenpool der vorherigen Stufe):
 *   1. PLZ            — 100% Übereinstimmung (exakt gleich)
 *   2. Wohnfläche      — bis zu 80% relative Abweichung vom Kundenobjekt
 *   3. Baujahr         — bis zu 50% relative Abweichung vom Kundenobjekt
 *   4. Kaufpreis       — bis zu 80% relative Abweichung vom Kundenobjekt
 *
 * "Nutze grundsätzlich (falls möglich)": Jede Stufe wird nur angewendet, wenn dadurch mindestens
 * ein Kandidat übrig bleibt UND das Kundenobjekt selbst den nötigen Wert besitzt (sonst ist die
 * Stufe schlicht nicht auswertbar). Andernfalls wird die Stufe übersprungen und der Kandidatenpool
 * der vorherigen Stufe unverändert an die nächste Stufe weitergereicht — eine einzelne fehlende
 * oder zu strenge Bedingung darf die Vorauswahl nicht komplett leerlaufen lassen.
 *
 * Bleiben nach allen vier Stufen mehr Kandidaten übrig als benötigt, wird zusätzlich nach
 * Gesamtnähe sortiert (gewichtete relative Abweichung, Gewichtung entlang derselben Prioritäts-
 * reihenfolge: Wohnfläche > Baujahr > Kaufpreis), damit unter mehreren zulässigen Kandidaten die
 * insgesamt ähnlichsten zuerst gewählt werden.
 */

// Relative Abweichung von `wert` zu `referenz`, als Anteil von `referenz` (0 = identisch,
// 1 = 100% Abweichung). Ohne gültige Referenz oder ohne gültigen Wert nicht auswertbar (undefined).
function relativeAbweichung(wert: number | undefined, referenz: number | undefined): number | undefined {
  if (!referenz || wert === undefined || wert === null) return undefined;
  return Math.abs(wert - referenz) / Math.abs(referenz);
}

interface KaskadenStufe {
  // Prüft einen einzelnen Kandidaten gegen das Kundenobjekt. `undefined` bedeutet "nicht
  // auswertbar" (z.B. fehlender Wert) — solche Kandidaten fallen bei dieser Stufe heraus, ändern
  // aber (dank des Skip-bei-leer-Verhaltens unten) nichts, falls dadurch der GESAMTE Pool leer würde.
  erfuellt: (kandidat: Immobilie, subjekt: Immobilie) => boolean | undefined;
}

const KASKADE: KaskadenStufe[] = [
  // 1. PLZ — 100% Übereinstimmung
  {
    erfuellt: (kandidat, subjekt) => {
      if (!subjekt.plz) return undefined;
      if (!kandidat.plz) return false;
      return kandidat.plz === subjekt.plz;
    },
  },
  // 2. Wohnfläche — bis zu 80% Abweichung
  {
    erfuellt: (kandidat, subjekt) => {
      const abweichung = relativeAbweichung(kandidat.wohnflaeche, subjekt.wohnflaeche);
      return abweichung === undefined ? undefined : abweichung <= 0.8;
    },
  },
  // 3. Baujahr — bis zu 50% Abweichung
  {
    erfuellt: (kandidat, subjekt) => {
      const abweichung = relativeAbweichung(kandidat.baujahr, subjekt.baujahr);
      return abweichung === undefined ? undefined : abweichung <= 0.5;
    },
  },
  // 4. Kaufpreis — bis zu 80% Abweichung
  {
    erfuellt: (kandidat, subjekt) => {
      const abweichung = relativeAbweichung(kandidat.kaufpreis, subjekt.kaufpreis);
      return abweichung === undefined ? undefined : abweichung <= 0.8;
    },
  },
];

// Gewichtung für die Nähe-Sortierung nach der Kaskade — entlang derselben Prioritätsreihenfolge
// wie oben (Wohnfläche wichtiger als Baujahr, Baujahr wichtiger als Kaufpreis). PLZ fließt hier
// nicht mehr ein, da sie durch Stufe 1 bereits binär entschieden ist (entweder alle verbliebenen
// Kandidaten erfüllen sie, oder die Stufe wurde komplett übersprungen).
const GEWICHT_WOHNFLAECHE = 3;
const GEWICHT_BAUJAHR = 2;
const GEWICHT_KAUFPREIS = 1;

function naeheScore(kandidat: Immobilie, subjekt: Immobilie): number {
  // Nicht auswertbare Kriterien werden mit einer "neutralen" Abweichung von 1 (=100%) bewertet,
  // statt den Kandidaten zu bevorzugen oder auszuschließen.
  const wohnflaeche = relativeAbweichung(kandidat.wohnflaeche, subjekt.wohnflaeche) ?? 1;
  const baujahr = relativeAbweichung(kandidat.baujahr, subjekt.baujahr) ?? 1;
  const kaufpreis = relativeAbweichung(kandidat.kaufpreis, subjekt.kaufpreis) ?? 1;

  return (
    GEWICHT_WOHNFLAECHE * wohnflaeche + GEWICHT_BAUJAHR * baujahr + GEWICHT_KAUFPREIS * kaufpreis
  );
}

/**
 * Wählt bis zu `anzahl` Vergleichsobjekte aus `kandidaten` für das Kundenobjekt `subjekt` aus, per
 * kaskadierender Filterlogik (siehe Datei-Kommentar oben). Gibt ein Array mit 0 bis `anzahl`
 * Einträgen zurück (kein Padding mit null — das übernimmt der Aufrufer).
 */
export function waehleVorauswahl(
  subjekt: Immobilie,
  kandidaten: Immobilie[],
  anzahl: number = 3
): Immobilie[] {
  let pool = kandidaten.filter((k) => k.id !== subjekt.id);

  for (const stufe of KASKADE) {
    const verengt = pool.filter((kandidat) => stufe.erfuellt(kandidat, subjekt) === true);
    // "Falls möglich": Stufe nur übernehmen, wenn dadurch nicht der gesamte Pool wegfällt.
    if (verengt.length > 0) {
      pool = verengt;
    }
  }

  return [...pool].sort((a, b) => naeheScore(a, subjekt) - naeheScore(b, subjekt)).slice(0, anzahl);
}
