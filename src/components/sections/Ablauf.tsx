import { SectionShell } from "@/components/layout/SectionShell";
import { STANDARD_ABLAUFPLAN } from "@/data/ablaufplan";

export function Ablauf() {
  return (
    <SectionShell label="Heute" title="Ablaufplan für Ihren Termin">
      <ol className="relative border-l border-sand pl-md">
        {STANDARD_ABLAUFPLAN.map((punkt) => (
          <li key={punkt.uhrzeit} className="mb-md last:mb-0">
            <span className="absolute -ml-[29px] mt-1 h-3 w-3 rounded-full bg-walnuss" />
            <p className="font-mono text-[13px] tracking-label text-walnuss/70">{punkt.uhrzeit}</p>
            <h4 className="mt-[2px]">{punkt.titel}</h4>
            {punkt.beschreibung && (
              <p className="text-small text-anthrazit/70">{punkt.beschreibung}</p>
            )}
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
