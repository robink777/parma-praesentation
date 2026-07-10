import Image from "next/image";
import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Icon, IconName } from "@/components/icons/Icon";
import { GOOGLE_BEWERTUNG, KENNZAHLEN, PORTALANFRAGEN_JAHR, STANDORTE, TEAM } from "@/data/unternehmen";
import { Betreuer, Kennzahl } from "@/types";

// Deutsches Tausendertrennzeichen (Punkt) für die live abgerufenen/gepflegten Kennzahlen unten —
// die restlichen KENNZAHLEN-Werte (data/unternehmen.ts) sind bereits fertige Strings.
const zahlenformat = new Intl.NumberFormat("de-DE");

// Icon je Kennzahl-Karte (siehe Icon.tsx, Parma-CI: 24px-Raster, 1,5px Strich, Round Cap,
// einfarbig — hier in Walnuss passend zum fett gesetzten Zahlenwert der Karte). Zuordnung über
// das Label statt über einen zusätzlichen Datenfeld in Kennzahl (types/index.ts), damit
// data/unternehmen.ts als reine Datenquelle ohne UI-Abhängigkeit bestehen bleibt.
const KENNZAHL_ICONS: Record<string, IconName> = {
  "Jahre Erfahrung": "clock",
  Standorte: "location",
  Team: "team",
  "Verkaufte Objekte": "house",
  Kunden: "greeting",
  "Portalanfragen (Jahr)": "globe",
};

// Live-Unternehmenskennzahlen ergänzend zu den statischen KENNZAHLEN (siehe data/unternehmen.ts):
// "Verkaufte Objekte" und "Kunden" kommen live aus OnOffice (siehe
// Praesentation.unternehmenKennzahlen, zaehleVerkaufteObjekte/ladeLetzteKundennummer in
// onoffice/estate.ts) und zeigen "–" statt einer erfundenen Zahl, wenn der jeweilige Abruf
// fehlgeschlagen ist (kennzahlen ist dann null oder das einzelne Feld null). "Portalanfragen
// dieses Jahr" ist NICHT live abrufbar (das Statistik-Modul ist für diesen Account nicht per API
// freigeschaltet, siehe Kommentar bei PORTALANFRAGEN_JAHR) und bleibt daher eine manuell
// gepflegte Konstante.
function liveKennzahlen(
  kennzahlen: { verkaufteObjekte: number | null; kundenNummer: number | null } | null
): Kennzahl[] {
  const verkaufteObjekte = kennzahlen?.verkaufteObjekte;
  const kundenNummer = kennzahlen?.kundenNummer;
  return [
    {
      label: "Verkaufte Objekte",
      wert: typeof verkaufteObjekte === "number" ? zahlenformat.format(verkaufteObjekte) : "–",
    },
    {
      label: "Kunden",
      wert: typeof kundenNummer === "number" ? zahlenformat.format(kundenNummer) : "–",
    },
    { label: "Portalanfragen (Jahr)", wert: zahlenformat.format(PORTALANFRAGEN_JAHR) },
  ];
}

function initialen(name: string) {
  const teile = name.trim().split(/\s+/);
  const erster = teile[0]?.charAt(0) || "";
  const letzter = teile.length > 1 ? teile[teile.length - 1].charAt(0) : "";
  return `${erster}${letzter}`.toUpperCase() || "?";
}

// Team-Bereich zeigt die echten Profilfotos aus OnOffice (siehe ladeAlleMitarbeiter in
// onoffice/estate.ts, Praesentation.alleMitarbeiter), statt wie bisher für jede Person
// dasselbe generische Icon. Die Team-Stammdaten (Name/Rolle/Standort) bleiben die statische
// TEAM-Liste aus data/unternehmen.ts — dort existiert kein Profilfoto-Feld und keine
// OnOffice-Adress-ID, daher erfolgt die Zuordnung über einen Abgleich des vollen Namens
// ("Vorname Nachname") mit Betreuer.vorname + " " + Betreuer.nachname. Findet sich kein
// Treffer (oder ist im Mock-Modus kein Foto hinterlegt), erscheint wie bei Kontaktperson.tsx
// ein Initialen-Avatar statt eines Platzhalterfotos.
function fotoLookup(alleMitarbeiter: Betreuer[]): Record<string, string> {
  const lookup: Record<string, string> = {};
  for (const m of alleMitarbeiter) {
    const voller = [m.vorname, m.nachname].filter(Boolean).join(" ");
    if (voller && m.profilbildUrl) lookup[voller] = m.profilbildUrl;
  }
  return lookup;
}

export function Unternehmen({
  alleMitarbeiter,
  kennzahlen,
}: {
  alleMitarbeiter: Betreuer[];
  kennzahlen: { verkaufteObjekte: number | null; kundenNummer: number | null } | null;
}) {
  const fotos = fotoLookup(alleMitarbeiter);
  const alleKennzahlen = [...KENNZAHLEN, ...liveKennzahlen(kennzahlen)];

  return (
    <SectionShell label="Über uns" title="Parma Immobilien">
      <p className="mb-lg max-w-[65ch] text-body text-anthrazit/90">
        2020 gegründet, um dem Maklerberuf wieder ein seriöses Bild zu geben: Der
        Dienstleistungsgedanke steht bei uns über allem — wir suchen nicht den schnellen
        Abschluss, sondern das beste Ergebnis für alle Beteiligten. Heute sind wir mit einem
        elfköpfigen Team an drei Standorten in der Region Düren für Sie da.
      </p>

      <div className="mb-lg grid grid-cols-2 gap-sm md:grid-cols-3">
        {alleKennzahlen.map((k) => (
          <Card key={k.label} className="text-center">
            {KENNZAHL_ICONS[k.label] && (
              <Icon name={KENNZAHL_ICONS[k.label]} size={28} className="mx-auto mb-xs text-walnuss" />
            )}
            <p className="font-slab text-3xl font-bold text-walnuss">{k.wert}</p>
            <p className="label mt-xs">{k.label}</p>
          </Card>
        ))}
      </div>

      <h3 className="mb-sm">Google-Bewertungen</h3>
      <Card className="mb-lg flex items-center gap-sm">
        <span className="font-slab text-3xl font-bold text-walnuss">
          {GOOGLE_BEWERTUNG.sterne.toLocaleString("de-DE", { minimumFractionDigits: 1 })} ★
        </span>
        <span className="text-body text-anthrazit/70">
          {zahlenformat.format(GOOGLE_BEWERTUNG.anzahlRezensionen)} Rezensionen
        </span>
      </Card>

      <h3 className="mb-sm">Standorte</h3>
      {/* Hauptstandort (Düren, siehe data/unternehmen.ts) wird groß hervorgehoben, mit genau EINEM
          Foto (auf ausdrücklichen Nutzerwunsch Juli 2026 kein Galerie-Raster mehr) — bewusst NICHT
          über die Card-Komponente gebaut, da deren feste p-md/p-lg-Innenabstände dem
          randabschließenden ("edge-to-edge") Bild im Weg stünden. Stattdessen ein eigener
          Container mit identischer Optik (rounded-md bg-stein), aber eigenem Padding: Bild ohne
          Abstand zum Kartenrand oben, Name/Adresse mit normalem Innenabstand darunter.
          Die beiden kompakten Karten darunter nutzen dasselbe grid-cols-2 wie hier implizit die
          volle Breite (siehe Kommentar dort) — dadurch schließen ihre äußeren Kanten bündig mit
          den Rändern dieser Box ab, statt wie zuvor bei grid-cols-3 eine leere dritte Spalte offen
          zu lassen. */}
      {STANDORTE.filter((s) => s.hauptstandort).map((s) => (
        <div key={s.name} className="mb-sm overflow-hidden rounded-md bg-stein">
          {s.bilder && s.bilder.length > 0 && (
            <div className="relative aspect-[21/9] w-full">
              <Image
                src={s.bilder[0]}
                alt={`${s.name} – Büro`}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 66vw, 100vw"
              />
            </div>
          )}
          <div className="flex items-center gap-sm p-md md:p-lg">
            <Icon name="location" />
            <div>
              <span className="font-medium">{s.name}</span>
              <span className="label ml-xs">Hauptstandort</span>
              {s.adresse && <p className="text-small text-anthrazit/70">{s.adresse}</p>}
            </div>
          </div>
        </div>
      ))}

      {/* Übrige Standorte (Kreuzau, Jülich): kompakte Karten mit je einem Foto (siehe
          data/unternehmen.ts) — bewusst grid-cols-2 (genau zwei Standorte), damit die beiden
          Karten zusammen exakt die volle Breite der Hauptstandort-Box oben ausfüllen und bündig
          mit deren Rändern abschließen, statt wie bei grid-cols-3 eine leere dritte Spalte zu
          lassen. Nicht über Card gebaut, aus demselben Grund wie beim Hauptstandort oben
          (Card-Innenabstand würde dem randabschließenden Bild im Weg stehen). */}
      <div className="mb-lg grid grid-cols-1 gap-sm md:grid-cols-2">
        {STANDORTE.filter((s) => !s.hauptstandort).map((s) => (
          <div key={s.name} className="overflow-hidden rounded-md bg-stein">
            {s.bilder && s.bilder.length > 0 && (
              <div className="relative aspect-[21/9] w-full">
                <Image
                  src={s.bilder[0]}
                  alt={`${s.name} – Büro`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
              </div>
            )}
            <div className="flex items-center gap-sm p-md">
              <Icon name="location" />
              <div>
                <span className="font-medium">{s.name}</span>
                {s.adresse && <p className="text-small text-anthrazit/70">{s.adresse}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="mb-sm">Ihr Team</h3>
      <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
        {TEAM.map((t) => (
          <Card key={t.name} className="flex items-center gap-sm">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-sand">
              {fotos[t.name] ? (
                <Image
                  src={fotos[t.name]}
                  alt={t.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-slab text-sm font-bold text-walnuss">
                  {initialen(t.name)}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-small text-anthrazit/70">
                {t.rolle}
                {t.standort ? ` · ${t.standort}` : ""}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </SectionShell>
  );
}
