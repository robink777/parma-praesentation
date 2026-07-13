import { Betreuer, Immobilie, Interessent, Kunde, ObjektDokument } from "@/types";

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
    // Feingranularerer Objekttyp (Singleselect, ~130 mögliche Werte) — Live-Feldkatalog geprüft,
    // Juli 2026. Klartext-Zuordnung des rohen Schlüssels über OBJEKTTYP_LABELS unten.
    objekttyp?: string;
    // Getrennt von strasse — Live-Feldkatalog geprüft, Juli 2026.
    hausnummer?: string;
    baujahr?: number | string;
    zustand?: string;
    energyClass?: string;
    // Multiselect-Felder: Kommen als JSON-Array roher Schlüssel zurück (z.B. ["zentral"]),
    // NICHT als pipe-getrennter String wie ArtDaten im address-Modul (siehe RawAddressRecord/
    // RawInteressentRecord unten) — live gegen den Account geprüft, Juli 2026 (Estate 1763).
    heizungsart?: string[];
    befeuerung?: string[];
    objektbeschreibung?: string;
    // "Verkauft/Vermietet am" — gegen den echten Feldkatalog geprüft (resourcetype "fields",
    // Juli 2026). Wird nur für die manuelle Referenzobjekt-Suche im Vergleichswert-Reiter
    // benötigt (siehe Vergleichswert.tsx), der Einfachheit halber aber für alle Estate-Abrufe
    // mitgeladen statt eines separaten Feldsatzes nur für diesen einen Anwendungsfall.
    verkauft_am?: string;
    // "DeepImmo-Link" — Individualfeld unter "Technische Daten", vom Kunden im Juli 2026 selbst
    // in OnOffice angelegt (resourcetype "fields" geprüft: ind_3450_Feld_ObjTech540, Freitext).
    // Wird objektspezifisch manuell gepflegt und ist deshalb bei den meisten Objekten (Stand
    // Juli 2026) noch leer — siehe DeepImmo.tsx für den Leerzustand.
    ind_3450_Feld_ObjTech540?: string;
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
  "hausnummer",
  "objektart",
  "objekttyp",
  "baujahr",
  "zustand",
  "energyClass",
  "heizungsart",
  "befeuerung",
  "objektbeschreibung",
  "verkauft_am",
  "ind_3450_Feld_ObjTech540",
];

// Klartext-Zuordnung für das Singleselect-Feld "objekttyp" — vollständige Werteliste (~130
// Einträge) gegen den echten Feldkatalog geprüft (resourcetype "fields", Juli 2026). Nur eine
// Auswahl der für Wohnimmobilien (den bei Parma weit überwiegenden Regelfall) relevanten
// Schlüssel ist hier hinterlegt; unbekannte/nicht gelistete Schlüssel fallen in
// mapEstateRecord auf den rohen Wert zurück, statt zu einem leeren Feld zu führen.
export const OBJEKTTYP_LABELS: Record<string, string> = {
  hausbau_einfamilienhaus: "Einfamilienhaus",
  einfamilienhaus: "Einfamilienhaus",
  einfamilienhausMitEinliegerwohnung: "Einfamilienhaus mit Einliegerwohnung",
  hausbau_zweifamilienhaus: "Zweifamilienhaus",
  zweifamilienhaus: "Zweifamilienhaus",
  hausbau_mehrfamilienhaus: "Mehrfamilienhaus",
  mehrfamilienhaus: "Mehrfamilienhaus",
  hausbau_reihenhaus: "Reihenhaus",
  reihenhaus: "Reihenhaus",
  reihenend: "Reihenendhaus",
  reihenmittel: "Reihenmittelhaus",
  reiheneck: "Reiheneckhaus",
  doppelhaus: "Doppelhaus",
  doppelhaushaelfte: "Doppelhaushälfte",
  hausbau_bungalow: "Bungalow",
  bungalow: "Bungalow",
  hausbau_villa: "Villa",
  villa: "Villa",
  hausbau_landhaus: "Landhaus",
  landhaus: "Landhaus",
  stadthaus: "Stadthaus",
  bauernhaus: "Bauernhaus",
  resthof: "Resthof",
  schloss: "Schloss",
  ferienhaus: "Ferienhaus",
  holzhaus: "Holzhaus",
  blockhaus: "Blockhaus",
  fachwerkhaus: "Fachwerkhaus",
  eigentumswohnung: "Eigentumswohnung",
  dachgeschoss: "Dachgeschosswohnung",
  maisonette: "Maisonette-Wohnung",
  penthouse: "Penthouse-Wohnung",
  etage: "Etagenwohnung",
  erdgeschoss: "Erdgeschosswohnung",
  hochparterre: "Hochparterre-Wohnung",
  souterrain: "Souterrain-Wohnung",
  loft: "Loft",
  zimmer: "Zimmer",
  wohnanlage: "Wohnanlage",
  wohnanlagen: "Wohnanlagen",
  wohn_und_geschaeftshaus: "Wohn- und Geschäftshaus",
  gewerbe: "Gewerbe",
  gewerbeeinheit: "Gewerbeeinheit",
  buerogebaeude: "Bürogebäude",
  buerohaus: "Bürohaus",
  bueroflaeche: "Bürofläche",
  praxis: "Praxis",
  praxisflaeche: "Praxisfläche",
  ladenlokal: "Ladenlokal",
  einzelhandelsladen: "Einzelhandelsladen",
  grundstueck: "Grundstück",
  land_forstwirtschaft: "Land-/Forstwirtschaft",
  sonstige: "Sonstige",
  sonstige_landwirtschaftsimmobilien: "Sonstige Landwirtschaftliche Immobilie",
  besondereImmobilie: "Besondere Immobilie",
};

// Klartext-Zuordnung für das Multiselect-Feld "heizungsart" — vollständige Werteliste (~15
// Einträge) gegen den echten Feldkatalog geprüft (resourcetype "fields", Juli 2026).
export const HEIZUNGSART_LABELS: Record<string, string> = {
  keineAngabe: "keine Angabe",
  etage: "Etagenheizung",
  ofen: "Ofenheizung",
  zentral: "Zentralheizung",
  zentral_oel: "Zentralheizung (Öl)",
  fussboden: "Fußbodenheizung",
  fern: "Fernwärme",
  indMulti1950Select5874: "Elektroheizung",
  electricHeating: "Elektro-Heizung",
  nachtspeicherheizung: "Nachtspeicherheizung",
  block: "Blockheizkraftwerk",
  waermepumpe: "Wärmepumpe",
  gas: "Gasheizung",
  woodPelletHeating: "Holz-Pelletheizung",
  solarHeating: "Solar-Heizung",
};

// Klartext-Zuordnung für das Multiselect-Feld "befeuerung" — vollständige Werteliste (~9
// Einträge) gegen den echten Feldkatalog geprüft (resourcetype "fields", Juli 2026).
export const BEFEUERUNG_LABELS: Record<string, string> = {
  alternativ: "Alternativ",
  elektro: "Elektro",
  indMulti1950Select5872: "Elektroheizung",
  erdwaerme: "Erdwärme",
  gas: "Gas",
  luftwp: "Luft/Wasser-Wärmepumpe",
  oel: "Öl",
  pellet: "Pellet",
  solar: "Solar",
};

// Übersetzt eine Liste roher Multiselect-Schlüssel (heizungsart/befeuerung) in Klartext-Labels.
// Unbekannte Schlüssel (z.B. neue, noch nicht in obigen Tabellen erfasste OnOffice-Werte)
// fallen auf den rohen Schlüssel zurück, statt stillschweigend zu verschwinden.
function labelListe(werte: string[] | undefined, labels: Record<string, string>): string[] {
  return (werte || []).map((w) => labels[w] || w);
}

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
    hausnummer: el.hausnummer || undefined,
    objektart: el.objektart,
    objekttyp: el.objekttyp ? OBJEKTTYP_LABELS[el.objekttyp] || el.objekttyp : undefined,
    baujahr: el.baujahr ? Number(el.baujahr) : undefined,
    zustand: el.zustand,
    energieklasse: el.energyClass,
    heizungsart: el.heizungsart && el.heizungsart.length > 0 ? labelListe(el.heizungsart, HEIZUNGSART_LABELS) : undefined,
    befeuerung: el.befeuerung && el.befeuerung.length > 0 ? labelListe(el.befeuerung, BEFEUERUNG_LABELS) : undefined,
    objektbeschreibung: el.objektbeschreibung,
    verkauftAm: el.verkauft_am || undefined,
    deepImmoLink: el.ind_3450_Feld_ObjTech540 || undefined,
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
    // Ergänzt Juli 2026 (Logik-Check "mehrere Eigentümer"): Ohne diese drei Felder blieb
    // Kunde.strasse/plz/ort für Eigentümer/innen (im Unterschied zu Betreuer/innen, siehe
    // RawBetreuerRecord/BETREUER_FIELDS unten) immer leer, obwohl das Feld im Typ existiert —
    // dadurch startete die automatische Vorbefüllung im Maklervertrag (siehe Maklervertrag.tsx,
    // kundeZuPartei) für "weitere Auftraggeber" IMMER ohne Adresse, selbst wenn in onOffice eine
    // hinterlegt war. Feldnamen "Strasse"/"Plz"/"Ort" bewusst identisch zu RawBetreuerRecord
    // gewählt (dasselbe address-Modul, gleicher Feldkatalog).
    Strasse?: string;
    Plz?: string;
    Ort?: string;
  };
}

export const ADDRESS_FIELDS = ["Anrede", "Vorname", "Name", "Email", "Telefon1", "Strasse", "Plz", "Ort"];

export function mapAddressRecord(record: RawAddressRecord): Kunde {
  const el = record.elements;
  return {
    anrede: el.Anrede,
    vorname: el.Vorname || "",
    nachname: el.Name || "",
    email: el.Email,
    telefon: el.Telefon1,
    strasse: el.Strasse || undefined,
    plz: el.Plz || undefined,
    ort: el.Ort || undefined,
  };
}

// Klartext-Zuordnung für das Multiselect-Feld "ArtDaten" (Kontaktart) im address-Modul —
// vollständige Werteliste (~48 Einträge) gegen den echten Feldkatalog geprüft (resourcetype
// "fields", Juli 2026). Enthält sowohl sprechende Schlüssel (z.B. "Investor") als auch
// kryptische, automatisch generierte Tokens (z.B. "indMulti3148Select6534") — beide werden hier
// auf denselben menschenlesbaren Anzeigetext gemappt. Unbekannte, nicht gelistete Schlüssel
// fallen in mapInteressentRecord auf den rohen Schlüssel zurück.
export const KONTAKTART_LABELS: Record<string, string> = {
  Systembenutzer: "Systembenutzer",
  "Eigentümer": "Eigentümer",
  Interessent: "Interessent",
  Kooperationspartner: "Dienstleister / Handwerker",
  Makler: "Makler",
  Tippgeber: "Tippgeber",
  indMulti1952Select5876: "Akquisekunde",
  Mieter: "Mieter",
  benutzerWPWebsite: "Benutzer WP-Website",
  "Interessent Miete": "Interessent Miete Wohnen",
  "Interessent Kauf": "Interessent Kauf Wohnen",
  Investor: "Kapitalanleger",
  "Verkäufer": "Verkäufer Parma",
  "Käufer": "Käufer Parma",
  indMulti3148Select6536: "Interessent Miete Gewerbe",
  indMulti3148Select6534: "Interessent Kauf Gewerbe",
  Vermieter: "Vermieter Parma",
  indMulti3148Select6542: "Eigentümer ohne bekannte Verkaufsabsicht",
  indMulti3148Select6538: "Eigentümer in Akquise",
  indMulti3404Select6618: "Behörde",
  indMulti3404Select6616: "Banken",
  indMulti3404Select6614: "Consultants",
  indMulti2842Select6284: "Hausverwaltung",
  indMulti3404Select6612: "Marketing",
  indMulti3404Select6610: "IT",
  indMulti3404Select6608: "Insolvenzverwalter",
  indMulti3404Select6606: "Rechtsanwalt",
  Notar: "Notar",
  Steuerberater: "Steuerberater",
  Versicherer: "Versicherungen",
  Architekt: "Architekt",
  indMulti3404Select6642: "Bauzeichner",
  indMulti3404Select6640: "Dachdecker",
  indMulti3404Select6638: "Maler",
  indMulti3404Select6636: "Maurer / Zimmerer",
  indMulti3404Select6634: "Schornsteinfeger",
  indMulti3404Select6632: "Elektro",
  indMulti3404Select6630: "Heizung / Sanitär",
  indMulti3404Select6628: "Hausmeister",
  indMulti3404Select6626: "Garten & Landschaftsbau",
  indMulti3404Select6624: "Entrümpler / Umzug",
  "Bauträger": "Bauträger",
  indMulti1944Select5848: "Finanzierer",
  indMulti3340Select6602: "Vertragspartner",
  indMulti2800Select6278: "BottImmo",
  indMulti2976Select6358: "Veranstaltungsteilnehmer",
  indMulti3148Select6540: "Eigentümer laut IS24",
  indMulti3440Select6674: "Käufer Kapitalanleger",
};

export interface RawInteressentRecord {
  id: string;
  elements: {
    KdNr?: number | string;
    Ort?: string;
    // Nur intern für die Umkreis-Filterung in ladeAutomatischeInteressenten benötigt (siehe
    // estate.ts) — wird bewusst NICHT auf den Interessent-Typ/in die UI durchgereicht (Juli 2026:
    // Kunde wünscht ausschließlich Ort, keine vollständige Adresse fremder Interessenten).
    Plz?: string;
    // Multiselect im address-Modul: kommt als pipe-getrennter String roher Schlüssel zurück
    // (z.B. "|Interessent Kauf||Investor|"), NICHT als JSON-Array wie heizungsart/befeuerung
    // im estate-Modul — live gegen den Account geprüft, Juli 2026. null/"" bei leerem Feld.
    ArtDaten?: string | null;
  };
}

export const INTERESSENT_FIELDS = ["KdNr", "Ort", "Plz", "ArtDaten"];

// Parst das pipe-getrennte ArtDaten-Format ("|Wert1||Wert2|") in ein Array roher Schlüssel.
// null/leerer String (kein Kontaktart-Wert gepflegt) ergibt ein leeres Array.
function parseArtDaten(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split("|").map((s) => s.trim()).filter(Boolean);
}

// "uebereinstimmung" ist hier bewusst NICHT Teil der Adressdaten (kommt aus einem separaten
// Abruf, siehe resourcetype "qualifiedsuitors" in ladeAutomatischeInteressenten/estate.ts) —
// Platzhalter 0, wird vom Aufrufer direkt nach dem Mapping mit dem echten Prozentwert
// überschrieben.
export function mapInteressentRecord(record: RawInteressentRecord): Interessent {
  const el = record.elements;
  const kontaktart = parseArtDaten(el.ArtDaten).map((k) => KONTAKTART_LABELS[k] || k);
  return {
    id: String(record.id),
    uebereinstimmung: 0,
    kdNr: el.KdNr !== undefined && el.KdNr !== null && el.KdNr !== "" ? Number(el.KdNr) : undefined,
    ort: el.Ort || undefined,
    kontaktart: kontaktart.length > 0 ? kontaktart : undefined,
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
// angenommen). Es existiert in diesem Account KEIN eigenständiges "Mobil"-Feld im
// address-Modul — der Wert bleibt bei Live-Daten daher immer undefined. Zusätzlich ist
// "jobPosition" für jeden bisher geprüften Mitarbeiter-Datensatz leer (nicht gepflegt) — die
// Rolle kommt für die "weitere Mitarbeiter"-Liste stattdessen aus der Parma-Wissensdatei
// (siehe TEAM in data/unternehmen.ts, verknüpft in estate.ts/ladeAlleMitarbeiter).
//
// Profilfoto ("Bild"-Feld im address-Modul existiert weiterhin nicht — das war die richtige
// Erkenntnis einer früheren Recherche): Profilbilder kommen NICHT aus diesem Datensatz/Modul,
// sondern werden separat über den eigenständigen OnOffice-Resourcetype "userphoto" nachgeladen
// (Nutzer-Fotoverwaltung, nicht Adressdaten) und per E-Mail-Abgleich mit diesem
// Betreuer-Datensatz verknüpft — siehe ladeUserFotoByEmail in estate.ts für die vollständige
// Herleitung. Setzt voraus, dass der API-Nutzer das Recht "Benutzerdaten über API auslesen"
// hat (vom Kunden im Juli 2026 aktiviert; ohne dieses Recht lieferte der Zugriff auf "user"/
// "userphoto" durchgehend Errorcode 170 "No read permission for this user", live bestätigt).
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
