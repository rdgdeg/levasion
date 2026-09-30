import { eachNight, parseISODate, todayISO } from "./dates";
import { property } from "./property";

export type QuoteLine = {
  nights: number;
  cents: number;
};

export type Quote = {
  nights: number;
  nightDates: string[];
  lines: QuoteLine[];
  discountPercent: number;
  rentalCents: number;
  extrasCents: number;
  amountCents: number;
  depositCents: number;
  balanceCents: number;
};

export function euros(cents: number, locale = "fr-BE"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function quoteStay(checkIn: string, checkOut: string, babyCot: boolean): Quote {
  const nightDates = eachNight(checkIn, checkOut);
  const nights = nightDates.length;
  const cents = property.nightlyRateCents;
  const rentalCents = cents * nights;
  const extrasCents = babyCot ? nights * property.babyCotPerNightCents : 0;
  const amountCents = rentalCents + extrasCents;
  const depositCents = Math.round((amountCents * property.depositPercent) / 100);
  return {
    nights,
    nightDates,
    lines: nights ? [{ nights, cents }] : [],
    discountPercent: 0,
    rentalCents,
    extrasCents,
    amountCents,
    depositCents,
    balanceCents: amountCents - depositCents,
  };
}

export function validateStay(input: {
  checkIn: string;
  checkOut: string;
  guests: number;
  babyCot: boolean;
}): { ok: true; quote: Quote } | { ok: false; error: string } {
  try {
    parseISODate(input.checkIn);
    parseISODate(input.checkOut);
  } catch {
    return { ok: false, error: "dates" };
  }

  if (input.checkIn < todayISO()) return { ok: false, error: "past" };
  if (input.checkOut <= input.checkIn) return { ok: false, error: "order" };

  const quote = quoteStay(input.checkIn, input.checkOut, input.babyCot);
  if (quote.nights < property.minNights) return { ok: false, error: "min" };
  if (quote.nights > property.maxNights) return { ok: false, error: "max" };
  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > property.maxGuests) {
    return { ok: false, error: "guests" };
  }
  return { ok: true, quote };
}
