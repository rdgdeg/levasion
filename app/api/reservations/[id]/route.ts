import { getReservation } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const reservation = await getReservation(id);
  if (!reservation || reservation.source !== "guest") {
    return Response.json({ error: "missing" }, { status: 404 });
  }
  return Response.json({
    id: reservation.id,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    guests: reservation.guests,
    adults: reservation.adults,
    children: reservation.children,
    babyCot: reservation.babyCot,
    nights: reservation.nights,
    name: reservation.name,
    status: reservation.status,
    paymentStatus: reservation.paymentStatus,
    amountCents: reservation.amountCents,
    depositCents: reservation.depositCents,
    rentalCents: reservation.rentalCents,
  });
}
