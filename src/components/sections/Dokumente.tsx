import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { ObjektDokument } from "@/types";

function formatGroesse(bytes?: number): string | undefined {
  if (!bytes) return undefined;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// Einzelne Zeile im Dokumente-Reiter. w-full/min-w-0 + break-words auf Titel/Meta-Zeile aus
// demselben Grund wie in Kontaktperson.tsx: lange, leerzeichenfreie Dateinamen dürfen die Karte
// sonst über den Rand hinaus sprengen (siehe ausführlicher Kommentar dort).
function DokumentZeile({ dokument }: { dokument: ObjektDokument }) {
  const meta = [dokument.typ, formatGroesse(dokument.groesseBytes)].filter(Boolean).join(" · ");

  return (
    <Card className="flex items-center gap-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-reinweiss text-walnuss">
        <Icon name="document" size={22} />
      </div>

      <div className="w-full min-w-0 flex-1">
        <p className="break-words font-medium text-anthrazit">{dokument.titel}</p>
        {(meta || dokument.dateiname) && (
          <p className="mt-[2px] break-words text-small text-anthrazit/60">
            {meta || dokument.dateiname}
          </p>
        )}
      </div>

      {dokument.url && (
        <a
          href={dokument.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-xs rounded-sm border-2 border-asche bg-reinweiss px-md py-xs font-medium text-anthrazit transition-colors hover:border-messing"
        >
          <Icon name="download" size={16} />
          Öffnen
        </a>
      )}
    </Card>
  );
}

// Zeigt die intern in OnOffice am Objekt hinterlegten Dokumente (z.B. Grundriss,
// Energieausweis, Exposé) — abgerufen über resourcetype "file" (siehe ladeObjektDokumente in
// onoffice/estate.ts). Fotos/Titelbild sind technisch über denselben API-Weg abrufbar, werden
// hier aber bewusst ausgeschlossen, da sie bereits als Objektbild an anderer Stelle erscheinen.
//
// Ersetzt den bisherigen "Objektbewertung"-Reiter (eingebetteter PDF-Viewer nur für das
// Wertgutachten) — der direkte Zugriff auf das Wertgutachten bleibt weiterhin über den
// "Bewertung"-Reiter erhalten (siehe Bewertung.tsx, Link auf bewertung.pdfUrl).
export function Dokumente({ dokumente }: { dokumente: ObjektDokument[] }) {
  return (
    <SectionShell label="Bewertungsunterlagen" title="Interne Dokumente zum Objekt">
      {dokumente.length > 0 ? (
        <div className="flex flex-col gap-sm">
          {dokumente.map((dokument) => (
            <DokumentZeile key={dokument.id} dokument={dokument} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-sm py-2xl text-center">
          <Icon name="document" size={32} className="text-anthrazit/40" />
          <p className="max-w-[50ch] text-body text-anthrazit/70">
            Für dieses Objekt wurden noch keine Dokumente in OnOffice hinterlegt.
          </p>
        </Card>
      )}
    </SectionShell>
  );
}
