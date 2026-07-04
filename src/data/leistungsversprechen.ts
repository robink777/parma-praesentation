import { Kennzahl, Leistungskategorie, Leistungspaket, Rahmenbedingung } from "@/types";

export const LEISTUNGSPAKETE: Leistungspaket[] = [
  {
    id: "basis",
    name: "Basis",
    provisionProzent: 2.5,
    beschreibung: "Die fundierte Grundlage.",
    highlights: [
      "Sprengnetter-Wertgutachten",
      "Prüfung & Digitalisierung der Unterlagen",
      "Vermarktung in Großportalen",
      "2-Wochen-Bericht entfällt",
    ],
  },
  {
    id: "komfort",
    name: "Komfort",
    provisionProzent: 3.0,
    empfohlen: true,
    beschreibung: "Die runde Rundum-Betreuung.",
    highlights: [
      "Energieausweis durch Energieberater",
      "Fotos, 360°-Tour & Grundrisse",
      "Premiumplatzierung ImmobilienScout & Immowelt",
      "Übernahme der Immobilienübergabe",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    provisionProzent: 3.5,
    beschreibung: "Die maximale Reichweite.",
    highlights: [
      "Drohnenaufnahmen, Coming-Soon-Video & Social-Ads",
      "IMAG international & Schaufenster-TV",
      "Übernahme Wohnflächenberechnung & Grundrisskosten",
      "Individuelle Marketingmaßnahmen",
    ],
  },
];

export const LEISTUNGS_KENNZAHLEN: Kennzahl[] = [
  { label: "Leistungspositionen", wert: "48" },
  { label: "Erfolgshonorar", wert: "Nur bei Verkauf" },
  { label: "Vertragslaufzeit", wert: "3 Monate" },
];

export const LEISTUNGSKATEGORIEN: Leistungskategorie[] = [
  {
    nummer: "02",
    titel: "Bewertung & Beratung",
    positionen: [
      { bezeichnung: "Objektaufnahme durch IHK-zertifizierten Bewerter", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Sprengnetter Sachwert-, Vergleichswert- & Ertragswertermittlung", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Nachbesprechung & Standortanalyse", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Beratung zur individuellen Immobiliensituation", basis: "ja", komfort: "ja", premium: "ja" },
    ],
  },
  {
    nummer: "03",
    titel: "Unternehmensvorteile",
    positionen: [
      { bezeichnung: "Klar definierter Maklerauftrag (3 Monate, automatische Verlängerung)", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Gut ausgebildetes Vertriebsteam", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Vermögensschaden- & Unternehmenshaftpflichtversicherung", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "IVD-Mitgliedschaft", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "BvFI-Regionaldirektion", basis: "ja", komfort: "ja", premium: "ja" },
    ],
  },
  {
    nummer: "04",
    titel: "Aufarbeitung & Unterlagen",
    positionen: [
      { bezeichnung: "Prüfung der Immobilienunterlagen", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Besorgung fehlender Unterlagen", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "Übernahme Erstellungskosten Ingenieurbüro/Wohnflächenberechnung", basis: "nein", komfort: "nein", premium: "ja" },
      { bezeichnung: "Energieausweis durch Energieberater", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "Digitalisierung der Unterlagen", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Professionelle Visualisierung: Fotos, 360°-Tour & Grundrisse", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "Drohnenaufnahmen, wenn möglich", basis: "nein", komfort: "optional", premium: "ja" },
      { bezeichnung: "PDF-Exposé", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Web-Exposé", basis: "nein", komfort: "ja", premium: "ja" },
    ],
  },
  {
    nummer: "05",
    titel: "Offmarket & Suchkunden",
    positionen: [
      { bezeichnung: "Vermarktungsbeschilderung", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "Nachbarschaftsbriefe", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "Täglicher Call-Prozess", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Digitalisierte Suchkundendatenbank", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Alternativangebot", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Weiterleitung an Kooperationspartner", basis: "ja", komfort: "ja", premium: "ja" },
    ],
  },
  {
    nummer: "06",
    titel: "Marketing & Reichweite",
    positionen: [
      { bezeichnung: "Ankündigung durch Visualisierungspost", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Coming-Soon-Video", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "Social-Media-Vermarktung mit gezielten Ads", basis: "nein", komfort: "nein", premium: "ja" },
      { bezeichnung: "Platzierung in allen Portalen", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Premiumplatzierung ImmobilienScout", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "Premiumplatzierung Immowelt", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "IMAG-Mitgliedschaft (international)", basis: "nein", komfort: "nein", premium: "ja" },
      { bezeichnung: "Schaufenster & Schaufenster-TV", basis: "nein", komfort: "ja", premium: "ja" },
    ],
  },
  {
    nummer: "07",
    titel: "Interessenten & Besichtigung",
    positionen: [
      { bezeichnung: "Prüfung der Finanzierbarkeit", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Planung & Übernahme der Besichtigungstermine", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Feedbackabfrage nach Besichtigung", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "Vermarktungsprozess mit 2-Wochen-Bericht", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "Wöchentliche Teammeetings", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Kommunikationswege: WhatsApp, SMS, E-Mail, Telefon", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "WhatsApp-Gruppe mit Ansprechpartnern", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "Kunden-Login auf der Internetseite", basis: "nein", komfort: "ja", premium: "ja" },
    ],
  },
  {
    nummer: "08",
    titel: "Kaufvertrag & Übergabe",
    positionen: [
      { bezeichnung: "Beauftragung eines rechtssicheren Kaufvertragsentwurfs", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Planung des Beurkundungstermins", basis: "ja", komfort: "ja", premium: "ja" },
      { bezeichnung: "Vertretung als vollmachtloser Vertreter", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "Überwachung des Zahlungsprozesses", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "Übernahme der Immobilienübergabe mit Fotoprotokoll", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "Ummeldung Grundsteuer", basis: "nein", komfort: "ja", premium: "ja" },
      { bezeichnung: "Provisionszahlung erst nach Eingang des Kaufpreises", basis: "nein", komfort: "nein", premium: "ja" },
      { bezeichnung: "Individuelle Maßnahmen nach Verfügbarkeit", basis: "nein", komfort: "nein", premium: "ja" },
    ],
  },
];

export const RAHMENBEDINGUNGEN: Rahmenbedingung[] = [
  {
    nummer: "09.01",
    titel: "Vergütung · Erfolgshonorar",
    text: "Sie zahlen nur bei erfolgreichem notariellem Verkauf — keine Vorab- oder Pauschalkosten.",
  },
  {
    nummer: "09.02",
    titel: "Vertrag · Drei Monate Laufzeit",
    text: "Der Vertrag läuft drei Monate, verlängert sich automatisch und ist monatlich kündbar.",
  },
  {
    nummer: "09.03",
    titel: "Käuferseite · Symmetrische Provision",
    text: "Die Käuferseite zahlt die gleiche Provision wie die Verkäuferseite (2,5/3,0/3,5 % zzgl. 19 % MwSt.) — Bestellerprinzip-konform.",
  },
  {
    nummer: "09.04",
    titel: "Diskretion · Offmarket auf Wunsch",
    text: "Eine diskrete Offmarket-Vermarktung ist in allen drei Paketen möglich.",
  },
  {
    nummer: "09.05",
    titel: "Wechsel · Upgrade während des Auftrags",
    text: "Ein Paket-Upgrade ist jederzeit während der Vertragslaufzeit möglich, nicht rückwirkend.",
  },
  {
    nummer: "09.06",
    titel: "Sonstiges · Individuelle Vereinbarungen",
    text: "Abweichungen und Sonderleistungen werden individuell im Vertrag dokumentiert.",
  },
];
