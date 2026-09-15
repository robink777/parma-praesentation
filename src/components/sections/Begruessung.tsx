import { SectionShell } from "@/components/layout/SectionShell";
import { Kunde } from "@/types";
import Image from "next/image";

// Bewusst kein Objektfoto: Der Empfang soll ein ruhiges, einladendes "Eintreten in den
// Raum" vermitteln, nicht schon auf die Immobilie des Kunden verweisen — das folgt erst
// in den späteren Sektionen (Objektdaten, Bewertung etc.).
// Neues Teamfoto (September 2026, vom Nutzer bereitgestellt, foto-kleer.de) — ersetzt das
// vorherige externe WordPress-Bild, lokal unter public/team/ abgelegt statt extern verlinkt
// (analog zu den Standort-Fotos in public/standorte/, siehe data/unternehmen.ts).
const WILLKOMMENSBILD = "/team/team-1.jpg";

// Kurzform pro Person (z.B. "Herr Mustermann") — bewusst ohne Vorname: Bei mehreren
// Eigentümern/innen (Miteigentum, Erbengemeinschaft) stehen die Namen untereinander (siehe
// Rendering unten), ein vollständiger Name pro Zeile wäre dort unnötig lang.
function formatiereName(kunde: Kunde): string {
  return [kunde.anrede, kunde.nachname].filter(Boolean).join(" ");
}

export function Begruessung({
  kunde,
  weitereEigentuemer = [],
}: {
  kunde: Kunde;
  // Bei Miteigentum (z.B. Ehepaar) oder einer Erbengemeinschaft können mehrere Eigentümer/innen
  // an einem Objekt hinterlegt sein (siehe Praesentation.weitereEigentuemer, lib/praesentation.ts)
  // — die Begrüßung soll dann alle namentlich ansprechen, nicht nur die erste gefundene Person.
  weitereEigentuemer?: Kunde[];
}) {
  const namen = [kunde, ...weitereEigentuemer].map(formatiereName).filter(Boolean);

  return (
    <SectionShell label="Willkommen" title="Herzlich Willkommen!">
      {namen.length > 0 && (
        <div className="mb-lg">
          {namen.map((name, i) => (
            <p key={i} className="text-lg font-slab leading-[1.4] text-anthrazit">
              {name}
            </p>
          ))}
        </div>
      )}
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
