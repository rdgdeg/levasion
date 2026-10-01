"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addDays, formatDisplayDate, todayISO } from "@/lib/dates";
import { useI18n } from "@/lib/i18n";
import { localeFor } from "@/lib/copy";
import { euros, quoteStay, validateStay } from "@/lib/pricing";
import { property } from "@/lib/property";

type NightState = "pending" | "confirmed";

function monthLabel(iso: string, locale: string): string {
  const [year, month] = iso.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
}

function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

function daysInGrid(monthIso: string): Array<string | null> {
  const start = monthStart(monthIso);
  const [year, month] = start.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const count = new Date(year, month, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: Array<string | null> = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= count; day += 1) {
    cells.push(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  return cells;
}

const countries = ["Belgique", "France", "Nederland", "United Kingdom", "Deutschland", "Luxembourg", "Other"];

export function BookingForm() {
  const { t, lang } = useI18n();
  const locale = localeFor(lang);
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [babyCot, setBabyCot] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Belgique");
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [company, setCompany] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [nights, setNights] = useState<Record<string, NightState>>({});
  const [departures, setDepartures] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [cursor, setCursor] = useState(monthStart(todayISO()));

  useEffect(() => {
    const from = todayISO();
    const to = addDays(from, 540);
    fetch(`/api/availability?from=${from}&to=${to}`)
      .then((response) => response.json())
      .then((data: { nights?: Record<string, NightState>; departures?: string[] }) => {
        setNights(data.nights || {});
        setDepartures(data.departures || []);
      })
      .catch(() => {
        setNights({});
        setDepartures([]);
      });
  }, []);

  const guests = adults + children;
  const quote = checkIn && checkOut && checkOut > checkIn ? quoteStay(checkIn, checkOut, babyCot) : null;
  const rangeBlocked = quote?.nightDates.some((night) => nights[night]) ?? false;
  const weekdays = lang === "en" ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] : lang === "nl" ? ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"] : ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
  const second = monthStart(addDays(monthStart(cursor), 32));

  function pick(day: string) {
    if (day < todayISO()) return;
    const choosingCheckout = Boolean(checkIn) && !checkOut && day > checkIn;
    if (!choosingCheckout) {
      if (nights[day]) {
        setError(t.form.unavailable);
        return;
      }
      setCheckIn(day);
      setCheckOut("");
      setError("");
      return;
    }
    const probe = quoteStay(checkIn, day, false);
    if (probe.nightDates.some((night) => nights[night])) {
      setError(t.form.unavailable);
      return;
    }
    setCheckOut(day);
    setError("");
  }

  function continueDates() {
    const stay = validateStay({ checkIn, checkOut, guests, babyCot });
    if (!stay.ok) {
      setError(t.form.errors[stay.error as keyof typeof t.form.errors] || t.form.errors.dates);
      return;
    }
    if (rangeBlocked) {
      setError(t.form.unavailable);
      return;
    }
    setError("");
    setStep(2);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!accepted) {
      setError(t.form.errors.terms);
      return;
    }
    if (name.trim().length < 2 || phone.trim().length < 6) {
      setError(t.form.errors.contact);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t.form.errors.email);
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn,
          checkOut,
          adults,
          children,
          babyCot,
          name,
          email,
          phone,
          country,
          message,
          company,
          lang,
          accepted,
        }),
      });
      const data = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !data.id || data.id === "ok") {
        setError(data.error === "conflict" ? t.form.errors.conflict : data.error === "terms" ? t.form.errors.terms : t.form.errors.server);
        setSending(false);
        return;
      }
      router.push(`/reserver/merci?ref=${data.id}`);
    } catch {
      setError(t.form.errors.server);
      setSending(false);
    }
  }

  return (
    <div className="booking">
      <div className="booking-top">
        <div className="legend">
          <span><i className="dot free" /> {t.form.legend.free}</span>
          <span><i className="dot booked" /> {t.form.legend.booked}</span>
          <span><i className="dot pending" /> {t.form.legend.pending}</span>
          <span><i className="dot depart" /> {t.form.legend.depart}</span>
        </div>
        <p className="hint">{t.form.bookedHint}</p>
      </div>
      <div className="calendar">
        <div className="cal-head">
          <button className="mini" type="button" onClick={() => setCursor(monthStart(addDays(monthStart(cursor), -1)))}>
            ←
          </button>
          <span />
          <button className="mini" type="button" onClick={() => setCursor(second)}>
            →
          </button>
        </div>
        <div className="months">
          {[cursor, second].map((month) => (
            <div className="month" key={month}>
              <div className="cal-head">
                <strong>{monthLabel(month, locale)}</strong>
              </div>
              <div className="weekdays">
                {weekdays.map((day) => (
                  <span key={`${month}-${day}`}>{day}</span>
                ))}
              </div>
              <div className="days">
                {daysInGrid(month).map((day, index) => {
                  if (!day) return <span key={`${month}-e-${index}`} />;
                  const state = nights[day];
                  const past = day < todayISO();
                  const edge = day === checkIn || day === checkOut;
                  const inside = Boolean(checkIn && checkOut && day > checkIn && day < checkOut);
                  const depart = !state && departures.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={past}
                      className={`${edge ? "edge" : ""} ${inside ? "in" : ""} ${state === "confirmed" ? "booked" : ""} ${state === "pending" ? "awaiting" : ""} ${depart ? "depart" : ""}`}
                      onClick={() => pick(day)}
                    >
                      {Number(day.slice(-2))}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form className="panel quote-panel" onSubmit={onSubmit}>
        <h2>{step === 1 ? t.form.datesTitle : t.form.detailsTitle}</h2>
        <p className="hint">{step === 1 ? t.form.lead : t.form.detailsLead}</p>
        <div className="row-2">
          <div>
            <label htmlFor="arrivee">{t.form.checkIn}</label>
            <input id="arrivee" value={checkIn ? formatDisplayDate(checkIn, locale) : "—"} readOnly />
          </div>
          <div>
            <label htmlFor="depart">{t.form.checkOut}</label>
            <input id="depart" value={checkOut ? formatDisplayDate(checkOut, locale) : "—"} readOnly />
          </div>
        </div>
        <div className="row-2">
          <div>
            <label htmlFor="adults">{t.form.adults}</label>
            <select id="adults" value={adults} onChange={(event) => setAdults(Number(event.target.value))}>
              {Array.from({ length: property.maxGuests }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="children">{t.form.children}</label>
            <select id="children" value={children} onChange={(event) => setChildren(Number(event.target.value))}>
              {Array.from({ length: property.maxGuests }, (_, index) => index).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="check">
          <input type="checkbox" checked={babyCot} onChange={(event) => setBabyCot(event.target.checked)} />
          <span>{t.form.cot}</span>
        </label>
        {quote && (
          <div className="estimate-box">
            {quote.lines.map((line) => (
              <p key={`${line.cents}-${line.nights}`}>
                <span>
                  {line.nights} {line.nights > 1 ? t.form.nights : t.form.night} × {euros(line.cents, locale)}
                </span>
                <span>{euros(line.cents * line.nights, locale)}</span>
              </p>
            ))}
            {quote.extrasCents > 0 && (
              <p>
                <span>
                  {t.form.cotLine} · {quote.nights} {quote.nights > 1 ? t.form.nights : t.form.night} ×{" "}
                  {euros(property.babyCotPerNightCents, locale)}
                </span>
                <span>{euros(quote.extrasCents, locale)}</span>
              </p>
            )}
            <p>
              <span>{t.form.total}</span>
              <strong>{euros(quote.amountCents, locale)}</strong>
            </p>
            <p>
              <span>{t.form.deposit}</span>
              <strong>{euros(quote.depositCents, locale)}</strong>
            </p>
            <p>
              <span>{t.form.balance}</span>
              <strong>{euros(quote.balanceCents, locale)}</strong>
            </p>
          </div>
        )}
        {step === 2 && (
          <>
            <label htmlFor="name">{t.form.name}</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
            <label htmlFor="email">{t.form.email}</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            <label htmlFor="phone">{t.form.phone}</label>
            <input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required />
            <label htmlFor="country">{t.form.country}</label>
            <select id="country" value={country} onChange={(event) => setCountry(event.target.value)}>
              {countries.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <label htmlFor="message">{t.form.message}</label>
            <textarea id="message" value={message} placeholder={t.form.messageHint} onChange={(event) => setMessage(event.target.value)} />
            <label className="check is-terms">
              <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
              <span>{t.form.terms}</span>
            </label>
            <label className="hp" htmlFor="company" aria-hidden="true">
              Company
              <input id="company" value={company} onChange={(event) => setCompany(event.target.value)} tabIndex={-1} autoComplete="off" />
            </label>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <p className="form-actions">
          {step === 2 && (
            <button className="btn ghost" type="button" onClick={() => setStep(1)}>
              {t.form.back}
            </button>
          )}
          {step === 1 ? (
            <button className="btn" type="button" onClick={continueDates}>
              {t.form.continue}
            </button>
          ) : (
            <button className="btn" type="submit" disabled={sending}>
              {sending ? t.form.sending : t.form.submit}
            </button>
          )}
        </p>
      </form>
    </div>
  );
}
