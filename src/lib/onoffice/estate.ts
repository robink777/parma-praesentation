import { Betreuer, Immobilie, Kunde, ObjektDokument } from "@/types";
import { TEAM } from "@/data/unternehmen";
import { callOnOfficeApi } from "./client";
import {
  ADDRESS_FIELDS,
  BETREUER_FIELDS,
  ESTATE_FIELDS,
  mapAddressRecord,
  mapBetreuerRecord,
  mapEstateRecord,
  mapFileRecord,
  RawAddressRecord,
  RawBetreuerRecord,
  RawEstateRecord,
  RawFileRecord,
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
  const result = await callOnOfficeApi<RawEstatePictureRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:get",
      resourcetype: "estatepictures",
      resourceid: "",
      identifier: "",
      cacheable: true,
      parameters: {
        estateids: [Number(estateId)],
        categories: ["Titelbild", "Foto"],
        size: "original",
        language: "DEU",
      },
    },
  ]);

  const records = result?.response?.results?.[0]?.data?.records || [];
  const bilder = records.flatMap((r) => r.elements || []);
  const titelbild = bilder.find((b) => b.type === "Titelbild") || bilder[0];
  return titelbild?.url;
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

// Ermittelt die Adress-ID des Eigentümers eines Objekts. Das ist kein Datenfeld am
// Estate-Datensatz, sondern eine eigene OnOffice-Relation (estate → address, Typ "owner").
// Damit reicht im OnOffice-Link künftig die Objekt-UUID allein aus — der Kunde für die
// persönliche Begrüßung wird automatisch über diese Relation aufgelöst.
export async function ladeEigentuemerAddressId(estateId: string): Promise<string | null> {
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
  const ids = record?.elements?.[estateId];
  return ids && ids.length > 0 ? ids[0] : null;
}

// Ermittelt die Adress-ID des zuständigen Mitarbeiters/der zuständigen Mitarbeiterin
// ("Betreuer") eines Objekts — analog zu ladeEigentuemerAddressId, nur mit dem
// Relations-Typ "contactPerson" statt "owner". Der zuvor hier verwendete Relations-Typ
// "employee" existiert in diesem Account NICHT (idsfromrelation lieferte dafür immer
// Errorcode 132 "No or unknown relation given") — dadurch schlug die Auflösung für JEDES
// Objekt fehl und die Seite "Ihre Kontaktperson" zeigte durchgehend den MOCK_BETREUER-
// Platzhalter ("Robin Kolbe") statt des tatsächlich zugeordneten Objekt-Betreuers.
// "contactPerson" ist laut offizieller onOffice-API-Doku (apidoc.onoffice.de, Abschnitt
// "Get Relations") der Relations-Typ für "Ansprechpartner (nur Makler)" und wurde gegen den
// echten Account verifiziert (Juli 2026): liefert für verschiedene Objekte tatsächlich
// unterschiedliche Adress-IDs (u.a. Daniel Parma, Robin Kolbe je nach Objekt-Zuordnung).
export async function ladeBetreuerAddressId(estateId: string): Promise<string | null> {
  const result = await callOnOfficeApi<RawRelationRecord>([
    {
      actionid: "urn:onoffice-de-ns:smart:2.5:smartml:action:get",
      resourcetype: "idsfromrelation",
      resourceid: "",
      identifier: "",
      cacheable: true,
      parameters: {
        relationtype: "urn:onoffice-de-ns:smart:2.5:relationTypes:estate:address:contactPerson",
        parentids: [Number(estateId)],
      },
    },
  ]);

  const record = result?.response?.results?.[0]?.data?.records?.[0];
  const ids = record?.elements?.[estateId];
  return ids && ids.length > 0 ? ids[0] : null;
}

export async function ladeBetreuerByAddressId(addressId: string): Promise<Betreuer | null> {
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

// Lädt den Objekt-Betreuer in einem Schritt: Relation auflösen, dann Adressdaten (inkl.
// Kontaktdaten und Profilbild) abrufen. Gibt null zurück, wenn keine Zuordnung existiert
// oder der Abruf fehlschlägt — der Aufrufer fällt in diesem Fall auf MOCK_BETREUER zurück.
export async function ladeBetreuerByEstateId(estateId: string): Promise<Betreuer | null> {
  const addressId = await ladeBetreuerAddressId(estateId);
  if (!addressId) return null;
  return ladeBetreuerByAddressId(addressId);
}

// Verknüpft TEAM-Einträge (Name, siehe data/unternehmen.ts) mit ihrer geschäftlichen
// OnOffice-Adress-ID, damit ladeAlleMitarbeiter() live Kontaktdaten (Telefon/E-Mail/Firma/
// Anschrift) nachladen kann. Live-Recherche Juli 2026 gegen den echten Account (customerId
// web77461): Es gibt in diesem Account weder ein "Kategorie"-Feld noch einen verifizierten
// Weg, die Liste der Backend-Benutzer ("Alle Mitarbeiter sind als Benutzer hinterlegt", so
// der Kunde) über die HMAC-signierte Adress-API generisch abzufragen — die Zuordnung
// Name → Adress-ID wurde daher einzeln geprüft und hier als Liste hinterlegt. Bei neuen
// Mitarbeitenden muss die Liste manuell ergänzt werden (siehe auch TEAM in data/unternehmen.ts).
//
// Wichtig (Datenschutz): Mehrere Personen haben in OnOffice ZWEI Adressdatensätze — einen
// geschäftlichen (Firmenanschrift Monschauer Straße 64, dienstliche Rufnummer) und einen
// privaten (Wohnanschrift, private Mobilnummer/E-Mail, vermutlich aus einem früheren Kunden-/
// Interessentenkontakt). Hier ist ausschließlich die geschäftliche Adress-ID hinterlegt, damit
// niemals private Wohnadressen oder private Kontaktdaten auf der öffentlichen
// Präsentationsseite erscheinen. Für Celin Borgwaldt und Tim Hartwich existiert in OnOffice
// gar keine verknüpfte Adresse — sie erscheinen im Slider daher nur mit Name/Rolle aus der
// Wissensdatei, ohne Kontaktdaten. Christian Rother, Tabea Erz, Nilgün Akbay, Santino Giese
// und Dawid Parma sind zwar als Benutzer in OnOffice angelegt, stehen aber (Stand Juli 2026)
// nicht in der öffentlichen Team-Übersicht (TEAM) — sie werden hier bewusst nicht ergänzt,
// zumal für Christian Rother in OnOffice ausschließlich ein privater Adressdatensatz
// (Heimatanschrift, private E-Mail) vorliegt.
const MITARBEITER_LIVE_ADRESS_IDS: Record<string, string> = {
  "Daniel Parma": "119",
  "Robin Kolbe": "123",
  "Kira Woldt": "125",
  "Katharina Becker": "6181",
  "Vanessa Krifft": "20105",
  "Jacqueline Henot": "20483",
  "Axel Wehmeier": "28831",
  "Sarah Barth": "31077",
  "Stanimira Georgieva": "32669",
};

// Lädt alle Mitarbeiter der Agentur für den "weitere Mitarbeiter"-Slider auf der
// Kontaktperson-Seite (objektunabhängig, im Gegensatz zum Objekt-Betreuer oben). Basis ist die
// TEAM-Liste aus der Wissensdatei (Namen + Rolle, siehe data/unternehmen.ts), angereichert mit
// live aus OnOffice geladenen Kontaktdaten, sofern eine geschäftliche Adress-ID bekannt ist
// (siehe MITARBEITER_LIVE_ADRESS_IDS oben). "rolle" kommt bewusst aus der Wissensdatei, nicht
// aus OnOffice: "jobPosition" ist im Account für jede bisher geprüfte Person leer. Enthält auch
// den Objekt-Betreuer (z.B. Robin Kolbe) — die Dublettenfilterung "Objekt-Betreuer ausschließen"
// erfolgt beim Aufrufer anhand von Betreuer.id (siehe praesentation.ts), nicht hier.
export async function ladeAlleMitarbeiter(): Promise<Betreuer[]> {
  return Promise.all(
    TEAM.map(async (t) => {
      const teile = t.name.split(" ");
      const basis: Betreuer = {
        vorname: teile.slice(0, -1).join(" "),
        nachname: teile[teile.length - 1],
        rolle: t.rolle,
      };

      const adressId = MITARBEITER_LIVE_ADRESS_IDS[t.name];
      if (!adressId) return basis;

      const live = await ladeBetreuerByAddressId(adressId).catch(() => null);
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
