// Icon-System nach Parma-CI: 24px-Raster, Strichstärke 1,5 px, Round Cap/Join, einfarbig.
export type IconName =
  | "greeting"
  | "building"
  | "calendar"
  | "house"
  | "scale"
  | "compare"
  | "calculator"
  | "timeline"
  | "handshake"
  | "phone"
  | "mail"
  | "location"
  | "clock"
  | "document"
  | "check"
  | "chevronRight"
  | "chevronLeft"
  | "expand"
  | "close"
  | "contact"
  | "globe"
  | "search"
  | "menu"
  | "download";

const PATHS: Record<IconName, React.ReactNode> = {
  greeting: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </>
  ),
  building: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="1" />
      <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="1" />
      <path d="M4 9.5h16M8 3v3M16 3v3" />
    </>
  ),
  house: (
    <>
      <path d="M4 11l8-6 8 6" />
      <path d="M6 10v9h12v-9" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16M7 20h10" />
      <path d="M12 6l-5 3M12 6l5 3" />
      <path d="M4 9l3 5.5a3 3 0 0 0 6 0L10 9M14 9l3 5.5a3 3 0 0 0 6 0L20 9" />
    </>
  ),
  compare: (
    <>
      <path d="M8 6H4v12h4M16 6h4v12h-4" />
      <path d="M8 10h8M8 14h8" />
    </>
  ),
  calculator: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="1" />
      <path d="M9 7h6M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01" />
    </>
  ),
  timeline: (
    <>
      <path d="M4 12h16" />
      <circle cx="7" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="17" cy="12" r="1.4" />
    </>
  ),
  handshake: (
    <>
      <path d="M3 12l4-4 4 3 4-4 6 5" />
      <path d="M9 11l3 3-2 2M15 10l-3 4" />
    </>
  ),
  phone: <path d="M6 4h3l2 5-2 1.5a9 9 0 0 0 5 5L15.5 13l5 2v3a2 2 0 0 1-2 2C10.5 20 4 13.5 4 6a2 2 0 0 1 2-2z" />,
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1" />
      <path d="M4 6.5l8 6 8-6" />
    </>
  ),
  location: (
    <>
      <path d="M12 21s7-6.5 7-11.5a7 7 0 0 0-14 0C5 14.5 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  document: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  chevronRight: <path d="M9 5l7 7-7 7" />,
  chevronLeft: <path d="M15 5l-7 7 7 7" />,
  expand: (
    <>
      <path d="M9 4H4v5" />
      <path d="M15 4h5v5" />
      <path d="M9 20H4v-5" />
      <path d="M15 20h5v-5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  contact: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6.5 16c0-1.7 1.5-3 3-3s3 1.3 3 3M14 9.5h4M14 12.5h4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.5 2.5 2.5 13 0 16M12 4c-2.5 2.5-2.5 13 0 16" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.5-4.5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  download: (
    <>
      <path d="M12 4v10" />
      <path d="M8 10l4 4 4-4" />
      <path d="M5 18h14" />
    </>
  ),
};

export function Icon({
  name,
  size = 24,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
