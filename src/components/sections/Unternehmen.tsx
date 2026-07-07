import Image from "next/image";
import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { KENNZAHLEN, STANDORTE, TEAM } from "@/data/unternehmen";
import { Betreuer } from "@/types";

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

export function Unternehmen({ alleMitarbeiter }: { alleMitarbeiter: Betreuer[] }) {
  const fotos = fotoLookup(alleMitarbeiter);

  return (
    <SectionShell label="Über uns" title="Parma Immobilien">
      <p className="mb-lg max-w-[65ch] text-body text-anthrazit/90">
        2020 gegründet, um dem Maklerberuf wieder ein seriöses Bild zu geben: Der
        Dienstleistungsgedanke steht bei uns über allem — wir suchen nicht den schnellen
        Abschluss, sondern das beste Ergebnis für alle Beteiligten. Heute sind wir mit einem
        elfköpfigen Team an drei Standorten in der Region Düren für Sie da.
      </p>

      <div className="mb-lg grid grid-cols-2 gap-sm md:grid-cols-4">
        {KENNZAHLEN.map((k) => (
          <Card key={k.label} className="text-center">
            <p className="font-slab text-3xl font-bold text-walnuss">{k.wert}</p>
            <p className="label mt-xs">{k.label}</p>
          </Card>
        ))}
      </div>

      <h3 className="mb-sm">Standorte</h3>
      <div className="mb-lg grid grid-cols-1 gap-sm md:grid-cols-3">
        {STANDORTE.map((s) => (
          <Card key={s.name} className="flex items-center gap-sm">
            <Icon name="location" />
            <div>
              <span className="font-medium">{s.name}</span>
              {s.adresse && <p className="text-small text-anthrazit/70">{s.adresse}</p>}
            </div>
          </Card>
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
