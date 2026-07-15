import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";

// Eigenständiger Navigationspunkt (siehe nav.ts) — ursprünglich als Unterpunkt von "DeepImmo"
// angelegt, auf Nutzerkorrektur hin aber wieder gleichrangig eingeordnet. Inhalt/Zahlen stammen
// 1:1 aus der Chat-Vorgabe (Beschreibung der vier Phasen sowie
// "in der ersten Phase starten 10, in der 3. Phase steigen 8 von 10 Leute aus, kaufen tun nur
// 2") — die Prozentwerte je Phase (100/95/30/20) entsprechen dem vom Nutzer als Referenz
// mitgeschickten Schaubild ("4 Phasen des Käufers").
interface Phase {
  nummer: string;
  titel: string;
  beschreibung: string;
  anteil: number;
}

const PHASEN: Phase[] = [
  {
    nummer: "01",
    titel: "Kaufwunsch",
    beschreibung: 'Die Idee des Traumhauses wird geboren – "am besten gleich neu bauen".',
    anteil: 100,
  },
  {
    nummer: "02",
    titel: "Markteintritt",
    beschreibung:
      "Jedes neue Angebot wird besichtigt. Aus Unerfahrenheit, was realistisch leistbar ist, geraten dabei auch Objekte außerhalb des eigenen Budgets in den Blick.",
    anteil: 95,
  },
  {
    nummer: "03",
    titel: "Realisierung",
    beschreibung:
      "Die Ernüchterung: Die Traumimmobilie gibt es nicht – zumindest nicht zu dem Preis, den sich die Kaufinteressenten erhofft haben.",
    anteil: 30,
  },
  {
    nummer: "04",
    titel: "Kompromiss",
    beschreibung:
      "Der Kunde wird flexibler: Objekttyp oder sogar Objektart, Lage und ab und an auch das Budget werden angepasst.",
    anteil: 20,
  },
];

export function Kaeuferverhalten() {
  return (
    <SectionShell label="DeepImmo" title="Käuferverhalten im Kaufprozess">
      <p className="mb-lg max-w-[65ch] text-body text-anthrazit/80">
        Von zehn Kaufinteressenten, die mit dem Wunsch nach der eigenen Immobilie starten, steigen
        bis zur Realisierungsphase acht wieder aus dem Prozess aus. Gekauft wird am Ende nur von
        zweien.
      </p>

      <div className="grid grid-cols-1 gap-sm sm:grid-cols-2 lg:grid-cols-4">
        {PHASEN.map((phase) => (
          <Card key={phase.nummer} className="text-center">
            <div className="mx-auto mb-sm flex h-14 w-14 items-center justify-center rounded-full bg-walnuss text-reinweiss">
              <Icon name="chevronRight" size={22} />
            </div>
            <p className="font-slab text-2xl font-bold text-walnuss">{phase.anteil}%</p>
            <p className="label mt-xs">
              {phase.nummer} · {phase.titel}
            </p>
            <p className="mt-sm text-small text-anthrazit/70">{phase.beschreibung}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-lg border-2 border-messing text-center">
        <p className="font-slab text-3xl font-bold text-walnuss">2 von 10</p>
        <p className="label mt-xs">Kaufinteressenten kaufen am Ende tatsächlich</p>
      </Card>
    </SectionShell>
  );
}
