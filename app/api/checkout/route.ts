import { isAdmin } from "@/lib/auth";
import { sendConfirmedMail } from "@/lib/mail";
import { createPaymentLink, stripeConfigured, type PaymentKind } from "@/lib/stripe";
import { getReservation, updateReservation } from "@/lib/store";

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "auth" }, { status: 401 });
  if (!stripeConfigured()) return Response.json({ error: "stripe_unconfigured" }, { status: 409 });
  const body = (await request.json().catch(() => null)) as { id?: string; kind?: PaymentKind } | null;
  if (!body?.id) return Response.json({ error: "id" }, { status: 400 });
  const kind: PaymentKind = body.kind === "balance" ? "balance" : "deposit";
  const reservation = await getReservation(body.id);
  if (!reservation) return Response.json({ error: "missing" }, { status: 404 });
  if (reservation.status !== "confirmed") return Response.json({ error: "status" }, { status: 409 });
  const link = await createPaymentLink(reservation, kind);
  const updated = await updateReservation(reservation.id, {
    paymentStatus: kind === "balance" ? "balance_link_sent" : "deposit_link_sent",
    stripeSessionId: link.sessionId,
    stripeUrl: link.url,
  });
  if (updated?.email) {
    try {
      await sendConfirmedMail(updated);
    } catch (error) {
      console.error(error);
    }
  }
  return Response.json({ url: link.url });
}
