import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { MAKLER_KONTAKT } from "@/data/makler";
import { DATENSCHUTZ_SEKTIONEN } from "@/data/rechtstexte";
import { styles, ladeLogo, Fusszeile, AbschnittsTitel, RechtsBloecke } from "./bausteine";

// Eigenständiges Dokument "Datenschutzerklärung" (Chat-Vorgabe September 2026: "Maklervertrag +
// Widerruf, Leistungsversprechen, Datenschutz — also 3 Dokumente") — vorher Teil des einen,
// alle vier Bestandteile bündelnden MandatDokument.tsx.
export function DatenschutzDokument() {
  const logo = ladeLogo();

  return (
    <Document title="Datenschutzerklärung Parma Immobilien">
      <Page size="A4" style={styles.page}>
        {logo && <Image src={logo} style={styles.logo} />}
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
