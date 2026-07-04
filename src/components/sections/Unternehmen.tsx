import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { KENNZAHLEN, STANDORTE, TEAM } from "@/data/unternehmen";

export function Unternehmen() {
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
            <Icon name="greeting" />
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
