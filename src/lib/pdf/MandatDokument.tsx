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
  logo: { width: 140, marginBottom: 24 },
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
    fontSize: 24,
    color: FARBE.walnuss,
    marginBottom: 16,
  },
  h2: {
    fontFamily: "Times-Bold",
    fontSize: 15,
    color: FARBE.walnuss,
    marginTop: 18,
    marginBottom: 8,
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
  text: { fontSize: 9.5, lineHeight: 1.5, color: FARBE.anthrazit },
  small: { fontSize: 8, lineHeight: 1.4, color: FARBE.anthrazit },
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
});

function Fusszeile({ titel }: { titel: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>Parma Immobilien · {titel}</Text>
      <Text render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`} />
    </View>
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

  return (
    <Document title={`Mandat ${kundeName || "Parma Immobilien"}`.trim()}>
      {/* Deckblatt */}
      <Page size="A4" style={styles.page}>
        {logo && <Image src={logo} style={styles.logo} />}
        <Text style={styles.label}>Mandat &amp; Leistungsversprechen</Text>
        <Text style={styles.h1}>Maklervertrag</Text>
        <View style={styles.card}>
          <Text style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>{kundeName || "—"}</Text>
          {kundeAdresse && <Text style={styles.text}>{kundeAdresse}</Text>}
        </View>
        <View style={styles.card}>
          <Text style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>
            {immobilie.bezeichnung || objektAdresse || "—"}
          </Text>
          {objektAdresse && <Text style={styles.text}>{objektAdresse}</Text>}
          {immobilie.kaufpreis ? (
            <Text style={styles.text}>Kaufpreis: {formatiereBetragPdf(immobilie.kaufpreis)}</Text>
          ) : null}
        </View>
        {gewaehltesPaketDaten && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.badge}>Gewähltes Paket</Text>
            <Text style={{ ...styles.h2, marginTop: 0, borderBottom: "none" }}>
              {gewaehltesPaketDaten.name} · {gewaehltesPaketDaten.provisionProzent.toLocaleString("de-DE")} %
            </Text>
          </View>
        )}
        <Text style={{ ...styles.small, marginTop: 24 }}>Erstellt am {heute()}</Text>
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
        <Fusszeile titel="Stammdaten" />
      </Page>

      {/* Leistungsversprechen */}
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

      {/* Maklervertrag */}
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

        <Text style={styles.h2}>§ 1 Maklervertrag</Text>
        <Text style={styles.text}>
          Hiermit wird der Makler durch die Veräußerin und/oder den Veräußerer oder dessen/deren
          Bevollmächtigten beauftragt, einen Kaufinteressenten nachzuweisen oder den Abschluss eines
          Kaufvertrags zu vermitteln.
        </Text>

        <Text style={styles.h2}>§ 2 Auftragsdauer</Text>
        <Text style={styles.text}>
          Von: {daten.auftragsdauerVon || "___________"}   bis: {daten.auftragsdauerBis || "___________"}
        </Text>
        <Text style={{ ...styles.text, marginTop: 4 }}>
          Der Auftrag verlängert sich jeweils um einen Monat, wenn er nicht unter Einhaltung einer
          Frist von einer Woche zum Ende der Vertragslaufzeit von einer Vertragspartei in Textform
          gekündigt wird.
        </Text>

        <Text style={styles.h2}>§ 3 Pflichten des Maklers</Text>
        <Text style={styles.text}>
          Der Makler ist verpflichtet, den Auftrag mit Fachkunde auszuführen, alle Abschlusschancen
          zu nutzen und alle Werbemaßnahmen auf eigene Kosten zu ergreifen, um einen kurzfristigen
          Verkauf zu ermöglichen. Siehe dazu das beiliegende Leistungsversprechen. Er hat die/den
          Auftraggeberin/Auftraggeber nach bestem Wissen und Gewissen über den Immobilienmarkt und
          die erzielbaren Preise zu beraten.
        </Text>
        <Fusszeile titel="Maklervertrag" />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>§ 4 Rechte der Auftraggeberin/des Auftraggebers</Text>
        <Text style={styles.text}>
          Die/der Auftraggeberin/Auftraggeber ist/sind nicht berechtigt, an Auftraggeber anderer
          Makler zu verkaufen oder andere Makler zu bezahlen. Die/der Auftraggeberin/Auftraggeber
          verpflichtet/verpflichten sich, den Makler beim Verkauf an andere Interessenten zu den
          Verhandlungen hinzuzuziehen.
        </Text>
        <Text style={{ ...styles.text, marginTop: 4 }}>
          Die/der Auftraggeberin/Auftraggeber darf/dürfen für evtl. Miteigentümer in Vollmacht
          handeln, ist/sind aber bei Unwirksamkeit der Vollmacht zu Schadensersatz verpflichtet.
        </Text>

        <Text style={styles.h2}>§ 5 Verkaufsobjekt</Text>
        <Text style={styles.text}>Art: {daten.verkaufsobjektArt || "—"}</Text>
        <Text style={styles.text}>Ort: {daten.verkaufsobjektOrt || "—"}</Text>
        <Text style={{ ...styles.text, marginTop: 4 }}>
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

        <Text style={styles.h2}>§ 6 Pflichten der Auftraggeberin/des Auftraggebers</Text>
        <Text style={styles.text}>
          Die/der Auftraggeberin/Auftraggeber teilt dem Makler alle für den Verkauf bedeutsame
          Informationen richtig und vollständig mit, insbesondere die folgenden bekannten Mängel.
        </Text>
        <Text style={{ ...styles.text, marginTop: 4 }}>
          {daten.keineMaengelBekannt ? "Keine Mängel bekannt." : daten.maengel || "___________"}
        </Text>

        <Text style={styles.h2}>§ 7 Maklerprovision</Text>
        {gewaehltesPaketDaten && <Text style={styles.badge}>Paket: {gewaehltesPaketDaten.name}</Text>}
        <Text style={styles.text}>
          Die/der Auftraggeberin/Auftraggeber verpflichtet/verpflichten sich, eine Maklerprovision in
          Höhe von {daten.provisionProzent !== undefined ? `${daten.provisionProzent.toLocaleString("de-DE")} %` : "______ %"}{" "}
          des erzielten Gesamtkaufpreises inklusive der gesetzlichen MwSt. zu zahlen. Die Provision
          wird mit Abschluss des notariellen Kaufvertrags fällig. Der Makler darf auch für den
          Käufer in entsprechender Höhe provisionspflichtig tätig sein. Etwaige Interessenkollisionen
          wird der Makler mit der/dem/den Auftraggeberin/Auftraggeber/Auftraggebern besprechen. Der
          Provisionsanspruch des Maklers wird durch eine nachträgliche Minderung des Kaufpreises
          nicht berührt. Der Provisionsanspruch des Maklers entsteht auch, wenn der/die
          Auftragsgeberin/Auftraggeber einen Kaufinteressenten ohne triftigen Grund ablehnt oder den
          Verkauf entgegen § 4 anderweitig vornimmt.
        </Text>
        <Text style={{ ...styles.text, marginTop: 4 }}>
          Ebenso entsteht der Provisionsanspruch, wenn der Kontakt zum Käufer noch während der
          Laufzeit dieses Vertrages durch den Makler zustande gekommen ist und die Veräußerung durch
          notariellen Kaufvertrag zu einem späteren Zeitpunkt erfolgt.
        </Text>
        <Fusszeile titel="Maklervertrag" />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>§ 8 Aufwendungsersatz</Text>
        <Text style={styles.text}>
          Gibt/geben die/der Auftraggeberin/Auftraggeber die Verkaufsabsicht vorzeitig (bevor ein
          Käufer benannt wurde) auf oder erschwert/erschweren sie/er die Erfüllung des Auftrages
          durch Änderung der festgelegten Bedingungen, oder kündigt/kündigen widerrechtlich den
          Maklerauftrag, so übernimmt/übernehmen sie/er alle Aufwendungen wie Telefon-, Porto-,
          Inserats-, Reise-, KFZ- und Beschaffungskosten für Unterlagen wie Grundbuchauszug,
          Bauunterlagen, Energieausweis und Lageplan. Der Auftraggeberin/Dem Auftraggeber bleibt der
          Nachweis gestattet, dass dem Makler kein oder ein geringer Schaden entstanden ist.
        </Text>

        <Text style={styles.h2}>§ 9 Salvatorische Klausel</Text>
        <Text style={styles.text}>
          Sollten eine oder mehrere der vorstehenden Vereinbarungen unwirksam sein, so wird die
          Wirksamkeit der übrigen Vertragsvereinbarungen hiervon nicht berührt. Dies gilt auch, wenn
          innerhalb einer Regelung ein Teil unwirksam ist, ein anderer Teil aber wirksam. Die jeweils
          unwirksame Vereinbarung soll zwischen den Parteien durch eine ersetzt werden, die den
          wirtschaftlichen Interessen der Vertragsparteien am nächsten kommt und im Übrigen den
          vertraglichen Vereinbarungen nicht zuwiderläuft. Gerichtsstand ist, soweit gesetzlich
          zulässig, der Geschäftssitz des Maklers.
        </Text>

        <Text style={styles.h2}>§ 10 Datenschutz und Widerrufbelehrung</Text>
        <Text style={styles.text}>
          Der Makler hat bei Erhebung und Verarbeitung von Daten des Auftraggebers die Bestimmungen
          der Datenschutzgesetzes (DSGVO) zu beachten. Die als Anlage 1 dieses Vertrag beigefügte
          Datenschutzerklärung des Maklers ist Bestandteil dieses Maklervertrags und mit diesem fest
          zu verbinden.
        </Text>
        <Text style={{ ...styles.text, marginTop: 4 }}>
          Für den Fall, dass es sich bei dem Kunden um einen Verbraucher gemäß § 13 BGB handelt und
          dieser Vertrag entweder außerhalb der Geschäftsräume des Maklers oder im Wege des
          Fernabsatzes über Fernkommunikationsmittel geschlossen wird, gilt die in Anlage 2 zu diesem
          Vertrag enthaltene Widerrufsbelehrung. Diese Anlage ist zwingender Bestandteil dieses
          Vertrages.
        </Text>

        <Text style={styles.h2}>§ 11 Schriftform</Text>
        <Text style={styles.text}>
          Mündliche Nebenabreden existieren nicht. Änderungen dieses Vertrages bedürfen der
          Textform.
        </Text>

        <Text style={styles.h2}>§ 12 Sonstige Vereinbarungen</Text>
        <Text style={styles.text}>{daten.sonstigeVereinbarungen || "—"}</Text>

        <Text style={styles.h2}>Genehmigung</Text>
        <Text style={styles.text}>
          Dem Makler wird ausdrücklich gestattet, die notwendigen Unterlagen zur erfolgreichen
          Vermarktung einzuholen. Diese Genehmigung bezieht sich auf folgende Unterlagen:
          Grundbuchauszug, Lageplan, Baubeschreibung, Statik, Grundrisse, Schnitte,
          Verwaltungsunterlagen und alle weiteren benötigten Unterlagen, die für den Verkauf des
          Objekts benötigt werden.
        </Text>

        <Text style={styles.h2}>Unterschrift</Text>
        <Text style={styles.text}>
          Ort: {daten.unterschriftOrt || "___________"}   Datum: {daten.unterschriftDatum || "___________"}
        </Text>
        <View style={{ flexDirection: "row", marginTop: 40 }}>
          <View style={{ flex: 1, marginRight: 12, borderTop: `0.5pt solid ${FARBE.asche}`, paddingTop: 4 }}>
            <Text style={styles.small}>Auftraggeberin/Auftraggeber</Text>
          </View>
          <View style={{ flex: 1, borderTop: `0.5pt solid ${FARBE.asche}`, paddingTop: 4 }}>
            <Text style={styles.small}>Maklerin/Makler</Text>
          </View>
        </View>
        <Fusszeile titel="Maklervertrag" />
      </Page>
    </Document>
  );
}
