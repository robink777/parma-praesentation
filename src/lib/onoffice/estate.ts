import { Betreuer, Immobilie, Interessent, Kunde, MitarbeiterObjekt, ObjektDokument } from "@/types";
import { TEAM } from "@/data/unternehmen";
import { distanzZwischenPlzKm } from "@/lib/geo";
import { callOnOfficeApi } from "./client";
import {
  ADDRESS_FIELDS,
  BETREUER_FIELDS,
  ESTATE_FIELDS,
  INTERESSENT_FIELDS,
  mapAddressRecord,
  mapBetreuerRecord,
  mapEstateRecord,
  mapFileRecord,
  mapInteressentRecord,
  RawAddressRecord,
  RawBetreuerRecord,
  RawEstateRecord,
  RawFileRecord,
  RawInteressentRecord,
} from "./mapping";

// Hartes Limit der onOffice-API pro Aufruf: listlimit-Werte über 500 werden NICHT etwa auf
// 500 gekappt oder mit einem Fehler abgelehnt, sondern die API fällt dann still auf ihren
// Standardwert von 20 Datensätzen zurück (gegen den Live-Account durchgetestet, Juli 2026:
// listlimit 500 liefert 500 Treffer, listlimit 501 liefert wieder nur 20 — ohne jede
// Fehlermeldung). Das war die eigentliche Ursache dafür, dass die Objektsuche seit jeher nur
// eine winzige, zufällige Teilmenge des Bestands durchsuchte (u.a. Immobilien ohne Objekttitel,
// weil objekttitel als Sortierfeld bei leerem Titel first sortiert) — unabhängig davon, wie hoch
// RAW_LISTLIMIT in route.ts gesetzt wurde. Größere Abrufe müssen daher zwingend über mehrere
// Aufrufe mit steigendem listoffset paginiert werden, siehe ladeImmobilienSeite/ladeImmobilien.
const ONOFFICE_MAX_LISTLIMIT = 500;

async function ladeImmobilienSeite(
  limit: number,
  offset: number,
  filter?: Record<string, unknown>,
  sortby?: Record<string, "ASC" | "DESC">
): Promise<Immobilie[]> {
  const result = await callOnOfficeApi<RawEstateRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      // Wichtig: Für Listenabfragen erwartet die onOffice-API resourceid: "" (leerer String),
      // NICHT "0". Mit "0" sucht die API nach einem Datensatz mit der ID 0 und liefert
      // dadurch immer cntabsolute: 0 zurück — unabhängig von Rechten oder Filter
      // (gegen echte API-Antwort geprüft, Juli 2026; siehe offizielle onOffice-API-Doku,
      // Beispiel "read estate", Seite 5).
      resourceid: "",
      identifier: "",
      cacheable: true,
      parameters: {
        data: ESTATE_FIELDS,
        listlimit: limit,
        listoffset: offset,
        // Bewusst NICHT nach kaufpreis sortiert: Der Account enthält u.a. ältere/unvollständige
        // Altdatensätze mit kaufpreis = 0 (gegen den Live-Account geprüft: von 1023
        // "kauf"-Objekten haben nur 686 einen Preis > 0). Eine Sortierung nach kaufpreis ASC
        // füllt das Abruflimit fast ausschließlich mit diesen Nullpreis-Datensätzen, sodass
        // echte, korrekt bepreiste Objekte in der Objektauswahl-Suche praktisch nie auftauchen.
        // Alphabetisch nach Titel ist neutral und ergibt eine vorhersehbare Browse-Reihenfolge.
        // Aufrufer können das per sortby-Parameter überschreiben (siehe z.B. der "neueste
        // Objekte"-Abruf beim Klick auf die leere Suchleiste in route.ts, sortiert nach
        // erstellt_am DESC statt objekttitel ASC).
        sortby: sortby || { objekttitel: "ASC" },
        filter: filter || { vermarktungsart: [{ op: "=", val: "kauf" }] },
      },
    },
  ]);

  const records = result?.response?.results?.[0]?.data?.records || [];
  return records.map(mapEstateRecord);
}

// limit ist die GESAMT-Obergrenze über alle Seiten hinweg (kann über ONOFFICE_MAX_LISTLIMIT
// liegen) — die Aufteilung in ≤500er-Seiten (siehe ONOFFICE_MAX_LISTLIMIT) passiert intern.
// Bricht früh ab, sobald eine Seite weniger als das Seitenlimit liefert (Bestand erschöpft),
// um nicht unnötig weitere leere Anfragen zu stellen.
export async function ladeImmobilien(
  limit = 20,
  filter?: Record<string, unknown>,
  sortby?: Record<string, "ASC" | "DESC">
): Promise<Immobilie[]> {
  const alle: Immobilie[] = [];
  let offset = 0;

  while (alle.length < limit) {
    const seitenlimit = Math.min(ONOFFICE_MAX_LISTLIMIT, limit - offset);
    const seite = await ladeImmobilienSeite(seitenlimit, offset, filter, sortby);
    alle.push(...seite);

    if (seite.length < seitenlimit) break; // Bestand erschöpft
    offset += seitenlimit;
  }

  return alle;
}

interface RawEstatePictureElement {
  estateid: string;
  type: string;
  url: string;
}

interface RawEstatePictureRecord {
  id: string;
  type: string;
  elements: RawEstatePictureElement[];
}

// Bilder sind kein Datenfeld des Estate-Datensatzes, sondern ein eigener Resourcetype.
// Die Antwort verschachtelt die einzelnen Bilder unter records[].elements (Array),
// nicht direkt auf dem Record (gegen echte API-Antwort geprüft, Juli 2026).
async function ladeTitelbild(estateId: string): Promise<string | undefined> {
  const bilder = await ladeTitelbilder([estateId]);
  return bilder[estateId];
}

// Batch-Variante von ladeTitelbild: Lädt die Titelbilder mehrerer Objekte in EINEM API-Aufruf
// (estateids akzeptiert ein Array, siehe ladeTitelbild oben), statt pro Objekt einzeln
// nachzuladen. Wird für Listen-/Suchergebnisse benötigt (Referenzobjekt-Suche im
// Vergleichswert-Reiter, Objektauswahl-Suche, siehe route.ts) — dort sonst ein N-facher
// API-Roundtrip für N Treffer nötig wäre. Gibt eine Map estateId -> bildUrl zurück; Objekte
// ohne hinterlegtes Foto fehlen einfach in der Map (Aufrufer behandelt das wie bisher als
// "kein Bild", siehe PropertyImage-Fallback).
export async function ladeTitelbilder(estateIds: string[]): Promise<Record<string, string>> {
  if (estateIds.length === 0) return {};

  const result = await callOnOfficeApi<RawEstatePictureRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:get",
      resourcetype: "estatepictures",
      resourceid: "",
      identifier: "",
      cacheable: true,
      parameters: {
        estateids: estateIds.map(Number),
        categories: ["Titelbild", "Foto"],
        size: "original",
        language: "DEU",
      },
    },
  ]);

  const records = result?.response?.results?.[0]?.data?.records || [];
  const bilder = records.flatMap((r) => r.elements || []);

  const map: Record<string, string> = {};
  for (const estateId of estateIds) {
    const bilderFuerObjekt = bilder.filter((b) => String(b.estateid) === estateId);
    const titelbild = bilderFuerObjekt.find((b) => b.type === "Titelbild") || bilderFuerObjekt[0];
    if (titelbild) map[estateId] = titelbild.url;
  }
  return map;
}

// Kategorien, die im "Dokumente"-Reiter ausgeblendet werden: Fotos/Titelbild sind technisch
// über denselben resourcetype "file" abrufbar wie "echte" Dokumente, werden im UI aber
// bereits an anderer Stelle gezeigt (Objektbild, siehe ladeTitelbild oben) — ohne diesen
// Filter würden hier z.B. alle 19 Objektfotos zusätzlich als "Dokument" auftauchen.
const DOKUMENTE_AUSGESCHLOSSENE_TYPEN = ["Foto", "Titelbild"];

// Lädt die am Objekt in OnOffice hinterlegten internen Dokumente (Grundriss, Energieausweis,
// Exposé, etc.) für den "Dokumente"-Reiter.
//
// Undokumentierter, gegen den echten Account verifizierter API-Sonderfall (Live-Recherche
// Juli 2026, apidoc.onoffice.de, Abschnitt "Get Estate files"): resourceid muss der LITERALE
// String "estate" sein — NICHT die Objekt-ID selbst. Die eigentliche Objekt-ID wandert
// stattdessen als "estateid" (Singular, String) in die parameters. Naheliegende Varianten
// (resourceid = Objekt-ID direkt, "estateids" als Zahlen-Array analog zu ladeTitelbild oben,
// "module"/"relatedRecordId") scheiterten alle durchgehend mit Errorcode 24 ("missing
// configuration for resourceId"). includeImageUrl: "original" liefert zusätzlich eine direkte,
// öffentliche Download-URL je Datei (ohne diesen Parameter bleibt sie leer).
export async function ladeObjektDokumente(estateId: string): Promise<ObjektDokument[]> {
  const result = await callOnOfficeApi<RawFileRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:get",
      resourcetype: "file",
      resourceid: "estate",
      identifier: "",
      cacheable: true,
      parameters: {
        estateid: estateId,
        includeImageUrl: "original",
      },
    },
  ]);

  const records = result?.response?.results?.[0]?.data?.records || [];
  return records
    .filter((r) => !DOKUMENTE_AUSGESCHLOSSENE_TYPEN.includes(r.elements?.type || ""))
    .map((r) => mapFileRecord(r, estateId));
}

export interface DokumentInhalt {
  content: Buffer;
  dateiname: string;
}

// Lädt den tatsächlichen Dateiinhalt eines einzelnen, am Objekt hinterlegten Dokuments —
// benötigt für Dateien mit "category": "internal" (siehe Kommentar bei RawFileRecord in
// mapping.ts), da onOffice für diese NIE eine direkte imageUrl liefert. Der Umweg über
// resourcetype "file" mit gesetztem "fileid"-Parameter (zusätzlich zur weiterhin
// erforderlichen estateid, siehe Live-Recherche Juli 2026: ohne estateid liefert die API
// Errorcode 110 "Missing estate record id") liefert bei Einzelabruf ein zusätzliches
// "content"-Feld: den vollen Dateiinhalt Base64-codiert (gegen echten Datensatz geprüft:
// dekodierte Länge entspricht exakt "fileSize", Byte-Anfang entspricht der PDF-Magic-Number
// "%PDF-"). Wird von der Proxy-Route /api/dokument aufgerufen (siehe dort).
export async function ladeDokumentInhalt(
  estateId: string,
  fileId: string
): Promise<DokumentInhalt | null> {
  const result = await callOnOfficeApi<RawFileRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:get",
      resourcetype: "file",
      resourceid: "estate",
      identifier: "",
      cacheable: false,
      parameters: {
        estateid: estateId,
        fileid: Number(fileId),
      },
    },
  ]);

  const record = result?.response?.results?.[0]?.data?.records?.[0];
  const el = record?.elements;
  if (!el?.content) return null;

  return {
    content: Buffer.from(el.content, "base64"),
    dateiname: el.originalname || el.filename || "dokument",
  };
}

export interface PriceHubbleWerte {
  marktwertPH?: number;
  marktwertMinPH?: number;
  marktwertMaxPH?: number;
}

interface RawPriceHubbleRecord {
  id: string;
  elements: {
    MPPricehubblePrice?: number | string;
    MPPricehubbleMax?: number | string;
    MPPricehubbleMin?: number | string;
  };
}

// Lädt die automatische PriceHubble-Marktwertschätzung eines Objekts. Live gegen den echten
// Feldkatalog geprüft (resourcetype "fields", modules "estate", Juli 2026): Die drei Felder
// sind eigenständige Estate-Datenfelder (nicht Teil von ESTATE_FIELDS in mapping.ts, da die
// Bewertung im Code als eigenständiges Konzept behandelt wird, siehe Bewertung-Typ) —
// gepflegt über eine PriceHubble-Anbindung in OnOffice, nicht manuell. Es existiert daneben
// noch ein viertes Feld "MPPricehubbleConfidence" (Konfidenznote Gering/Mittel/Hoch), das auf
// Kundenwunsch bewusst NICHT abgerufen/angezeigt wird — nur die drei Wertfelder.
export async function ladePriceHubbleWerte(estateId: string): Promise<PriceHubbleWerte | null> {
  const result = await callOnOfficeApi<RawPriceHubbleRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: estateId,
      identifier: "",
      cacheable: false,
      parameters: {
        data: ["MPPricehubblePrice", "MPPricehubbleMax", "MPPricehubbleMin"],
      },
    },
  ]);

  const record = result?.response?.results?.[0]?.data?.records?.[0];
  const el = record?.elements;
  if (!el) return null;

  return {
    marktwertPH: el.MPPricehubblePrice !== undefined ? Number(el.MPPricehubblePrice) : undefined,
    marktwertMinPH: el.MPPricehubbleMin !== undefined ? Number(el.MPPricehubbleMin) : undefined,
    marktwertMaxPH: el.MPPricehubbleMax !== undefined ? Number(el.MPPricehubbleMax) : undefined,
  };
}

export async function ladeImmobilieById(id: string): Promise<Immobilie | null> {
  const [result, bildUrl] = await Promise.all([
    callOnOfficeApi<RawEstateRecord>([
      {
        actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
        resourcetype: "estate",
        resourceid: id,
        identifier: "",
        cacheable: false,
        parameters: { data: ESTATE_FIELDS },
      },
    ]),
    ladeTitelbild(id).catch(() => undefined),
  ]);

  const record = result?.response?.results?.[0]?.data?.records?.[0];
  return record ? { ...mapEstateRecord(record), bildUrl } : null;
}

export async function ladeKundeByAddressId(addressId: string): Promise<Kunde | null> {
  const result = await callOnOfficeApi<RawAddressRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "address",
      resourceid: addressId,
      identifier: "",
      cacheable: false,
      parameters: { data: ADDRESS_FIELDS },
    },
  ]);

  const record = result?.response?.results?.[0]?.data?.records?.[0];
  return record ? mapAddressRecord(record) : null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Erkennt, ob eine Objekt-Referenz die (öffentliche, nicht erratbare) OnOffice-UUID ist
// statt der internen numerischen ID. Für Links, die direkt aus OnOffice generiert werden
// (berechnetes Feld auf Basis von [uuid]), ist das der erwartete Normalfall.
export function istUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

// Löst die OnOffice-UUID eines Objekts zur internen numerischen ID auf.
// Direkter Abruf mit der UUID als resourceid funktioniert bei OnOffice NICHT
// (liefert cntabsolute: 0, gegen echte API-Antwort geprüft, Juli 2026) — die UUID muss
// stattdessen über eine gefilterte Listenabfrage aufgelöst werden.
export async function ladeEstateIdByUuid(uuid: string): Promise<string | null> {
  const result = await callOnOfficeApi<RawEstateRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: "",
      identifier: "",
      cacheable: true,
      parameters: {
        data: ["Id"],
        filter: { uuid: [{ op: "=", val: uuid }] },
        listlimit: 1,
      },
    },
  ]);

  const record = result?.response?.results?.[0]?.data?.records?.[0];
  return record ? String(record.id) : null;
}

interface RawRelationRecord {
  id: string;
  type: string;
  elements: Record<string, string[]>;
}

// Feldsatz für den "estatedata"-Parameter von resourcetype "qualifiedsuitors" (siehe
// ladeAutomatischeInteressenten unten) — bewusst ein eigener, kleinerer Feldsatz statt
// ESTATE_FIELDS, da hier nur die für den Suchprofil-Abgleich relevanten Kriterien benötigt
// werden (keine Texte/Bilder/etc.). "vermarktungsart" ist zusätzlich zu ESTATE_FIELDS nötig
// (kauf/miete), da OnOffices Abgleich sonst Kauf- und Mietinteressenten nicht unterscheiden kann.
const QUALIFIEDSUITORS_ESTATE_FIELDS = [
  "plz",
  "ort",
  "objektart",
  "objekttyp",
  "wohnflaeche",
  "kaufpreis",
  "anzahl_zimmer",
  "grundstuecksflaeche",
  "vermarktungsart",
];

interface RawQualifiedSuitorRecord {
  id: number;
  elements: {
    percentage: number;
    deviated?: unknown;
    searchcriteria?: number;
  };
}

// Ermittelt ALLE Adress-IDs der Eigentümer eines Objekts (nicht nur die/den erste/n) — das ist
// kein Datenfeld am Estate-Datensatz, sondern eine eigene OnOffice-Relation (estate → address,
// Typ "owner"), die bei Miteigentum (z.B. Ehepaar) oder einer Erbengemeinschaft MEHRERE Adressen
// gleichzeitig enthalten kann. Damit reicht im OnOffice-Link künftig die Objekt-UUID allein aus —
// ALLE hinterlegten Eigentümer werden automatisch über diese Relation aufgelöst, für die
// persönliche Begrüßung (siehe Begruessung.tsx) UND die automatische Vorbefüllung weiterer
// Auftraggeber im Maklervertrag (siehe Maklervertrag.tsx, ladePraesentationsDaten in
// lib/praesentation.ts). Früher (bis Juli 2026) wurde hier nur ids[0] zurückgegeben — dadurch
// blieben zusätzliche Eigentümer dem System vollständig unbekannt statt nur "leer".
export async function ladeEigentuemerAddressIds(estateId: string): Promise<string[]> {
  const result = await callOnOfficeApi<RawRelationRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:get",
      resourcetype: "idsfromrelation",
      resourceid: "",
      identifier: "",
      cacheable: true,
      parameters: {
        relationtype: "urn:onoffice-de-ns:smart:2.5:relationTypes:estate:address:owner",
        parentids: [Number(estateId)],
      },
    },
  ]);

  const record = result?.response?.results?.[0]?.data?.records?.[0];
  return record?.elements?.[estateId] ?? [];
}

export interface AutomatischeInteressenten {
  liste: Interessent[];
  gesamtAnzahl: number;
}

// Ermittelt die über das OnOffice-Immo-Matching automatisch einem Objekt zugeordneten
// Interessenten (Reiter "Objektdaten", auf Nutzerwunsch Juli 2026 ergänzt/erweitert).
//
// FRÜHERER ANSATZ (bis Juli 2026): Relations-Typ "matching" über resourcetype
// "idsfromrelation" — lieferte eine reine Adress-ID-Liste OHNE jede Prozent-/Score-Angabe
// (live gegen den Account geprüft: die Antwort enthält ausschließlich
// "elements: { "<estateId>": [id1, id2, ...] }", kein Übereinstimmungswert).
//
// AKTUELLER ANSATZ: Die vom Kunden ausdrücklich gewünschte Prozentzahl ("Übereinstimmung",
// wie im OnOffice-Backend unter Objekt → Interessenten → "Automatisch zugeordnet" angezeigt)
// stammt NICHT aus einer eigenen, im Code nachgebauten Berechnung, sondern direkt aus der
// offiziellen onOffice-API-Aktion "Get Tenant/Buyer seeker (Immomatching)"
// (apidoc.onoffice.de, resourcetype "qualifiedsuitors", Juli 2026 gegen den echten Account
// verifiziert): Sie erwartet als "estatedata"-Parameter die Objektkriterien (nicht die
// Objekt-ID) und liefert dafür je Interessenten-Suchprofil einen Datensatz mit "id"
// (Adress-ID — live abgeglichen: id 123 = Robin Kolbes hinterlegte Adresse, deckt sich mit
// TEAM["Robin Kolbe"].adressId in data/unternehmen.ts) und "percentage" (0–100, exakt die vom Kunden gemeinte
// Übereinstimmungs-Kennzahl — OnOffice übernimmt die vollständige Berechnung, siehe
// Interessent.uebereinstimmung in types/index.ts). Die Aktion unterstützt laut Doku KEIN
// listlimit/sortby/Schwellenwert-Filter — sie liefert live durchgehend ALLE im Account
// hinterlegten Suchprofile mitsamt Prozentwert zurück (gegen Estate 1763 geprüft: 4568
// Datensätze in einer Antwort, keine Paginierung nötig), Sortierung/Filterung nach
// Übereinstimmung erfolgt daher unten im Code.
//
// Auf ausdrücklichen Nutzerwunsch (Juli 2026) werden Interessenten unter 80% Übereinstimmung
// HIER bereits vollständig verworfen (nicht erst in Objektdaten.tsx) — sie sind für den
// Aufrufer nicht mehr sichtbar, "gesamtAnzahl" zählt daher nur noch Treffer im 80–100%-Bereich.
// Von den verbleibenden, nach Übereinstimmung absteigend sortierten Treffern werden wie zuvor
// nur "limit" Datensätze im Detail zurückgegeben, die volle gefilterte Trefferzahl aber separat
// (für eine "+X weitere"-Anzeige, siehe Objektdaten.tsx).
//
// WICHTIG (live gegen den Account verifiziert, Juli 2026): Das "id"-Feld je qualifiedsuitors-
// Treffer ist entgegen einer naheliegenden Annahme NICHT die interne Adress-ID, sondern die
// KUNDENNUMMER (KdNr) — deckt sich mit der offiziellen apidoc.onoffice.de-Doku ("id: Customer
// number of the address record"), wurde hier aber zusätzlich per Live-Test bestätigt: Direkter
// Leseversuch mit resourceid = qualifiedsuitors-id scheiterte für die meisten Treffer mit
// cntabsolute 0 (z.B. id 218 existiert nicht als Adress-ID), während ein Filter auf
// KdNr = 218 exakt einen Treffer lieferte (Adress-ID 365). Der Detailabruf unten filtert daher
// nach KdNr, NICHT nach Adress-ID.
//
// UMKREIS-FILTER (ergänzt Juli 2026, nach Kundenmeldung "Objekt 854: App zeigt 685, OnOffice
// zeigt 140"): "qualifiedsuitors" vergleicht Kaufpreis/Fläche/Zimmer/Objektart etc., aber KEINE
// geografische Nähe — dadurch tauchen bundesweit alle preislich/größenmäßig passenden Suchprofile
// auf, unabhängig vom Wohnort des Interessenten. Der OnOffice-Backend-Reiter "Automatisch
// zugeordnet" kombiniert den Prozent-Schwellenwert zusätzlich mit einem manuell einstellbaren
// Umkreis-Filter (vom Kunden am Beispielobjekt 854 live geprüft: dort auf ~10 km gestellt) — DAS
// war die eigentliche Ursache der Diskrepanz, nicht ein Fehler in der Prozentberechnung selbst.
// Da dieser Umkreis in OnOffice ein manuell verstellbarer UI-Regler ist (kein fester
// Account-Wert, den die API ausliest), wird hier ein fester Standardwert von 10 km angesetzt
// (siehe MAX_UMKREIS_KM) — eine Annäherung an den vom Kunden bestätigten Wert, keine exakte
// 1:1-Kopie eines pro Aufruf frei einstellbaren Reglers. Die Entfernung wird über die PLZ-
// Mittelpunkte von Objekt und Interessenten-Wohnort berechnet (siehe lib/geo.ts,
// distanzZwischenPlzKm) — dafür wird "Plz" zusätzlich zu den bisherigen INTERESSENT_FIELDS
// abgerufen (siehe mapping.ts), aber bewusst NICHT auf den Interessent-Typ durchgereicht (nur
// Ort wird angezeigt, siehe RawInteressentRecord-Kommentar). Ist die Entfernung nicht ermittelbar
// (PLZ fehlt oder nicht im Geodatensatz vorhanden), wird der Treffer sicherheitshalber
// AUSGESCHLOSSEN, statt ihn ungeprüft anzuzeigen.
//
// Detailabruf bewusst als gefilterte Listenabfrage(n) ("filter: { KdNr: [{ op: "in", ... }] }",
// live erfolgreich getestet — anders als ein Filter auf "id"/"Id", der mit "Unknown field:
// (Code 141)" scheitert) statt einzelner Leseaktionen pro Treffer: KdNr ist ein regulär
// filterbares Adressfeld (anders als die interne ID). Der Detailabruf muss jedoch (anders als vor
// Einführung des Umkreis-Filters) für ALLE ≥80%-Treffer erfolgen, nicht nur die obersten "limit" —
// erst nach Anwendung des Umkreis-Filters steht fest, welche Treffer überhaupt zu den obersten
// "limit" zählen. Da eine einzelne Listenabfrage laut onOffice-API maximal
// ONOFFICE_MAX_LISTLIMIT (500) Datensätze liefert (siehe Kommentar dort), wird in Chunks
// paginiert.
const MINDEST_UEBEREINSTIMMUNG = 80;
const MAX_UMKREIS_KM = 10;

async function ladeInteressentenAdressdatenByKdNr(
  kdNrs: number[]
): Promise<Map<number, RawInteressentRecord>> {
  const byKdNr = new Map<number, RawInteressentRecord>();
  const chunks: number[][] = [];
  for (let i = 0; i < kdNrs.length; i += ONOFFICE_MAX_LISTLIMIT) {
    chunks.push(kdNrs.slice(i, i + ONOFFICE_MAX_LISTLIMIT));
  }

  const ergebnisse = await Promise.all(
    chunks.map((chunk) =>
      callOnOfficeApi<RawInteressentRecord>([
        {
          actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
          resourcetype: "address",
          resourceid: "",
          identifier: "",
          cacheable: false,
          parameters: {
            data: INTERESSENT_FIELDS,
            filter: { KdNr: [{ op: "in", val: chunk }] },
            listlimit: chunk.length,
          },
        },
      ])
    )
  );

  for (const result of ergebnisse) {
    const records = result?.response?.results?.[0]?.data?.records || [];
    for (const r of records) {
      if (r.elements.KdNr !== undefined) byKdNr.set(Number(r.elements.KdNr), r);
    }
  }
  return byKdNr;
}

export async function ladeAutomatischeInteressenten(
  estateId: string,
  limit = 8
): Promise<AutomatischeInteressenten> {
  const estateResult = await callOnOfficeApi<RawEstateRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: estateId,
      identifier: "",
      cacheable: false,
      parameters: { data: QUALIFIEDSUITORS_ESTATE_FIELDS },
    },
  ]);
  const estatedata = estateResult?.response?.results?.[0]?.data?.records?.[0]?.elements || {};
  const objektPlz = (estatedata as { plz?: string }).plz;

  const suitorResult = await callOnOfficeApi<RawQualifiedSuitorRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:get",
      resourcetype: "qualifiedsuitors",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: { estatedata },
    },
  ]);

  const suitorRecords = suitorResult?.response?.results?.[0]?.data?.records || [];
  const qualifiziertRoh = suitorRecords
    .filter((r) => (r.elements?.percentage ?? 0) >= MINDEST_UEBEREINSTIMMUNG)
    .sort((a, b) => b.elements.percentage - a.elements.percentage);

  if (qualifiziertRoh.length === 0) return { liste: [], gesamtAnzahl: 0 };

  const adressenByKdNr = await ladeInteressentenAdressdatenByKdNr(
    qualifiziertRoh.map((r) => r.id)
  );

  // Umkreis-Filter anwenden (siehe Kommentar oben) — Reihenfolge (absteigend nach Prozent)
  // bleibt erhalten, da qualifiziertRoh bereits sortiert ist und hier nur gefiltert wird.
  const qualifiziert = qualifiziertRoh.filter((r) => {
    const adresse = adressenByKdNr.get(r.id);
    if (!adresse) return false;
    const distanz = distanzZwischenPlzKm(objektPlz, adresse.elements.Plz);
    return distanz !== null && distanz <= MAX_UMKREIS_KM;
  });

  if (qualifiziert.length === 0) return { liste: [], gesamtAnzahl: 0 };

  const obersteTreffer = qualifiziert.slice(0, limit);
  const liste = obersteTreffer.map((r) => ({
    ...mapInteressentRecord(adressenByKdNr.get(r.id)!),
    uebereinstimmung: r.elements.percentage,
  }));

  return { liste, gesamtAnzahl: qualifiziert.length };
}

interface RawEstateUserFeldRecord {
  id: number;
  elements: Record<string, string | undefined>;
}

interface RawUserNameRecord {
  id: string;
  elements: { Vorname?: string; Nachname?: string };
}

// Gemeinsame Auflösung für Estate-Felder, die eine interne onOffice-Nutzer-Nr enthalten
// (siehe ladeBetreuerAddressId und ladeSetterAddressId unten, die sich nur im Feldnamen
// unterscheiden): 1) Feldwert am Estate-Datensatz lesen (Nutzer-Nr als String, "0"/leer/
// "0000-00-00" gelten als "nicht gesetzt" — Live-Test zeigte für ein Objekt ohne hinterlegten
// Setter exakt "0" statt eines leeren Strings). 2) Nutzer-Nr über das "user"-Modul in
// Vor-/Nachname auflösen. 3) Vollen Namen über die TEAM-Liste (data/unternehmen.ts,
// TeamMitglied.adressId) auf die geschäftliche Adress-ID mappen — es gibt im "user"-Modul
// selbst kein Feld, das direkt auf die Adress-ID verweist (siehe Kommentar bei
// ladeUserFotosByEmails), daher der Umweg über den Namen.
async function ladeAdressIdViaUserFeld(estateId: string, feldname: string): Promise<string | null> {
  const estateResult = await callOnOfficeApi<RawEstateUserFeldRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: estateId,
      identifier: "",
      cacheable: true,
      parameters: { data: [feldname] },
    },
  ]);

  const nutzerNr = estateResult?.response?.results?.[0]?.data?.records?.[0]?.elements?.[feldname];
  if (!nutzerNr || nutzerNr === "0") return null;

  const userResult = await callOnOfficeApi<RawUserNameRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "user",
      resourceid: nutzerNr,
      identifier: "",
      cacheable: true,
      parameters: { data: ["Vorname", "Nachname"] },
    },
  ]);

  const userElements = userResult?.response?.results?.[0]?.data?.records?.[0]?.elements;
  if (!userElements?.Vorname || !userElements?.Nachname) return null;

  // Nachname kam live vereinzelt mit trailing Whitespace zurück (z.B. "Kolbe ") — trim(), damit
  // der Namens-Lookup unten (exaktes String-Match gegen TEAM, siehe types/index.ts/TeamMitglied)
  // nicht an unsichtbaren Leerzeichen scheitert.
  const vollerName = `${userElements.Vorname.trim()} ${userElements.Nachname.trim()}`;
  return TEAM.find((t) => t.name === vollerName)?.adressId || null;
}

// Ermittelt die Adress-ID des zuständigen Mitarbeiters/der zuständigen Mitarbeiterin
// ("Betreuer") eines Objekts.
//
// FRÜHERER ANSATZ (bis Juli 2026): Relations-Typ "contactPerson" (estate→address-Relation,
// analog zu ladeEigentuemerAddressId, nur mit "contactPerson" statt "owner") — laut
// offizieller onOffice-API-Doku (apidoc.onoffice.de, Abschnitt "Get Relations") der
// Relations-Typ für "Ansprechpartner (nur Makler)". Funktionierte für mehrere Objekte
// korrekt (u.a. Daniel Parma, Kira Woldt je nach Objekt-Zuordnung), lieferte aber für
// andere Objekte trotz beim Kunden hinterlegtem Betreuer eine LEERE Trefferliste (Praxis-
// Test "Hamweg 15", estateId 2593: Kunde bestätigte live in OnOffice sowohl einen Betreuer
// [Robin Kolbe] als auch einen separaten Ansprechpartner [Sarah Barth] hinterlegt zu haben —
// die contactPerson-Relation blieb für dieses Objekt dennoch nachweislich leer, per direktem,
// uncached API-Aufruf verifiziert, keine Cache-/Flakiness-Ursache). Diese manuell gepflegte
// Adress-Relation ist demnach NICHT für jedes Objekt gesetzt.
//
// AKTUELLER ANSATZ: Das Feld "benutzer" am Estate-Datensatz selbst (kompletter Feldkatalog
// live per resourcetype "fields" geprüft, Juli 2026) — dieses Feld ist für praktisch jedes
// Objekt gesetzt und referenziert NICHT eine Adress-ID, sondern die interne Nutzer-Nr des
// zuständigen Mitarbeiters im "user"-Modul (für Hamweg 15: benutzer="23" → user 23 = Robin
// Kolbe, deckt sich exakt mit der vom Kunden genannten "Betreuer"-Zuordnung).
export async function ladeBetreuerAddressId(estateId: string): Promise<string | null> {
  return ladeAdressIdViaUserFeld(estateId, "benutzer");
}

// Ermittelt die Adress-ID des "Setters" eines Objekts — ein im Account individuell angelegtes
// Feld unter "Grunddaten → Technische Angaben" im OnOffice-Backend (Feldkatalog-Kategorie
// "ObjTech", analog zu deepImmoLink in mapping.ts). Technisch identisch zu "benutzer" oben
// (Feldwert ist eine interne Nutzer-Nr, keine Adress-ID, aufgelöst über dieselbe
// ladeAdressIdViaUserFeld-Hilfsfunktion) — live gegen den Account verifiziert (Juli 2026):
// "ind_3356_Feld_ObjTech505" lieferte für Hamweg 15 (estateId 2593) den Wert "59" → user 59 =
// Sarah Barth (deckt sich mit der vom Kunden genannten Person), für ein anderes Objekt "21" →
// Daniel Parma, und für ein drittes Objekt "0" (= nicht gesetzt). Anders als beim Betreuer gibt
// es hierfür KEINEN Mock-Fallback — ist das Feld leer, liefert diese Funktion null und der
// Aufrufer (praesentation.ts) reicht null unverändert durch, damit der komplette
// "Setter"-Block auf der Kontaktperson-Seite ausgeblendet werden kann (siehe Kontaktperson.tsx).
export async function ladeSetterAddressId(estateId: string): Promise<string | null> {
  return ladeAdressIdViaUserFeld(estateId, "ind_3356_Feld_ObjTech505");
}

interface RawUserRecord {
  id: string;
}

interface RawUserPhotoRecord {
  id: string;
  elements: {
    photo?: string;
  };
}

// Lädt das Profilfoto ("Passfoto") eines Mitarbeiters — live gegen den echten Account
// verifiziert (Juli 2026, customerId web77461), NACHDEM der Kunde der API das Recht
// "Benutzerdaten über API auslesen" gewährt hat (vorher lieferte jeder Zugriff auf "user"
// und "userphoto" durchgehend Errorcode 170 "No read permission for this user" — bestätigt
// per Vergleichstest: "address" funktionierte mit denselben Zugangsdaten währenddessen
// anstandslos, das Problem war also gezielt diese Berechtigung, keine falschen
// Zugangsdaten/API-Störung).
//
// Es gibt KEIN Datenfeld im "user"-Modul, das direkt auf die Adress-ID verweist (kompletter
// Feldkatalog live per resourcetype "fields" geprüft: Name, Rechte, online_seit, offline_seit,
// email, Vorname, Nachname, Aktiv_bis, Kuerzel, Sprache, Anrede, Titel, Firma, Land, PLZ, Ort,
// Strasse, Hausnummer, Telefon, Mobil, Fax, Url, Nr, meetingUrl, userCreationDate,
// userDeactivatedDate, mailMode — kein "adrId" o.ä., anders als eine ältere, nur aus der
// öffentlichen API-Doku abgeleitete Vermutung nahelegte). Die Verknüpfung läuft daher über die
// geschäftliche E-Mail-Adresse: Sie ist im address-Datensatz (Betreuer.email, siehe
// mapBetreuerRecord) UND im user-Datensatz gepflegt und live als eindeutiger Schlüssel
// bestätigt (resourcetype "user" mit filter auf "email" lieferte für
// "r.kolbe@parmaimmobilien.com" genau einen Treffer: Nr 23).
//
// Zweistufiger Abruf, weil "userphoto" die Nutzer-Nr (nicht die Adress-ID) als resourceid
// braucht: 1) "user" nach E-Mail(s) filtern → liefert die Nr je E-Mail (= record.id, live
// geprüft: identisch mit dem Feld "Nr" im elements-Objekt). 2) "userphoto" mit ALLEN Nrs auf
// einmal aufrufen (photosAsLinks: true → direkte Bild-URL statt Base64, "Nr"-Filter akzeptiert
// laut Live-Test ein Array über "op: in" und liefert dann mehrere Records in einem Aufruf
// zurück — z.B. für [21, 23, 25, 119] kamen 3 Treffer zurück, der vierte hat einfach kein
// Foto und fehlt in der Antwort). Beide Schritte sind daher bewusst BATCH-fähig (Liste von
// E-Mails rein, Map E-Mail → Foto-URL raus) statt pro Person einzeln aufgerufen zu werden.
//
// Grund für den Umbau auf Batch (Juli 2026, nach dem ersten Live-Test in der laufenden
// Kontaktperson-Seite): Bei EINZELABRUF pro Person (ladeAlleMitarbeiter ruft die Adressdaten
// für alle ~9 Mitarbeiter parallel per Promise.all ab) hätte jede Person zusätzlich ihre
// EIGENEN zwei Foto-Requests ausgelöst — macht in Summe ~30 gleichzeitige HMAC-signierte
// Requests pro Seitenaufruf (Adressdaten + user + userphoto je Person). Live beobachtet: Das
// führte zu einem intermittierenden Fehler (der Hauptbetreuer zeigte bei manchen, nicht allen,
// Seitenaufrufen trotz vorhandenem Foto den Initialen-Avatar "RK" statt des echten Fotos —
// reproduzierbar durch mehrfaches Neuladen derselben URL). callOnOfficeApi wirft bei einem
// API-Fehler eine Exception, die von ladeBetreuerByAddressId einzeln abgefangen wird (siehe
// dort) und dann einfach "kein Foto" statt eines sichtbaren Fehlers ergibt — die
// Serverantwort selbst war dabei nachweislich korrekt (per curl/​Server-Fetch bestätigt), nur
// unter der hohen Parallel-Last einzelner Requests offenbar nicht immer zuverlässig. Die
// Batch-Variante reduziert die Foto-Anfragen für die gesamte Mitarbeiterliste auf zwei
// Requests insgesamt (statt zwei pro Person) und behebt die Flakiness dadurch strukturell,
// nicht nur per Retry.
export async function ladeUserFotosByEmails(
  emails: string[]
): Promise<Record<string, string>> {
  const eindeutigeEmails = [...new Set(emails)];
  if (eindeutigeEmails.length === 0) return {};

  const userResult = await callOnOfficeApi<RawUserRecord & { elements: { email?: string } }>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "user",
      resourceid: "",
      identifier: "",
      cacheable: true,
      parameters: {
        data: ["Nr", "email"],
        filter: { email: [{ op: "in", val: eindeutigeEmails }] },
        listlimit: eindeutigeEmails.length,
      },
    },
  ]);

  const userRecords = userResult?.response?.results?.[0]?.data?.records || [];
  if (userRecords.length === 0) return {};

  // E-Mail ist im Feldkatalog nicht eindeutig groß-/kleinschreibungsnormiert bekannt — Vergleich
  // daher bewusst über lowercase, um Groß-/Kleinschreibungsunterschiede zwischen Adress- und
  // User-Datensatz (die theoretisch getrennt gepflegt werden) nicht als "kein Treffer" zu werten.
  const emailByNr = new Map<number, string>();
  for (const r of userRecords) {
    const nr = Number(r.id);
    const mail = r.elements?.email;
    if (mail) emailByNr.set(nr, mail.toLowerCase());
  }
  const nrs = [...emailByNr.keys()];
  if (nrs.length === 0) return {};

  const photoResult = await callOnOfficeApi<RawUserPhotoRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "userphoto",
      resourceid: "",
      identifier: "",
      cacheable: true,
      parameters: {
        photosAsLinks: true,
        filter: { Nr: [{ op: "in", val: nrs }] },
      },
    },
  ]);

  const photoRecords = photoResult?.response?.results?.[0]?.data?.records || [];
  const result: Record<string, string> = {};
  for (const r of photoRecords) {
    const mail = emailByNr.get(Number(r.id));
    if (mail && r.elements?.photo) result[mail] = r.elements.photo;
  }
  return result;
}

// Einzelabruf-Variante für Aufrufer, die nur EINE Person laden (Objekt-Betreuer, siehe
// ladeBetreuerByAddressId unten) — intern nur ein dünner Wrapper um die Batch-Funktion oben
// mit einer Liste aus einer einzigen E-Mail.
export async function ladeUserFotoByEmail(email: string): Promise<string | undefined> {
  const fotos = await ladeUserFotosByEmails([email]);
  return fotos[email.toLowerCase()];
}

// Lädt ausschließlich die Adress-/Kontaktdaten (OHNE Profilfoto) — extrahiert aus
// ladeBetreuerByAddressId, damit ladeAlleMitarbeiter unten die Adressdaten aller Mitarbeiter
// zunächst OHNE eigene Foto-Einzelabrufe laden und die Fotos anschließend in einem einzigen
// Batch nachladen kann (siehe ladeUserFotosByEmails weiter oben für den Grund).
async function ladeBetreuerAdressdaten(addressId: string): Promise<Betreuer | null> {
  const result = await callOnOfficeApi<RawBetreuerRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "address",
      resourceid: addressId,
      identifier: "",
      cacheable: false,
      parameters: { data: BETREUER_FIELDS },
    },
  ]);

  const record = result?.response?.results?.[0]?.data?.records?.[0];
  return record ? mapBetreuerRecord(record) : null;
}

// Lädt EINEN Objekt-Betreuer inkl. Profilfoto (Einzelabruf-Fall, siehe ladeBetreuerByEstateId
// unten). ACHTUNG: Wird die Hauptbetreuer-Karte GEMEINSAM mit der Mitarbeiterliste geladen (der
// Normalfall auf der Präsentationsseite, siehe praesentation.ts), NICHT diese Funktion parallel
// zu ladeAlleMitarbeiter aufrufen — siehe ladeBetreuerUndAlleMitarbeiter weiter unten und deren
// Kommentar für den Grund (doppelter, gleichzeitiger user/userphoto-Request führte zu
// intermittierend fehlendem Hauptbetreuer-Foto). Diese Einzelabruf-Variante bleibt für Aufrufer
// erhalten, die WIRKLICH nur den Betreuer ohne die übrige Mitarbeiterliste benötigen.
export async function ladeBetreuerByAddressId(addressId: string): Promise<Betreuer | null> {
  const betreuer = await ladeBetreuerAdressdaten(addressId);
  if (!betreuer) return null;

  if (betreuer.email) {
    betreuer.profilbildUrl = await ladeUserFotoByEmail(betreuer.email).catch(() => undefined);
  }
  return betreuer;
}

// Lädt den Objekt-Betreuer in einem Schritt: Relation auflösen, dann Adressdaten (inkl.
// Kontaktdaten und Profilbild) abrufen. Gibt null zurück, wenn keine Zuordnung existiert
// oder der Abruf fehlschlägt — der Aufrufer fällt in diesem Fall auf MOCK_BETREUER zurück.
export async function ladeBetreuerByEstateId(estateId: string): Promise<Betreuer | null> {
  const addressId = await ladeBetreuerAddressId(estateId);
  if (!addressId) return null;
  return ladeBetreuerByAddressId(addressId);
}

// Namensabgleich Juli 2026 konsolidiert (siehe TeamMitglied in types/index.ts für die
// vollständige Herleitung): adressId/nutzerNr/benutzername stehen jetzt direkt an jedem
// TEAM-Eintrag (data/unternehmen.ts) statt in drei separaten, exakt per Namens-String
// synchron zu haltenden Record<string,string>-Tabellen hier. ladeNutzerNrFuerMitarbeiter und
// ladeBenutzernameFuerMitarbeiter suchen daher jetzt einfach in TEAM statt in einer eigenen
// Tabelle nachzuschlagen.

// Liefert die Nutzer-Nr eines TEAM-Mitglieds (siehe TeamMitglied.nutzerNr) für die
// Mitarbeiterstatistik-Aggregation (siehe onoffice/mitarbeiterstatistik.ts) — null, wenn für
// den Namen kein TEAM-Eintrag oder keine Nutzer-Nr hinterlegt ist.
export function ladeNutzerNrFuerMitarbeiter(name: string): string | null {
  return TEAM.find((t) => t.name === name)?.nutzerNr || null;
}

// Liefert den OnOffice-Benutzernamen eines TEAM-Mitglieds (siehe TeamMitglied.benutzername) für
// die Mitarbeiterstatistik-Aggregation ("Kunden aktiv", siehe Mitarbeiterstatistik.tsx) — null,
// wenn für den Namen kein TEAM-Eintrag oder kein Benutzername hinterlegt ist.
export function ladeBenutzernameFuerMitarbeiter(name: string): string | null {
  return TEAM.find((t) => t.name === name)?.benutzername || null;
}

// Lädt alle Mitarbeiter der Agentur für den "weitere Mitarbeiter"-Slider auf der
// Kontaktperson-Seite (objektunabhängig, im Gegensatz zum Objekt-Betreuer oben). Basis ist die
// TEAM-Liste aus der Wissensdatei (Name + Rolle + adressId, siehe data/unternehmen.ts),
// angereichert mit live aus OnOffice geladenen Kontaktdaten, sofern eine geschäftliche Adress-ID
// bekannt ist. "rolle" kommt bewusst aus der Wissensdatei, nicht
// aus OnOffice: "jobPosition" ist im Account für jede bisher geprüfte Person leer. Enthält auch
// den Objekt-Betreuer (z.B. Robin Kolbe) — die Dublettenfilterung "Objekt-Betreuer ausschließen"
// erfolgt beim Aufrufer anhand von Betreuer.id (siehe praesentation.ts), nicht hier.
//
// Lädt nur die Adressdaten (OHNE Foto) — Hilfsfunktion für ladeBetreuerUndAlleMitarbeiter unten,
// die den Foto-Abruf für Team UND Hauptbetreuer bewusst in einem einzigen gemeinsamen Batch
// zusammenführt (siehe dortiger Kommentar für den Grund).
async function ladeTeamAdressdaten(): Promise<Betreuer[]> {
  return Promise.all(
    TEAM.map(async (t) => {
      const teile = t.name.split(" ");
      const basis: Betreuer = {
        vorname: teile.slice(0, -1).join(" "),
        nachname: teile[teile.length - 1],
        rolle: t.rolle,
      };

      const adressId = t.adressId;
      if (!adressId) return basis;

      const live = await ladeBetreuerAdressdaten(adressId).catch(() => null);
      if (!live) return basis;

      return {
        ...basis,
        id: live.id,
        telefon: live.telefon,
        email: live.email,
        firma: live.firma,
        strasse: live.strasse,
        plz: live.plz,
        ort: live.ort,
        url: live.url,
      };
    })
  );
}

// Fotos werden bewusst in ZWEI Phasen geladen statt pro Person einzeln: Erst alle Adressdaten
// parallel (wie zuvor), dann EIN gemeinsamer Foto-Batch-Abruf für alle dabei gefundenen
// E-Mail-Adressen (siehe ladeUserFotosByEmails). Grund: Bei einem eigenen Foto-Einzelabruf pro
// Person (~9 Personen × 2 Requests) trat unter der dadurch entstehenden Anfragen-Last
// intermittierend ein Fehler auf (vereinzelt fehlendes Foto trotz vorhandenem Datensatz, siehe
// Kommentar bei ladeUserFotosByEmails) — die gebündelte Variante braucht für die gesamte Liste
// nur zwei zusätzliche Requests statt bis zu 18.
export async function ladeAlleMitarbeiter(): Promise<Betreuer[]> {
  const mitAdressdaten = await ladeTeamAdressdaten();

  const emails = mitAdressdaten.map((m) => m.email).filter((e): e is string => !!e);
  const fotosByEmail = await ladeUserFotosByEmails(emails).catch(() => ({}) as Record<string, string>);

  return mitAdressdaten.map((m) =>
    m.email && fotosByEmail[m.email.toLowerCase()]
      ? { ...m, profilbildUrl: fotosByEmail[m.email.toLowerCase()] }
      : m
  );
}

// Kombinierter Abruf für Hauptbetreuer ("Ansprechpartner"), Setter und komplette
// Mitarbeiterliste in EINEM Rutsch — ersetzt in praesentation.ts die bisherigen zwei
// UNABHÄNGIGEN, aber wegen Promise.all GLEICHZEITIG laufenden Aufrufe (ladeBetreuerByAddressId
// für den Hauptkontakt, ladeAlleMitarbeiter für die übrige Liste). Beide lösten INTERN jeweils
// einen eigenen "user"+"userphoto"-Request aus, liefen also parallel gegen dieselben
// Resourcetypes.
//
// Live beobachtet (Juli 2026, Kundenmeldung "Bild des Ansprechpartners lädt nicht"): Genau
// diese Art von Überlappung war bereits einmal Ursache der bei ladeUserFotosByEmails
// dokumentierten Flakiness ("der Hauptbetreuer zeigte bei manchen, nicht allen, Seitenaufrufen
// trotz vorhandenem Foto den Initialen-Avatar statt des echten Fotos") — der damalige Umbau auf
// Batch reduzierte zwar ladeAlleMitarbeiters EIGENE Foto-Requests auf zwei, ließ aber
// ladeBetreuerByAddressIds separaten Einzelabruf (eigener "user"+"userphoto"-Request pro
// Seitenaufruf für die eine Betreuer-E-Mail) unangetastet — beide Batches liefen dadurch
// weiterhin gleichzeitig. Diese Funktion vereint alle drei E-Mail-Quellen VOR dem Foto-Abruf zu
// einem einzigen ladeUserFotosByEmails-Aufruf, sodass pro Seitenaufruf nur noch genau EIN
// "user"+"userphoto"-Requestpaar an OnOffice geht — strukturelle Behebung statt Retry. Der
// Setter (setterAddressId) wurde nachträglich ergänzt (siehe ladeSetterAddressId) und folgt
// exakt demselben Muster wie der Betreuer — inkl. null, falls für das Objekt kein Setter
// hinterlegt ist (siehe Betreuer-Typ, Kontaktperson.tsx blendet den Block dann komplett aus).
export async function ladeBetreuerUndAlleMitarbeiter(
  betreuerAddressId: string | null,
  setterAddressId: string | null
): Promise<{ betreuer: Betreuer | null; setter: Betreuer | null; alleMitarbeiter: Betreuer[] }> {
  const [betreuerBasis, setterBasis, teamBasis] = await Promise.all([
    betreuerAddressId
      ? ladeBetreuerAdressdaten(betreuerAddressId).catch(() => null)
      : Promise.resolve(null),
    setterAddressId
      ? ladeBetreuerAdressdaten(setterAddressId).catch(() => null)
      : Promise.resolve(null),
    ladeTeamAdressdaten(),
  ]);

  const emails = [
    ...(betreuerBasis?.email ? [betreuerBasis.email] : []),
    ...(setterBasis?.email ? [setterBasis.email] : []),
    ...teamBasis.map((m) => m.email).filter((e): e is string => !!e),
  ];
  const fotosByEmail = await ladeUserFotosByEmails(emails).catch(() => ({}) as Record<string, string>);

  const betreuer = betreuerBasis
    ? {
        ...betreuerBasis,
        profilbildUrl: betreuerBasis.email
          ? fotosByEmail[betreuerBasis.email.toLowerCase()]
          : undefined,
      }
    : null;

  const setter = setterBasis
    ? {
        ...setterBasis,
        profilbildUrl: setterBasis.email
          ? fotosByEmail[setterBasis.email.toLowerCase()]
          : undefined,
      }
    : null;

  const alleMitarbeiter = teamBasis.map((m) =>
    m.email && fotosByEmail[m.email.toLowerCase()]
      ? { ...m, profilbildUrl: fotosByEmail[m.email.toLowerCase()] }
      : m
  );

  return { betreuer, setter, alleMitarbeiter };
}

// Zählt Objekte mit status2=verkauft für die "Verkaufte Objekte"-Kennzahl im "Über uns"-Reiter
// (siehe Unternehmen.tsx). Bewusst listlimit: 1 statt der vollen Liste — es wird ausschließlich
// meta.cntabsolute aus der Antwort gelesen, die einzelnen Datensätze werden nicht benötigt.
// status2=verkauft ist dasselbe Feld/derselbe Wert, der bereits für die
// Vergleichswert-Referenzobjektsuche verwendet wird (siehe route.ts, "nurVerkaufte"-Filter) —
// dort zusätzlich mit vermarktungsart=kauf kombiniert, um verkaufte Vermietungsobjekte
// auszuschließen. Für die reine Zählung "wie viele Objekte hat Parma insgesamt verkauft" ist das
// bewusst NICHT gewünscht (ein Objekt bleibt verkauft, unabhängig von der Vermarktungsart) — live
// gegen den Account geprüft, Juli 2026: 234 Objekte mit status2=verkauft.
export async function zaehleVerkaufteObjekte(): Promise<number> {
  const result = await callOnOfficeApi([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: ["Id"],
        filter: { status2: [{ op: "=", val: "verkauft" }] },
        listlimit: 1,
      },
    },
  ]);
  return result?.response?.results?.[0]?.data?.meta?.cntabsolute ?? 0;
}

// Zählt die aktuell aktiven Objekte (status=1) eines bestimmten Mitarbeiters (Objekt-Betreuer,
// Feld "benutzer" = Nutzer-Nr, siehe ladeNutzerNrFuerMitarbeiter/TeamMitglied.nutzerNr oben —
// NICHT die Adress-ID) für die Mitarbeiterstatistik im Admin-Bereich (Parameter 1 von 5, siehe
// Mitarbeiterstatistik.tsx). Bewusst ein reiner Absolut-Snapshot ohne Zeitraum (kein 30-Tage-
// oder Jahres-Fenster wie bei Terminen/Besichtigungen weiter unten) — "wie viele Objekte
// betreut die Person gerade". Gleiches listlimit:1 + meta.cntabsolute-Muster wie
// zaehleVerkaufteObjekte oben, hier zusätzlich nach Betreuer gefiltert.
// vermarktungsart=kauf schließt Vermietungsobjekte aus (Chat-Vorgabe Juli 2026: "Es gibt auch
// Vermietungsobjekte ... Rechne diese Werte bitte überall raus" — Vermietungsobjekte werden
// stattdessen separat geladen, siehe ladeAktiveVermietungenFuerMitarbeiter/
// ladeVermietungenInAufarbeitungFuerMitarbeiter weiter unten).
export async function zaehleAktiveObjekte(nutzerNr: string): Promise<number> {
  const result = await callOnOfficeApi([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: ["Id"],
        filter: {
          status: [{ op: "=", val: "1" }],
          benutzer: [{ op: "=", val: nutzerNr }],
          vermarktungsart: [{ op: "=", val: "kauf" }],
        },
        listlimit: 1,
      },
    },
  ]);
  return result?.response?.results?.[0]?.data?.meta?.cntabsolute ?? 0;
}

// Zählt Objekte "in Aufarbeitung" (Parameter 2 von 5, siehe Mitarbeiterstatistik.tsx) eines
// bestimmten Mitarbeiters: status=2 (Inaktiv) UND status2=vorbereitung (Status 2 = "Vorbereitung",
// bewusst UND statt ODER, siehe Chat-Vorgabe) UND benutzer=Nutzer-Nr. Beide Permitted-Values live
// gegen den Account per get_field_definitions bestätigt (Juli 2026): status "2" = "Inaktiv",
// status2 "vorbereitung" = "Vorbereitung". Ebenfalls ein reiner Absolut-Snapshot ohne Zeitraum
// (wie zaehleAktiveObjekte oben) — gleiches listlimit:1 + meta.cntabsolute-Muster.
// vermarktungsart=kauf schließt Vermietungsobjekte aus (siehe Kommentar bei zaehleAktiveObjekte
// oben).
export async function zaehleObjekteInAufarbeitung(nutzerNr: string): Promise<number> {
  const result = await callOnOfficeApi([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: ["Id"],
        filter: {
          status: [{ op: "=", val: "2" }],
          status2: [{ op: "=", val: "vorbereitung" }],
          benutzer: [{ op: "=", val: nutzerNr }],
          vermarktungsart: [{ op: "=", val: "kauf" }],
        },
        listlimit: 1,
      },
    },
  ]);
  return result?.response?.results?.[0]?.data?.meta?.cntabsolute ?? 0;
}

// Zählt Objekte mit status2=verkauft eines bestimmten Mitarbeiters innerhalb eines Datumsfensters
// von "verkauft_am" (Feld "Verkauft/Vermietet am", siehe mapping.ts) — für die neue Kennzahl
// "Verkaufte Objekte" je Mitarbeiter im aktuellen Kalenderjahr (Chat-Vorgabe Juli 2026: "die Zahl
// der verkauften Objekte pro Mitarbeiter in diesem Jahr"). von/bis werden bewusst NICHT hier
// hartkodiert, sondern vom Aufrufer übergeben (siehe ermittleJahresDatumsfenster in
// mitarbeiterstatistik.ts, die das aktuelle Kalenderjahr zur Laufzeit aus dem Systemdatum
// bestimmt) — so bleibt die Kennzahl "jedes Jahr zurückgestellt" (Chat-Vorgabe), ohne dass der
// Code jährlich angepasst werden muss. Live geprüft, Juli 2026: Datumsfilter im Format
// "YYYY-MM-DD" funktioniert zuverlässig gegen das Feld verkauft_am. vermarktungsart=kauf schließt
// Vermietungsobjekte aus (siehe Kommentar bei zaehleAktiveObjekte oben).
export async function zaehleVerkaufteObjekteFuerMitarbeiter(
  nutzerNr: string,
  von: string,
  bis: string
): Promise<number> {
  const result = await callOnOfficeApi([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: ["Id"],
        filter: {
          status2: [{ op: "=", val: "verkauft" }],
          benutzer: [{ op: "=", val: nutzerNr }],
          vermarktungsart: [{ op: "=", val: "kauf" }],
          verkauft_am: [
            { op: ">=", val: von },
            { op: "<=", val: bis },
          ],
        },
        listlimit: 1,
      },
    },
  ]);
  return result?.response?.results?.[0]?.data?.meta?.cntabsolute ?? 0;
}

// Leichte Objekt-Kennung für die aufklappbare Objektliste je Mitarbeiter (Admin-Bereich, siehe
// Mitarbeiterstatistik.tsx / api/admin/mitarbeiter-objekte) — bewusst nur die Felder, die dort
// angezeigt werden (Objektnummer, Preis, Vermarktungsdauer, siehe Chat-Vorgabe), statt des vollen
// ESTATE_FIELDS-Katalogs (siehe mapping.ts), da hier ggf. mehrere Dutzend Objekte auf einmal
// geladen werden. Das Titelbild kommt NICHT aus diesem Abruf (Bilder sind kein Datenfeld des
// Estate-Datensatzes, siehe ladeTitelbilder oben) — der Aufrufer (api/admin/mitarbeiter-objekte)
// ergänzt die Bild-URL per separatem Batch-Aufruf.
interface RawMitarbeiterObjektRecord {
  id: string;
  elements: {
    objekttitel?: string;
    objektnr_extern?: string;
    kaufpreis?: string | number;
    // "Auftrag von" (Beginn des Maklerauftrags) — auf Chat-Vorgabe hin die Grundlage für
    // Vermarktungsdauer, NICHT das gleichnamige individuelle OnOffice-Feld
    // "Vermarktungsdauer [Tage]" (ind_2950_Feld_ObjPreise377): live geprüft, Juli 2026 — bei
    // fast allen Objekten unbefüllt (Wert 0) und bei den wenigen befüllten Objekten mit
    // unplausiblen Werten (z.B. 738977), also nicht verlässlich nutzbar. "auftragvon" liefert bei
    // fehlendem Auftragsdatum "0000-00-00" statt eines echten Datums (siehe
    // berechneVermarktungsdauerTage unten).
    auftragvon?: string;
    // "Prozent Außenprovision"/"Prozent Innenprovision" (Bereich Preise/Flächen > Preise
    // Statistik in OnOffice) — Feldkatalog live geprüft (resourcetype "fields", Juli 2026):
    // prozent_aussenprovision/prozent_innenprovision, Typ "float". Bewusst NICHT die
    // gleichnamigen Freitextfelder aussen_courtage/innen_courtage (Typ "text", z.B. "3,57 %
    // inkl. 19 % MwSt.", "3,57 % zzgl. 19 % MwSt." oder ganz ohne Prozentzeichen) — Stichprobe
    // von 30 aktiven Objekten (Juli 2026) zeigte, dass die Freitextfelder uneinheitlich formuliert
    // sind (mal "inkl.", mal "zzgl.", mal "inkl. ges. MwSt.") und dadurch nicht zuverlässig
    // regelbasiert auszuwerten waren — u.a. ein Objekt mit gültigem Prozentwert laut den
    // "prozent_*"-Feldern (1,50%), dessen Freitext ("zzgl. 19 % MwSt.") ein Parser fälschlich
    // verwirft, sowie umgekehrt Objekte mit plausibel aussehendem Freitext ("3,57"), deren
    // "prozent_*"-Felder tatsächlich 0 (= nicht gepflegt) sind. Auf Nutzerhinweis (Juli 2026:
    // "diese scheinen mir etwas zuverlässiger zu sein") daher auf die strukturierten
    // Prozent-Felder umgestellt.
    prozent_aussenprovision?: string | number;
    prozent_innenprovision?: string | number;
    // Kaltmiete — bei Vermietungsobjekten (vermarktungsart=miete) ist "kaufpreis" stets 0 (live
    // geprüft, Juli 2026), daher wird für die neue "Vermietung"-Dropdown-Gruppe (Chat-Vorgabe:
    // "zeige sie aber Pro mitarbeiter trotzdem an als weiter dropdown funktion") stattdessen die
    // Kaltmiete als Preis angezeigt, siehe mapMitarbeiterVermietung unten.
    kaltmiete?: string | number;
  };
}

const MITARBEITER_OBJEKT_FIELDS = [
  "Id",
  "objekttitel",
  "objektnr_extern",
  "kaufpreis",
  "auftragvon",
  "prozent_aussenprovision",
  "prozent_innenprovision",
  "kaltmiete",
];

// Deutlich über der realistischen Objektzahl einer einzelnen Person — anders als bei den
// zaehle*-Funktionen oben (listlimit:1 + meta.cntabsolute) werden hier die tatsächlichen
// Datensätze gebraucht, nicht nur ihre Anzahl.
const MITARBEITER_OBJEKT_LISTLIMIT = 200;

// Tage seit Auftragsbeginn — null, wenn kein Auftragsdatum hinterlegt ist ("0000-00-00", das
// OnOffice-Pendant zu NULL bei Datumsfeldern) oder das Datum sich nicht parsen lässt. Rundet auf
// ganze Tage (Uhrzeitanteil wird für den Vergleich auf Mitternacht gesetzt), negative Werte
// (Auftragsdatum in der Zukunft) werden auf 0 begrenzt.
function berechneVermarktungsdauerTage(auftragvon?: string): number | null {
  if (!auftragvon || auftragvon === "0000-00-00") return null;
  const start = new Date(auftragvon);
  if (Number.isNaN(start.getTime())) return null;
  start.setHours(0, 0, 0, 0);
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  const diffTage = Math.round((heute.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffTage);
}

// prozent_aussenprovision/prozent_innenprovision liefern von OnOffice bereits eine Zahl als
// String (z.B. "3.5700"), aber bei unbefüllten Objekten "0.0000" statt eines leeren Werts — ein
// Provisionssatz von exakt 0% ist im hier betreuten Bestand geschäftlich nicht plausibel (siehe
// die Auswahlwerte des Felds "Maklerprovision" im Feldkatalog, die alle > 0 liegen), daher wird
// 0 bzw. ein nicht als Zahl interpretierbarer Wert bewusst wie "nicht gepflegt" behandelt.
function parseProvisionsProzent(wert?: string | number): number | null {
  const zahl = Number(wert);
  if (!Number.isFinite(zahl) || zahl <= 0) return null;
  return zahl;
}

// MwSt.-Satz, um aus dem in OnOffice hinterlegten Brutto-Prozentsatz (üblicherweise 3,57 % = 3 %
// netto + 19 % MwSt., siehe Feldkatalog-Auswahlwerte von "Maklerprovision") den realen
// Netto-Provisionssatz zu ermitteln (Chat-Vorgabe: "Hier muss einmal die Mehrwertsteuer von 19%
// rausgerechnet werden um die reale Provision zu sehen").
const MWST_FAKTOR = 1.19;

function mapMitarbeiterObjekt(record: RawMitarbeiterObjektRecord): MitarbeiterObjekt {
  const el = record.elements;
  const preis = Number(el.kaufpreis) || 0;

  const aussenProzent = parseProvisionsProzent(el.prozent_aussenprovision);
  const innenProzent = parseProvisionsProzent(el.prozent_innenprovision);
  // Nur berechnen, wenn BEIDE Felder einen auswertbaren Prozentsatz enthalten — fehlt eines,
  // wäre die Summe unvollständig und damit irreführend, siehe provisionsvorlaufFehlt.
  const provisionsvorlaufFehlt = aussenProzent === null || innenProzent === null;
  const provisionsvorlauf = provisionsvorlaufFehlt
    ? null
    : (preis * ((aussenProzent as number) + (innenProzent as number))) / 100 / MWST_FAKTOR;

  return {
    id: String(record.id),
    titel: el.objekttitel || `Immobilie ${record.id}`,
    objektnr: el.objektnr_extern || String(record.id),
    preis,
    vermarktungsdauerTage: berechneVermarktungsdauerTage(el.auftragvon),
    titelbildUrl: null,
    provisionsvorlauf,
    provisionsvorlaufFehlt,
  };
}

// Mapping-Variante für Vermietungsobjekte (vermarktungsart=miete, siehe
// ladeAktiveVermietungenFuerMitarbeiter/ladeVermietungenInAufarbeitungFuerMitarbeiter unten) —
// verwendet die Kaltmiete statt des (bei Vermietungsobjekten stets 0) Kaufpreises als "preis" und
// berechnet bewusst KEINEN Provisionsvorlauf: Das Außen-/Innen-Provisionsmodell auf den Kaufpreis
// (siehe mapMitarbeiterObjekt oben) gilt für Vermietungsobjekte nicht in gleicher Form, daher
// provisionsvorlaufFehlt hier bewusst false statt eines Hinweises auf fehlende OnOffice-Daten
// (kein "Angabe fehlt", weil hier grundsätzlich nichts erwartet wird).
function mapMitarbeiterVermietung(record: RawMitarbeiterObjektRecord): MitarbeiterObjekt {
  const el = record.elements;
  return {
    id: String(record.id),
    titel: el.objekttitel || `Immobilie ${record.id}`,
    objektnr: el.objektnr_extern || String(record.id),
    preis: Number(el.kaltmiete) || 0,
    vermarktungsdauerTage: berechneVermarktungsdauerTage(el.auftragvon),
    titelbildUrl: null,
    provisionsvorlauf: null,
    provisionsvorlaufFehlt: false,
  };
}

// Lädt die aktiven Objekte (status=1) eines Mitarbeiters als Liste — identischer Filter wie
// zaehleAktiveObjekte oben, hier aber mit echten Anzeige-Feldern statt nur "Id" und ohne
// listlimit:1. Wird NICHT beim initialen Laden der Admin-Seite für alle Mitarbeiter aufgerufen,
// sondern erst bei Bedarf, wenn eine Zeile in der Mitarbeiterstatistik aufgeklappt wird (siehe
// api/admin/mitarbeiter-objekte/route.ts). vermarktungsart=kauf schließt Vermietungsobjekte aus
// (siehe Kommentar bei zaehleAktiveObjekte oben) — diese werden separat über
// ladeAktiveVermietungenFuerMitarbeiter unten geladen.
export async function ladeAktiveObjekteFuerMitarbeiter(
  nutzerNr: string
): Promise<MitarbeiterObjekt[]> {
  const result = await callOnOfficeApi<RawMitarbeiterObjektRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: MITARBEITER_OBJEKT_FIELDS,
        filter: {
          status: [{ op: "=", val: "1" }],
          benutzer: [{ op: "=", val: nutzerNr }],
          vermarktungsart: [{ op: "=", val: "kauf" }],
        },
        listlimit: MITARBEITER_OBJEKT_LISTLIMIT,
        sortby: { objekttitel: "ASC" },
      },
    },
  ]);
  const records = result?.response?.results?.[0]?.data?.records || [];
  return records.map(mapMitarbeiterObjekt);
}

// Lädt Objekte "in Aufarbeitung" eines Mitarbeiters als Liste — identischer Filter wie
// zaehleObjekteInAufarbeitung oben, hier aber mit echten Anzeige-Feldern (siehe
// ladeAktiveObjekteFuerMitarbeiter direkt darüber für das gemeinsame Muster). vermarktungsart=kauf
// schließt Vermietungsobjekte aus (siehe Kommentar bei zaehleAktiveObjekte oben).
export async function ladeObjekteInAufarbeitungFuerMitarbeiter(
  nutzerNr: string
): Promise<MitarbeiterObjekt[]> {
  const result = await callOnOfficeApi<RawMitarbeiterObjektRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: MITARBEITER_OBJEKT_FIELDS,
        filter: {
          status: [{ op: "=", val: "2" }],
          status2: [{ op: "=", val: "vorbereitung" }],
          benutzer: [{ op: "=", val: nutzerNr }],
          vermarktungsart: [{ op: "=", val: "kauf" }],
        },
        listlimit: MITARBEITER_OBJEKT_LISTLIMIT,
        sortby: { objekttitel: "ASC" },
      },
    },
  ]);
  const records = result?.response?.results?.[0]?.data?.records || [];
  return records.map(mapMitarbeiterObjekt);
}

// Lädt aktive Vermietungsobjekte (status=1, vermarktungsart=miete) eines Mitarbeiters — Pendant zu
// ladeAktiveObjekteFuerMitarbeiter oben, nur für Vermietungsobjekte statt Kaufobjekte (Chat-Vorgabe
// Juli 2026: "Es gibt auch Vermietungsobjekte ... zeige sie aber Pro mitarbeiter trotzdem an als
// weiter dropdown funktion"). Wird vom Aufrufer (api/admin/mitarbeiter-objekte/route.ts)
// zusammen mit ladeVermietungenInAufarbeitungFuerMitarbeiter zu EINER gemeinsamen
// "Vermietung"-Dropdown-Gruppe zusammengeführt, statt hier zwei getrennte Gruppen wie bei
// Kaufobjekten (aktiv/Aufarbeitung) abzubilden — der Nutzer bat um EINEN zusätzlichen Dropdown,
// nicht zwei.
export async function ladeAktiveVermietungenFuerMitarbeiter(
  nutzerNr: string
): Promise<MitarbeiterObjekt[]> {
  const result = await callOnOfficeApi<RawMitarbeiterObjektRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: MITARBEITER_OBJEKT_FIELDS,
        filter: {
          status: [{ op: "=", val: "1" }],
          benutzer: [{ op: "=", val: nutzerNr }],
          vermarktungsart: [{ op: "=", val: "miete" }],
        },
        listlimit: MITARBEITER_OBJEKT_LISTLIMIT,
        sortby: { objekttitel: "ASC" },
      },
    },
  ]);
  const records = result?.response?.results?.[0]?.data?.records || [];
  return records.map(mapMitarbeiterVermietung);
}

// Lädt Vermietungsobjekte "in Aufarbeitung" (status=2, status2=vorbereitung, vermarktungsart=miete)
// eines Mitarbeiters — Pendant zu ladeObjekteInAufarbeitungFuerMitarbeiter oben, siehe
// ladeAktiveVermietungenFuerMitarbeiter direkt darüber für den gemeinsamen Hintergrund (eine
// einzige "Vermietung"-Gruppe statt zweier getrennter).
export async function ladeVermietungenInAufarbeitungFuerMitarbeiter(
  nutzerNr: string
): Promise<MitarbeiterObjekt[]> {
  const result = await callOnOfficeApi<RawMitarbeiterObjektRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: MITARBEITER_OBJEKT_FIELDS,
        filter: {
          status: [{ op: "=", val: "2" }],
          status2: [{ op: "=", val: "vorbereitung" }],
          benutzer: [{ op: "=", val: nutzerNr }],
          vermarktungsart: [{ op: "=", val: "miete" }],
        },
        listlimit: MITARBEITER_OBJEKT_LISTLIMIT,
        sortby: { objekttitel: "ASC" },
      },
    },
  ]);
  const records = result?.response?.results?.[0]?.data?.records || [];
  return records.map(mapMitarbeiterVermietung);
}

// Lädt die einzelnen verkauften Objekte (status2=verkauft, Datumsfenster auf "verkauft_am") eines
// Mitarbeiters als Liste — Pendant zu zaehleVerkaufteObjekteFuerMitarbeiter oben (dort nur die
// Anzahl über meta.cntabsolute), hier mit echten Anzeige-Feldern für die aufklappbare
// "Verkauft {Jahr}"-Dropdown-Gruppe (Juli 2026 Chat-Vorgabe: "ich sehe immer noch keine
// Verkauften Objekte! Bitte auch noch ausführen" — die reine Zahl in der Tabelle reichte nicht,
// die einzelnen Objekte sollen wie bei Vermietung/Aufarbeitung/Aktive Vermarktung aufklappbar
// sein). Nutzt dieselben Anzeige-Felder wie ladeAktiveObjekteFuerMitarbeiter/mapMitarbeiterObjekt
// (echte Kaufobjekte, kein Vermietungs-Sonderfall) — der Provisionsvorlauf ist hier sogar
// besonders aussagekräftig, da die Provision bei einem verkauften Objekt tatsächlich realisiert
// wurde. von/bis werden vom Aufrufer übergeben (siehe ermittleJahresDatumsfenster in
// mitarbeiterstatistik.ts), damit das Kalenderjahr zur Laufzeit bestimmt wird statt hartkodiert zu
// sein.
export async function ladeVerkaufteObjekteFuerMitarbeiter(
  nutzerNr: string,
  von: string,
  bis: string
): Promise<MitarbeiterObjekt[]> {
  const result = await callOnOfficeApi<RawMitarbeiterObjektRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: MITARBEITER_OBJEKT_FIELDS,
        filter: {
          status2: [{ op: "=", val: "verkauft" }],
          benutzer: [{ op: "=", val: nutzerNr }],
          vermarktungsart: [{ op: "=", val: "kauf" }],
          verkauft_am: [
            { op: ">=", val: von },
            { op: "<=", val: bis },
          ],
        },
        listlimit: MITARBEITER_OBJEKT_LISTLIMIT,
        sortby: { objekttitel: "ASC" },
      },
    },
  ]);
  const records = result?.response?.results?.[0]?.data?.records || [];
  return records.map(mapMitarbeiterObjekt);
}

// Deutlich über dem live beobachteten Gesamtbestand (Juli 2026: rund 103 aktive + 22 in
// Aufarbeitung über alle Mitarbeiter zusammen, siehe ladeObjektGesamtKennzahlen in
// mitarbeiterstatistik.ts) — für die beiden unternehmensweiten Listen unten, die bewusst KEINEN
// benutzer-Filter setzen.
const GESAMT_OBJEKT_LISTLIMIT = 500;

// Lädt ALLE aktiven Objekte (status=1) unternehmensweit, ohne Filter nach Mitarbeiter — für die
// Infobox "Aktive Vermarktung gesamt" über der Mitarbeitertabelle (siehe Mitarbeiterstatistik.tsx,
// Chat-Vorgabe). vermarktungsart=kauf schließt Vermietungsobjekte aus (siehe Kommentar bei
// zaehleAktiveObjekte oben) — die unternehmensweiten Summen sollen laut Nutzervorgabe
// ausschließlich Kaufobjekte umfassen. Bewusst EIN Abruf für alle Mitarbeiter zusammen statt einer Summe aus 11
// Einzelabrufen (ladeAktiveObjekteFuerMitarbeiter je Mitarbeiter) — spart ~10 zusätzliche
// OnOffice-Abrufe beim initialen Laden der Admin-Seite.
export async function ladeAlleAktivenObjekte(): Promise<MitarbeiterObjekt[]> {
  const result = await callOnOfficeApi<RawMitarbeiterObjektRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: MITARBEITER_OBJEKT_FIELDS,
        filter: {
          status: [{ op: "=", val: "1" }],
          vermarktungsart: [{ op: "=", val: "kauf" }],
        },
        listlimit: GESAMT_OBJEKT_LISTLIMIT,
        sortby: { objekttitel: "ASC" },
      },
    },
  ]);
  const records = result?.response?.results?.[0]?.data?.records || [];
  return records.map(mapMitarbeiterObjekt);
}

// Lädt ALLE Objekte "in Aufarbeitung" unternehmensweit — Pendant zu ladeAlleAktivenObjekte oben,
// gleicher Filter wie ladeObjekteInAufarbeitungFuerMitarbeiter, nur ohne benutzer-Filter.
export async function ladeAlleObjekteInAufarbeitung(): Promise<MitarbeiterObjekt[]> {
  const result = await callOnOfficeApi<RawMitarbeiterObjektRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: MITARBEITER_OBJEKT_FIELDS,
        filter: {
          status: [{ op: "=", val: "2" }],
          status2: [{ op: "=", val: "vorbereitung" }],
          vermarktungsart: [{ op: "=", val: "kauf" }],
        },
        listlimit: GESAMT_OBJEKT_LISTLIMIT,
        sortby: { objekttitel: "ASC" },
      },
    },
  ]);
  const records = result?.response?.results?.[0]?.data?.records || [];
  return records.map(mapMitarbeiterObjekt);
}

// Lädt ALLE im übergebenen Zeitfenster verkauften Objekte unternehmensweit, ohne Filter nach
// Mitarbeiter — Pendant zu ladeAlleAktivenObjekte/ladeAlleObjekteInAufarbeitung oben, gleicher
// Filter wie ladeVerkaufteObjekteFuerMitarbeiter, nur ohne benutzer-Filter. Für den neuen
// unternehmensweiten Block "Verkaufte Objekte {Jahr} / Provisionsvolumen {Jahr} / Gesamtvolumen
// {Jahr}" über der Mitarbeitertabelle (Juli 2026 Chat-Vorgabe: "Zeige oben in der Gesamtstatistik
// bitte einen weiteren Block an"), siehe ladeObjektGesamtKennzahlen in mitarbeiterstatistik.ts.
// von/bis werden vom Aufrufer übergeben (ermittleJahresDatumsfenster), damit das Kalenderjahr zur
// Laufzeit bestimmt wird statt hartkodiert zu sein.
export async function ladeAlleVerkauftenObjekte(
  von: string,
  bis: string
): Promise<MitarbeiterObjekt[]> {
  const result = await callOnOfficeApi<RawMitarbeiterObjektRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "estate",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: MITARBEITER_OBJEKT_FIELDS,
        filter: {
          status2: [{ op: "=", val: "verkauft" }],
          vermarktungsart: [{ op: "=", val: "kauf" }],
          verkauft_am: [
            { op: ">=", val: von },
            { op: "<=", val: bis },
          ],
        },
        listlimit: GESAMT_OBJEKT_LISTLIMIT,
        sortby: { objekttitel: "ASC" },
      },
    },
  ]);
  const records = result?.response?.results?.[0]?.data?.records || [];
  return records.map(mapMitarbeiterObjekt);
}

// Terminarten, die NICHT in die "Termine"-Kennzahl (Parameter 3 von 5) einfließen — reine
// Abwesenheits-/interne Termine ohne Kundenauslastung, auf ausdrücklichen Nutzerwunsch
// ausgeschlossen (siehe Chat). Alle übrigen live im Account genutzten Terminarten
// (Besichtigung, Geschäftstermin, Akquise - Ersttermin/-Zweittermin/-Vertragstermin,
// Notartermin, Objektübergabe, Folgebesichtigung, Handwerkertermin, Gutachtertermin,
// Visualisierung — sowie Termine ganz ohne hinterlegte Terminart) zählen mit.
const AUSGESCHLOSSENE_TERMINARTEN = ["Urlaub", "Privattermin", "Teammeeting"];

// Zählt Termine eines Mitarbeiters (Parameter 3 von 5, siehe Mitarbeiterstatistik.tsx) im
// Zeitraum [von, bis] (jeweils "YYYY-MM-DD HH:mm:ss", siehe ermittleZeitraeume in
// onoffice/mitarbeiterstatistik.ts für die konkreten 30-Tage-/Kalenderjahr-Fenster), ohne die
// drei Abwesenheits-/internen Terminarten oben. resourcetype "calendar" statt "estate" — eigene
// Parameter datestart/dateend/users laut apidoc.onoffice.de ("Datensatz lesen" > "Kalender/
// Termin"), NICHT das sonst übliche filter-Objekt für den Datumsbereich (ein reiner
// filter-Versuch auf start_dt/end_dt lieferte live den Fehler "Missing date period",
// Errorcode 289 — datestart/dateend sind eigene Top-Level-Parameter). WICHTIG: "users" erwartet
// die Nutzer-Nr als Zahl, nicht als String (anders als "benutzer" im estate-Filter oben). Live
// gegen den Account geprüft (Juli 2026, Kira Woldt Nutzer-Nr 25, ein Zwei-Monats-Fenster): 70
// Termine gesamt, davon 9 einer der drei ausgeschlossenen Arten (per separatem "art IN"-Test
// bestätigt) — 9 + 61 (mit "art NOT IN"-Filter) = 70, damit sichergestellt, dass "NOT IN" keine
// Termine ohne hinterlegte Terminart verschluckt.
export async function zaehleTermine(nutzerNr: string, von: string, bis: string): Promise<number> {
  const result = await callOnOfficeApi([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "calendar",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: ["Id"],
        listlimit: 1,
        datestart: von,
        dateend: bis,
        users: [Number(nutzerNr)],
        filter: {
          art: [{ op: "NOT IN", val: AUSGESCHLOSSENE_TERMINARTEN }],
        },
      },
    },
  ]);
  return result?.response?.results?.[0]?.data?.meta?.cntabsolute ?? 0;
}

// Terminarten, die in die "Besichtigungen"-Kennzahl (Parameter 4 von 5) einfließen — auf
// Nutzerwunsch beide Arten zusammen (siehe Chat): "Besichtigung" (Ersttermin) UND
// "Folgebesichtigung" zählen beide als reale Vor-Ort-Termine mit Kunden.
const BESICHTIGUNGS_TERMINARTEN = ["Besichtigung", "Folgebesichtigung"];

// Zählt Besichtigungstermine eines Mitarbeiters (Parameter 4 von 5, siehe
// Mitarbeiterstatistik.tsx) im Zeitraum [von, bis] — exakt dasselbe Muster wie zaehleTermine
// oben (resourcetype "calendar", datestart/dateend/users), hier aber mit "art IN" statt
// "art NOT IN", da nur die zwei Besichtigungs-Terminarten oben zählen sollen (statt aller außer
// den drei Abwesenheits-/internen Arten).
export async function zaehleBesichtigungen(
  nutzerNr: string,
  von: string,
  bis: string
): Promise<number> {
  const result = await callOnOfficeApi([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "calendar",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: ["Id"],
        listlimit: 1,
        datestart: von,
        dateend: bis,
        users: [Number(nutzerNr)],
        filter: {
          art: [{ op: "IN", val: BESICHTIGUNGS_TERMINARTEN }],
        },
      },
    },
  ]);
  return result?.response?.results?.[0]?.data?.meta?.cntabsolute ?? 0;
}

// Zählt Kunden (Adressen) eines Mitarbeiters mit Adressstatus "Aktiv" (Parameter 5 von 5, siehe
// Mitarbeiterstatistik.tsx) — reiner Absolut-Snapshot ohne Zeitraum (wie zaehleAktiveObjekte/
// zaehleObjekteInAufarbeitung oben, siehe Nutzerentscheidung im Chat: kein 30-Tage-/Jahres-Paar
// für diese Kennzahl). resourcetype "address" statt "estate"/"calendar", Filter
// Status2Adr="status2adr_active" (Permitted-Value live per get_field_definitions bestätigt,
// Juli 2026: "Aktiv") UND Benutzer=Benutzername. WICHTIG: Das Feld "Benutzer" im address-Modul
// ist NICHT die Nutzer-Nr (anders als "benutzer" im estate-Filter oben), sondern der
// OnOffice-Kurz-Benutzername (siehe ladeBenutzernameFuerMitarbeiter/TeamMitglied.benutzername
// oben) — mit Nutzer-Nr gefiltert hätte die Abfrage schlicht 0 Treffer geliefert. Außerdem
// nimmt resourcetype "address" hier bewusst "Name" statt "Id" als data-Feld (ein Testaufruf mit
// data:["Id"] lieferte den Fehler "Unknown field: Id" — anders als bei "estate", wo "Id"
// funktioniert).
export async function zaehleAktiveKunden(benutzername: string): Promise<number> {
  const result = await callOnOfficeApi([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "address",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        data: ["Name"],
        filter: {
          Status2Adr: [{ op: "=", val: "status2adr_active" }],
          Benutzer: [{ op: "=", val: benutzername }],
        },
        listlimit: 1,
      },
    },
  ]);
  return result?.response?.results?.[0]?.data?.meta?.cntabsolute ?? 0;
}

// Ermittelt die zuletzt vergebene Kundennummer (KdNr, Feld im address-Modul) für die
// "Kunden"-Kennzahl im "Über uns"-Reiter (siehe Unternehmen.tsx). WICHTIG: Der sortby-Parameter
// wird von der onOffice-API für resourcetype "address" in diesem Account nachweislich ignoriert
// (live getestet, Juli 2026 — sortby nach KdNr/Eintragsdatum/id lieferte in allen Varianten
// dieselbe, unsortierte Reihenfolge zurück). Statt eines sortby-Aufrufs wird daher zunächst nur
// die Gesamtanzahl über meta.cntabsolute ermittelt (listlimit: 1) und anschließend genau der
// letzte Datensatz per listoffset (cntabsolute - 1) abgerufen — die Standard-/unsortierte
// Reihenfolge entspricht dabei der Eintragsreihenfolge (aufsteigend nach interner id), wie anhand
// des Zusammenhangs zwischen id/KdNr/Eintragsdatum live verifiziert. Ergibt live aktuell KdNr
// 22286 (Stand Juli 2026).
export async function ladeLetzteKundennummer(): Promise<number | null> {
  const zaehlung = await callOnOfficeApi<{ KdNr?: number }>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "address",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: { data: ["KdNr"], listlimit: 1 },
    },
  ]);
  const cnt = zaehlung?.response?.results?.[0]?.data?.meta?.cntabsolute ?? 0;
  if (cnt <= 0) return null;

  const result = await callOnOfficeApi<{ id: number; elements: { KdNr?: number } }>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:read",
      resourcetype: "address",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: { data: ["KdNr"], listlimit: 1, listoffset: cnt - 1 },
    },
  ]);
  const letzter = result?.response?.results?.[0]?.data?.records?.[0];
  const kdNr = letzter?.elements?.KdNr;
  return typeof kdNr === "number" ? kdNr : null;
}
