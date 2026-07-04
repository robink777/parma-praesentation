export function SectionShell({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto h-full max-w-content overflow-y-auto px-xl py-xl">
      <p className="label mb-xs">{label}</p>
      <h1 className="mb-lg [hyphens:auto] break-words text-[40px] leading-[1.2] md:text-[56px]">{title}</h1>
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
