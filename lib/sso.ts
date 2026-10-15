import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * One FLAME PH account, with flameph.org as the hub. flameph.org tells us who a visitor is with a short-lived token
 * signed with SSO_SECRET (the same value set in every FLAME PH site's Vercel project). NegosyoDepot has no database:
 * the signed-in member is kept in a signed cookie holding their verified email and name. Everything is off until
 * SSO_SECRET is set.
 */

export const SSO_CLIENT = "negosyodepot";
export const SSO_HUB = "flameph";
export const HUB_URL = "https://www.flameph.org";
export const SITE_ORIGINS = ["https://www.negosyodepot.com", "https://negosyodepot.com"];
/** "checked" for a while after asking the hub, "off" after logging out: stops repeat checks. */
export const CHECK_COOKIE = "flame_sso";
export const SESSION_COOKIE = "nd_session";
export const SESSION_DAYS = 30;

const SESSION_AUD = "negosyodepot-session";

export type Member = { email: string; name?: string };
type Claims = Member & { iss: string; aud: string; iat: number; exp: number };

const secret = () => {
  const s = process.env.SSO_SECRET;
  return s && s.length >= 32 ? s : null;
};
export const ssoEnabled = () => secret() !== null;

const mac = (key: string, data: string) => createHmac("sha256", key).update(data).digest();

function sign(c: Omit<Claims, "iat" | "exp">, ttlSeconds: number): string | null {
  const key = secret();
  if (!key) return null;
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ ...c, email: c.email.toLowerCase(), iat: now, exp: now + ttlSeconds })).toString("base64url");
  return `v1.${body}.${mac(key, body).toString("base64url")}`;
}

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

/** A token from flameph.org saying who this visitor is. */
export const verifyHubToken = (token: string) => verify(token, SSO_HUB, SSO_CLIENT);

export const signSession = (m: Member) => sign({ iss: SSO_CLIENT, aud: SESSION_AUD, email: m.email, name: m.name }, SESSION_DAYS * 86400);

export function readSession(value: string | undefined): Member | null {
  const c = value ? verify(value, SSO_CLIENT, SESSION_AUD) : null;
  return c ? { email: c.email, name: c.name } : null;
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
