import { isAdmin } from "@/lib/auth";
import { validateStay } from "@/lib/pricing";
import { createReservation } from "@/lib/store";

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "auth" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { checkIn?: string; checkOut?: string; note?: string } | null;
  if (!body) return Response.json({ error: "body" }, { status: 400 });
  const stay = validateStay({
    checkIn: body.checkIn || "",
    checkOut: body.checkOut || "",
    guests: 1,
    babyCot: false,
  });
  if (!stay.ok) return Response.json({ error: stay.error }, { status: 400 });
  try {
    const reservation = await createReservation({
      checkIn: body.checkIn!,
      checkOut: body.checkOut!,
      guests: 1,
      adults: 1,
      children: 0,
      babyCot: false,
      name: (body.note || "Indisponible").trim().slice(0, 120) || "Indisponible",
      email: "",
      phone: "",
      country: "",
      message: (body.note || "").trim().slice(0, 400),
      lang: "fr",
      status: "confirmed",
      rentalCents: 0,
      extrasCents: 0,
      amountCents: 0,
      depositCents: 0,
      nights: stay.quote.nights,
      source: "block",
    });
    return Response.json({ id: reservation.id });
  } catch (error) {
    if (error instanceof Error && error.message === "conflict") {
      return Response.json({ error: "conflict" }, { status: 409 });
    }
    return Response.json({ error: "server" }, { status: 500 });
  }
}
