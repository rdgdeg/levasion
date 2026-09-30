import { isAdmin, passwordMatches, setAdminCookie } from "@/lib/auth";

const attempts = new Map<string, { count: number; until: number }>();

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const state = attempts.get(ip);
  if (state && state.until > Date.now() && state.count >= 8) {
    return Response.json({ error: "locked" }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || !passwordMatches(body.password)) {
    const count = (state && state.until > Date.now() ? state.count : 0) + 1;
    attempts.set(ip, { count, until: Date.now() + 10 * 60 * 1000 });
    return Response.json({ error: "password" }, { status: 401 });
  }
  attempts.delete(ip);
  await setAdminCookie();
  return Response.json({ ok: true, admin: await isAdmin() });
}
