import type { MaklervertragDaten } from "@/types";

// Gleicht die in onOffice gespeicherten Maklervertrag-Daten (siehe lib/onoffice/
// praesentationsdatei.ts) beim Laden mit den AKTUELLEN Objekt-/Kundendaten ab. Die gespeicherte
// Datei enthält neben den echten Eingaben des Beraters/der Beraterin auch alle aus onOffice
// abgeleiteten Vorschlagswerte (Eigentümer samt Anschrift, Objektadresse, Kaufpreis, Auftragsdauer
// "heute + 3 Monate" — siehe baueInitialdaten in Maklervertrag.tsx). Ohne Abgleich blieben diese
// Werte für immer auf dem Stand des ersten Speicherns eingefroren: Ein später in onOffice
// ergänzter Eigentümer/eine ergänzte Anschrift käme nicht mehr an, und die Auftragsdauer zeigte
// dauerhaft das Datum des ersten Öffnens.
//
// Regel je Feld: Stimmt der gespeicherte Wert mit dem damals beim Speichern vorgeschlagenen
// Ausgangswert ("basis") überein, wurde er nicht bearbeitet und wird durch den aktuellen
// Vorschlag ersetzt. Weicht er ab, hat der Nutzer ihn geändert und er bleibt erhalten. Objekte
// (z.B. auftraggeber1) werden feldweise verglichen, Listen als Ganzes.
//
// Dateien aus der Zeit vor dieser Regel haben keine Basis: dort werden nur leere gespeicherte
// Felder aus dem aktuellen Vorschlag aufgefüllt, alles Ausgefüllte bleibt unverändert.

function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return !!wert && typeof wert === "object" && !Array.isArray(wert);
}

const gleich = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const istLeer = (wert: unknown) =>
  wert === undefined || wert === null || wert === "" || (Array.isArray(wert) && wert.length === 0);

function abgleich(gespeichert: unknown, basis: unknown, aktuell: unknown, hatBasis: boolean): unknown {
  if (istObjekt(gespeichert) && istObjekt(aktuell)) {
    const ergebnis: Record<string, unknown> = {};
    for (const schluessel of new Set([...Object.keys(gespeichert), ...Object.keys(aktuell)])) {
      const wert = abgleich(
        gespeichert[schluessel],
        istObjekt(basis) ? basis[schluessel] : undefined,
        aktuell[schluessel],
        hatBasis
      );
      if (wert !== undefined) ergebnis[schluessel] = wert;
    }
    return ergebnis;
  }
  if (hatBasis) return gleich(gespeichert, basis) ? aktuell : gespeichert;
  return istLeer(gespeichert) ? aktuell : gespeichert;
}

export function gleicheVertragsdatenAb(
  gespeichert: MaklervertragDaten,
  basis: MaklervertragDaten | undefined,
  aktuell: MaklervertragDaten
): MaklervertragDaten {
  return abgleich(gespeichert, basis, aktuell, basis !== undefined) as MaklervertragDaten;
}
