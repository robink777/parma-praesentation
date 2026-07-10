import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/auth";

// Löscht das Admin-Session-Cookie — Gegenstück zu /api/admin-login, analog zum bereits
// bestehenden (aber unverlinkten) /api/logout für die App-weite Session. Anders als dort ist
// diese Route hier aktiv verlinkt: components/admin/AdminSessionWaechter.tsx ruft sie auf,
// sobald der Admin-Bereich verlassen wird (siehe Chat-Vorgabe: Admin-Login soll jedes Mal
// erneut verlangt werden, nicht erst nach Ablauf der 8-Stunden-Gültigkeit).
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}
