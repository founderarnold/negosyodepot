(() => {
  if (typeof layout !== "function") return;

  const originalLayout = layout;
  const contextualNavigation = [
    {
      label: "Business opportunities",
      matches: path => ["/explore", "/find", "/compare", "/buy-franchise", "/sell-franchise", "/sell-business", "/grow", "/scale", "/post"].includes(path) || path.startsWith("/opportunity/"),
      links: [["Explore", "/explore"], ["Business Finder", "/find"], ["Compare", "/compare"], ["Buy Franchise", "/buy-franchise"], ["Sell Franchise", "/sell-franchise"], ["Sell or Pasalo", "/sell-business"], ["Post a Business", "/post"]],
    },
    {
      label: "Fulfillment by MSMEs",
      matches: path => path === "/fulfillment" || path.startsWith("/fulfillment/") || path.startsWith("/fulfillmentbymsmes"),
      links: [["Overview", "/fulfillmentbymsmes"], ["Brand Owners", "/fulfillmentbymsmes/brands"], ["Hub Operators", "/fulfillmentbymsmes/hubs"], ["Logistics", "/fulfillmentbymsmes/logistics"], ["B2B Network", "/fulfillmentbymsmes/providers"], ["Pricing", "/fulfillment/pricing"], ["Guides", "/fulfillment/guides"]],
    },
    {
      label: "My Workspace",
      matches: path => ["/dashboard", "/profile", "/looking-for", "/install", "/login"].includes(path),
      links: [["Overview", "/dashboard"], ["My Profile", "/profile"], ["Saved & Compare", "/compare"], ["Requests", "/looking-for"], ["My Listings", "/post"], ["Add to Home Screen", "/install"]],
    },
    {
      label: "Funding and partnerships",
      matches: path => ["/funder-finder", "/investor-funder", "/partners", "/membership"].includes(path),
      links: [["Funder Finder", "/funder-finder"], ["Investor/Funder", "/investor-funder"], ["Partners", "/partners"], ["Membership", "/membership"]],
    },
    {
      label: "Resources and support",
      matches: path => ["/resources", "/ecosystem", "/trust", "/faq", "/contact", "/privacy", "/terms", "/ai"].includes(path),
      links: [["Resources", "/resources"], ["FLAME PH Ecosystem", "/ecosystem"], ["Trust & Safety", "/trust"], ["FAQ", "/faq"], ["Contact", "/contact"]],
    },
  ];

  function contextualSubnavigation(path) {
    const group = contextualNavigation.find(item => item.matches(path));
    if (!group) return "";
    const links = group.links.map(([label, target]) => {
      const active = path === target || (target === "/fulfillmentbymsmes" && path === "/fulfillment");
      return `<a href="#${target}"${active ? ' class="active" aria-current="page"' : ""}>${label}</a>`;
    }).join("");
    return `<nav class="context-subnav" aria-label="${group.label}"><div class="container context-subnav-inner"><strong>${group.label}</strong><div class="context-subnav-links">${links}</div></div></nav>`;
  }

  function enhanceNavigation() {
    const mainNavigation = document.getElementById("nav");
    const menuToggle = document.getElementById("menuToggle");
    if (!mainNavigation) return;

    mainNavigation.setAttribute("aria-label", "Main navigation");
    const moreSummary = mainNavigation.querySelector(".more-menu > summary");
    moreSummary?.setAttribute("aria-label", "More navigation options");

    const route = current || "/";
    mainNavigation.querySelectorAll(":scope > a").forEach(anchor => {
      const target = (anchor.getAttribute("href") || "").replace(/^#/, "");
      const sectionActive = target === route
        || (target === "/explore" && ["/find", "/compare"].includes(route))
        || (target === "/fulfillmentbymsmes" && (route === "/fulfillment" || route.startsWith("/fulfillment/") || route.startsWith("/fulfillmentbymsmes/")))
        || (target === "/dashboard" && ["/profile", "/looking-for", "/install"].includes(route));
      if (sectionActive) {
        anchor.classList.add("active");
        anchor.setAttribute("aria-current", target === route ? "page" : "location");
      }
    });

    mainNavigation.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      mainNavigation.classList.remove("open");
      menuToggle?.setAttribute("aria-expanded", "false");
      mainNavigation.querySelectorAll("details[open]").forEach(details => details.removeAttribute("open"));
      menuToggle?.focus();
    });
  }

  window.layout = layout = function informationArchitectureLayout(body) {
    originalLayout(contextualSubnavigation(current) + body);
    enhanceNavigation();
  };
})();
