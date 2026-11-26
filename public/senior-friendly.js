(() => {
  if (typeof mobileDock !== "function") return;

  const items = [
    ["Home", "/"],
    ["Find", "/explore"],
    ["Fulfillment", "/fulfillmentbymsmes"],
    ["My Workspace", "/dashboard"],
  ];

  window.mobileDock = mobileDock = function accessibleMobileDock() {
    const links = items.map(([label, route], index) => {
      const active = route === "/"
        ? current === "/"
        : route === "/fulfillmentbymsmes"
          ? current === "/fulfillment" || current.startsWith("/fulfillment")
          : route === "/dashboard"
            ? ["/dashboard", "/profile", "/looking-for", "/install"].includes(current)
            : current === "/explore" || current === "/find";
      return `<a class="dock-item${active ? " active" : ""}" href="#${route}"${active ? ' aria-current="page"' : ""}><span class="dock-symbol" aria-hidden="true"></span><span>${label}</span></a>`;
    }).join("");
    return `<nav class="mobile-dock redesigned-dock" aria-label="Quick navigation">${links}<button class="dock-item dock-more" type="button" data-open-main-menu aria-label="Open more sections"><span class="dock-symbol" aria-hidden="true"></span><span>More</span></button></nav>`;
  };

  if (typeof page === "function") page();
})();
