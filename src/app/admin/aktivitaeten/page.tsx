import Image from "next/image";
import Link from "next/link";
import { AktivitaetenListe } from "@/components/admin/AktivitaetenListe";

// Detailseite hinter einer Mitarbeiter-Kachel (siehe components/admin/MitarbeiterBereich.tsx),
// Aufbau wie app/admin/neuzugaenge/page.tsx. Die Daten lädt AktivitaetenListe selbst nach.
export default async function AktivitaetenPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; reiter?: string }>;
}) {
  const { name = "", reiter } = await searchParams;

  return (
    <div className="min-h-screen bg-stein">
      <header className="flex items-center gap-sm px-lg py-sm">
        <Image src="/logos/immobilien-quer.svg" alt="Parma Immobilien" width={104} height={26} priority />
        <div className="h-5 w-px bg-walnuss/15" />
        <p className="label">Admin-Bereich</p>
      </header>
      <main className="mx-auto max-w-content px-lg pb-xl">
        <Link
          href={`/admin?abschnitt=mitarbeiter${reiter ? `&reiter=${encodeURIComponent(reiter)}` : ""}`}
          prefetch={false}
          className="mb-md inline-block text-small text-anthrazit/60 hover:text-anthrazit"
        >
          ← Zurück zu den Mitarbeitern
        </Link>
        <h1 className="mb-xs font-slab text-2xl font-bold text-anthrazit">Aktivitäten von {name || "–"}</h1>
        <p className="mb-md max-w-[65ch] text-body text-anthrazit/60">
          Alle Einträge aus dem OnOffice-Maklerbuch mit Bemerkung, Art und Kontakt. „Gespeichert am“ erscheint, wenn
          ein Eintrag mindestens 10 Minuten nach dem angegebenen Zeitpunkt zuletzt gespeichert wurde.
        </p>
        <AktivitaetenListe name={name} />
      </main>
    </div>
  );
}
