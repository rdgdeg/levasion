import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { addDays, rangesOverlap } from "./dates";
import type { Reservation } from "./types";

const filePath = path.join(process.cwd(), "data", "reservations.json");

let chain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readAll(): Promise<Reservation[]> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Reservation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeAll(items: Reservation[]): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(items, null, 2));
  await fs.rename(temp, filePath);
}

export function isBlocking(status: Reservation["status"]): boolean {
  return status === "pending" || status === "confirmed";
}

export async function listReservations(): Promise<Reservation[]> {
  return withLock(readAll);
}

export async function calendarWindow(from: string, to: string): Promise<{
  nights: Record<string, "pending" | "confirmed">;
  departures: string[];
}> {
  const items = await listReservations();
  const nights: Record<string, "pending" | "confirmed"> = {};
  const departures = new Set<string>();
  for (const item of items) {
    if (!isBlocking(item.status)) continue;
    if (item.checkOut >= from && item.checkOut < to) departures.add(item.checkOut);
    let cursor = item.checkIn;
    const mark = item.status === "pending" ? "pending" : "confirmed";
    while (cursor < item.checkOut) {
      if (cursor >= from && cursor < to && nights[cursor] !== "confirmed") nights[cursor] = mark;
      cursor = addDays(cursor, 1);
    }
  }
  return { nights, departures: [...departures] };
}

export async function hasConflict(checkIn: string, checkOut: string, ignoreId?: string): Promise<boolean> {
  const items = await listReservations();
  return items.some(
    (item) =>
      item.id !== ignoreId &&
      isBlocking(item.status) &&
      rangesOverlap(item.checkIn, item.checkOut, checkIn, checkOut),
  );
}

export async function createReservation(
  input: Omit<Reservation, "id" | "createdAt" | "paymentStatus" | "stripeSessionId" | "stripeUrl">,
): Promise<Reservation> {
  return withLock(async () => {
    const items = await readAll();
    const conflict = items.some(
      (item) => isBlocking(item.status) && rangesOverlap(item.checkIn, item.checkOut, input.checkIn, input.checkOut),
    );
    if (conflict) {
      const error = new Error("conflict");
      throw error;
    }
    const reservation: Reservation = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      paymentStatus: "unpaid",
    };
    items.push(reservation);
    await writeAll(items);
    return reservation;
  });
}

export async function updateReservation(
  id: string,
  patch: Partial<Pick<Reservation, "status" | "paymentStatus" | "amountCents" | "stripeSessionId" | "stripeUrl">>,
): Promise<Reservation | null> {
  return withLock(async () => {
    const items = await readAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const next = { ...items[index], ...patch };
    if (
      (next.status === "pending" || next.status === "confirmed") &&
      items.some(
        (item) =>
          item.id !== id &&
          isBlocking(item.status) &&
          rangesOverlap(item.checkIn, item.checkOut, next.checkIn, next.checkOut),
      )
    ) {
      throw new Error("conflict");
    }
    items[index] = next;
    await writeAll(items);
    return next;
  });
}

export async function getReservation(id: string): Promise<Reservation | null> {
  const items = await listReservations();
  return items.find((item) => item.id === id) ?? null;
}
