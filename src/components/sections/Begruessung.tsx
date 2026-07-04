import { SectionShell } from "@/components/layout/SectionShell";
import { Kunde } from "@/types";
import Image from "next/image";

// Bewusst kein Objektfoto: Der Empfang soll ein ruhiges, einladendes "Eintreten in den
// Raum" vermitteln, nicht schon auf die Immobilie des Kunden verweisen — das folgt erst
// in den späteren Sektionen (Objektdaten, Bewertung etc.).
const WILLKOMMENSBILD =
  "https://www.parmaimmobilien.de/wp-content/uploads/2025/09/fotokleer_207-KOpie-scaled.jpg";

export function Begruessung({ kunde }: { kunde: Kunde }) {
  const name = [kunde.anrede, kunde.vorname, kunde.nachname].filter(Boolean).join(" ");

  return (
    <SectionShell label="Willkommen" title={`Herzlich willkommen, ${name || "bei Parma Immobilien"}`}>
      <p className="mb-lg max-w-[60ch] text-lg font-slab leading-[1.4] text-anthrazit">
        Schön, dass Sie da sind. Heute sprechen wir gemeinsam über Ihre Immobilie — in Ruhe,
        mit allen Zahlen auf dem Tisch.
      </p>

      <div className="relative h-72 w-full overflow-hidden rounded-md md:h-96">
        <Image
          src={WILLKOMMENSBILD}
          alt="Willkommen bei Parma Immobilien"
          fill
          priority
          className="object-cover"
        />
      </div>
    </SectionShell>
  );
}
