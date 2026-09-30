import { isAdmin } from "@/lib/auth";
import { sendConfirmedMail } from "@/lib/mail";
import { createPaymentLink, stripeConfigured } from "@/lib/stripe";
import { updateReservation } from "@/lib/store";
import type { PaymentStatus, ReservationStatus } from "@/lib/types";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "auth" }, { status: 401 });
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { action?: string; amountCents?: number } | null;
  if (!body?.action) return Response.json({ error: "action" }, { status: 400 });

  const statusByAction: Record<string, ReservationStatus | undefined> = {
    confirm: "confirmed",
    decline: "declined",
    cancel: "cancelled",
  };

  try {
    if (body.action === "update_amount") {
      if (!Number.isInteger(body.amountCents) || (body.amountCents ?? 0) < 0) {
        return Response.json({ error: "amount" }, { status: 400 });
      }
      const updated = await updateReservation(id, { amountCents: body.amountCents });
      if (!updated) return Response.json({ error: "missing" }, { status: 404 });
      return Response.json({ reservation: updated });
    }
    if (body.action === "mark_paid") {
      const updated = await updateReservation(id, { paymentStatus: "paid" });
      if (!updated) return Response.json({ error: "missing" }, { status: 404 });
      return Response.json({ reservation: updated });
    }
    const status = statusByAction[body.action];
    if (!status) return Response.json({ error: "action" }, { status: 400 });
    let updated = await updateReservation(id, { status });
    if (!updated) return Response.json({ error: "missing" }, { status: 404 });

    if (body.action === "confirm" && updated.source === "guest" && updated.email) {
      if (stripeConfigured() && updated.depositCents >= 50) {
        try {
          const link = await createPaymentLink(updated, "deposit");
          const paymentStatus: PaymentStatus = "deposit_link_sent";
          updated =
            (await updateReservation(id, {
              paymentStatus,
              stripeSessionId: link.sessionId,
              stripeUrl: link.url,
            })) || updated;
        } catch (error) {
          console.error(error);
        }
      }
      try {
        await sendConfirmedMail(updated);
      } catch (error) {
        console.error(error);
      }
    }

    return Response.json({ reservation: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "conflict") {
      return Response.json({ error: "conflict" }, { status: 409 });
    }
    return Response.json({ error: "server" }, { status: 500 });
  }
}
