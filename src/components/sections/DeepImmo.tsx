import Image from "next/image";
import { SectionShell } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { Immobilie } from "@/types";

// Fallback, falls für das Objekt (noch) kein individueller Link gepflegt ist (siehe
// deepImmoLink-Kommentar in types/index.ts) — auf Kundenwunsch (Juli 2026) die allgemeine
// DeepImmo-Startseite statt eines Leerzustands, da das Individualfeld objektspezifisch erst
// nach und nach in OnOffice befüllt wird und der Reiter bis dahin trotzdem einen sinnvollen
// Klick-Link zeigen soll.
const DEEPIMMO_DEFAULT_LINK = "https://realestateos.deepimmo.com/";

// Ein echtes Live-Preview der Zielseite (z.B. per iframe) ist hier bewusst NICHT umgesetzt:
// realestateos.deepimmo.com liefert serverseitig nur ein leeres <div id="root"> ohne
// og:image/og:title (live per curl geprüft, Juli 2026) — der komplette Seiteninhalt wird
// clientseitig per JS nachgeladen. Zusätzlich ist die eigentliche Objekt-Ansicht ("Real Estate
// OS" für Makler) ihrer Natur nach ein Login-geschütztes Fachtool, kein öffentliches Exposé —
// ein eingebetteter Frame würde also bestenfalls leer bleiben, schlimmstenfalls einen
// Login-Bildschirm mitten in der Kundenpräsentation zeigen. Stattdessen (siehe Nutzeranfrage:
// "wenn hinter Login, nimm etwas anderes von DeepImmo") baut die Karte unten eine eigene
// Vorschau aus echten, öffentlich abrufbaren DeepImmo-Markenelementen: Logo, Produktname und
// Tagline stammen 1:1 von der öffentlichen DeepImmo-Startseite (Meta-Description dort, Juli
// 2026 geprüft) statt einer erfundenen Beschreibung. Das Logo liegt als lokale Kopie unter
// public/logos/partner/deepimmo-icon.svg (Original: realestateos.deepimmo.com/favicon.svg).
const DEEPIMMO_TAGLINE = "Hybride Makler-Intelligenz für bessere Entscheidungen. Und beste Ergebnisse.";

// Zeigt den objektspezifischen DeepImmo-Link (OnOffice-Individualfeld "DeepImmo-Link" unter
// "Technische Daten", Feldkatalog-Id ind_3450_Feld_ObjTech540 — siehe mapping.ts). Der Kunde hat
// das Feld im Juli 2026 selbst angelegt und pflegt es objektspezifisch manuell nach — bei den
// meisten Objekten (Stand Juli 2026, live gegen den Account geprüft: 0 von 0 getesteten Objekten
// befüllt) ist es daher noch leer; in diesem Fall greift DEEPIMMO_DEFAULT_LINK oben, damit der
// Reiter nie einen reinen Leerzustand ohne Klick-Ziel zeigt.
//
// "Miniaturansicht" (siehe Nutzeranfrage) wird als kompakte Link-Vorschaukarte umgesetzt
// (ähnlich einer Link-Unfurl-Karte, wie man sie aus Messengern kennt) — ein Klick auf die Karte
// öffnet den vollständigen Link per target="_blank" in einem neuen Tab.
export function DeepImmo({ immobilie }: { immobilie: Immobilie }) {
  const link = immobilie.deepImmoLink || DEEPIMMO_DEFAULT_LINK;

  return (
    <SectionShell label="DeepImmo" title="DeepImmo-Verknüpfung">
      <a href={link} target="_blank" rel="noopener noreferrer" className="group block max-w-[480px]">
        {/* Eigener Card-Aufbau statt der gemeinsamen <Card>-Komponente: die dort fest
            vorgegebene Innen-Polsterung (p-md/md:p-lg) lässt sich per zusätzlicher Klasse nicht
            zuverlässig auf 0 überschreiben (beide Utilities setzen dieselbe CSS-Eigenschaft,
            die Reihenfolge im class-String bestimmt in Tailwind NICHT die Kaskade) — hier wird
            aber ein randloser Kopfbereich (Logo-Leiste) benötigt, umgeben von eigener Polsterung
            nur im unteren Textbereich. */}
        <div className="overflow-hidden rounded-md border-2 border-transparent bg-stein transition-colors group-hover:border-messing">
          <div className="flex items-center gap-sm bg-[#202c44] px-md py-md">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-reinweiss">
              <Image
                src="/logos/partner/deepimmo-icon.svg"
                alt="DeepImmo Logo"
                width={22}
                height={23}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate font-slab text-lg font-bold text-reinweiss">DeepImmo</p>
              <p className="truncate text-small text-reinweiss/70">Real Estate OS®</p>
            </div>
          </div>

          <div className="p-md">
            <p className="mb-sm text-small text-anthrazit/70">{DEEPIMMO_TAGLINE}</p>
            <div className="flex items-center gap-xs">
              <Icon name="externalLink" size={16} className="shrink-0 text-anthrazit/40" />
              <p className="truncate font-mono text-small text-anthrazit/60">{link}</p>
            </div>
          </div>
        </div>
      </a>
    </SectionShell>
  );
}
