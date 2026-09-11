import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import {
  Betreuer,
  Bewertung,
  Immobilie,
  Kunde,
  LeistungspaketId,
  MaklervertragDaten,
} from "@/types";
import { LEISTUNGSPAKETE, LEISTUNGS_KENNZAHLEN, RAHMENBEDINGUNGEN } from "@/data/leistungsversprechen";
import { MAKLER_KONTAKT } from "@/data/makler";
import { berechneMittelwerte } from "@/lib/vergleichswert";
import { FARBE, styles, ladeLogo, Fusszeile, Zeile, formatiereBetragPdf, heute } from "./bausteine";

// Zusammenfassende Gesamtpräsentation als PDF (Chat-Vorgabe September 2026: "... Gesamtpräsentation
// als pdf" als vierter Download auf der Verabschiedungsseite, siehe Verabschiedung.tsx) — fasst
// die wesentlichen Inhalte der interaktiven Präsentation (Begrüßung/Kontakt, Objektdaten,
// Bewertung, Leistungsversprechen, Vergleichsobjekte) auf wenigen Seiten zusammen. Bewusst KEINE
// 1:1-Reproduktion jedes interaktiven Reiters (z.B. Käuferverhalten, DeepImmo, Preis des
// Wartens bleiben außen vor) — der vollständige Maklervertrag inkl. Widerruf liegt ohnehin als
// eigenes Dokument vor (siehe MaklervertragWiderrufDokument.tsx) und wird hier nur referenziert,
// nicht dupliziert.
export interface GesamtpraesentationDokumentProps {
  kunde: Kunde;
  weitereEigentuemer: Kunde[];
  immobilie: Immobilie;
  bewertung: Bewertung;
  betreuer?: Betreuer;
  daten: MaklervertragDaten;
  gewaehltesPaket?: LeistungspaketId;
  referenzobjekte: Immobilie[];
}

export function GesamtpraesentationDokument({
  kunde,
  weitereEigentuemer,
  immobilie,
  bewertung,
  betreuer,
  daten,
  gewaehltesPaket,
  referenzobjekte,
}: GesamtpraesentationDokumentProps) {
  const logo = ladeLogo();
  const kundenNamen = [kunde, ...weitereEigentuemer]
    .map((k) => [k.anrede, k.vorname, k.nachname].filter(Boolean).join(" "))
    .filter(Boolean);
  const objektAdresse = [immobilie.strasse, [immobilie.plz, immobilie.ort].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  const gewaehltesPaketDaten = LEISTUNGSPAKETE.find((p) => p.id === gewaehltesPaket);
  const mittelwerte = referenzobjekte.length > 0 ? berechneMittelwerte(referenzobjekte) : null;
  const hochgerechneterWert =
    mittelwerte?.preisProM2 !== undefined && immobilie.wohnflaeche
      ? mittelwerte.preisProM2 * immobilie.wohnflaeche
      : undefined;

  return (
    <Document title={`Gesamtpräsentation ${kundenNamen[0] || "Parma Immobilien"}`.trim()}>
      {/* Deckblatt */}
      <Page size="A4" style={styles.page}>
        {logo && <Image src={logo} style={styles.logo} />}
        <Text style={styles.label}>Objektpräsentation</Text>
        <Text style={styles.h1}>{immobilie.bezeichnung || objektAdresse || "Ihre Immobilie"}</Text>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          <View style={{ ...styles.card, flex: 1, marginRight: 6 }}>
            <Text style={{ ...styles.small, fontFamily: "Courier", marginBottom: 4 }}>
              VERKÄUFER/IN · AUFTRAGGEBER/IN
            </Text>
            {kundenNamen.map((name) => (
              <Text key={name} style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>
                {name}
              </Text>
            ))}
          </View>
          <View style={{ ...styles.card, flex: 1 }}>
            <Text style={{ ...styles.small, fontFamily: "Courier", marginBottom: 4 }}>IHR ANSPRECHPARTNER</Text>
            <Text style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>
              {betreuer ? [betreuer.anrede, betreuer.vorname, betreuer.nachname].filter(Boolean).join(" ") : MAKLER_KONTAKT.name}
            </Text>
            <Text style={styles.text}>{betreuer?.telefon || MAKLER_KONTAKT.telefon}</Text>
            <Text style={styles.text}>{betreuer?.email || MAKLER_KONTAKT.email}</Text>
          </View>
        </View>
        <Text style={{ ...styles.small, marginTop: 24 }}>Erstellt am {heute()}</Text>
        <Fusszeile titel="Gesamtpräsentation" />
      </Page>

      {/* Objektdaten */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.label}>Objektdaten</Text>
        <Text style={styles.h2}>{immobilie.bezeichnung || objektAdresse}</Text>
        <Zeile label="Adresse" wert={objektAdresse} />
        <Zeile label="Objektart" wert={immobilie.objektart} />
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
        <Zeile label="Marktwertschätzung" wert={formatiereBetragPdf(bewertung.marktwertPH)} />
        <Zeile label="Empfohlener Angebotspreis" wert={formatiereBetragPdf(bewertung.empfohlenerAngebotspreis)} />
        <Zeile label="Stand der Wertermittlung" wert={bewertung.stand} />
        <Fusszeile titel="Gesamtpräsentation" />
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

        {gewaehltesPaketDaten && (
          <>
            <Text style={styles.badge}>Gewähltes Paket</Text>
            <Text style={{ ...styles.h2, marginTop: 0 }}>
              {gewaehltesPaketDaten.name} · {gewaehltesPaketDaten.provisionProzent.toLocaleString("de-DE")} %
            </Text>
            <Text style={{ ...styles.text, marginBottom: 8 }}>{gewaehltesPaketDaten.beschreibung}</Text>
            {gewaehltesPaketDaten.highlights.map((h) => (
              <Text key={h} style={{ ...styles.text, marginBottom: 2 }}>
                · {h}
              </Text>
            ))}
          </>
        )}

        <Text style={styles.h2}>Rahmenbedingungen</Text>
        {RAHMENBEDINGUNGEN.map((r) => (
          <View key={r.nummer} style={{ marginBottom: 4 }}>
            <Text style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>
              § {r.nummer} · {r.titel}
            </Text>
            <Text style={styles.small}>{r.text}</Text>
          </View>
        ))}
        <Fusszeile titel="Gesamtpräsentation" />
      </Page>

      {/* Vergleichsobjekte */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.label}>Marktvergleich</Text>
        <Text style={styles.h1}>Vergleichbare Objekte</Text>

        {mittelwerte && (
          <View style={{ ...styles.card, marginBottom: 12 }}>
            <Text style={{ ...styles.small, fontFamily: "Courier", marginBottom: 6 }}>
              MITTELWERTE AUS {referenzobjekte.length} OBJEKT{referenzobjekte.length === 1 ? "" : "EN"}
            </Text>
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.small}>Ø Kaufpreis</Text>
                <Text style={{ ...styles.h3, marginTop: 0 }}>
                  {mittelwerte.kaufpreis !== undefined ? formatiereBetragPdf(Math.round(mittelwerte.kaufpreis)) : "—"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.small}>Ø Wohnfläche</Text>
                <Text style={{ ...styles.h3, marginTop: 0 }}>
                  {mittelwerte.wohnflaeche !== undefined ? `${Math.round(mittelwerte.wohnflaeche)} m²` : "—"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.small}>Ø Preis/m²</Text>
                <Text style={{ ...styles.h3, marginTop: 0 }}>
                  {mittelwerte.preisProM2 !== undefined
                    ? `${Math.round(mittelwerte.preisProM2).toLocaleString("de-DE")} €/m²`
                    : "—"}
                </Text>
              </View>
            </View>
            {hochgerechneterWert !== undefined && (
              <Text style={{ ...styles.text, marginTop: 8 }}>
                Hochgerechneter Wert für Ihr Objekt ({immobilie.wohnflaeche} m²):{" "}
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{formatiereBetragPdf(Math.round(hochgerechneterWert))}</Text>
              </Text>
            )}
          </View>
        )}

        {referenzobjekte.length === 0 ? (
          <Text style={styles.text}>Für diese Präsentation wurden keine Vergleichsobjekte ausgewählt.</Text>
        ) : (
          referenzobjekte.map((objekt) => (
            <View key={objekt.id} style={{ ...styles.zeile, flexDirection: "column", paddingVertical: 6 }} wrap={false}>
              <Text style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>{objekt.bezeichnung}</Text>
              <Text style={styles.small}>
                {[objekt.plz, objekt.ort].filter(Boolean).join(" ")}
                {!!objekt.wohnflaeche && ` · ${objekt.wohnflaeche} m²`}
                {!!objekt.baujahr && ` · Baujahr ${objekt.baujahr}`}
              </Text>
              <Text style={{ ...styles.text, color: FARBE.walnuss }}>
                {formatiereBetragPdf(objekt.kaufpreis)}
                {objekt.verkauftAm
                  ? ` · Verkauft am ${new Date(objekt.verkauftAm).toLocaleDateString("de-DE")}`
                  : objekt.status2 === "aktive_vermarktung"
                    ? " · Aktuell in Vermarktung"
                    : ""}
              </Text>
            </View>
          ))
        )}
        <Fusszeile titel="Gesamtpräsentation" />
      </Page>

      {/* Abschluss */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.label}>Nächste Schritte</Text>
        <Text style={styles.h1}>Vielen Dank für Ihre Zeit!</Text>
        <Text style={styles.absatz}>
          Der vollständige Maklervertrag inklusive Widerrufsbelehrung sowie unsere
          Datenschutzerklärung liegen Ihnen als eigenständige Dokumente vor.
        </Text>
        {daten.unterschriftOrt || daten.unterschriftDatum ? (
          <Text style={styles.absatz}>
            Vereinbart am {daten.unterschriftDatum || "___________"} in {daten.unterschriftOrt || "___________"}.
          </Text>
        ) : null}

        <Text style={styles.h2}>Ihr Ansprechpartner</Text>
        <Text style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>
          {betreuer ? [betreuer.anrede, betreuer.vorname, betreuer.nachname].filter(Boolean).join(" ") : MAKLER_KONTAKT.name}
        </Text>
        <Text style={styles.text}>{MAKLER_KONTAKT.unternehmen}</Text>
        <Text style={styles.text}>{MAKLER_KONTAKT.strasse}</Text>
        <Text style={styles.text}>{MAKLER_KONTAKT.plzOrt}</Text>
        <Text style={styles.text}>{betreuer?.telefon || MAKLER_KONTAKT.telefon}</Text>
        <Text style={styles.text}>{betreuer?.email || MAKLER_KONTAKT.email}</Text>
        <Fusszeile titel="Gesamtpräsentation" />
      </Page>
    </Document>
  );
}
