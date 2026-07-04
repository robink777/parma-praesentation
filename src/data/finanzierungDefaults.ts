// Standardwerte für den Finanzierungsrechner — bewusst konservativ gewählt und pro Termin
// im Rechner frei anpassbar. Keine Live-Zinsdaten (kein Datenanbieter angebunden); vor dem
// Termin ggf. gegen aktuelle Konditionen von Parma Finanz prüfen.
export const STANDARD_ZINSSATZ = 3.6; // % p.a., 10 Jahre Zinsbindung
export const STANDARD_TILGUNG = 2.0; // % p.a.
export const STANDARD_EIGENKAPITAL_QUOTE = 0.2; // 20 % des Kaufpreises
export const MAX_RATE_ANTEIL_NETTO = 0.35; // maximale monatliche Rate = 35 % des Netto-HH-Einkommens
export const STANDARD_LAUFZEIT_JAHRE = 25;
export const STANDARD_MAKLER_PROZENT = 3.57; // marktüblich, inkl. USt.
