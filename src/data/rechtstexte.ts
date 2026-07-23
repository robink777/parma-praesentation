// Wörtliche Inhalte der Datenschutzerklärung, vom Nutzer als Referenz-PDF bereitgestellt
// (Downloads/Datenschutzerklaerung.pdf, Stand siehe § 14). Abschnitt 1 (Verantwortlicher) wird
// im MandatDokument als eigene Kontaktkarte gerendert (Wiederverwendung des Karten-Stils aus dem
// Maklervertrag) und ist daher hier bewusst nicht enthalten — diese Liste beginnt bei § 2.
export type RechtsBlock =
  | { art: "text"; text: string }
  | { art: "label"; text: string }
  | { art: "liste"; items: string[] };

export interface RechtsSektion {
  nummer: string;
  titel: string;
  bloecke: RechtsBlock[];
}

export const DATENSCHUTZ_SEKTIONEN: RechtsSektion[] = [
  {
    nummer: "2",
    titel: "Allgemeine Hinweise zur Datenverarbeitung",
    bloecke: [
      {
        art: "text",
        text: "Der Schutz Ihrer personenbezogenen Daten ist uns ein wichtiges Anliegen. Wir verarbeiten Ihre personenbezogenen Daten ausschließlich im Einklang mit den gesetzlichen Datenschutzvorschriften, insbesondere der Datenschutz-Grundverordnung (DSGVO) und dem Bundesdatenschutzgesetz (BDSG).",
      },
    ],
  },
  {
    nummer: "3",
    titel: "Arten der verarbeiteten Daten",
    bloecke: [
      { art: "text", text: "Wir verarbeiten insbesondere folgende Datenkategorien:" },
      {
        art: "liste",
        items: [
          "Stammdaten (Name, Anschrift)",
          "Kontaktdaten (Telefonnummer, E-Mail-Adresse)",
          "Vertragsdaten",
          "Objektbezogene Daten",
          "Kommunikationsdaten",
          "Finanzdaten (z. B. Angaben zur Finanzierung)",
          "Identitätsdaten (z. B. Ausweiskopien)",
          "Nutzungsdaten (Website, Tracking)",
        ],
      },
    ],
  },
  {
    nummer: "4",
    titel: "Zwecke und Rechtsgrundlagen der Verarbeitung",
    bloecke: [
      { art: "text", text: "Die Verarbeitung erfolgt auf Grundlage von:" },
      {
        art: "liste",
        items: [
          "Art. 6 Abs. 1 lit. b DSGVO (Vertrag und vorvertragliche Maßnahmen)",
          "Art. 6 Abs. 1 lit. c DSGVO (gesetzliche Verpflichtungen, z. B. Geldwäschegesetz, Aufbewahrungspflichten)",
          "Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse, z. B. effiziente Organisation, Kundenservice)",
          "Art. 6 Abs. 1 lit. a DSGVO (Einwilligung, z. B. Newsletter, Tracking)",
        ],
      },
    ],
  },
  {
    nummer: "5.1",
    titel: "Kontaktaufnahme (Telefon, E-Mail, persönlich, WhatsApp)",
    bloecke: [
      {
        art: "text",
        text: "Wenn Sie uns kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung Ihres Anliegens.",
      },
    ],
  },
  {
    nummer: "5.2",
    titel: "Kontaktformulare auf der Website",
    bloecke: [
      { art: "text", text: "Wir verarbeiten Daten aus Formularen für:" },
      { art: "liste", items: ["Exposé-Anfragen", "Suchprofile", "Immobilienbewertungen"] },
    ],
  },
  {
    nummer: "5.3",
    titel: "Maklertätigkeit",
    bloecke: [
      {
        art: "text",
        text: "Im Rahmen unserer Tätigkeit als Immobilienmakler verarbeiten wir personenbezogene Daten von Interessenten, Käufern, Verkäufern und Mietern. Dies umfasst insbesondere:",
      },
      {
        art: "liste",
        items: [
          "Kontaktdaten",
          "Objekt- und Vertragsdaten",
          "Finanzierungs- und Bonitätsdaten",
          "Identitätsnachweise (z. B. zur Erfüllung gesetzlicher Pflichten nach dem Geldwäschegesetz)",
        ],
      },
    ],
  },
  {
    nummer: "6.1",
    titel: "OnOffice (CRM-System)",
    bloecke: [
      { art: "text", text: "Wir nutzen OnOffice zur Verwaltung von Kunden-, Objekt- und Vertragsdaten." },
      { art: "label", text: "Zwecke:" },
      {
        art: "liste",
        items: [
          "Vertragserfüllung und Maklertätigkeit",
          "Vorvertragliches Anbahnungsverhältnis",
          "Kundenservice und Betreuung",
          "Nachweis- und Dokumentationspflichten",
        ],
      },
      { art: "label", text: "Rechtsgrundlagen:" },
      { art: "liste", items: ["Art. 6 Abs. 1 lit. b DSGVO", "Art. 6 Abs. 1 lit. c DSGVO", "Art. 6 Abs. 1 lit. f DSGVO"] },
      { art: "label", text: "Speichergrund und Aufbewahrung:" },
      {
        art: "liste",
        items: [
          "Vertragserfüllung",
          "Nachweispflichten (z. B. Geldwäschegesetz)",
          "gesetzliche Aufbewahrungsfristen (bis zu 10 Jahre)",
        ],
      },
      { art: "text", text: "Ein Vertrag zur Auftragsverarbeitung wurde abgeschlossen." },
    ],
  },
  {
    nummer: "6.2",
    titel: "Microsoft OneDrive",
    bloecke: [
      { art: "text", text: "Wir nutzen Microsoft OneDrive zur internen Speicherung von Dokumenten." },
      { art: "label", text: "Verarbeitete Daten:" },
      { art: "liste", items: ["Vertragsunterlagen", "Objektunterlagen", "Ausweiskopien"] },
      { art: "label", text: "Zwecke:" },
      {
        art: "liste",
        items: ["Dokumentenmanagement", "Zusammenarbeit im Unternehmen", "Einhaltung gesetzlicher Aufbewahrungspflichten"],
      },
      { art: "label", text: "Rechtsgrundlage:" },
      { art: "liste", items: ["Art. 6 Abs. 1 lit. c DSGVO", "Art. 6 Abs. 1 lit. f DSGVO"] },
      { art: "label", text: "Drittlandübertragung:" },
      {
        art: "text",
        text: "Eine Verarbeitung kann in den USA erfolgen. Microsoft ist nach dem EU-U.S. Data Privacy Framework zertifiziert.",
      },
      { art: "label", text: "Sicherheitsmaßnahmen:" },
      { art: "liste", items: ["Zugriffsbeschränkungen", "Verschlüsselung", "rollenbasierte Berechtigungen"] },
    ],
  },
  {
    nummer: "6.3",
    titel: "WhatsApp Business",
    bloecke: [
      { art: "text", text: "Wir nutzen WhatsApp Business zur Kommunikation." },
      { art: "label", text: "Hinweis:" },
      {
        art: "text",
        text: "Bei Nutzung werden Daten an Meta Platforms übermittelt. Eine Verarbeitung in Drittländern (z. B. USA) kann nicht ausgeschlossen werden.",
      },
      { art: "label", text: "Rechtsgrundlage:" },
      { art: "text", text: "Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch Nutzung)" },
      { art: "text", text: "Wir empfehlen, keine sensiblen Daten über WhatsApp zu übermitteln." },
    ],
  },
  {
    nummer: "6.4",
    titel: "Superchat",
    bloecke: [
      { art: "text", text: "Zur zentralen Verwaltung unserer Kundenkommunikation nutzen wir Superchat." },
      { art: "label", text: "Verarbeitete Daten:" },
      { art: "liste", items: ["Nachrichteninhalte", "Kontaktdaten"] },
      { art: "label", text: "Rechtsgrundlage:" },
      { art: "text", text: "Art. 6 Abs. 1 lit. b DSGVO" },
      { art: "text", text: "Ein Vertrag zur Auftragsverarbeitung wurde abgeschlossen." },
    ],
  },
  {
    nummer: "6.5",
    titel: "Meta Pixel",
    bloecke: [
      { art: "text", text: "Wir nutzen auf unserer Website den Meta Pixel." },
      { art: "label", text: "Verarbeitete Daten:" },
      { art: "liste", items: ["IP-Adresse", "Nutzungsverhalten", "besuchte Seiten"] },
      { art: "label", text: "Zweck:" },
      { art: "text", text: "Marketing und Conversion-Tracking" },
      { art: "label", text: "Rechtsgrundlage:" },
      { art: "text", text: "Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)" },
      { art: "text", text: "Die Nutzung erfolgt nur nach Zustimmung über unser Cookie-Banner." },
    ],
  },
  {
    nummer: "6.6",
    titel: "Newsletter (zukünftig)",
    bloecke: [
      { art: "text", text: "Bei Anmeldung zu unserem Newsletter verarbeiten wir:" },
      { art: "liste", items: ["E-Mail-Adresse", "ggf. Name"] },
      { art: "label", text: "Verfahren:" },
      { art: "text", text: "Double-Opt-in" },
      { art: "label", text: "Rechtsgrundlage:" },
      { art: "text", text: "Art. 6 Abs. 1 lit. a DSGVO" },
      { art: "text", text: "Sie können den Newsletter jederzeit abbestellen." },
    ],
  },
  {
    nummer: "7.1",
    titel: "Allgemeine Weitergabe",
    bloecke: [
      { art: "text", text: "Eine Weitergabe Ihrer personenbezogenen Daten erfolgt nur, wenn:" },
      {
        art: "liste",
        items: ["dies zur Vertragserfüllung erforderlich ist", "wir gesetzlich dazu verpflichtet sind", "Sie eingewilligt haben"],
      },
      { art: "text", text: "Empfänger können insbesondere sein:" },
      { art: "liste", items: ["Notare", "Banken", "Eigentümer / Interessenten"] },
    ],
  },
  {
    nummer: "7.2",
    titel: "Weitergabe an verbundene Unternehmen und Finanzierungspartner",
    bloecke: [
      {
        art: "text",
        text: "Im Rahmen unserer Tätigkeit arbeiten wir mit der Parma Finanz GmbH, Monschauer Straße 64, 52355 Düren, zusammen. Eine Weitergabe personenbezogener Daten erfolgt, sofern dies erforderlich ist für:",
      },
      {
        art: "liste",
        items: [
          "Prüfung der Finanzierbarkeit einer Immobilie",
          "Unterstützung bei der Immobilienfinanzierung",
          "Vermittlung oder Durchführung von Finanzierungen",
        ],
      },
      { art: "text", text: "Darüber hinaus kann eine Weitergabe an weitere Finanzierungspartner erfolgen, insbesondere:" },
      { art: "liste", items: ["Banken", "Kreditinstitute", "Finanzdienstleister"] },
      { art: "label", text: "Verarbeitete Daten:" },
      { art: "liste", items: ["Kontaktdaten", "Finanzielle Angaben", "Objektbezogene Daten", "Unterlagen zur Finanzierung"] },
      { art: "label", text: "Rechtsgrundlagen:" },
      { art: "liste", items: ["Art. 6 Abs. 1 lit. b DSGVO", "Art. 6 Abs. 1 lit. a DSGVO", "Art. 6 Abs. 1 lit. f DSGVO"] },
      { art: "text", text: "Die empfangenden Stellen verarbeiten die Daten eigenverantwortlich." },
    ],
  },
  {
    nummer: "8",
    titel: "Server-Logfiles (Hosting)",
    bloecke: [
      { art: "text", text: "Beim Besuch unserer Website werden automatisch Informationen erfasst:" },
      { art: "liste", items: ["IP-Adresse", "Browsertyp", "Betriebssystem", "Uhrzeit der Anfrage"] },
      {
        art: "text",
        text: "Diese Daten dienen der Sicherstellung eines störungsfreien Betriebs. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO",
      },
    ],
  },
  {
    nummer: "9",
    titel: "Speicherdauer",
    bloecke: [
      { art: "text", text: "Personenbezogene Daten werden gespeichert:" },
      {
        art: "liste",
        items: ["für die Dauer der Geschäftsbeziehung", "entsprechend gesetzlicher Aufbewahrungsfristen (bis zu 10 Jahre)"],
      },
    ],
  },
  {
    nummer: "10",
    titel: "Ihre Rechte",
    bloecke: [
      { art: "text", text: "Sie haben das Recht auf:" },
      {
        art: "liste",
        items: [
          "Auskunft (Art. 15 DSGVO)",
          "Berichtigung (Art. 16 DSGVO)",
          "Löschung (Art. 17 DSGVO)",
          "Einschränkung (Art. 18 DSGVO)",
          "Datenübertragbarkeit (Art. 20 DSGVO)",
          "Widerspruch (Art. 21 DSGVO)",
        ],
      },
    ],
  },
  {
    nummer: "11",
    titel: "Beschwerderecht",
    bloecke: [
      { art: "text", text: "Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren. Zuständig ist:" },
      { art: "text", text: "Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen" },
    ],
  },
  {
    nummer: "12",
    titel: "Datensicherheit",
    bloecke: [
      { art: "text", text: "Wir setzen geeignete technische und organisatorische Maßnahmen ein:" },
      { art: "liste", items: ["Verschlüsselung", "Zugriffskontrollen", "Datensicherungen"] },
    ],
  },
  {
    nummer: "13",
    titel: "Cookies und Einwilligungsmanagement",
    bloecke: [
      {
        art: "text",
        text: "Unsere Website verwendet Cookies und Tracking-Technologien. Nicht notwendige Cookies werden nur nach Ihrer Einwilligung gesetzt.",
      },
    ],
  },
  {
    nummer: "14",
    titel: "Aktualität und Änderung",
    bloecke: [
      { art: "text", text: "Diese Datenschutzerklärung wird regelmäßig überprüft und bei Bedarf angepasst." },
    ],
  },
];
