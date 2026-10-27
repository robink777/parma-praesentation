export function SectionShell({
  label,
  title,
  children,
  compact = false,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
  // Oktober 2026 Chat-Vorgabe ("kontrolliere die gesamte Optik ... mehr Freiflächen", später
  // präzisiert: "Schriften kleiner, Gliederung logischer, nicht scrollen müssen — bei
  // Schriftgröße/Abständen darfst du von der CI abweichen, Farben/Schriften bleiben") — die
  // Standard-Headline (40-56px) und die Standard-Abstände sind für die volle Bildschirmbreite der
  // Kundenpräsentation gestaltet und viel zu großzügig für das schmale 1/3-Admin-Panel (siehe
  // Mitarbeiterstatistik.tsx) — ein Titel wie "Mitarbeiter" brach dort buchstabenweise um.
  // "compact" schaltet auf eine kleinere Headline und deutlich engere Außenabstände um, bewusst
  // mit px-Werten UNTER der eigentlichen CI-Spacing-Skala (siehe Nutzerfreigabe), ohne die
  // Kundenpräsentation selbst anzufassen.
  compact?: boolean;
}) {
  return (
    <div
      className={`mx-auto h-full max-w-content overflow-y-auto ${compact ? "px-[14px] py-[14px]" : "px-xl py-xl"}`}
    >
      <p className="label mb-[6px]">{label}</p>
      <h1
        className={
          compact
            ? "mb-sm break-words font-slab text-lg font-bold leading-[1.2] text-anthrazit"
            : "mb-lg [hyphens:auto] break-words text-[40px] leading-[1.2] md:text-[56px]"
        }
      >
        {title}
      </h1>
      {children}
    </div>
  );
}

export function Card({
  children,
  className = "",
  compact = false,
}: {
  children: React.ReactNode;
  className?: string;
  // Dieselbe CI-Abstands-Ausnahme wie bei SectionShell oben — alle admin-eigenen Karten
  // (Mitarbeiterstatistik/PlzObjekte/Leadquellen/Kontrolle) nutzen compact, die Kundenpräsentation
  // verwendet Card nicht.
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-md bg-stein ${compact ? "p-[14px]" : "p-md md:p-lg"} ${className}`}
    >
      {children}
    </div>
  );
}
