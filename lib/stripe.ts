import type { Reservation } from "./types";

export type PaymentKind = "deposit" | "balance";

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function amountFor(reservation: Reservation, kind: PaymentKind): number {
  if (kind === "deposit") return reservation.depositCents;
  const paid = reservation.paymentStatus === "deposit_paid" || reservation.paymentStatus === "balance_link_sent";
  return paid ? Math.max(0, reservation.amountCents - reservation.depositCents) : reservation.amountCents;
}

export async function createPaymentLink(
  reservation: Reservation,
  kind: PaymentKind,
): Promise<{ url: string; sessionId: string }> {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("stripe_unconfigured");
  const amount = amountFor(reservation, kind);
  if (amount < 50) throw new Error("amount");
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = siteUrl();
  const label = kind === "deposit" ? "Acompte 15 %" : "Solde";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: reservation.email || undefined,
    client_reference_id: reservation.id,
    metadata: { reservationId: reservation.id, kind },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: amount,
          product_data: {
            name: `L'évasion · ${label} · ${reservation.checkIn} → ${reservation.checkOut}`,
            description: `${reservation.nights} nuit${reservation.nights > 1 ? "s" : ""}`,
          },
        },
      },
    ],
    success_url: `${origin}/reserver/merci?ref=${reservation.id}&paid=${kind}`,
    cancel_url: `${origin}/reserver/merci?ref=${reservation.id}`,
  });
  if (!session.url) throw new Error("stripe_no_url");
  return { url: session.url, sessionId: session.id };
}

export async function paymentFromWebhook(
  rawBody: string,
  signature: string | null,
): Promise<{ id: string; kind: PaymentKind } | null> {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    throw new Error("stripe_unconfigured");
  }
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  if (event.type !== "checkout.session.completed") return null;
  const session = event.data.object;
  if (session.payment_status !== "paid") return null;
  const id = session.metadata?.reservationId || session.client_reference_id;
  if (!id) return null;
  const kind: PaymentKind = session.metadata?.kind === "balance" ? "balance" : "deposit";
  return { id, kind };
}
