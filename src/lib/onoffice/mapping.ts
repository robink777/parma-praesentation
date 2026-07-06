import { Betreuer, Immobilie, Kunde, ObjektDokument } from "@/types";

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
    // "Verkauft/Vermietet am" — gegen den echten Feldkatalog geprüft (resourcetype "fields",
    // Juli 2026). Wird nur für die manuelle Referenzobjekt-Suche im Vergleichswert-Reiter
    // benötigt (siehe Vergleichswert.tsx), der Einfachheit halber aber für alle Estate-Abrufe
    // mitgeladen statt eines separaten Feldsatzes nur für diesen einen Anwendungsfall.
    verkauft_am?: string;
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
  "verkauft_am",
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
    verkauftAm: el.verkauft_am || undefined,
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

// Live gegen den echten Account geprüft (Juli 2026, customerId web77461, Objekt 43):
// resourcetype "file" liefert die Rohdaten NICHT wie estate/address unter "elements" mit
// eigenem Datenfeld-Katalog (kein "data"-Parameter nötig/möglich), sondern liefert direkt den
// vollen, festen Elemente-Satz je Datei zurück — u.a. "type" (Kategorie, z.B. "Foto",
// "Titelbild", oder frei vergebene Werte wie "Grundriss"/"Energieausweis"), "originalname"
// (ursprünglicher Dateiname beim Hochladen) und bei gesetztem Parameter "includeImageUrl" eine
// direkte, öffentliche Download-URL ("imageUrl").
//
// Wichtiger Sonderfall (Live-Recherche Juli 2026, Objekt 2415/"JH1180" — Immobilie mit echten
// Objekt-Dokumenten statt nur Fotos): "imageUrl" bleibt bei "category": "internal" IMMER null,
// selbst mit gesetztem includeImageUrl — nur "category": "external" (Fotos, Titelbild, Lageplan)
// liefert dort eine echte URL. "internal" ist laut apidoc.onoffice.de genau die Kategorie der
// "echten" Dokumente (type "Dokument": Mietverträge, Altlastenauskunft, Grundsteuermessbetrag,
// etc.) — also ausgerechnet die Dateien, um die es im "Dokumente"-Reiter hauptsächlich geht.
// Deren Inhalt muss stattdessen einzeln über den "fileid"-Parameter abgerufen werden (liefert
// dann ein zusätzliches "content"-Feld, Base64-codiert — siehe ladeDokumentInhalt in estate.ts).
// "content" ist optional, weil es nur bei Einzelabruf per fileid mitgeliefert wird, nicht bei
// der Listenabfrage aller Dateien eines Objekts.
export interface RawFileRecord {
  id: string;
  elements: {
    type?: string;
    name?: string;
    originalname?: string;
    filename?: string;
    fileSize?: number;
    title?: string;
    freetext?: string;
    modified?: number;
    category?: string;
    imageUrl?: string;
    content?: string;
  };
}

// estateId wird gebraucht, um für "internal"-Dateien (siehe Kommentar oben) auf unsere eigene
// Proxy-Route (/api/dokument) zu verweisen, statt eine (nicht existierende) direkte onOffice-URL
// zu verwenden — die Route ruft den Dateiinhalt serverseitig mit den API-Zugangsdaten ab.
export function mapFileRecord(record: RawFileRecord, estateId: string): ObjektDokument {
  const el = record.elements;
  const id = String(record.id);
  return {
    id,
    titel: el.title || el.originalname || el.name || "Dokument",
    dateiname: el.originalname || el.filename || undefined,
    typ: el.type || undefined,
    groesseBytes: el.fileSize,
    url: el.imageUrl || `/api/dokument?estateId=${encodeURIComponent(estateId)}&fileId=${id}`,
  };
}
