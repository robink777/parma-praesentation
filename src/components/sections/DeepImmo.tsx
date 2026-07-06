import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { Immobilie } from "@/types";

// Fallback, falls für das Objekt (noch) kein individueller Link gepflegt ist (siehe
// deepImmoLink-Kommentar in types/index.ts) — auf Kundenwunsch (Juli 2026) die allgemeine
// DeepImmo-Startseite statt eines Leerzustands, da das Individualfeld objektspezifisch erst
// nach und nach in OnOffice befüllt wird und der Reiter bis dahin trotzdem einen sinnvollen
// Klick-Link zeigen soll.
const DEEPIMMO_DEFAULT_LINK = "https://realestateos.deepimmo.com/";

// Zeigt den objektspezifischen DeepImmo-Link (OnOffice-Individualfeld "DeepImmo-Link" unter
// "Technische Daten", Feldkatalog-Id ind_3450_Feld_ObjTech540 — siehe mapping.ts). Der Kunde hat
// das Feld im Juli 2026 selbst angelegt und pflegt es objektspezifisch manuell nach — bei den
// meisten Objekten (Stand Juli 2026, live gegen den Account geprüft: 0 von 0 getesteten Objekten
// befüllt) ist es daher noch leer; in diesem Fall greift DEEPIMMO_DEFAULT_LINK oben, damit der
// Reiter nie einen reinen Leerzustand ohne Klick-Ziel zeigt.
//
// "Miniaturansicht" (siehe Nutzeranfrage) wird hier als reine Link-Vorschau-Karte umgesetzt: Der
// volle Link wird als Text angezeigt (Plex Mono, wie bei anderen Datenlabels), ein Klick öffnet
// ihn per target="_blank" in einem neuen Tab — kein iframe/Preview-Rendering der Zielseite, da
// DeepImmo als externe Plattform vermutlich Framing per X-Frame-Options/CSP unterbindet.
export function DeepImmo({ immobilie }: { immobilie: Immobilie }) {
  const link = immobilie.deepImmoLink || DEEPIMMO_DEFAULT_LINK;

  return (
    <SectionShell label="DeepImmo" title="DeepImmo-Verknüpfung">
      <a href={link} target="_blank" rel="noopener noreferrer" className="group block">
        <Card className="flex items-center gap-md border-2 border-transparent transition-colors group-hover:border-messing">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-reinweiss text-walnuss">
            <Icon name="externalLink" size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="label mb-xs">DeepImmo-Link</p>
            <p className="truncate font-mono text-body text-anthrazit">{link}</p>
          </div>
          <Icon
            name="chevronRight"
            size={20}
            className="shrink-0 text-anthrazit/40 transition-colors group-hover:text-messing"
          />
        </Card>
      </a>
    </SectionShell>
  );
}
