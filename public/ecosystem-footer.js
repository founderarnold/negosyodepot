// "One FLAME PH ecosystem" strip: the same three lines as on flameph.org and MarketplacePH.
// Shown under the page (outside #app, so it stays when the hash route changes). NegosyoDepot is marked "You are here".
(function () {
  var APPS = [
    { name: "FLAME PH", focus: "Community, learning, tools and support", href: "https://www.flameph.org/" },
    { name: "MarketplacePH", focus: "Buy, sell, delivery, jobs and hiring", href: "https://www.marketplaceph.com/" },
    { name: "NegosyoDepot", focus: "Business packages, suppliers and Fulfillment by MSMEs", href: null },
  ];
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function build() {
    if (document.getElementById("eco-strip")) return;
    var s = el("section", "eco-strip"); s.id = "eco-strip"; s.setAttribute("aria-labelledby", "eco-h");
    var wrap = el("div", "eco-wrap");
    var h = el("h2", "eco-title", "One FLAME PH ecosystem · One account"); h.id = "eco-h";
    wrap.appendChild(h);
    wrap.appendChild(el("p", "eco-text", "Three focused apps for Filipino MSMEs. Your FLAME PH account works on all three."));
    var ul = el("ul", "eco-list");
    APPS.forEach(function (a) {
      var li = el("li");
      var box = a.href ? el("a", "eco-app") : el("div", "eco-app eco-here");
      if (a.href) box.href = a.href; else box.setAttribute("aria-current", "page");
      var name = el("span", "eco-name", a.name);
      if (!a.href) name.appendChild(el("span", "eco-badge", "You are here"));
      box.appendChild(name);
      box.appendChild(el("span", "eco-focus", a.focus));
      li.appendChild(box); ul.appendChild(li);
    });
    wrap.appendChild(ul); s.appendChild(wrap);
    var app = document.getElementById("app");
    if (app && app.parentNode) app.parentNode.insertBefore(s, app.nextSibling); else document.body.appendChild(s);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
