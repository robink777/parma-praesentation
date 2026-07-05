import { Betreuer, Immobilie, Kunde } from "@/types";

// Feldnamen gegen den echten Feldkatalog des Kunden-Accounts geprüft (resourcetype "fields",
// Juli 2026). Modernisierungen sind in diesem Account über ~10 einzelne Individualfelder
// (ind_...) statt eines generischen Felds abgebildet — dafür bislang keine automatische
// Zuordnung, da das ohne Rücksprache mit dem Kunden geraten wäre.
export interface RawEstateRecord {
  id: string;
  elements: {
    objekttitel?: string;
    // "ImmoNr" im OnOffice-Backend — gegen den echten Feldkatalog geprüft (resourcetype
    // "fields", Juli 2026): objektnr_extern trägt die kundenseitig sichtbare Objektnummer
    // (nicht die interne numerische Id).
    objektnr_extern?: string;
    kaufpreis?: number | string;
    wohnflaeche?: number | string;
    grundstuecksflaeche?: number | string;
    anzahl_zimmer?: number | string;
    ort?: string;
    plz?: string;
    strasse?: string;
    objektart?: string;
    baujahr?: number | string;
    zustand?: string;
    energyClass?: string;
    objektbeschreibung?: string;
  };
}

export const ESTATE_FIELDS = [
  "Id",
  "objekttitel",
  "objektnr_extern",
  "kaufpreis",
  "wohnflaeche",
  "grundstuecksflaeche",
  "anzahl_zimmer",
  "ort",
  "plz",
  "strasse",
  "objektart",
  "baujahr",
  "zustand",
  "energyClass",
  "objektbeschreibung",
];

export function mapEstateRecord(record: RawEstateRecord): Immobilie {
  const el = record.elements;
  return {
    id: String(record.id),
    immoNr: el.objektnr_extern || undefined,
    bezeichnung: el.objekttitel || `Immobilie ${record.id}`,
    kaufpreis: Number(el.kaufpreis) || 0,
    wohnflaeche: el.wohnflaeche ? Number(el.wohnflaeche) : undefined,
    grundstuecksflaeche: el.grundstuecksflaeche ? Number(el.grundstuecksflaeche) : undefined,
    anzahlZimmer: el.anzahl_zimmer ? Number(el.anzahl_zimmer) : undefined,
    ort: el.ort,
    plz: el.plz,
    strasse: el.strasse,
    objektart: el.objektart,
    baujahr: el.baujahr ? Number(el.baujahr) : undefined,
    zustand: el.zustand,
    energieklasse: el.energyClass,
    objektbeschreibung: el.objektbeschreibung,
  };
}

export interface RawAddressRecord {
  id: string;
  elements: {
    Anrede?: string;
    Vorname?: string;
    Name?: string;
    Email?: string;
    Telefon1?: string;
  };
}

export const ADDRESS_FIELDS = ["Anrede", "Vorname", "Name", "Email", "Telefon1"];

export function mapAddressRecord(record: RawAddressRecord): Kunde {
  const el = record.elements;
  return {
    anrede: el.Anrede,
    vorname: el.Vorname || "",
    nachname: el.Name || "",
    email: el.Email,
    telefon: el.Telefon1,
  };
}

export interface RawBetreuerRecord {
  id: string;
  elements: {
    Anrede?: string;
    Vorname?: string;
    Name?: string;
    Zusatz1?: string;
    Strasse?: string;
    Plz?: string;
    Ort?: string;
    Email?: string;
    Telefon1?: string;
    jobPosition?: string;
    Homepage?: string;
  };
}

// Feldnamen gegen die echte OnOffice-Account-Konfiguration geprüft (Live-Recherche Juli 2026,
// customerId web77461, address-Modul): "Zusatz1" = Firma, "jobPosition" = Position im
// Unternehmen, "Homepage" = Website-URL (nicht "Firma"/"Position"/"Url", wie zuvor
// angenommen). Zwei frühere Annahmen haben sich als falsch herausgestellt und wurden entfernt:
// Es existiert in diesem Account WEDER ein eigenständiges "Mobil"-Feld noch ein "Bild"-Feld
// (Profilfoto) im address-Modul — beide Werte bleiben bei Live-Daten daher immer undefined
// (die UI zeigt in diesem Fall bewusst nur Telefon1 und einen Initialen-Avatar statt eines
// Fotos, siehe Kontaktperson.tsx). Zusätzlich ist "jobPosition" für jeden bisher geprüften
// Mitarbeiter-Datensatz leer (nicht gepflegt) — die Rolle kommt für die "weitere
// Mitarbeiter"-Liste stattdessen aus der Parma-Wissensdatei (siehe TEAM in
// data/unternehmen.ts, verknüpft in estate.ts/ladeAlleMitarbeiter).
export const BETREUER_FIELDS = [
  "Anrede",
  "Vorname",
  "Name",
  "Zusatz1",
  "Strasse",
  "Plz",
  "Ort",
  "Email",
  "Telefon1",
  "jobPosition",
  "Homepage",
];

export function mapBetreuerRecord(record: RawBetreuerRecord): Betreuer {
  const el = record.elements;
  return {
    // String()-Cast wichtig: Die onOffice-API liefert "id" bei resourcetype "address" als
    // rohe JSON-Zahl zurück (z.B. 123), nicht als String, obwohl RawBetreuerRecord.id als
    // string typisiert ist (TypeScript prüft das zur Laufzeit nicht). idsfromrelation
    // (siehe ladeBetreuerAddressId in estate.ts) liefert dieselbe Adress-ID dagegen als
    // echten String ("123"). Ohne diesen Cast verglich der Dubletten-Filter in
    // praesentation.ts (m.id !== betreuerAddressId) also number !== string — das ist mit
    // strikter Ungleichheit IMMER true, weshalb der Objekt-Betreuer trotz Filter zusätzlich
    // in der "weitere Mitarbeiter"-Liste auftauchte (Live-Recherche Juli 2026: address-read
    // für ID 119/123 lieferte { id: 119 } als number, idsfromrelation für dasselbe Objekt
    // { elements: { "43": ["119"] } } als string).
    id: String(record.id),
    anrede: el.Anrede,
    vorname: el.Vorname || "",
    nachname: el.Name || "",
    rolle: el.jobPosition || undefined,
    firma: el.Zusatz1 || undefined,
    strasse: el.Strasse || undefined,
    plz: el.Plz || undefined,
    ort: el.Ort || undefined,
    telefon: el.Telefon1 || undefined,
    email: el.Email,
    url: el.Homepage || undefined,
  };
}
