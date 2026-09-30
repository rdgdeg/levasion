import { paymentFromWebhook } from "@/lib/stripe";
import { updateReservation } from "@/lib/store";

export async function POST(request: Request) {
  const raw = await request.text();
  try {
    const payment = await paymentFromWebhook(raw, request.headers.get("stripe-signature"));
    if (!payment) return Response.json({ received: true });
    await updateReservation(payment.id, {
      paymentStatus: payment.kind === "balance" ? "paid" : "deposit_paid",
      status: "confirmed",
    });
    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "signature" }, { status: 400 });
  }
}
