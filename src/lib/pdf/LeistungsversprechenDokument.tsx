import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { LeistungspaketId } from "@/types";
import {
  LEISTUNGSKATEGORIEN,
  LEISTUNGSPAKETE,
  LEISTUNGS_KENNZAHLEN,
  RAHMENBEDINGUNGEN,
} from "@/data/leistungsversprechen";
import { FARBE, styles, ladeLogo, Fusszeile, LEISTUNGS_SPALTEN, StatusZeichen } from "./bausteine";

// Eigenständiges Dokument "Leistungsversprechen" (Chat-Vorgabe September 2026: "Maklervertrag +
// Widerruf, Leistungsversprechen, Datenschutz — also 3 Dokumente") — vorher Teil des einen,
// alle vier Bestandteile bündelnden MandatDokument.tsx.
export interface LeistungsversprechenDokumentProps {
  gewaehltesPaket?: LeistungspaketId;
}

export function LeistungsversprechenDokument({ gewaehltesPaket }: LeistungsversprechenDokumentProps) {
  const logo = ladeLogo();

  return (
    <Document title="Leistungsversprechen Parma Immobilien">
      <Page size="A4" style={styles.page}>
        {logo && <Image src={logo} style={styles.logo} />}
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
    </Document>
  );
}
