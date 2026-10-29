import { Kennzahl, Standort, TeamMitglied } from "@/types";

// Quelle: Parma-Wissensdatei (parma_wissensbasis.md, Stand Mai 2026, Interview mit Robin Kolbe).
// Düren ist der Hauptstandort (auf Nutzerwunsch Juli 2026 groß hervorgehoben, siehe
// Unternehmen.tsx) — Fotos liegen lokal unter public/standorte/ (vom Nutzer bereitgestellt).
// Jeder Standort zeigt auf ausdrücklichen Nutzerwunsch genau EIN Foto (kein Galerie-Raster mehr).
//
// Kreuzau hat seit August 2026 ein eigenes Standort-Foto (kreuzau-1.jpg, vom Nutzer bereitgestellt
// — Empfangs-/Loungebereich mit "Parma Immobilien"-Neonschrift an der Pflanzenwand), ersetzt den
// vorherigen Düren-Platzhalter. Jülich hat weiterhin KEIN eigenes Foto — bis eines vorliegt, zeigt
// es laut ausdrücklicher Nutzeranweisung übergangsweise eines der Düren-Fotos als Platzhalter.
export const STANDORTE: Standort[] = [
  {
    name: "Düren",
    adresse: "Monschauer Straße 64, 52355 Düren",
    hauptstandort: true,
    bilder: ["/standorte/dueren-1.jpg"],
  },
  { name: "Kreuzau", adresse: "Hauptstraße 80, 52372 Kreuzau", bilder: ["/standorte/kreuzau-1.jpg"] },
  { name: "Jülich", adresse: "Gereonstraße 1, 52428 Jülich", bilder: ["/standorte/dueren-3.jpg"] },
];

// "Team" bewusst NICHT hier als eigene feste Zahl (siehe Unternehmen.tsx, wo sie stattdessen aus
// TEAM.length abgeleitet wird) — genau ein solcher separat gepflegter Zähler war es, der zuletzt
// veraltete (Chat-Vorgabe September 2026: "Schau dir bitte nochmal die Benutzer in OnOffice an.
// Auch diese werden nicht mehr aktualisiert"), weil beim Ergänzen neuer Team-Mitglieder leicht
// vergessen wird, ihn manuell mit hochzuzählen.
export const KENNZAHLEN: Kennzahl[] = [
  { label: "Jahre Erfahrung", wert: "6" },
  { label: "Standorte", wert: "3" },
];

// Google-Bewertung: bewusst NICHT Teil der KENNZAHLEN-Karten-Grid, sondern eigener Abschnitt mit
// eigenem Untertitel zwischen den Unternehmenskennzahlen und "Standorte" (siehe Unternehmen.tsx)
// — Sterne-Bewertung und Rezensionsanzahl gehören inhaltlich zusammen und werden dort wieder
// gemeinsam dargestellt.
export const GOOGLE_BEWERTUNG = { sterne: 5.0, anzahlRezensionen: 241 };

// "Portalanfragen Gesamt" aus dem OnOffice-Statistikreiter — anders als "Verkaufte Objekte" und
// "Kunden" NICHT live aus der API abrufbar: resourcetype "statistic" liefert für diesen Account
// durchgehend den Fehler "missing configuration for resourceType" (zuletzt live geprüft September
// 2026, auch nach Freigabe zusätzlicher API-Rechte durch den Nutzer weiterhin derselbe Fehler) —
// das Statistik-Modul ist dort nicht per API freigeschaltet, nur im OnOffice-Backend selbst
// einsehbar. Wert daher manuell gepflegt, bei Bedarf im OnOffice-Backend unter dem
// Statistikreiter nachschlagen und hier aktualisieren. Stand laut Nutzerangabe: September 2026.
export const PORTALANFRAGEN_JAHR = 23952;

// Team-Roster, Stand September 2026: erneut live gegen den OnOffice-Account abgeglichen
// (resourcetype "user", alle ~30 Benutzer-Datensätze durchsucht). Christian Rother (Nr. 77,
// aktiv seit 29.05.2026) und Leon Otten (Nr. 95, aktiv seit 29.07.2026) waren dabei aktive
// Benutzer, die noch nicht in dieser Liste standen — auf Nutzerangabe ergänzt (Christian Rother:
// Kaufmännischer Leiter, Leon Otten: Immobilienmakler). Santino Giese (private E-Mail-Domain,
// kein @parmaimmobilien.com) und Stefanie Scalone (@parmafinanz.de, andere Marke) bewusst NICHT
// aufgenommen. Tabea Erz/Nilgün Akbay/Celin Borgwaldt bleiben draußen (in OnOffice deaktiviert).
//
// Frühere Historie: Celin Borgwaldt wurde zum 30.06.2026 als deaktiviert festgestellt und auf
// Nutzerwunsch entfernt. Dawid Parma wurde ergänzt: aktiver Benutzer in OnOffice
// (da.parma@parmaimmobilien.com, Adress-ID 44851), der zuvor nicht in dieser Liste stand. Für ihn
// ist wie für alle anderen kein "jobPosition"-Feld in OnOffice gepflegt (das Feld ist dort für
// jeden bisher geprüften Mitarbeiter leer) — Rolle daher auf Nutzerangabe "Immobilienmakler"
// gesetzt, kein Profilfoto in OnOffice hinterlegt (erscheint vorerst mit Initialen-Avatar, siehe
// Unternehmen.tsx).
//
// adressId/nutzerNr/benutzername (Juli 2026 hierher konsolidiert, siehe TeamMitglied in
// types/index.ts für die Herleitung/den Grund): drei unterschiedliche OnOffice-ID-Räume für
// dieselbe Person — adressId fürs address-Modul (Kontaktdaten), nutzerNr fürs user-Modul
// (Objekt-Betreuer-Zuordnung, Statistik), benutzername der dort zusätzlich verwendete
// Kurz-Login-Name. Celin Borgwaldt/Christian Rother/Tabea Erz/Nilgün Akbay/Santino Giese haben
// bewusst KEINEN adressId-Eintrag (siehe Datenschutz-/Status-Hinweis, der früher bei
// MITARBEITER_LIVE_ADRESS_IDS in onoffice/estate.ts stand): mehrere Personen haben in OnOffice
// zusätzlich einen privaten Adressdatensatz (Wohnanschrift/private Kontaktdaten) — hier ist
// ausschließlich die geschäftliche Adress-ID hinterlegt, damit niemals private Daten auf der
// öffentlichen Präsentationsseite erscheinen. Für Christian Rother (September 2026 live geprüft)
// ist unter seiner geschäftlichen E-Mail nur ein privater Adressdatensatz (Wohnanschrift in
// Vettweiß/Kelz) hinterlegt — er bekommt daher bewusst nutzerNr/benutzername (für
// Betreuer-/Statistik-Zuordnung, unkritisch), aber KEINE adressId. Tim Hartwich/Dawid Parma haben
// kein Profilfoto in OnOffice hinterlegt (erscheinen mit Initialen-Avatar).
export const TEAM: TeamMitglied[] = [
  {
    name: "Daniel Parma",
    rolle: "Gründer, Geschäftsführer, DEKRA-zert. Immobilienmakler, IHK-Immobilienbewerter",
    adressId: "119",
    nutzerNr: "21",
    benutzername: "Daniel",
  },
  {
    name: "Robin Kolbe",
    rolle: "Stellv. Geschäftsleitung, IHK-Immobilienbewerter, Marketing, Digitalisierung",
    adressId: "123",
    nutzerNr: "23",
    benutzername: "Robin",
  },
  {
    name: "Jacqueline Henot",
    rolle: "Bürokauffrau, Immobilienmaklerin (EIA)",
    adressId: "20483",
    nutzerNr: "39",
    benutzername: "Jacqueline",
  },
  {
    name: "Kira Woldt",
    rolle: "Kauffrau Büromanagement (IHK), Immobilienmaklerin (IHK), Wohnflächenberechnung, Visualisierung",
    adressId: "125",
    nutzerNr: "25",
    benutzername: "Kira",
  },
  {
    name: "Vanessa Krifft",
    rolle: "Kauffrau Büromanagement (IHK), Immobilienmaklerin",
    adressId: "20105",
    nutzerNr: "37",
    benutzername: "Vanessa",
  },
  {
    name: "Sarah Barth",
    rolle: "Bankkauffrau (IHK), Office Managerin",
    adressId: "31077",
    nutzerNr: "59",
    benutzername: "Sarah",
  },
  {
    name: "Stanimira Georgieva",
    rolle: "Juniormaklerin",
    adressId: "32669",
    nutzerNr: "63",
    benutzername: "Stanimira",
  },
  {
    name: "Katharina Becker",
    rolle: "Back Office, Social Media",
    adressId: "6181",
    nutzerNr: "35",
    benutzername: "Katharina",
  },
  {
    name: "Axel Wehmeier",
    rolle: "Immobilienmakler, Bankkaufmann, zert. Bauspar- und Finanzierungsfachmann",
    adressId: "28831",
    nutzerNr: "55",
    benutzername: "Axel",
  },
  {
    name: "Tim Hartwich",
    rolle: "Auszubildender zum Immobilienkaufmann (IHK)",
    adressId: "31313",
    nutzerNr: "41",
    benutzername: "Tim",
  },
  {
    name: "Dawid Parma",
    rolle: "Immobilienmakler",
    adressId: "44851",
    nutzerNr: "79",
    benutzername: "Dawid",
  },
  {
    name: "Christian Rother",
    rolle: "Kaufmännischer Leiter",
    nutzerNr: "77",
    benutzername: "Christian",
  },
  {
    name: "Leon Otten",
    rolle: "Immobilienmakler",
    adressId: "46243",
    nutzerNr: "95",
    benutzername: "Leon",
  },
  // Oktober 2026 Chat-Vorgabe: "bitte Steffi Scaloe als Mitarbeiterin mit aufnehmen! Sie ist für
  // die Parma Finanz zuständig" — live in OnOffice gesucht (search_users), echter Name ist
  // "Stefanie Scalone" (E-Mail s.scalone@parmafinanz.de bestätigt Parma Finanz), nicht "Steffi
  // Scaloe". adressId noch nicht geprüft (kein öffentliches Profil auf der Präsentationsseite
  // nötig, siehe FINANZ_NAMEN unten) — nutzerNr/benutzername genügen für die TV-Rangliste.
  {
    name: "Stefanie Scalone",
    rolle: "Finanzierungsberaterin, Parma Finanz",
    nutzerNr: "97",
    benutzername: "Stefanie",
  },
];

// Reiter-Zuordnung der Mitarbeiterstatistik im Admin-Bereich (siehe Mitarbeiterstatistik.tsx,
// onoffice/mitarbeiterstatistik.ts) — August 2026 Chat-Vorgabe: "ich brauche bei Mitarbeiter
// neben Vertrieb noch zwei weitere Reiter mit unterschiedlichen Angaben. Akquise (Daniel, Robin,
// Axel) und Setting (Sarah, Kathi)". Bewusst hier (statt lokal in der jeweiligen Komponente/dem
// jeweiligen Lader) definiert: sowohl die UI (welche Tabelle zeigt wen) als auch der
// OnOffice-Lader (wer bekommt die zusätzlichen Akquise-Kennzahlen berechnet, siehe
// ladeMitarbeiterKennzahlen) müssen dieselbe Zuordnung verwenden. Axel Wehmeier bewusst in BEIDEN
// Listen (Vertrieb UND Akquise) — laut Chat-Vorgabe nicht aus Vertrieb entfernt, sondern
// zusätzlich für Akquise vorgesehen. Alle TEAM-Mitglieder, die in keiner der drei Listen stehen,
// landen weiterhin in "Weitere Mitarbeiter" (siehe teileTeamAuf in Mitarbeiterstatistik.tsx).
// Oktober 2026 Chat-Vorgabe: "leon ist im vertrieb und jacy ist in der akquise, die bitte noch
// tauschen" — Jacqueline Henot wechselt komplett von Vertrieb zu Akquise (auf Nutzerwunsch NICHT
// wie Axel in beiden Listen, siehe unten), Leon Otten rückt dafür von "Weitere Mitarbeiter" in
// Vertrieb auf.
export const VERTRIEB_NAMEN = [
  "Vanessa Krifft",
  "Kira Woldt",
  "Dawid Parma",
  "Axel Wehmeier",
  "Stanimira Georgieva",
  "Leon Otten",
];

export const AKQUISE_NAMEN = ["Daniel Parma", "Robin Kolbe", "Axel Wehmeier", "Jacqueline Henot"];

// "Kathi" = Katharina Becker (siehe TEAM oben).
export const SETTING_NAMEN = ["Sarah Barth", "Katharina Becker"];

// Parma Finanz (siehe TEAM oben, Stefanie Scalone) — eigene, vierte Gruppe statt Teil von
// Vertrieb/Akquise/Setting: andere Kennzahlen (Finanzierungstermine statt Besichtigungen/
// Akquise-Termine), Oktober 2026 Chat-Vorgabe: "Hier will ich auch Punkte vergeben um zu sehen
// wie viel sie telefoniert".
export const FINANZ_NAMEN = ["Stefanie Scalone"];

// Teilnehmerkreis des Büro-Wettkampfs (TV-Folie, siehe onoffice/wettkampf.ts) — ABSICHTLICH eine
// eigene, von VERTRIEB_NAMEN/AKQUISE_NAMEN/FINANZ_NAMEN entkoppelte Liste statt deren Vereinigung
// (ursprünglich so gebaut): Oktober 2026 Chat-Vorgabe "nimm bitte Daniel und mich aus der Wertung
// raus und nimm Sarah und Kathi mit rein" — Daniel Parma und Robin Kolbe bleiben für die
// Admin-Statistik weiterhin ganz normal im Akquise-Reiter (siehe AKQUISE_NAMEN), nehmen aber
// nicht mehr am Wettkampf teil; Sarah Barth und Katharina Becker (Setting-Team, siehe
// SETTING_NAMEN) kommen NEU dazu. Für Sarah/Kathi greifen in berechnePunkte() automatisch nur die
// Kategorien Telefonate/Besichtigungen (nicht an istAkquise/istFinanz geknüpft) — passend zu
// ihrer tatsächlichen Tätigkeit als Terminsetzer.
export const WETTKAMPF_NAMEN = [
  "Vanessa Krifft",
  "Kira Woldt",
  "Dawid Parma",
  "Axel Wehmeier",
  "Stanimira Georgieva",
  "Leon Otten",
  "Jacqueline Henot",
  "Stefanie Scalone",
  "Sarah Barth",
  "Katharina Becker",
];
