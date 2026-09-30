import { sendRequestMails } from "@/lib/mail";
import { validateStay } from "@/lib/pricing";
import { property } from "@/lib/property";
import { createReservation } from "@/lib/store";
import type { ReservationLang } from "@/lib/types";

const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= 8) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ error: "rate" }, { status: 429 });

  const body = (await request.json().catch(() => null)) as {
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
    babyCot?: boolean;
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    message?: string;
    company?: string;
    lang?: string;
    accepted?: boolean;
  } | null;

  if (!body) return Response.json({ error: "body" }, { status: 400 });
  if (body.company) return Response.json({ id: "ok" });
  if (!body.accepted) return Response.json({ error: "terms" }, { status: 400 });

  const adults = Number(body.adults);
  const children = Number(body.children || 0);
  const guests = adults + children;
  const stay = validateStay({
    checkIn: body.checkIn || "",
    checkOut: body.checkOut || "",
    guests,
    babyCot: Boolean(body.babyCot),
  });
  if (!stay.ok) return Response.json({ error: stay.error }, { status: 400 });
  if (!Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0) {
    return Response.json({ error: "guests" }, { status: 400 });
  }
  if (guests > property.maxGuests) return Response.json({ error: "guests" }, { status: 400 });

  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const phone = (body.phone || "").trim();
  if (name.length < 2 || phone.length < 6 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "contact" }, { status: 400 });
  }

  const lang: ReservationLang = body.lang === "nl" || body.lang === "en" ? body.lang : "fr";

  try {
    const reservation = await createReservation({
      checkIn: body.checkIn!,
      checkOut: body.checkOut!,
      guests,
      adults,
      children,
      babyCot: Boolean(body.babyCot),
      name,
      email,
      phone,
      country: (body.country || "").trim().slice(0, 80),
      message: (body.message || "").trim().slice(0, 1000),
      lang,
      status: "pending",
      rentalCents: stay.quote.rentalCents,
      extrasCents: stay.quote.extrasCents,
      amountCents: stay.quote.amountCents,
      depositCents: stay.quote.depositCents,
      nights: stay.quote.nights,
      source: "guest",
    });
    try {
      await sendRequestMails(reservation);
    } catch (error) {
      console.error(error);
    }
    return Response.json({ id: reservation.id, mailed: true });
  } catch (error) {
    if (error instanceof Error && error.message === "conflict") {
      return Response.json({ error: "conflict" }, { status: 409 });
    }
    return Response.json({ error: "server" }, { status: 500 });
  }
}
