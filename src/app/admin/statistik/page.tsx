import { redirect } from "next/navigation";

// Diese Route gibt es seit Oktober 2026 nicht mehr als eigenen Hauptbereich (siehe
// app/admin/page.tsx, AdminDashboard.tsx) — ein einfacher Redirect fängt noch offene Tabs/
// Lesezeichen aus der kurzen Übergangszeit ab, statt sie ins Leere laufen zu lassen.
export default function StatistikRedirect() {
  redirect("/admin");
}
