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

  // The member's FLAME PH badge in their workspace (only when flameph.org shares it: consent 3, 3 months, records).
  // Built with textContent only, never HTML from the server.
  const showBadge = () => {
    const b = auth.member && auth.member.badge;
    const main = /^#\/dashboard(\?|$)/.test(location.hash) && document.querySelector(".dash-main");
    if (!b || !main || main.querySelector("[data-flame-badge]")) return;
    const box = document.createElement("div");
    box.className = "panel";
    box.setAttribute("data-flame-badge", "");
    const h = document.createElement("h3");
    h.textContent = `FLAME PH ${b.level} badge${b.verified ? " · Verified" : ""}`;
    const top = Object.entries(b.categories || {}).sort((x, y) => y[1] - x[1]).slice(0, 3).map((x) => x[0]).join(", ");
    const p = document.createElement("p");
    p.textContent = [`${b.counted} confirmed ${b.counted === 1 ? "deal" : "deals"} on FLAME PH`, top && `mostly ${top}`, b.memberSince && `member since ${b.memberSince}`].filter(Boolean).join(" · ");
    const note = document.createElement("p");
    note.style.fontSize = "12px";
    note.textContent = "A status badge from FLAME PH, not a certification or a guarantee. You can turn it off in your FLAME PH Settings (consent 3).";
    box.append(h, p, note);
    main.prepend(box);
  };
  new MutationObserver(showBadge).observe(document.documentElement, { childList: true, subtree: true });

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
