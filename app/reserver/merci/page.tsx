"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { formatDisplayDate } from "@/lib/dates";
import { useI18n } from "@/lib/i18n";
import { localeFor } from "@/lib/copy";
import { euros } from "@/lib/pricing";
import type { PaymentStatus, ReservationStatus } from "@/lib/types";

type PublicReservation = {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  name: string;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  amountCents: number;
  depositCents?: number;
};

function ThanksBody() {
  const { t, lang } = useI18n();
  const params = useSearchParams();
  const ref = params.get("ref") || "";
  const [item, setItem] = useState<PublicReservation | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!ref) {
      setMissing(true);
      return;
    }
    fetch(`/api/reservations/${ref}`)
      .then(async (response) => {
        if (!response.ok) {
          setMissing(true);
          return;
        }
        setItem((await response.json()) as PublicReservation);
      })
      .catch(() => setMissing(true));
  }, [ref]);

  if (missing) {
    return (
      <div className="page narrow">
        <h1>{t.thanks.missing}</h1>
        <Link className="btn" href="/">
          {t.thanks.back}
        </Link>
      </div>
    );
  }

  if (!item) return <div className="page">…</div>;
  const locale = localeFor(lang);

  return (
    <div className="page narrow">
      <p className="kicker">{t.thanks.kicker}</p>
      <h1>{t.thanks.title}</h1>
      <p className="intro">{t.thanks.body}</p>
      <div className="card">
        <p>
          {t.thanks.ref} · {item.id.slice(0, 8)}
        </p>
        <p>
          {formatDisplayDate(item.checkIn, locale)} → {formatDisplayDate(item.checkOut, locale)}
        </p>
        <p>
          {item.nights} {item.nights > 1 ? t.form.nights : t.form.night} · {item.guests} {t.form.guests.toLocaleLowerCase(locale)}
        </p>
        <p>
          <strong>{euros(item.amountCents, locale)}</strong>
          {item.depositCents ? ` · ${t.form.deposit} ${euros(item.depositCents, locale)}` : ""}
        </p>
        <p>
          {t.thanks[item.status]} · {t.thanks[item.paymentStatus]}
        </p>
      </div>
      <p>
        <Link className="btn" href="/">
          {t.thanks.back}
        </Link>
      </p>
    </div>
  );
}

export default function MerciPage() {
  return (
    <Suspense fallback={<div className="page">…</div>}>
      <ThanksBody />
    </Suspense>
  );
}
