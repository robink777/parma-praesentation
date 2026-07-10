import { AdminSessionWaechter } from "@/components/admin/AdminSessionWaechter";

// Gemeinsames Layout für /admin und /admin/login. Bindet ausschließlich den
// AdminSessionWaechter ein (siehe dort) — der meldet die Admin-Session ab, sobald dieses Layout
// verlassen wird, damit die Admin-Anmeldung wie gewünscht bei jedem Verlassen des Bereichs neu
// verlangt wird, statt erst nach Ablauf der 8-Stunden-Gültigkeit (siehe Chat-Vorgabe).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSessionWaechter />
      {children}
    </>
  );
}
