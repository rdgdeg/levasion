"use client";

import { useEffect, useState } from "react";
import { euros } from "@/lib/pricing";
import { fr } from "@/lib/copy";
import { property } from "@/lib/property";
import type { Reservation } from "@/lib/types";

const labels = fr.admin;

export function AdminDesk() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [items, setItems] = useState<Reservation[]>([]);
  const [stripeOn, setStripeOn] = useState(false);
  const [copied, setCopied] = useState("");
  const [blockIn, setBlockIn] = useState("");
  const [blockOut, setBlockOut] = useState("");
  const [note, setNote] = useState("Indisponible");

  async function load() {
    const response = await fetch("/api/admin/reservations");
    if (response.status === 401) {
      setAuthed(false);
      setReady(true);
      return;
    }
    const data = (await response.json()) as { reservations: Reservation[]; stripe: boolean };
    setItems(data.reservations);
    setStripeOn(data.stripe);
    setAuthed(true);
    setReady(true);
  }

  useEffect(() => {
    load().catch(() => setReady(true));
  }, []);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setError(labels.badPassword);
      return;
    }
    setPassword("");
    await load();
  }

  async function act(id: string, action: string, amountCents?: number) {
    await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, amountCents }),
    });
    await load();
  }

  async function payLink(id: string, kind: "deposit" | "balance") {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, kind }),
    });
    const data = (await response.json()) as { url?: string };
    if (data.url) {
      await navigator.clipboard.writeText(data.url);
      setCopied(id);
      await load();
    }
  }

  async function block(event: React.FormEvent) {
    event.preventDefault();
    await fetch("/api/admin/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkIn: blockIn, checkOut: blockOut, note }),
    });
    setBlockIn("");
    setBlockOut("");
    await load();
  }

  if (!ready) return <p className="page">…</p>;

  if (!authed) {
    return (
      <div className="page narrow">
        <h1>{labels.title}</h1>
        <p>{labels.lead}</p>
        <form onSubmit={login} className="panel" style={{ position: "static" }}>
          <label htmlFor="password">{labels.password}</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p className="error">{error}</p>}
          <p>
            <button className="btn" type="submit">
              {labels.enter}
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h1>{labels.title}</h1>
        <button
          className="mini"
          type="button"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            setAuthed(false);
          }}
        >
          {labels.logout}
        </button>
      </div>
      <p className={stripeOn ? "banner" : "banner"}>{stripeOn ? labels.stripeOn : labels.stripeOff}</p>

      <form className="panel" style={{ position: "static", marginBottom: 22 }} onSubmit={block}>
        <h2 style={{ fontSize: 28 }}>{labels.blockTitle}</h2>
        <p className="hint">{labels.blockLead}</p>
        <div className="row-2">
          <div>
            <label htmlFor="block-in">Arrivée</label>
            <input id="block-in" type="date" value={blockIn} onChange={(event) => setBlockIn(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="block-out">Départ</label>
            <input id="block-out" type="date" value={blockOut} onChange={(event) => setBlockOut(event.target.value)} required />
          </div>
          <button className="btn" type="submit">
            {labels.block}
          </button>
        </div>
        <label htmlFor="note">{labels.note}</label>
        <input id="note" value={note} onChange={(event) => setNote(event.target.value)} />
      </form>

      {items.length === 0 ? (
        <p>{labels.empty}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Séjour</th>
                <th>Contact</th>
                <th>Statut</th>
                <th>Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.checkIn} → {item.checkOut}
                    <br />
                    {item.nights} nuits · {item.guests} pers.
                    {item.babyCot ? " · lit bébé" : ""}
                    <br />
                    <small>{item.id.slice(0, 8)}</small>
                  </td>
                  <td>
                    {item.name}
                    <br />
                    {item.email}
                    <br />
                    {item.phone}
                    {item.message && (
                      <>
                        <br />
                        <em>{item.message}</em>
                      </>
                    )}
                  </td>
                  <td>
                    <span className="badge">{labels.statuses[item.status]}</span>
                    <br />
                    <span className="badge">{labels.payments[item.paymentStatus]}</span>
                  </td>
                  <td>
                    <input
                      key={`${item.id}-${item.amountCents}`}
                      type="number"
                      min={0}
                      defaultValue={Math.round(item.amountCents / 100)}
                      style={{ width: 90 }}
                      onBlur={(event) => {
                        const cents = Math.round(Number(event.target.value) * 100);
                        if (cents !== item.amountCents) act(item.id, "update_amount", cents);
                      }}
                    />
                  </td>
                  <td className="admin-actions">
                    {item.status !== "confirmed" && item.source === "guest" && (
                      <button type="button" onClick={() => act(item.id, "confirm")}>
                        {labels.confirm}
                      </button>
                    )}
                    {item.status === "pending" && (
                      <button type="button" onClick={() => act(item.id, "decline")}>
                        {labels.decline}
                      </button>
                    )}
                    {(item.status === "pending" || item.status === "confirmed") && (
                      <button type="button" onClick={() => act(item.id, "cancel")}>
                        {labels.cancel}
                      </button>
                    )}
                    {item.paymentStatus !== "paid" && (
                      <button type="button" onClick={() => act(item.id, "mark_paid")}>
                        {labels.paid}
                      </button>
                    )}
                    {stripeOn &&
                      item.status === "confirmed" &&
                      item.email &&
                      (item.paymentStatus === "unpaid" || item.paymentStatus === "deposit_link_sent") && (
                        <button type="button" onClick={() => payLink(item.id, "deposit")}>
                          {copied === item.id ? labels.copied : labels.depositLink}
                        </button>
                      )}
                    {stripeOn &&
                      item.status === "confirmed" &&
                      item.email &&
                      (item.paymentStatus === "deposit_paid" || item.paymentStatus === "balance_link_sent") && (
                        <button type="button" onClick={() => payLink(item.id, "balance")}>
                          {copied === item.id ? labels.copied : labels.balanceLink}
                        </button>
                      )}
                    {item.stripeUrl && (
                      <a href={item.stripeUrl} target="_blank" rel="noreferrer">
                        {labels.copy}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="hint">Les montants se mettent à jour quand vous quittez le champ. {euros(property.nightlyRateCents)} est le tarif unique par nuit.</p>
    </div>
  );
}
