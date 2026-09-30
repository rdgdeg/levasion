import nodemailer from "nodemailer";
import { formatDisplayDate } from "./dates";
import { euros } from "./pricing";
import { property } from "./property";
import { siteUrl } from "./stripe";
import type { Reservation, ReservationLang } from "./types";

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function locale(lang: ReservationLang): string {
  if (lang === "nl") return "nl-BE";
  if (lang === "en") return "en-GB";
  return "fr-BE";
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  if (!mailConfigured()) {
    console.info(`[mail] SMTP non configuré — non envoyé à ${options.to}: ${options.subject}`);
    return false;
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM || `L'évasion <${process.env.SMTP_USER}>`,
    to: options.to,
    replyTo: options.replyTo,
    subject: options.subject,
    text: options.text,
  });
  return true;
}

function stayBlock(reservation: Reservation): string {
  const loc = locale(reservation.lang);
  return [
    `${formatDisplayDate(reservation.checkIn, loc)} → ${formatDisplayDate(reservation.checkOut, loc)}`,
    `${reservation.nights} nuits · ${reservation.guests} voyageurs`,
    `Séjour : ${euros(reservation.amountCents, loc)}`,
    `Acompte 15 % : ${euros(reservation.depositCents, loc)}`,
    `Solde : ${euros(reservation.amountCents - reservation.depositCents, loc)}`,
    `Référence : ${reservation.id}`,
  ].join("\n");
}

export async function sendRequestMails(reservation: Reservation): Promise<void> {
  const page = `${siteUrl()}/reserver/merci?ref=${reservation.id}`;
  const guest =
    reservation.lang === "en"
      ? `Hello ${reservation.name},\n\nWe have received your request for L'évasion. The dates are held while we confirm them. No payment is taken yet.\n\n${stayBlock(reservation)}\n\n${page}\n\nL'évasion\n${property.phone}\n${property.email}`
      : reservation.lang === "nl"
        ? `Dag ${reservation.name},\n\nWe hebben uw aanvraag voor L'évasion goed ontvangen. De data blijven gereserveerd tot we bevestigen. Er wordt nog niets betaald.\n\n${stayBlock(reservation)}\n\n${page}\n\nL'évasion\n${property.phone}\n${property.email}`
        : `Bonjour ${reservation.name},\n\nNous avons bien reçu votre demande pour L'évasion. Les dates sont retenues le temps de la confirmation. Aucun paiement n'est demandé pour l'instant.\n\n${stayBlock(reservation)}\n\n${page}\n\nL'évasion\n${property.phone}\n${property.email}`;

  const subject =
    reservation.lang === "en"
      ? "L'évasion — request received"
      : reservation.lang === "nl"
        ? "L'évasion — aanvraag ontvangen"
        : "L'évasion — demande bien reçue";

  await sendMail({ to: reservation.email, subject, text: guest, replyTo: property.email });
  await sendMail({
    to: property.email,
    replyTo: reservation.email,
    subject: `Nouvelle demande · ${reservation.checkIn} → ${reservation.checkOut}`,
    text: `Nouvelle demande sur le site.\n\n${reservation.name}\n${reservation.email}\n${reservation.phone}\n${reservation.country}\n\n${stayBlock(reservation)}\n\n${reservation.message || "—"}\n\nÀ confirmer dans l'admin : ${siteUrl()}/admin`,
  });
}

export async function sendConfirmedMail(reservation: Reservation): Promise<void> {
  const link = reservation.stripeUrl
    ? `\n\nPayer l'acompte : ${reservation.stripeUrl}`
    : "\n\nLe lien de paiement de l'acompte vous sera envoyé dès que le paiement en ligne est ouvert.";
  const text =
    reservation.lang === "en"
      ? `Hello ${reservation.name},\n\nYour stay at L'évasion is confirmed.\n\n${stayBlock(reservation)}${reservation.stripeUrl ? `\n\nPay the 15% deposit: ${reservation.stripeUrl}` : "\n\nThe deposit payment link will follow."}\n\nThe balance is due 60 days before arrival.\n\nL'évasion`
      : reservation.lang === "nl"
        ? `Dag ${reservation.name},\n\nUw verblijf op L'évasion is bevestigd.\n\n${stayBlock(reservation)}${reservation.stripeUrl ? `\n\nBetaal de aanbetaling van 15 %: ${reservation.stripeUrl}` : "\n\nDe betaallink voor de aanbetaling volgt."}\n\nHet saldo is verschuldigd 60 dagen voor aankomst.\n\nL'évasion`
        : `Bonjour ${reservation.name},\n\nVotre séjour à L'évasion est confirmé.\n\n${stayBlock(reservation)}${link}\n\nLe solde est à régler 60 jours avant l'arrivée.\n\nL'évasion`;
  const subject =
    reservation.lang === "en" ? "L'évasion — stay confirmed" : reservation.lang === "nl" ? "L'évasion — verblijf bevestigd" : "L'évasion — séjour confirmé";
  await sendMail({ to: reservation.email, subject, text, replyTo: property.email });
}
