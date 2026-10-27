export function SectionShell({
  label,
  title,
  children,
  compact = false,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
  // Oktober 2026 Chat-Vorgabe ("kontrolliere die gesamte Optik ... mehr Freiflächen"): die
  // Standard-Headline (40-56px) ist für die volle Bildschirmbreite der Kundenpräsentation
  // gestaltet — im schmalen 1/3-Admin-Panel (siehe Mitarbeiterstatistik.tsx) brach ein Titel wie
  // "Mitarbeiter" dort buchstabenweise um. "compact" schaltet auf eine kleinere, für schmale
  // Spalten taugliche Headline um, ohne die Kundenpräsentation selbst anzufassen.
  compact?: boolean;
}) {
  return (
    <div
      className={`mx-auto h-full max-w-content overflow-y-auto ${compact ? "px-lg py-lg" : "px-xl py-xl"}`}
    >
      <p className="label mb-xs">{label}</p>
      <h1
        className={
          compact
            ? "mb-md break-words font-slab text-2xl font-bold leading-[1.2] text-anthrazit"
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-md bg-stein p-md md:p-lg ${className}`}>{children}</div>
  );
}
