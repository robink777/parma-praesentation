import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import {
  Bewertung as BewertungTyp,
  WertermittlungKeyValue,
  WertermittlungMieteinheit,
  WertermittlungRohertragZeile,
  WertermittlungsDaten,
} from "@/types";

function formatEuro(wert?: number) {
  if (wert === undefined) return "—";
  return `${wert.toLocaleString("de-DE")} €`;
}

function KeyValueCard({ titel, items }: { titel?: string; items: WertermittlungKeyValue[] }) {
  return (
    <Card>
      {titel && <p className="label mb-sm">{titel}</p>}
      <dl className="flex flex-col gap-xs">
        {items.map((item) => (
          <div key={item.label} className="grid grid-cols-[1fr_auto] items-baseline gap-x-sm">
            <dt className="text-small text-anthrazit/70">{item.label}</dt>
            <dd className="whitespace-nowrap text-right font-medium text-anthrazit">{item.wert}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function MieteinheitenTabelle({ zeilen }: { zeilen: WertermittlungMieteinheit[] }) {
  return (
    <div className="overflow-x-auto rounded-md bg-stein">
      <table className="w-full min-w-[720px] border-collapse text-small">
        <thead>
          <tr className="border-b border-asche/60 text-left">
            <th className="p-sm font-medium text-anthrazit">Bezeichnung</th>
            <th className="p-sm font-medium text-anthrazit">Nutzung</th>
            <th className="p-sm text-right font-medium text-anthrazit">Fläche</th>
            <th className="p-sm text-right font-medium text-anthrazit">Tats. Miete</th>
            <th className="p-sm font-medium text-anthrazit">Geschosslage</th>
            <th className="p-sm font-medium text-anthrazit">Balkon</th>
            <th className="p-sm font-medium text-anthrazit">Garten</th>
          </tr>
        </thead>
        <tbody>
          {zeilen.map((z, i) => (
            <tr key={i} className="border-b border-asche/30">
              <td className="p-sm text-anthrazit/90">{z.bezeichnung}</td>
              <td className="p-sm text-anthrazit/90">{z.nutzung}</td>
              <td className="p-sm text-right text-anthrazit/90">{z.flaeche} m²</td>
              <td className="p-sm text-right text-anthrazit/90">{formatEuro(z.tatsaechlicheMiete)}</td>
              <td className="p-sm text-anthrazit/90">{z.geschosslage}</td>
              <td className="p-sm text-anthrazit/90">{z.balkon}</td>
              <td className="p-sm text-anthrazit/90">{z.gartennutzung}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RohertragTabelle({ zeilen }: { zeilen: WertermittlungRohertragZeile[] }) {
  return (
    <div className="overflow-x-auto rounded-md bg-stein">
      <table className="w-full min-w-[760px] border-collapse text-small">
        <thead>
          <tr className="border-b border-asche/60 text-left">
            <th className="p-sm font-medium text-anthrazit">Einheit</th>
            <th className="p-sm text-right font-medium text-anthrazit">RND</th>
            <th className="p-sm text-right font-medium text-anthrazit">LZS</th>
            <th className="p-sm text-right font-medium text-anthrazit">Fläche</th>
            <th className="p-sm text-right font-medium text-anthrazit">Tats. Miete €/m²</th>
            <th className="p-sm text-right font-medium text-anthrazit">Tats. Miete €/Jahr</th>
            <th className="p-sm text-right font-medium text-anthrazit">Rohertrag €/m²</th>
            <th className="p-sm text-right font-medium text-anthrazit">Rohertrag €/Jahr</th>
          </tr>
        </thead>
        <tbody>
          {zeilen.map((z, i) => (
            <tr key={i} className="border-b border-asche/30">
              <td className="p-sm text-anthrazit/90">{z.bezeichnung}</td>
              <td className="p-sm text-right text-anthrazit/90">{z.rndJahre}</td>
              <td className="p-sm text-right text-anthrazit/90">{z.lzsProzent.toLocaleString("de-DE")} %</td>
              <td className="p-sm text-right text-anthrazit/90">{z.flaeche} m²</td>
              <td className="p-sm text-right text-anthrazit/90">{z.tatsaechlicheMieteProM2.toLocaleString("de-DE")}</td>
              <td className="p-sm text-right text-anthrazit/90">{formatEuro(z.tatsaechlicheMieteProJahr)}</td>
              <td className="p-sm text-right text-anthrazit/90">{z.angesetzterRohertragProM2.toLocaleString("de-DE")}</td>
              <td className="p-sm text-right text-anthrazit/90">{formatEuro(z.angesetzterRohertragProJahr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WertermittlungsBericht({ w }: { w: WertermittlungsDaten }) {
  return (
    <div className="mt-2xl">
      <p className="label mb-xs">Vollständige Marktpreisermittlung</p>
      <h2 className="mb-sm text-2xl font-bold text-anthrazit">{w.objektart}</h2>
      <p className="mb-lg w-full text-body text-anthrazit/80">
        {w.adresse} · Erstellungsdatum {w.erstellungsdatum} · Wertermittlungsstichtag{" "}
        {w.wertermittlungsstichtag}
      </p>

      <h3 className="mb-sm">Objektbeschreibung</h3>
      <div className="mb-lg grid grid-cols-1 gap-sm md:grid-cols-2">
        <KeyValueCard titel="Grundstück & Lage" items={w.grundstueck} />
        <KeyValueCard titel="Lagescoring (-10 bis 10)" items={w.lagescore} />
      </div>
      <div className="mb-lg">
        <KeyValueCard titel="Gebäudedaten" items={w.gebaeudedaten} />
      </div>

      <h3 className="mb-sm">Mieteinheiten</h3>
      <div className="mb-lg">
        <MieteinheitenTabelle zeilen={w.mieteinheiten} />
      </div>

      <h3 className="mb-sm">Energieeffizienz</h3>
      <Card className="mb-lg">
        {w.energieeffizienz.map((text, i) => (
          <p key={i} className="mb-xs text-body text-anthrazit/90 last:mb-0">
            {text}
          </p>
        ))}
      </Card>

      <h3 className="mb-sm">Gebäudestandard & Modernisierungen</h3>
      <div className="mb-lg grid grid-cols-1 gap-sm md:grid-cols-2">
        <KeyValueCard titel="Gebäudestandard-Merkmale" items={w.gebaeudestandardMerkmale} />
        <KeyValueCard titel="Relevante Modernisierungen" items={w.modernisierungen} />
      </div>
      <p className="mb-lg w-full text-small text-anthrazit/70">
        Resultierender Modernisierungsgrad: {w.modernisierungsgrad}
      </p>

      <h3 className="mb-sm">Bodenwert</h3>
      <div className="mb-lg">
        <KeyValueCard
          items={[
            { label: "Ø Bodenwert", wert: `${w.bodenwert.proM2.toLocaleString("de-DE")} €/m²` },
            { label: "Lage", wert: w.bodenwert.lage },
            { label: "Quelle", wert: w.bodenwert.quelle },
            { label: "Bodenwert Grundstück", wert: formatEuro(w.bodenwert.grundstueck) },
            { label: "Bodenwert insgesamt", wert: formatEuro(w.bodenwert.gesamt) },
          ]}
        />
      </div>

      <h3 className="mb-sm">Gebäudestandard & Restnutzungsdauer</h3>
      <div className="mb-lg grid grid-cols-1 gap-sm md:grid-cols-2">
        <KeyValueCard
          titel="Standardstufe & Nutzungsdauer"
          items={[
            { label: "Standardstufe", wert: w.gebaeudestandardRnd.standardstufe.toLocaleString("de-DE") },
            { label: "Baujahr", wert: String(w.gebaeudestandardRnd.baujahr) },
            { label: "Gesamtnutzungsdauer (GND)", wert: `${w.gebaeudestandardRnd.gnd} Jahre` },
            { label: "Restnutzungsdauer (RND)", wert: `${w.gebaeudestandardRnd.rnd} Jahre` },
          ]}
        />
        <KeyValueCard titel="NHK-Ermittlung" items={w.nhkErmittlung} />
      </div>
      <p className="mb-lg w-full text-small text-anthrazit/70">
        Gebäudesachwert insgesamt (Zwischenwert, NHK-Verfahren): {formatEuro(w.gebaeudesachwertGesamt)}
      </p>

      <h3 className="mb-sm">Ertragswertermittlung — Rohertrag im Marktwert</h3>
      <div className="mb-lg">
        <RohertragTabelle zeilen={w.rohertrag} />
        <p className="mt-sm text-small text-anthrazit/70">
          Gesamt: {w.rohertragGesamt.flaeche} m² · {w.rohertragGesamt.einheiten} Wohneinheiten · tatsächliche
          Miete {formatEuro(w.rohertragGesamt.tatsaechlichProJahr)}/Jahr · angesetzter Rohertrag{" "}
          {formatEuro(w.rohertragGesamt.angesetztProJahr)}/Jahr
        </p>
      </div>

      <div className="mb-lg grid grid-cols-1 gap-sm md:grid-cols-2">
        <KeyValueCard
          titel="Vergleichsmiete Wohnen"
          items={[
            { label: "Nachhaltig erzielbare Nettokaltmiete", wert: `${w.vergleichsmiete.wert.toLocaleString("de-DE")} €/m²` },
            { label: "Quelle", wert: w.vergleichsmiete.quelle },
            { label: "Stichtag", wert: w.vergleichsmiete.stichtag },
            { label: "Spanne", wert: w.vergleichsmiete.spanne },
          ]}
        />
        <KeyValueCard
          titel="Liegenschaftszinssatz Mehrfamilienhaus"
          items={[
            { label: "Liegenschaftszinssatz", wert: `${w.liegenschaftszins.wert.toLocaleString("de-DE")} %` },
            { label: "Quelle", wert: w.liegenschaftszins.quelle },
            { label: "Stichtag", wert: w.liegenschaftszins.stichtag },
            { label: "Standardfehler", wert: w.liegenschaftszins.standardfehler },
            { label: "95 %-Konfidenzintervall", wert: w.liegenschaftszins.konfidenzintervall },
          ]}
        />
      </div>

      <h3 className="mb-sm">Ertragswertberechnung</h3>
      <div className="mb-lg">
        <KeyValueCard items={w.ertragswertBerechnung} />
      </div>

      <h3 className="mb-sm">Wertermittlungsergebnisse</h3>
      <div className="mb-lg grid grid-cols-1 gap-sm md:grid-cols-3">
        <Card>
          <p className="label mb-xs">Bodenwert</p>
          <p className="font-slab text-2xl font-bold text-walnuss">{formatEuro(w.ergebnis.bodenwert)}</p>
          {w.ergebnis.bodenwertProM2 && (
            <p className="mt-xs text-small text-anthrazit/60">
              ({w.ergebnis.bodenwertProM2.toLocaleString("de-DE")} €/m²)
            </p>
          )}
        </Card>
        <Card>
          <p className="label mb-xs">Ertragswert</p>
          <p className="font-slab text-2xl font-bold text-walnuss">{formatEuro(w.ergebnis.ertragswert)}</p>
          {w.ergebnis.ertragswertProM2 && (
            <p className="mt-xs text-small text-anthrazit/60">
              ({w.ergebnis.ertragswertProM2.toLocaleString("de-DE")} €/m²
              {w.ergebnis.vervielfaeltiger ? ` · ${w.ergebnis.vervielfaeltiger}` : ""})
            </p>
          )}
        </Card>
        <Card>
          <p className="label mb-xs">Sachwert</p>
          <p className="font-slab text-2xl font-bold text-walnuss">{formatEuro(w.ergebnis.sachwert)}</p>
          <p className="mt-xs text-small text-anthrazit/60">nicht gerechnet (Ertragswertverfahren gewählt)</p>
        </Card>
      </div>
      <div className="mb-lg grid grid-cols-1 gap-sm md:grid-cols-2">
        <Card>
          <p className="label mb-xs">Vergleichswert (indirekt)</p>
          <p className="text-body text-anthrazit/80">{w.ergebnis.vergleichswertIndirekt}</p>
        </Card>
        <Card>
          <p className="label mb-xs">Vergleichswert (direkt)</p>
          <p className="text-body text-anthrazit/80">{w.ergebnis.vergleichswertDirekt}</p>
        </Card>
      </div>
      <Card className="mb-lg border-2 border-messing">
        <p className="label mb-xs">Geschätzter Marktpreis</p>
        <p className="font-slab text-4xl font-extrabold text-anthrazit">
          {formatEuro(w.ergebnis.geschaetzterMarktpreis)}
        </p>
        <p className="mt-xs text-small text-anthrazit/60">
          {w.ergebnis.vervielfaeltiger} · Stand: {w.ergebnis.geschaetzterMarktpreisStichtag}
        </p>
      </Card>

      <h3 className="mb-sm">Ergänzende Erläuterungen</h3>
      <div className="mb-lg flex flex-col gap-sm">
        {w.erlaeuterungen.map((e) => (
          <Card key={e.titel}>
            <p className="mb-xs font-medium text-anthrazit">{e.titel}</p>
            <p className="text-small text-anthrazit/80">{e.text}</p>
          </Card>
        ))}
      </div>

      <p className="mb-md flex items-start gap-xs text-small text-anthrazit/50">
        <Icon name="document" size={16} className="mt-[2px] shrink-0" />
        {w.haftungsausschluss}
      </p>
    </div>
  );
}

export function Bewertung({ bewertung }: { bewertung: BewertungTyp }) {
  return (
    <SectionShell label="Bewertung" title="Was ist Ihre Immobilie wert?">
      <div className="mb-lg grid grid-cols-1 gap-sm md:grid-cols-3">
        <Card>
          <p className="label mb-xs">Sachwert</p>
          <p className="font-slab text-3xl font-bold text-walnuss">{formatEuro(bewertung.sachwert)}</p>
        </Card>
        <Card>
          <p className="label mb-xs">Ertragswert</p>
          <p className="font-slab text-3xl font-bold text-walnuss">{formatEuro(bewertung.ertragswert)}</p>
        </Card>
        <Card>
          <p className="label mb-xs">Vergleichswert</p>
          <p className="font-slab text-3xl font-bold text-walnuss">{formatEuro(bewertung.vergleichswert)}</p>
        </Card>
      </div>

      <Card className="mb-lg border-2 border-messing">
        <p className="label mb-xs">Empfohlener Angebotspreis</p>
        <p className="font-slab text-4xl font-extrabold text-anthrazit">
          {formatEuro(bewertung.empfohlenerAngebotspreis)}
        </p>
        {bewertung.stand && (
          <p className="mt-xs text-small text-anthrazit/60">Stand: {bewertung.stand}</p>
        )}
      </Card>

      {bewertung.pdfUrl && (
        <a
          href={bewertung.pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-md inline-flex items-center gap-xs text-body text-walnuss underline underline-offset-4"
        >
          <Icon name="document" size={18} />
          Vollständiges Wertgutachten (PDF) öffnen
        </a>
      )}

      {bewertung.wertermittlung ? (
        <p className="mb-md max-w-[60ch] text-small text-anthrazit/60">
          Diese Bewertung wurde aus der Sprengnetter-Marktpreisermittlung (Word-Export) 1:1
          übernommen — aktuell noch manuell eingelesen. Perspektivisch soll dieser Schritt
          automatisiert werden.
        </p>
      ) : (
        !bewertung.berechnetAutomatisch && (
          <p className="max-w-[60ch] text-small text-anthrazit/60">
            Diese Bewertung stammt aktuell aus dem hinterlegten Gutachten. Sobald Wohnfläche,
            Baujahr und Modernisierungsstand vollständig in OnOffice gepflegt sind, wird sie an
            dieser Stelle automatisch berechnet.
          </p>
        )
      )}

      {bewertung.wertermittlung && <WertermittlungsBericht w={bewertung.wertermittlung} />}
    </SectionShell>
  );
}
