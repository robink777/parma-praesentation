import { Praesentation } from "@/types";
import { ONOFFICE_MODE } from "./onoffice/config";
import {
  istUuid,
  ladeAutomatischeInteressenten,
  ladeBetreuerAddressId,
  ladeBetreuerUndAlleMitarbeiter,
  ladeEigentuemerAddressIds,
  ladeEstateIdByUuid,
  ladeImmobilieById,
  ladeKundeByAddressId,
  ladeLetzteKundennummer,
  ladeObjektDokumente,
  ladePriceHubbleWerte,
  ladeSetterAddressId,
  zaehleVerkaufteObjekte,
} from "./onoffice/estate";
import {
  MOCK_ALLE_MITARBEITER,
  MOCK_AUTOMATISCHE_INTERESSENTEN,
  MOCK_BETREUER,
  MOCK_BEWERTUNG,
  MOCK_DOKUMENTE,
  MOCK_IMMOBILIE,
  MOCK_KUNDE,
  MOCK_UNTERNEHMEN_KENNZAHLEN,
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
 * Die übrige Bewertung (Sach-/Ertrags-/Vergleichswert) liegt aktuell als PDF vor und wird nicht
 * automatisch aus OnOffice berechnet — das folgt, sobald die nötigen Felder dort gepflegt sind.
 * Einzige Ausnahme: Die drei PriceHubble-Marktwertfelder (siehe ladePriceHubbleWerte) werden
 * bereits live aus OnOffice geladen und im Bewertung-Reiter angezeigt (seit Juli 2026, auf
 * Kundenwunsch — die übrigen Bewertungsfelder wurden dafür im Reiter ausgeblendet).
 *
 * estateId kann entweder die interne numerische OnOffice-ID sein (z.B. für manuelle
 * Test-Links) oder die öffentliche Objekt-UUID (der künftige Normalfall: Link direkt aus
 * OnOffice über ein berechnetes Feld auf Basis von [uuid]). Wird keine addressId
 * mitgegeben, werden ALLE Eigentümer automatisch über die Eigentümer-Relation des Objekts
 * ermittelt (siehe ladeEigentuemerAddressIds in onoffice/estate.ts) — bei Miteigentum
 * (Ehepaar) oder einer Erbengemeinschaft können das mehrere Personen sein. Die erste
 * gefundene Person bleibt `kunde` (persönliche Begrüßung, Rückwärtskompatibilität), alle
 * weiteren stehen als `weitereEigentuemer` bereit und werden im Maklervertrag automatisch als
 * zusätzliche Auftraggeber vorbefüllt (siehe Maklervertrag.tsx). Wird explizit eine addressId
 * mitgegeben (manueller Test-Link), gilt weiterhin nur diese eine Person — der Eigentümer-
 * Abruf entfällt dann komplett. Der zuständige Betreuer (inkl. Profilbild) wird analog über die
 * Mitarbeiter-Relation des Objekts ermittelt; schlägt das fehl, wird MOCK_BETREUER verwendet.
 * Zusätzlich werden alle übrigen Mitarbeiter-Adressen der Agentur geladen (objektunabhängig,
 * für den "weitere Mitarbeiter"-Slider auf der Kontaktperson-Seite) und um den Objekt-Betreuer
 * bereinigt; schlägt das fehl oder bleibt die Liste leer, wird MOCK_WEITERE_MITARBEITER verwendet.
 * Die ungefilterte Variante (inkl. Objekt-Betreuer) steht zusätzlich als alleMitarbeiter für den
 * Team-Bereich im "Über uns"-Reiter zur Verfügung (siehe Unternehmen.tsx), dort samt echter
 * Profilfotos statt des bisherigen generischen Icons.
 * Die intern in OnOffice am Objekt hinterlegten Dokumente (Reiter "Dokumente") werden ebenfalls
 * live geladen; anders als bei den übrigen Feldern wird eine leere Liste hier NICHT durch
 * Demo-Dokumente ersetzt, da "keine Dokumente hinterlegt" ein gültiger echter Zustand ist.
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

      // Bei explizit übergebener addressId (z.B. manueller Test-Link) gilt weiterhin nur diese
      // eine Person — sonst ALLE über die Eigentümer-Relation gefundenen Adress-IDs (kann bei
      // Miteigentum/Erbengemeinschaft mehr als eine sein, siehe ladeEigentuemerAddressIds).
      const addressIds = params.addressId
        ? [params.addressId]
        : await ladeEigentuemerAddressIds(estateId).catch(() => []);
      const [betreuerAddressId, setterAddressId] = await Promise.all([
        ladeBetreuerAddressId(estateId).catch(() => null),
        ladeSetterAddressId(estateId).catch(() => null),
      ]);

      const [
        immobilie,
        kundenRoh,
        betreuerUndMitarbeiter,
        dokumente,
        priceHubbleWerte,
        verkaufteObjekte,
        kundenNummer,
        automatischeInteressenten,
      ] = await Promise.all([
          ladeImmobilieById(estateId),
          // Jede Adress-ID unabhängig per .catch(() => null) abgesichert (Muster analog zu den
          // übrigen Einzelabrufen hier) — schlägt der Abruf für EINEN Eigentümer fehl, sollen die
          // übrigen trotzdem geladen werden statt die ganze Präsentation ohne Kundendaten dastehen
          // zu lassen.
          Promise.all(addressIds.map((id) => ladeKundeByAddressId(id).catch(() => null))),
          // Betreuer (Hauptkontakt), Setter und komplette Mitarbeiterliste bewusst in EINEM
          // gemeinsamen Aufruf statt mehrerer paralleler (siehe ladeBetreuerUndAlleMitarbeiter in
          // estate.ts) — mehrere unabhängige, aber durch dieses Promise.all gleichzeitig laufende
          // Foto-Batches waren die Ursache dafür, dass das Profilbild des Hauptbetreuers
          // intermittierend nicht lud.
          ladeBetreuerUndAlleMitarbeiter(betreuerAddressId, setterAddressId).catch(() => ({
            betreuer: null,
            setter: null,
            alleMitarbeiter: [],
          })),
          ladeObjektDokumente(estateId).catch(() => []),
          ladePriceHubbleWerte(estateId).catch(() => null),
          // Unternehmenskennzahlen für den "Über uns"-Reiter (siehe Unternehmen.tsx) — bewusst
          // objektunabhängig hier mit abgerufen (wie alleMitarbeiter oben), da eine eigene
          // Ladefunktion pro Reiter aktuell nicht existiert und die Präsentation ohnehin bereits
          // Live-Daten lädt.
          zaehleVerkaufteObjekte().catch(() => null),
          ladeLetzteKundennummer().catch(() => null),
          // Automatisch zugeordnete Interessenten (Objektdaten-Reiter, siehe Objektdaten.tsx) —
          // null bei Fehlschlag, damit der Block dort komplett ausgeblendet werden kann statt
          // einen falschen "keine Interessenten"-Zustand zu zeigen.
          ladeAutomatischeInteressenten(estateId).catch(() => null),
        ]);
      const { betreuer, setter, alleMitarbeiter } = betreuerUndMitarbeiter;

      // Objekt-Betreuer aus der "weitere Mitarbeiter"-Liste ausschließen (Dubletten-Schutz) —
      // er wird bereits separat oben als Hauptkontakt angezeigt.
      const weitereMitarbeiter = betreuerAddressId
        ? alleMitarbeiter.filter((m) => m.id !== betreuerAddressId)
        : alleMitarbeiter;

      // Fehlgeschlagene Einzelabrufe (null) herausfiltern, dann die erste gefundene Person als
      // `kunde` (Rückwärtskompatibilität, siehe Praesentation.kunde), alle weiteren als
      // `weitereEigentuemer` — leer, wenn nur eine Person gefunden wurde (der Normalfall).
      const [kunde, ...weitereEigentuemer] = kundenRoh.filter((k): k is NonNullable<typeof k> => k !== null);

      if (immobilie) {
        return {
          kunde: kunde || { vorname: "", nachname: "" },
          weitereEigentuemer,
          immobilie,
          // Die übrigen Bewertungsfelder (sachwert/ertragswert/etc.) bleiben MOCK_BEWERTUNG
          // (aktuell weiterhin manuell aus Sprengnetter gepflegt, siehe Bewertung-Typ) — nur
          // die drei PriceHubble-Felder werden live überschrieben, sofern der Abruf
          // erfolgreich war (priceHubbleWerte ist null, wenn ladePriceHubbleWerte
          // fehlgeschlagen ist oder das Objekt keinen Datensatz zurückgibt).
          bewertung: { ...MOCK_BEWERTUNG, ...priceHubbleWerte },
          betreuer: betreuer || MOCK_BETREUER,
          // Bewusst KEIN Fallback auf einen Mock-Setter bei null (anders als beim Betreuer
          // oben): Kein Setter hinterlegt ist ein gültiger, echter Zustand (siehe
          // ladeSetterAddressId) — Kontaktperson.tsx blendet den Block dafür komplett aus,
          // statt eine erfundene Person zu zeigen.
          setter,
          weitereMitarbeiter: weitereMitarbeiter.length > 0 ? weitereMitarbeiter : MOCK_WEITERE_MITARBEITER,
          // Ungefiltert (inkl. Objekt-Betreuer) für den Team-Bereich im "Über uns"-Reiter, siehe
          // Praesentation.alleMitarbeiter und Unternehmen.tsx.
          alleMitarbeiter: alleMitarbeiter.length > 0 ? alleMitarbeiter : MOCK_ALLE_MITARBEITER,
          // Bewusst KEIN Fallback auf MOCK_DOKUMENTE bei leerer Liste (anders als z.B. bei
          // weitereMitarbeiter oben): Ein Objekt ohne hinterlegte Dokumente ist ein gültiger,
          // echter Zustand (live gegen den Account geprüft, Juli 2026 — nicht jedes Objekt hat
          // Dateien) und soll in einer echten Kundenpräsentation nicht durch ein erfundenes
          // Demo-Dokument verschleiert werden.
          dokumente,
          // Siehe Praesentation.unternehmenKennzahlen (types/index.ts): einzelne Werte bleiben
          // null, wenn der jeweilige Live-Abruf fehlgeschlagen ist (.catch(() => null) oben) —
          // Unternehmen.tsx zeigt dann einen Platzhalter statt einer erfundenen Zahl.
          unternehmenKennzahlen: { verkaufteObjekte, kundenNummer },
          automatischeInteressenten,
          quelle: "live",
        };
      }
    } catch (error) {
      console.error("Live-Abruf aus OnOffice fehlgeschlagen, verwende Demo-Daten:", error);
    }
  }

  return {
    kunde: MOCK_KUNDE,
    // Keine weiteren Demo-Eigentümer — Mock-Modus bildet bewusst den (häufigeren) Einzeleigentümer-
    // Normalfall ab, siehe Praesentation.weitereEigentuemer.
    weitereEigentuemer: [],
    immobilie: MOCK_IMMOBILIE,
    bewertung: MOCK_BEWERTUNG,
    betreuer: MOCK_BETREUER,
    // Kein Mock-Setter (siehe Kommentar oben im Live-Zweig) — zeigt im Demo-Modus zugleich den
    // "kein Setter hinterlegt"-Zustand, also dass Kontaktperson.tsx den Block korrekt ausblendet.
    setter: null,
    weitereMitarbeiter: MOCK_WEITERE_MITARBEITER,
    alleMitarbeiter: MOCK_ALLE_MITARBEITER,
    dokumente: MOCK_DOKUMENTE,
    unternehmenKennzahlen: MOCK_UNTERNEHMEN_KENNZAHLEN,
    automatischeInteressenten: MOCK_AUTOMATISCHE_INTERESSENTEN,
    quelle: "mock",
  };
}
