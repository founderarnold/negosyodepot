/*
 * One FLAME PH account on NegosyoDepot. flameph.org is where members sign in and join; this script tells the rest of
 * the site who is signed in (window.NegosyoDepotAuth, which the header and pages already read) and sends Sign in /
 * Sign up clicks to flameph.org. On a host without the sign-in routes (/api/me missing) it changes nothing.
 */
(() => {
  const auth = (window.NegosyoDepotAuth = { signedIn: false, member: null });
  const here = () => location.pathname + location.search + location.hash;
  const go = (mode) => location.assign(`/auth/flame/start?mode=${mode}&next=${encodeURIComponent(here())}`);
  const rerender = () => window.dispatchEvent(new HashChangeEvent("hashchange"));
  let live = false;

  auth.signIn = () => go("login");
  auth.signUp = () => go("join");
  auth.signOut = auth.signOutEverywhere = () => {
    location.assign("/auth/logout");
    return new Promise(() => {}); // the page is leaving; keep callers from re-rendering first
  };

  const onLoginPage = () => /^#\/login(\?|$)/.test(location.hash);
  const handleLoginPage = () => {
    if (!live || !onLoginPage()) return;
    if (auth.signedIn) location.replace("#/dashboard");
    else location.replace(`/auth/flame/start?mode=login&next=${encodeURIComponent(location.pathname + location.search + "#/dashboard")}`);
  };

  fetch("/api/me", { credentials: "same-origin", cache: "no-store" })
    .then((r) => (r.ok && (r.headers.get("content-type") || "").includes("json") ? r.json() : null))
    .then((me) => {
      if (!me || !me.enabled) return;
      live = true;
      if (me.signedIn) {
        auth.signedIn = true;
        auth.member = me.member;
        if (!onLoginPage()) rerender();
      } else if (me.check) {
        location.replace(`/auth/flame/start?silent=1&next=${encodeURIComponent(here())}`);
        return;
      }
      handleLoginPage();
    })
    .catch(() => {});

  window.addEventListener("hashchange", (e) => { if (e.isTrusted) handleLoginPage(); });

  // Sign in / Sign up buttons go to flameph.org instead of the old preview sign-in.
  document.addEventListener(
    "click",
    (e) => {
      if (!live || auth.signedIn) return;
      const el = e.target instanceof Element ? e.target.closest('a[href="#/login"], [data-open-signup], [data-dialog-login]') : null;
      if (!el) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const join = el.hasAttribute("data-open-signup") && /sign.?up|create|join|register/i.test(el.textContent || "");
      go(join ? "join" : "login");
    },
    true,
  );
})();
