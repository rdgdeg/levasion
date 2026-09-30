import { isAdmin } from "@/lib/auth";
import { stripeConfigured } from "@/lib/stripe";
import { listReservations } from "@/lib/store";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "auth" }, { status: 401 });
  const reservations = (await listReservations()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return Response.json({ reservations, stripe: stripeConfigured() });
}
