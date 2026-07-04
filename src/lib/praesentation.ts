import { Praesentation } from "@/types";
import { ONOFFICE_MODE } from "./onoffice/config";
import {
  istUuid,
  ladeAlleMitarbeiter,
  ladeBetreuerAddressId,
  ladeBetreuerByAddressId,
  ladeEigentuemerAddressId,
  ladeEstateIdByUuid,
  ladeImmobilieById,
  ladeKundeByAddressId,
} from "./onoffice/estate";
import {
  MOCK_BETREUER,
  MOCK_BEWERTUNG,
  MOCK_IMMOBILIE,
  MOCK_KUNDE,
  MOCK_WEITERE_MITARBEITER,
} from "./onoffice/mock";

export interface PraesentationsParams {
  estateId?: string;
  addressId?: string;
}

/**
 * Lädt die Daten für eine Präsentation, ausgelöst über den Link aus OnOffice
 * (Query-Parameter estateId / addressId). Solange ONOFFICE_MODE=mock (Default, siehe
 * onoffice/config.ts) oder der Live-Abruf fehlschlägt, werden Demo-Daten verwendet.
 * Die Bewertung (Sach-/Ertrags-/Vergleichswert) liegt aktuell als PDF vor und wird nicht
 * automatisch aus OnOffice berechnet — das folgt, sobald die nötigen Felder dort gepflegt sind.
 *
 * estateId kann entweder die interne numerische OnOffice-ID sein (z.B. für manuelle
 * Test-Links) oder die öffentliche Objekt-UUID (der künftige Normalfall: Link direkt aus
 * OnOffice über ein berechnetes Feld auf Basis von [uuid]). Wird keine addressId
 * mitgegeben, wird der Kunde automatisch über die Eigentümer-Relation des Objekts ermittelt
 * — der OnOffice-Link braucht dadurch nur die Objekt-UUID, die Begrüßung bleibt trotzdem
 * persönlich. Der zuständige Betreuer (inkl. Profilbild) wird analog über die
 * Mitarbeiter-Relation des Objekts ermittelt; schlägt das fehl, wird MOCK_BETREUER verwendet.
 * Zusätzlich werden alle übrigen Mitarbeiter-Adressen der Agentur geladen (objektunabhängig,
 * für den "weitere Mitarbeiter"-Slider auf der Kontaktperson-Seite) und um den Objekt-Betreuer
 * bereinigt; schlägt das fehl oder bleibt die Liste leer, wird MOCK_WEITERE_MITARBEITER verwendet.
 */
export async function ladePraesentationsDaten(
  params: PraesentationsParams
): Promise<Praesentation> {
  if (ONOFFICE_MODE === "live" && params.estateId) {
    try {
      const estateId = istUuid(params.estateId)
        ? await ladeEstateIdByUuid(params.estateId)
        : params.estateId;

      if (!estateId) {
        throw new Error(`Objekt mit Referenz "${params.estateId}" nicht gefunden`);
      }

      const addressId =
        params.addressId || (await ladeEigentuemerAddressId(estateId).catch(() => null));
      const betreuerAddressId = await ladeBetreuerAddressId(estateId).catch(() => null);

      const [immobilie, kunde, betreuer, alleMitarbeiter] = await Promise.all([
        ladeImmobilieById(estateId),
        addressId ? ladeKundeByAddressId(addressId) : Promise.resolve(null),
        betreuerAddressId ? ladeBetreuerByAddressId(betreuerAddressId).catch(() => null) : Promise.resolve(null),
        ladeAlleMitarbeiter().catch(() => []),
      ]);

      // Objekt-Betreuer aus der "weitere Mitarbeiter"-Liste ausschließen (Dubletten-Schutz) —
      // er wird bereits separat oben als Hauptkontakt angezeigt.
      const weitereMitarbeiter = betreuerAddressId
        ? alleMitarbeiter.filter((m) => m.id !== betreuerAddressId)
        : alleMitarbeiter;

      if (immobilie) {
        return {
          kunde: kunde || { vorname: "", nachname: "" },
          immobilie,
          bewertung: MOCK_BEWERTUNG,
          betreuer: betreuer || MOCK_BETREUER,
          weitereMitarbeiter: weitereMitarbeiter.length > 0 ? weitereMitarbeiter : MOCK_WEITERE_MITARBEITER,
          quelle: "live",
        };
      }
    } catch (error) {
      console.error("Live-Abruf aus OnOffice fehlgeschlagen, verwende Demo-Daten:", error);
    }
  }

  return {
    kunde: MOCK_KUNDE,
    immobilie: MOCK_IMMOBILIE,
    bewertung: MOCK_BEWERTUNG,
    betreuer: MOCK_BETREUER,
    weitereMitarbeiter: MOCK_WEITERE_MITARBEITER,
    quelle: "mock",
  };
}
