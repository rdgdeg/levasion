import { addDays, todayISO } from "@/lib/dates";
import { calendarWindow } from "@/lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from") || todayISO();
  const to = url.searchParams.get("to") || addDays(from, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || to <= from) {
    return Response.json({ error: "dates" }, { status: 400 });
  }
  const calendar = await calendarWindow(from, to);
  return Response.json(calendar);
}
