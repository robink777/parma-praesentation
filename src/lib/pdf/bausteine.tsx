import { View, Text, StyleSheet } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";
import { LeistungspaketId } from "@/types";
import { RechtsSektion } from "@/data/rechtstexte";

// Gemeinsame Bausteine (Farben, Styles, wiederverwendbare Komponenten/Helfer) für alle
// PDF-Exporte der Präsentation — ursprünglich Teil des einen, alles bündelnden
// MandatDokument.tsx, das auf Chat-Vorgabe September 2026 ("Maklervertrag + Widerruf,
// Leistungsversprechen, Datenschutz — also 3 Dokumente") in eigenständige Dokumente aufgeteilt
// wurde (siehe MaklervertragWiderrufDokument.tsx, LeistungsversprechenDokument.tsx,
// DatenschutzDokument.tsx). Hier zentral, statt in jedem Dokument dupliziert, damit alle Exporte
// optisch identisch bleiben.

// Farbwerte 1:1 aus der Parma-CI-Referenz (Abschnitt 3 · Farbsystem) — siehe parma-design-Skill.
// Walnuss ausschließlich für Text/Linien, Messing sparsam als Einzelakzent pro Seite,
// Stein/Reinweiß tragen die Flächen.
export const FARBE = {
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
export function ladeLogo(): Buffer | undefined {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public/logos/immobilien-quer.png"));
  } catch {
    return undefined;
  }
}

export const styles = StyleSheet.create({
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
  // Zweistufiger Abschnittstitel (kleiner Messing-Kicker + große Walnuss-Überschrift) — siehe
  // AbschnittsTitel unten.
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

export function Fusszeile({ titel }: { titel: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>Parma Immobilien · {titel}</Text>
      <Text render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`} />
    </View>
  );
}

export function AbschnittsTitel({ kicker, titel }: { kicker: string; titel: string }) {
  return (
    <>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.h2}>{titel}</Text>
    </>
  );
}

export function Zeile({ label, wert }: { label: string; wert?: string | number | null }) {
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
export function Formularzeile({ label }: { label: string }) {
  return (
    <View style={styles.formularFeld}>
      <Text style={styles.small}>{label}</Text>
      <View style={styles.formularLinie} />
    </View>
  );
}

// Rendert die Absatz-/Listen-Bausteine einer Datenschutz-Sektion (siehe data/rechtstexte.ts).
export function RechtsBloecke({ sektion }: { sektion: RechtsSektion }) {
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

export function formatiereBetragPdf(betrag?: number): string | undefined {
  if (betrag === undefined || betrag === null) return undefined;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(betrag);
}

export function heute(): string {
  return new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export const LEISTUNGS_SPALTEN: { id: LeistungspaketId; label: string }[] = [
  { id: "basis", label: "Basis" },
  { id: "komfort", label: "Komfort" },
  { id: "premium", label: "Premium" },
];

// Helvetica (Standard-14-PDF-Font, WinAnsi-Encoding) enthält kein Häkchen-Glyph (✓, U+2713) —
// react-pdf rendert das Zeichen dann unsichtbar/leer. Deshalb hier ein ASCII-sicheres "X" statt
// eines Unicode-Symbols, damit "ja" in der Leistungen-Tabelle tatsächlich sichtbar ist.
export function StatusZeichen({ status }: { status: "ja" | "nein" | "optional" }) {
  if (status === "ja") return <Text style={{ fontFamily: "Helvetica-Bold", color: FARBE.messing }}>X</Text>;
  if (status === "optional") return <Text style={{ fontSize: 6.5 }}>optional</Text>;
  return <Text>–</Text>;
}
