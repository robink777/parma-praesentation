import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";
import {
  Bewertung,
  Immobilie,
  Kunde,
  LeistungspaketId,
  MaklervertragDaten,
} from "@/types";
import {
  LEISTUNGSKATEGORIEN,
  LEISTUNGSPAKETE,
  LEISTUNGS_KENNZAHLEN,
  RAHMENBEDINGUNGEN,
} from "@/data/leistungsversprechen";
import { MAKLER_KONTAKT } from "@/data/makler";
import { DATENSCHUTZ_SEKTIONEN, RechtsSektion } from "@/data/rechtstexte";

// Farbwerte 1:1 aus der Parma-CI-Referenz (Abschnitt 3 · Farbsystem) — siehe parma-design-Skill.
// Walnuss ausschließlich für Text/Linien, Messing sparsam als Einzelakzent pro Seite,
// Stein/Reinweiß tragen die Flächen.
const FARBE = {
  walnuss: "#503F3D",
  messing: "#CB8E49",
  stein: "#F2F1ED",
  reinweiss: "#FCFCFB",
  anthrazit: "#2A2624",
  asche: "#A9A29A",
  sand: "#E1D6C1",
};

// Reihenfolge der vier Dokumentteile im PDF (Chat-Vorgabe): Maklervertrag, Widerruf,
// Leistungsversprechen, Datenschutz. Wird auf dem Deckblatt als Inhaltsübersicht angezeigt.
const DOKUMENTTEILE = [
  { titel: "Maklervertrag", anlage: undefined },
  { titel: "Widerrufsbelehrung", anlage: "Anlage 2" },
  { titel: "Leistungsversprechen", anlage: undefined },
  { titel: "Datenschutzerklärung", anlage: "Anlage 1" },
];

// Logo wird serverseitig direkt von der Festplatte gelesen (kein Netzwerk-Roundtrip beim
// PDF-Rendern nötig) — react-pdf akzeptiert dafür einen Buffer.
function ladeLogo(): Buffer | undefined {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public/logos/immobilien-quer.png"));
  } catch {
    return undefined;
  }
}

const styles = StyleSheet.create({
  page: {
    paddingTop: "28mm",
    paddingBottom: "22mm",
    paddingLeft: "22mm",
    paddingRight: "22mm",
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: FARBE.anthrazit,
    backgroundColor: FARBE.reinweiss,
  },
  logo: { width: 130, marginBottom: 22 },
  label: {
    fontFamily: "Courier",
    fontSize: 7.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: FARBE.messing,
    marginBottom: 4,
  },
  h1: {
    fontFamily: "Times-Bold",
    fontSize: 23,
    color: FARBE.walnuss,
    marginBottom: 16,
  },
  // Zweistufiger Abschnittstitel (kleiner Messing-Kicker + große Walnuss-Überschrift), analog zum
  // Label/H1-Paar auf dem Deckblatt — ersetzt die vorherigen einzeiligen "§ N Titel"-Überschriften,
  // um den reinen Fließtextseiten der Vertrags-/Rechtstexte mehr Struktur zu geben (Chat-Vorgabe
  // "Bearbeite die Optik").
  kicker: {
    fontFamily: "Courier",
    fontSize: 7,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: FARBE.messing,
    marginTop: 16,
  },
  h2: {
    fontFamily: "Times-Bold",
    fontSize: 14,
    color: FARBE.walnuss,
    marginTop: 2,
    marginBottom: 7,
    paddingBottom: 4,
    borderBottom: `1pt solid ${FARBE.asche}`,
  },
  h3: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    color: FARBE.walnuss,
    marginTop: 10,
    marginBottom: 4,
  },
  text: { fontSize: 9.5, lineHeight: 1.48, color: FARBE.anthrazit },
  absatz: { fontSize: 9.5, lineHeight: 1.48, color: FARBE.anthrazit, marginBottom: 6 },
  small: { fontSize: 8, lineHeight: 1.4, color: FARBE.anthrazit },
  rechtsLabel: {
    fontSize: 8.5,
    lineHeight: 1.4,
    color: FARBE.walnuss,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  zeile: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottom: `0.5pt solid ${FARBE.sand}`,
  },
  zeileLabel: { width: "38%", fontSize: 8.5, color: FARBE.anthrazit, opacity: 0.65 },
  zeileWert: { width: "62%", fontSize: 9, color: FARBE.anthrazit },
  card: {
    backgroundColor: FARBE.stein,
    padding: 10,
    borderRadius: 3,
    marginBottom: 8,
  },
  paketCard: {
    flex: 1,
    padding: 8,
    borderRadius: 3,
    marginRight: 6,
  },
  paketAktiv: {
    backgroundColor: FARBE.stein,
    border: `1.5pt solid ${FARBE.messing}`,
  },
  paketInaktiv: {
    backgroundColor: FARBE.stein,
    border: `1pt solid transparent`,
  },
  badge: {
    fontFamily: "Courier",
    fontSize: 6.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: FARBE.reinweiss,
    backgroundColor: FARBE.messing,
    borderRadius: 2,
    paddingVertical: 2,
    paddingHorizontal: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  tabelleZeile: { flexDirection: "row", borderBottom: `0.5pt solid ${FARBE.sand}` },
  tabelleKopf: {
    flexDirection: "row",
    backgroundColor: FARBE.stein,
    paddingVertical: 3,
  },
  tabelleZelleLabel: { width: "46%", fontSize: 7.5, padding: 3 },
  tabelleZelleSpalte: { width: "18%", fontSize: 7.5, padding: 3, textAlign: "center" },
  footer: {
    position: "absolute",
    bottom: "10mm",
    left: "22mm",
    right: "22mm",
    fontSize: 7,
    color: FARBE.asche,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `0.5pt solid ${FARBE.sand}`,
    paddingTop: 4,
  },
  unterschriftFeld: {
    width: "48%",
    borderTop: `0.5pt solid ${FARBE.asche}`,
    paddingTop: 4,
  },
  formularFeld: { marginBottom: 9 },
  formularLinie: { borderBottom: `0.75pt solid ${FARBE.asche}`, height: 13, marginTop: 2 },
});

function Fusszeile({ titel }: { titel: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>Parma Immobilien · {titel}</Text>
      <Text render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`} />
    </View>
  );
}

function AbschnittsTitel({ kicker, titel }: { kicker: string; titel: string }) {
  return (
    <>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.h2}>{titel}</Text>
    </>
  );
}

function Zeile({ label, wert }: { label: string; wert?: string | number | null }) {
  if (wert === undefined || wert === null || wert === "") return null;
  return (
    <View style={styles.zeile}>
      <Text style={styles.zeileLabel}>{label}</Text>
      <Text style={styles.zeileWert}>{String(wert)}</Text>
    </View>
  );
}

// Beschriftetes, leeres Schreibfeld für das Muster-Widerrufsformular — eine Unterstreichung statt
// eines vorausgefüllten Werts, da der Kunde dieses Formular nur im Widerrufsfall eigenhändig
// ausfüllt (Formularinhalt ist unabhängig von den beim Vertragsschluss erfassten Stammdaten).
function Formularzeile({ label }: { label: string }) {
  return (
    <View style={styles.formularFeld}>
      <Text style={styles.small}>{label}</Text>
      <View style={styles.formularLinie} />
    </View>
  );
}

// Rendert die Absatz-/Listen-Bausteine einer Datenschutz-Sektion (siehe data/rechtstexte.ts).
function RechtsBloecke({ sektion }: { sektion: RechtsSektion }) {
  return (
    <>
      {sektion.bloecke.map((block, i) => {
        if (block.art === "label") {
          return (
            <Text key={i} style={styles.rechtsLabel}>
              {block.text}
            </Text>
          );
        }
        if (block.art === "liste") {
          return (
            <View key={i} style={{ marginBottom: 6 }}>
              {block.items.map((item) => (
                <Text key={item} style={{ ...styles.text, marginBottom: 2 }}>
                  · {item}
                </Text>
              ))}
            </View>
          );
        }
        return (
          <Text key={i} style={styles.absatz}>
            {block.text}
          </Text>
        );
      })}
    </>
  );
}

function formatiereBetragPdf(betrag?: number): string | undefined {
  if (betrag === undefined || betrag === null) return undefined;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(betrag);
}

function heute(): string {
  return new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const LEISTUNGS_SPALTEN: { id: LeistungspaketId; label: string }[] = [
  { id: "basis", label: "Basis" },
  { id: "komfort", label: "Komfort" },
  { id: "premium", label: "Premium" },
];

// Helvetica (Standard-14-PDF-Font, WinAnsi-Encoding) enthält kein Häkchen-Glyph (✓, U+2713) —
// react-pdf rendert das Zeichen dann unsichtbar/leer. Deshalb hier ein ASCII-sicheres "X" statt
// eines Unicode-Symbols, damit "ja" in der Leistungen-Tabelle tatsächlich sichtbar ist.
function StatusZeichen({ status }: { status: "ja" | "nein" | "optional" }) {
  if (status === "ja") return <Text style={{ fontFamily: "Helvetica-Bold", color: FARBE.messing }}>X</Text>;
  if (status === "optional") return <Text style={{ fontSize: 6.5 }}>optional</Text>;
  return <Text>–</Text>;
}

export interface MandatDokumentProps {
  kunde: Kunde;
  immobilie: Immobilie;
  bewertung: Bewertung;
  daten: MaklervertragDaten;
  gewaehltesPaket?: LeistungspaketId;
}

export function MandatDokument({ kunde, immobilie, bewertung, daten, gewaehltesPaket }: MandatDokumentProps) {
  const logo = ladeLogo();
  const kundeName = [kunde.anrede, kunde.vorname, kunde.nachname].filter(Boolean).join(" ");
  const kundeAdresse = [kunde.strasse, [kunde.plz, kunde.ort].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  const objektAdresse = [immobilie.strasse, [immobilie.plz, immobilie.ort].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(", ");
  const gewaehltesPaketDaten = LEISTUNGSPAKETE.find((p) => p.id === gewaehltesPaket);

  // Eine eigene Unterschriftszeile pro erfasster Vertragspartei (auftraggeber1 + weitere
  // Auftraggeber), da bei mehreren Eigentümern/Erben ohne Vollmachtsverhältnis (siehe § 4) jede
  // Person einzeln unterschreibt. Wird sowohl auf der Maklervertrags- als auch auf der
  // Widerrufs-Unterschriftsseite verwendet.
  const auftraggeberBeschriftungen = [daten.auftraggeber1, ...daten.weitereAuftraggeber].map(
    (partei, i) => partei.name || (i === 0 ? "Auftraggeberin/Auftraggeber" : `Weitere/r Auftraggeber/in ${i + 1}`)
  );

  return (
    <Document title={`Mandat ${kundeName || "Parma Immobilien"}`.trim()}>
      {/* ── Teil 1: Maklervertrag ───────────────────────────────────────────────── */}

      {/* Deckblatt */}
      <Page size="A4" style={styles.page}>
        {logo && <Image src={logo} style={styles.logo} />}
        <Text style={styles.label}>Mandat &amp; Leistungsversprechen</Text>
        <Text style={styles.h1}>Maklervertrag</Text>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          <View style={{ ...styles.card, flex: 1, marginRight: 6 }}>
            <Text style={{ ...styles.small, fontFamily: "Courier", marginBottom: 4 }}>
              VERKÄUFER/IN · AUFTRAGGEBER/IN
            </Text>
            <Text style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>{kundeName || "—"}</Text>
            {kundeAdresse && <Text style={styles.text}>{kundeAdresse}</Text>}
          </View>
          <View style={{ ...styles.card, flex: 1 }}>
            <Text style={{ ...styles.small, fontFamily: "Courier", marginBottom: 4 }}>OBJEKT</Text>
            <Text style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>
              {immobilie.bezeichnung || objektAdresse || "—"}
            </Text>
            {objektAdresse && <Text style={styles.text}>{objektAdresse}</Text>}
            {immobilie.kaufpreis ? (
              <Text style={styles.text}>Kaufpreis: {formatiereBetragPdf(immobilie.kaufpreis)}</Text>
            ) : null}
          </View>
        </View>
        {gewaehltesPaketDaten && (
          <View style={{ marginTop: 4, marginBottom: 24 }}>
            <Text style={styles.badge}>Gewähltes Paket</Text>
            <Text style={{ ...styles.h2, marginTop: 0, borderBottom: "none", paddingBottom: 0 }}>
              {gewaehltesPaketDaten.name} · {gewaehltesPaketDaten.provisionProzent.toLocaleString("de-DE")} %
            </Text>
          </View>
        )}

        {/* Inhaltsübersicht: füllt den unteren Teil des Deckblatts bewusst mit Orientierung statt
            Leerraum — sinnvoll geworden, seit dieses PDF vier vollständige Dokumente bündelt. */}
        <View style={{ marginTop: "auto", paddingTop: 24, borderTop: `0.5pt solid ${FARBE.sand}` }}>
          <Text style={styles.label}>Inhalt dieses Dokuments</Text>
          {DOKUMENTTEILE.map((teil, i) => (
            <View
              key={teil.titel}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 4,
                borderBottom: i < DOKUMENTTEILE.length - 1 ? `0.5pt solid ${FARBE.sand}` : undefined,
              }}
            >
              <Text style={styles.text}>
                {i + 1}. {teil.titel}
              </Text>
              {teil.anlage && <Text style={{ ...styles.small, opacity: 0.65 }}>{teil.anlage}</Text>}
            </View>
          ))}
          <Text style={{ ...styles.small, marginTop: 12 }}>Erstellt am {heute()}</Text>
        </View>
        <Fusszeile titel="Deckblatt" />
      </Page>

      {/* Kunden- und Objektdaten */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.label}>Stammdaten</Text>
        <Text style={styles.h2}>Kundendaten</Text>
        <Zeile label="Anrede" wert={kunde.anrede} />
        <Zeile label="Name" wert={[kunde.vorname, kunde.nachname].filter(Boolean).join(" ")} />
        <Zeile label="Straße" wert={kunde.strasse} />
        <Zeile label="PLZ / Ort" wert={[kunde.plz, kunde.ort].filter(Boolean).join(" ")} />
        <Zeile label="Telefon" wert={kunde.telefon} />
        <Zeile label="E-Mail" wert={kunde.email} />

        <Text style={styles.h2}>Objektdaten</Text>
        <Zeile label="Bezeichnung" wert={immobilie.bezeichnung} />
        <Zeile label="ImmoNr." wert={immobilie.immoNr} />
        <Zeile label="Objektart" wert={immobilie.objektart} />
        <Zeile label="Adresse" wert={objektAdresse} />
        <Zeile label="Kaufpreis" wert={formatiereBetragPdf(immobilie.kaufpreis)} />
        <Zeile label="Wohnfläche" wert={immobilie.wohnflaeche ? `${immobilie.wohnflaeche} m²` : undefined} />
        <Zeile
          label="Grundstücksfläche"
          wert={immobilie.grundstuecksflaeche ? `${immobilie.grundstuecksflaeche} m²` : undefined}
        />
        <Zeile label="Zimmer" wert={immobilie.anzahlZimmer} />
        <Zeile label="Baujahr" wert={immobilie.baujahr} />
        <Zeile label="Zustand" wert={immobilie.zustand} />
        <Zeile label="Energieklasse" wert={immobilie.energieklasse} />
        <Zeile label="Modernisierungen" wert={immobilie.modernisierungen?.join(", ")} />
        {immobilie.objektbeschreibung && (
          <>
            <Text style={styles.h3}>Objektbeschreibung</Text>
            <Text style={styles.text}>{immobilie.objektbeschreibung}</Text>
          </>
        )}

        <Text style={styles.h2}>Bewertung</Text>
        <Zeile label="Sachwert" wert={formatiereBetragPdf(bewertung.sachwert)} />
        <Zeile label="Ertragswert" wert={formatiereBetragPdf(bewertung.ertragswert)} />
        <Zeile label="Vergleichswert" wert={formatiereBetragPdf(bewertung.vergleichswert)} />
        <Zeile label="Empfohlener Angebotspreis" wert={formatiereBetragPdf(bewertung.empfohlenerAngebotspreis)} />
        <Zeile label="Stand der Wertermittlung" wert={bewertung.stand} />
        <Fusszeile titel="Maklervertrag" />
      </Page>

      {/* § 1–3 */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.label}>Vertrag</Text>
        <Text style={styles.h1}>Maklervertrag</Text>

        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          <View style={{ ...styles.card, flex: 1, marginRight: 6 }}>
            <Text style={{ ...styles.small, fontFamily: "Courier", marginBottom: 4 }}>IMMOBILIENMAKLER</Text>
            <Text style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>{MAKLER_KONTAKT.name}</Text>
            <Text style={styles.small}>{MAKLER_KONTAKT.unternehmen}</Text>
            <Text style={styles.small}>{MAKLER_KONTAKT.strasse}</Text>
            <Text style={styles.small}>{MAKLER_KONTAKT.plzOrt}</Text>
            <Text style={styles.small}>{MAKLER_KONTAKT.telefon}</Text>
            <Text style={styles.small}>{MAKLER_KONTAKT.email}</Text>
          </View>
          <View style={{ ...styles.card, flex: 1 }}>
            <Text style={{ ...styles.small, fontFamily: "Courier", marginBottom: 4 }}>
              VERKÄUFER/IN · AUFTRAGGEBER/IN
            </Text>
            <Text style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>{daten.auftraggeber1.name || "—"}</Text>
            <Text style={styles.small}>{daten.auftraggeber1.strasse}</Text>
            <Text style={styles.small}>{daten.auftraggeber1.plzOrt}</Text>
            <Text style={styles.small}>{daten.auftraggeber1.telefon}</Text>
            <Text style={styles.small}>{daten.auftraggeber1.email}</Text>
          </View>
        </View>

        {daten.weitereAuftraggeber.map((p, i) => (
          <View key={i} style={{ ...styles.card }}>
            <Text style={{ ...styles.small, fontFamily: "Courier", marginBottom: 4 }}>
              WEITERE/R EIGENTÜMER/IN {i + 2}
            </Text>
            <Text style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>{p.name || "—"}</Text>
            <Text style={styles.small}>{p.strasse}</Text>
            <Text style={styles.small}>{p.plzOrt}</Text>
            <Text style={styles.small}>{p.telefon}</Text>
            <Text style={styles.small}>{p.email}</Text>
          </View>
        ))}

        <Zeile label="Objekt" wert={daten.objekt} />

        <View wrap={false}>
          <AbschnittsTitel kicker="§ 1" titel="Maklervertrag" />
          <Text style={styles.absatz}>
            Hiermit wird der Makler durch die Veräußerin und/oder den Veräußerer oder dessen/deren
            Bevollmächtigten beauftragt, einen Kaufinteressenten nachzuweisen oder den Abschluss
            eines Kaufvertrags zu vermitteln.
          </Text>
        </View>

        <View wrap={false}>
          <AbschnittsTitel kicker="§ 2" titel="Auftragsdauer" />
          <Text style={styles.absatz}>
            Von: {daten.auftragsdauerVon || "___________"}   bis: {daten.auftragsdauerBis || "___________"}
          </Text>
          <Text style={styles.absatz}>
            Der Auftrag verlängert sich jeweils um einen Monat, wenn er nicht unter Einhaltung
            einer Frist von einer Woche zum Ende der Vertragslaufzeit von einer Vertragspartei in
            Textform gekündigt wird.
          </Text>
        </View>

        <View wrap={false}>
          <AbschnittsTitel kicker="§ 3" titel="Pflichten des Maklers" />
          <Text style={styles.absatz}>
            Der Makler ist verpflichtet, den Auftrag mit Fachkunde auszuführen, alle
            Abschlusschancen zu nutzen und alle Werbemaßnahmen auf eigene Kosten zu ergreifen, um
            einen kurzfristigen Verkauf zu ermöglichen. Siehe dazu das beiliegende
            Leistungsversprechen. Er hat die/den Auftraggeberin/Auftraggeber nach bestem Wissen und
            Gewissen über den Immobilienmarkt und die erzielbaren Preise zu beraten.
          </Text>
        </View>
        <Fusszeile titel="Maklervertrag" />
      </Page>

      {/* § 4–7 */}
      <Page size="A4" style={styles.page}>
        <View wrap={false}>
          <AbschnittsTitel kicker="§ 4" titel="Rechte der Auftraggeberin/des Auftraggebers" />
          <Text style={styles.absatz}>
            Die/der Auftraggeberin/Auftraggeber ist/sind nicht berechtigt, an Auftraggeber anderer
            Makler zu verkaufen oder andere Makler zu bezahlen. Die/der Auftraggeberin/Auftraggeber
            verpflichtet/verpflichten sich, den Makler beim Verkauf an andere Interessenten zu den
            Verhandlungen hinzuzuziehen.
          </Text>
          <Text style={styles.absatz}>
            Die/der Auftraggeberin/Auftraggeber darf/dürfen für evtl. Miteigentümer in Vollmacht
            handeln, ist/sind aber bei Unwirksamkeit der Vollmacht zu Schadensersatz verpflichtet.
          </Text>
        </View>

        <View wrap={false}>
          <AbschnittsTitel kicker="§ 5" titel="Verkaufsobjekt" />
          <Text style={styles.absatz}>Art: {daten.verkaufsobjektArt || "—"}</Text>
          <Text style={styles.absatz}>Ort: {daten.verkaufsobjektOrt || "—"}</Text>
        </View>
        <Text style={styles.absatz}>
          Der vereinbarte Startpreis beträgt {formatiereBetragPdf(daten.startpreis) || "___________"}{" "}
          entsprechend der Wertermittlung vom {daten.wertermittlungVom || "___________"}. Parma
          Immobilien hat die/den Auftraggeberin/Auftraggeber darüber aufgeklärt, dass es durch die
          Marktveränderung nach Zinsanstieg je nach Immobilientyp deutliche Abweichungen zum
          Verkehrswert eintreten können. Zudem zeichnet sich ab, dass mit längerer
          Vermarktungsdauer ein Wertverlust einhergeht. Preisanpassungen werden im Laufe der
          Vermarktungszeit nur in enger Absprache mit der/dem/den Auftraggeberin/Auftraggeber/
          Auftraggebern abgestimmt und erfordern der eindeutigen Zustimmung. Dies bedarf keiner
          Änderung des Maklervertrags, die Unterzeichnung des notariellen Kaufvertrages bestätigt
          die Akzeptanz des Kaufpreises.
        </Text>

        <View wrap={false}>
          <AbschnittsTitel kicker="§ 6" titel="Pflichten der Auftraggeberin/des Auftraggebers" />
          <Text style={styles.absatz}>
            Die/der Auftraggeberin/Auftraggeber teilt dem Makler alle für den Verkauf bedeutsame
            Informationen richtig und vollständig mit, insbesondere die folgenden bekannten
            Mängel.
          </Text>
          <Text style={styles.absatz}>
            {daten.keineMaengelBekannt ? "Keine Mängel bekannt." : daten.maengel || "___________"}
          </Text>
        </View>

        <View wrap={false}>
          <AbschnittsTitel kicker="§ 7" titel="Maklerprovision" />
          {gewaehltesPaketDaten && (
            <Text style={{ ...styles.badge, marginTop: 4 }}>Paket: {gewaehltesPaketDaten.name}</Text>
          )}
          <Text style={styles.absatz}>
            Die/der Auftraggeberin/Auftraggeber verpflichtet/verpflichten sich, eine
            Maklerprovision in Höhe von{" "}
            {daten.provisionProzent !== undefined ? `${daten.provisionProzent.toLocaleString("de-DE")} %` : "______ %"}{" "}
            des erzielten Gesamtkaufpreises inklusive der gesetzlichen MwSt. zu zahlen. Die
            Provision wird mit Abschluss des notariellen Kaufvertrags fällig. Der Makler darf auch
            für den Käufer in entsprechender Höhe provisionspflichtig tätig sein. Etwaige
            Interessenkollisionen wird der Makler mit der/dem/den
            Auftraggeberin/Auftraggeber/Auftraggebern besprechen. Der Provisionsanspruch des
            Maklers wird durch eine nachträgliche Minderung des Kaufpreises nicht berührt. Der
            Provisionsanspruch des Maklers entsteht auch, wenn der/die
            Auftragsgeberin/Auftraggeber einen Kaufinteressenten ohne triftigen Grund ablehnt oder
            den Verkauf entgegen § 4 anderweitig vornimmt.
          </Text>
        </View>
        <Text style={styles.absatz}>
          Ebenso entsteht der Provisionsanspruch, wenn der Kontakt zum Käufer noch während der
          Laufzeit dieses Vertrages durch den Makler zustande gekommen ist und die Veräußerung durch
          notariellen Kaufvertrag zu einem späteren Zeitpunkt erfolgt.
        </Text>
        <Fusszeile titel="Maklervertrag" />
      </Page>

      {/* § 8–12 + Genehmigung */}
      <Page size="A4" style={styles.page}>
        <View wrap={false}>
          <AbschnittsTitel kicker="§ 8" titel="Aufwendungsersatz" />
          <Text style={styles.absatz}>
            Gibt/geben die/der Auftraggeberin/Auftraggeber die Verkaufsabsicht vorzeitig (bevor ein
            Käufer benannt wurde) auf oder erschwert/erschweren sie/er die Erfüllung des Auftrages
            durch Änderung der festgelegten Bedingungen, oder kündigt/kündigen widerrechtlich den
            Maklerauftrag, so übernimmt/übernehmen sie/er alle Aufwendungen wie Telefon-, Porto-,
            Inserats-, Reise-, KFZ- und Beschaffungskosten für Unterlagen wie Grundbuchauszug,
            Bauunterlagen, Energieausweis und Lageplan. Der Auftraggeberin/Dem Auftraggeber bleibt
            der Nachweis gestattet, dass dem Makler kein oder ein geringer Schaden entstanden ist.
          </Text>
        </View>

        <View wrap={false}>
          <AbschnittsTitel kicker="§ 9" titel="Salvatorische Klausel" />
          <Text style={styles.absatz}>
            Sollten eine oder mehrere der vorstehenden Vereinbarungen unwirksam sein, so wird die
            Wirksamkeit der übrigen Vertragsvereinbarungen hiervon nicht berührt. Dies gilt auch,
            wenn innerhalb einer Regelung ein Teil unwirksam ist, ein anderer Teil aber wirksam.
            Die jeweils unwirksame Vereinbarung soll zwischen den Parteien durch eine ersetzt
            werden, die den wirtschaftlichen Interessen der Vertragsparteien am nächsten kommt und
            im Übrigen den vertraglichen Vereinbarungen nicht zuwiderläuft. Gerichtsstand ist,
            soweit gesetzlich zulässig, der Geschäftssitz des Maklers.
          </Text>
        </View>

        <View wrap={false}>
          <AbschnittsTitel kicker="§ 10" titel="Datenschutz und Widerrufbelehrung" />
          <Text style={styles.absatz}>
            Der Makler hat bei Erhebung und Verarbeitung von Daten des Auftraggebers die
            Bestimmungen der Datenschutzgesetzes (DSGVO) zu beachten. Die als Anlage 1 dieses
            Vertrag beigefügte Datenschutzerklärung des Maklers ist Bestandteil dieses
            Maklervertrags und mit diesem fest zu verbinden.
          </Text>
          <Text style={styles.absatz}>
            Für den Fall, dass es sich bei dem Kunden um einen Verbraucher gemäß § 13 BGB handelt
            und dieser Vertrag entweder außerhalb der Geschäftsräume des Maklers oder im Wege des
            Fernabsatzes über Fernkommunikationsmittel geschlossen wird, gilt die in Anlage 2 zu
            diesem Vertrag enthaltene Widerrufsbelehrung. Diese Anlage ist zwingender Bestandteil
            dieses Vertrages.
          </Text>
        </View>

        <View wrap={false}>
          <AbschnittsTitel kicker="§ 11" titel="Schriftform" />
          <Text style={styles.absatz}>
            Mündliche Nebenabreden existieren nicht. Änderungen dieses Vertrages bedürfen der
            Textform.
          </Text>
        </View>

        <View wrap={false}>
          <AbschnittsTitel kicker="§ 12" titel="Sonstige Vereinbarungen" />
          <Text style={styles.absatz}>{daten.sonstigeVereinbarungen || "—"}</Text>
        </View>
        <Fusszeile titel="Maklervertrag" />
      </Page>

      {/* Genehmigung + Unterschrift auf einer eigenständigen Abschlussseite: react-pdf hat den
          kurzen Genehmigungs-Absatz beim Anhängen an § 8–12 in Tests wiederholt vollständig auf
          eine eigene, fast leere Folgeseite verschoben (wrap={false}-Pagination reservierte dort
          mehr Raum als optisch nötig) — auf dieser bewusst ruhig komponierten Schlussseite fügt er
          sich stattdessen zwischen Vertragstext und Unterschriftsfeldern natürlich ein. */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.label}>Vertrag</Text>
        <Text style={styles.h1}>Genehmigung &amp; Unterschrift</Text>

        <AbschnittsTitel kicker="Genehmigung" titel="Beschaffung von Unterlagen" />
        <Text style={styles.absatz}>
          Dem Makler wird ausdrücklich gestattet, die notwendigen Unterlagen zur erfolgreichen
          Vermarktung einzuholen. Diese Genehmigung bezieht sich auf folgende Unterlagen:
          Grundbuchauszug, Lageplan, Baubeschreibung, Statik, Grundrisse, Schnitte,
          Verwaltungsunterlagen und alle weiteren benötigten Unterlagen, die für den Verkauf des
          Objekts benötigt werden.
        </Text>

        <AbschnittsTitel kicker="Unterschrift" titel="Ort und Datum" />
        <Text style={styles.absatz}>
          Ort: {daten.unterschriftOrt || "___________"}   Datum: {daten.unterschriftDatum || "___________"}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 48 }}>
          {[...auftraggeberBeschriftungen, "Maklerin/Makler"].map((beschriftung, i) => (
            <View
              key={i}
              style={{
                ...styles.unterschriftFeld,
                marginRight: i % 2 === 0 ? "4%" : 0,
                marginTop: i >= 2 ? 28 : 0,
              }}
            >
              <Text style={styles.small}>{beschriftung}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 40, paddingTop: 16, borderTop: `0.5pt solid ${FARBE.sand}` }}>
          <Text style={styles.small}>
            Die als Anlage 1 und Anlage 2 beigefügte Datenschutzerklärung sowie Widerrufsbelehrung
            sind Bestandteil dieses Maklervertrags (siehe § 10).
          </Text>
        </View>
        <Fusszeile titel="Maklervertrag" />
      </Page>

      {/* ── Teil 2: Widerruf ────────────────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.label}>Anlage 2 · Widerruf</Text>
        <Text style={styles.h1}>Widerrufsbelehrung</Text>

        <View wrap={false}>
          <Text style={styles.h2}>Widerrufsrecht</Text>
          <Text style={styles.absatz}>
            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
            widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des
            Vertragsabschlusses.
          </Text>
        </View>
        <Text style={styles.absatz}>
          Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Parma Immobilien, Monschauer Straße 64,
          52355 Düren, Tel.: 02421 – 9748688, E-Mail: info@parmaimmobilien.de) mittels einer
          eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail) über Ihren
          Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte
          Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der
          Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts
          vor Ablauf der Widerrufsfrist absenden.
        </Text>

        <View wrap={false}>
          <Text style={styles.h2}>Folgen des Widerrufs</Text>
          <Text style={styles.absatz}>
            Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen
            erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten,
            die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns
            angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens
            binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über den
            Widerruf dieses Vertrages bei uns eingegangen ist. Für diese Rückzahlung verwenden wir
            dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben,
            es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall
            werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
          </Text>
        </View>
        <Text style={styles.absatz}>
          Haben Sie verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, so
          haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt,
          zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrages
          unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im
          Vertrag vorgesehenen Dienstleistungen entspricht.
        </Text>

        <View wrap={false}>
          <Text style={styles.h2}>Vorzeitiges Erlöschen des Widerrufsrechts</Text>
          <Text style={styles.absatz}>
            Ihr zunächst bestehendes Widerrufsrecht erlischt, wenn Parma Immobilien die
            Maklerleistung vollständig erbracht hat und mit der Ausführung der Maklerleistung erst
            begonnen hat, nachdem Sie dazu Ihre ausdrückliche Zustimmung gegeben haben und
            gleichzeitig Ihre Kenntnis davon bestätigt haben, dass Sie Ihr Widerrufsrecht bei
            vollständiger Vertragserfüllung durch Parma Immobilien verlieren.
          </Text>
        </View>

        <Text style={styles.h2}>Muster-Widerrufsformular</Text>
        <Text style={styles.small}>
          (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und
          senden Sie es zurück.)
        </Text>
        <View style={{ ...styles.card, marginTop: 8 }}>
          <Text style={{ ...styles.small, marginBottom: 8 }}>
            An Parma Immobilien, Monschauer Straße 64, 52355 Düren, Tel.: 02421 – 9748688, E-Mail:
            info@parmaimmobilien.de
          </Text>
          <Formularzeile label="Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung" />
          <View style={{ flexDirection: "row" }}>
            <View style={{ width: "48%", marginRight: "4%" }}>
              <Formularzeile label="Bestellt am" />
            </View>
            <View style={{ width: "48%" }}>
              <Formularzeile label="Erhalten am" />
            </View>
          </View>
          <Formularzeile label="Name des/der Verbraucher(s)" />
          <Formularzeile label="Anschrift des/der Verbraucher(s)" />
          <View style={{ flexDirection: "row" }}>
            <View style={{ width: "48%", marginRight: "4%" }}>
              <Formularzeile label="Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)" />
            </View>
            <View style={{ width: "48%" }}>
              <Formularzeile label="Datum" />
            </View>
          </View>
        </View>

        <View wrap={false}>
          <Text style={{ ...styles.h2, marginTop: 18 }}>
            Zustimmung zum Beginn der Maklertätigkeit vor Ablauf der Widerrufsfrist
          </Text>
          <Text style={styles.absatz}>
            Ich/wir erteile/erteilen meine/unsere ausdrückliche Zustimmung, dass mit der
            Ausführung der beauftragten Maklerleistung (z. B. Exposé-Versendung, Durchführung von
            Besichtigungen) vor Ende der Widerrufsfrist begonnen wird. Mir/uns ist bekannt, dass
            ich/wir bei vollständiger Vertragserfüllung durch Parma Immobilien mein Widerrufsrecht
            verliere.
          </Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 20 }}>
          <View style={{ ...styles.unterschriftFeld, marginRight: "4%" }}>
            <Text style={styles.small}>Ort, Datum</Text>
          </View>
          {auftraggeberBeschriftungen.map((beschriftung, i) => (
            <View
              key={i}
              style={{
                ...styles.unterschriftFeld,
                marginTop: i > 0 ? 20 : 0,
                marginRight: i === 0 ? undefined : "4%",
              }}
            >
              <Text style={styles.small}>{beschriftung}</Text>
            </View>
          ))}
        </View>

        <View wrap={false}>
          <Text style={{ ...styles.h2, marginTop: 18 }}>Empfangsbestätigung</Text>
          <Text style={styles.absatz}>
            Hiermit bestätige/bestätigen ich/wir, von Parma Immobilien über die Widerrufsbelehrung
            informiert worden zu sein und eine Abschrift erhalten zu haben.
          </Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 20 }}>
          <View style={{ ...styles.unterschriftFeld, marginRight: "4%" }}>
            <Text style={styles.small}>Ort, Datum</Text>
          </View>
          {auftraggeberBeschriftungen.map((beschriftung, i) => (
            <View
              key={i}
              style={{
                ...styles.unterschriftFeld,
                marginTop: i > 0 ? 20 : 0,
                marginRight: i === 0 ? undefined : "4%",
              }}
            >
              <Text style={styles.small}>{beschriftung}</Text>
            </View>
          ))}
        </View>
        <Fusszeile titel="Widerrufsbelehrung" />
      </Page>

      {/* ── Teil 3: Leistungsversprechen ────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.label}>Leistungsversprechen</Text>
        <Text style={styles.h1}>Unser Leistungsversprechen</Text>

        <View style={{ flexDirection: "row", marginBottom: 12 }}>
          {LEISTUNGS_KENNZAHLEN.map((k) => (
            <View key={k.label} style={{ ...styles.card, flex: 1, marginRight: 6, textAlign: "center" }}>
              <Text style={{ ...styles.h3, marginTop: 0, textAlign: "center" }}>{k.wert}</Text>
              <Text style={{ ...styles.small, textAlign: "center" }}>{k.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.h2}>Unsere Pakete</Text>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {LEISTUNGSPAKETE.map((paket) => {
            const aktiv = paket.id === gewaehltesPaket;
            return (
              <View
                key={paket.id}
                style={[styles.paketCard, aktiv ? styles.paketAktiv : styles.paketInaktiv]}
              >
                {aktiv && <Text style={styles.badge}>Ausgewählt</Text>}
                <Text style={{ ...styles.h3, marginTop: 0 }}>{paket.name}</Text>
                <Text style={styles.small}>{paket.beschreibung}</Text>
                <Text style={{ ...styles.h3, color: FARBE.walnuss }}>
                  {paket.provisionProzent.toLocaleString("de-DE")} %
                </Text>
                {paket.highlights.map((h) => (
                  <Text key={h} style={{ ...styles.small, marginBottom: 2 }}>
                    · {h}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>

        <Text style={styles.h2}>Rahmenbedingungen</Text>
        {RAHMENBEDINGUNGEN.map((r) => (
          <View key={r.nummer} style={{ marginBottom: 4 }}>
            <Text style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>
              § {r.nummer} · {r.titel}
            </Text>
            <Text style={styles.small}>{r.text}</Text>
          </View>
        ))}
        <Fusszeile titel="Leistungsversprechen" />
      </Page>

      {/* Leistungen im Detail */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.label}>Leistungsversprechen</Text>
        <Text style={styles.h2}>Leistungen im Detail</Text>
        <View style={styles.tabelleKopf}>
          <Text style={styles.tabelleZelleLabel}>Leistung</Text>
          {LEISTUNGS_SPALTEN.map((s) => (
            <Text
              key={s.id}
              style={{
                ...styles.tabelleZelleSpalte,
                fontFamily: s.id === gewaehltesPaket ? "Helvetica-Bold" : "Helvetica",
                color: s.id === gewaehltesPaket ? FARBE.walnuss : FARBE.anthrazit,
              }}
            >
              {s.label}
            </Text>
          ))}
        </View>
        {LEISTUNGSKATEGORIEN.map((kategorie) => (
          <View key={kategorie.nummer} wrap={false}>
            <Text style={{ ...styles.small, fontFamily: "Courier", marginTop: 6, marginBottom: 2 }}>
              § {kategorie.nummer} {kategorie.titel}
            </Text>
            {kategorie.positionen.map((pos) => (
              <View key={pos.bezeichnung} style={styles.tabelleZeile}>
                <Text style={styles.tabelleZelleLabel}>{pos.bezeichnung}</Text>
                {LEISTUNGS_SPALTEN.map((s) => (
                  <Text key={s.id} style={styles.tabelleZelleSpalte}>
                    <StatusZeichen status={pos[s.id]} />
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ))}
        <Fusszeile titel="Leistungsversprechen" />
      </Page>

      {/* ── Teil 4: Datenschutz ─────────────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.label}>Anlage 1 · Datenschutz</Text>
        <Text style={styles.h1}>Datenschutzerklärung</Text>

        <AbschnittsTitel kicker="§ 1" titel="Verantwortlicher" />
        <View style={{ ...styles.card, marginTop: 8 }}>
          <Text style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>{MAKLER_KONTAKT.unternehmen}</Text>
          <Text style={styles.small}>{MAKLER_KONTAKT.strasse}</Text>
          <Text style={styles.small}>{MAKLER_KONTAKT.plzOrt}</Text>
          <Text style={{ ...styles.small, marginTop: 4 }}>Vertreten durch: Daniel Parma &amp; Robin Kolbe</Text>
          <Text style={styles.small}>Telefon: {MAKLER_KONTAKT.telefon}</Text>
          <Text style={styles.small}>E-Mail: info@parmaimmobilien.de</Text>
          <Text style={styles.small}>Website: https://www.parmaimmobilien.de/</Text>
        </View>

        {DATENSCHUTZ_SEKTIONEN.map((sektion) => (
          <View key={sektion.nummer} style={{ marginTop: 8 }} wrap={false}>
            <AbschnittsTitel kicker={`§ ${sektion.nummer}`} titel={sektion.titel} />
            <RechtsBloecke sektion={sektion} />
          </View>
        ))}
        <Fusszeile titel="Datenschutzerklärung" />
      </Page>
    </Document>
  );
}
