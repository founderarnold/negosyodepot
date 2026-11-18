import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * One FLAME PH account, with flameph.org as the hub. Since Phase 10A flameph.org sends back only a one-time ticket bound
 * to this browser (state + nonce cookie), which this server swaps for who the visitor is, server-to-server, signed
 * with this site's own key (SSO_SECRET_NEGOSYODEPOT; the old shared SSO_SECRET until that is set). NegosyoDepot has
 * no database: the signed-in member is kept in a signed cookie (email, name, private FLAME PH code, start time), good
 * for 7 days and re-checked with flameph.org every 5 minutes (logout everywhere). Everything is off until a key is set.
 */

export const SSO_CLIENT = "negosyodepot";
export const SSO_HUB = "flameph";
export const HUB_URL = "https://www.flameph.org";
export const SITE_ORIGINS = ["https://www.negosyodepot.com", "https://negosyodepot.com"];
/** "checked" for a while after asking the hub, "off" after logging out: stops repeat checks. */
export const CHECK_COOKIE = "flame_sso";
export const SESSION_COOKIE = "nd_session";
export const SESSION_DAYS = 7;
/** Browser-bound check while the visitor is on flameph.org. Host-only, so no other site or subdomain can plant it. */
export const AUTH_COOKIE = "__Host-flame_auth";
export const SESSION_CHECK_SECONDS = 300;

// v2: sessions from before Phase 10A (30 days, no FLAME PH code) are no longer accepted, so members sign in again once.
const SESSION_AUD = "negosyodepot-session-v2";

export type Member = { email: string; name?: string };
/** `sub`: the member's private FLAME PH code for this site; `since`: sign-in time; `chk`: last check with flameph.org. */
export type Session = Member & { sub: string; since: number; chk: number };
type Claims = Member & { iss: string; aud: string; iat: number; exp: number; sub?: string; since?: number; chk?: number };

const strong = (s: string | undefined) => (s && s.length >= 32 ? s : null);
const secret = () => strong(process.env.SSO_SECRET_NEGOSYODEPOT) ?? strong(process.env.SSO_SECRET);
export const ssoEnabled = () => secret() !== null;

const mac = (key: string, data: string) => createHmac("sha256", key).update(data).digest();

function verify(token: string, iss: string, aud: string): Claims | null {
  const key = secret();
  const [v, body, sig] = token.split(".");
  if (!key || v !== "v1" || !body || !sig) return null;
  const want = mac(key, body);
  const got = Buffer.from(sig, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const c = JSON.parse(Buffer.from(body, "base64url").toString()) as Claims;
    const now = Math.floor(Date.now() / 1000);
    if (c.iss !== iss || c.aud !== aud || !(c.exp > now) || c.iat > now + 30) return null;
    if (typeof c.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return null;
    return c;
  } catch {
    return null;
  }
}

/** The session keeps its 7-day end when it is refreshed after a check (`exp` is carried over, never extended). */
export function signSession(m: Session, exp?: number): string | null {
  const key = secret();
  if (!key) return null;
  const now = Math.floor(Date.now() / 1000);
  const end = exp && exp > now ? Math.min(exp, now + SESSION_DAYS * 86400) : now + SESSION_DAYS * 86400;
  const body = Buffer.from(JSON.stringify({ iss: SSO_CLIENT, aud: SESSION_AUD, email: m.email.toLowerCase(), name: m.name, sub: m.sub, since: m.since, chk: m.chk, iat: now, exp: end })).toString("base64url");
  return `v1.${body}.${mac(key, body).toString("base64url")}`;
}

export function readSession(value: string | undefined): (Session & { exp: number }) | null {
  const c = value ? verify(value, SSO_CLIENT, SESSION_AUD) : null;
  if (!c || typeof c.sub !== "string" || typeof c.since !== "number" || typeof c.chk !== "number") return null;
  return { email: c.email, name: c.name, sub: c.sub, since: c.since, chk: c.chk, exp: c.exp };
}

export const randomToken = (bytes = 24) => randomBytes(bytes).toString("base64url");
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Reads the browser's `state.nonce` cookie and checks the state flameph.org sent back. */
export function checkState(cookie: string | undefined, state: string | null): { nonce: string } | null {
  const [s, n] = (cookie ?? "").split(".");
  return s && n && state && same(s, state) ? { nonce: n } : null;
}
export const nonceMatches = (a: string, b: unknown) => typeof b === "string" && same(a, b);

/** A signed message to flameph.org: this site's key, a purpose, a single-use id, 2 minutes to live. */
export function signSiteCall(purpose: string, claims: Record<string, unknown>, ttlSeconds = 120): string | null {
  const key = secret();
  if (!key) return null;
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ ...claims, iss: SSO_CLIENT, aud: SSO_HUB, typ: purpose, jti: randomToken(18), iat: now, exp: now + ttlSeconds })).toString("base64url");
  return `v1.${body}.${mac(key, `${purpose}.${body}`).toString("base64url")}`;
}

/** Calls flameph.org server-to-server. The JSON answer, or null on any failure (4 second limit). */
export async function hubCall<T = Record<string, unknown>>(path: string, purpose: string, claims: Record<string, unknown>): Promise<T | null> {
  const token = signSiteCall(purpose, claims);
  if (!token) return null;
  try {
    const r = await fetch(`${HUB_URL}${path}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ client: SSO_CLIENT, token }),
      cache: "no-store", signal: AbortSignal.timeout(4000),
    });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

/** A notice from flameph.org (for example "drop this member's badge"), signed with this site's key. */
export function verifyHubMessage(purpose: string, token: string): Record<string, unknown> | null {
  const key = secret();
  const [v, body, sig] = (token ?? "").split(".");
  if (!key || v !== "v1" || !body || !sig) return null;
  const want = mac(key, `${purpose}.${body}`);
  const got = Buffer.from(sig, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const c = JSON.parse(Buffer.from(body, "base64url").toString()) as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);
    if (c.iss !== SSO_HUB || c.aud !== SSO_CLIENT || c.typ !== purpose || typeof c.exp !== "number" || !(c.exp > now) || (c.iat as number) > now + 30) return null;
    return c;
  } catch {
    return null;
  }
}

/** Where to send the visitor back to: only addresses on this site, otherwise the home page. */
export function backTo(next: string | null, origin: string): string {
  try {
    const u = new URL(next ?? "/", origin);
    if (u.origin === origin && u.pathname.startsWith("/") && !u.pathname.startsWith("//")) return u.toString();
  } catch {}
  return `${origin}/`;
}

/** flameph.org only returns visitors to the real NegosyoDepot addresses, so ask for the www one. */
export const publicUrl = (url: string) => {
  const u = new URL(url);
  return SITE_ORIGINS.includes(u.origin) ? u.toString() : `${SITE_ORIGINS[0]}${u.pathname}${u.search}${u.hash}`;
};

export const cookieBase = { path: "/", sameSite: "lax" as const, secure: true, httpOnly: true };
export const BADGE_TAG = "flame-badges";
