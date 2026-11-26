/* Phase 1 information architecture for Fulfillment by MSMEs.
 * This is intentionally informational until the reviewed database,
 * authorization, accreditation, and integration contracts are available.
 */
(function () {
  const journeys = {
    brands: {
      kicker: "For MSME brand owners",
      title: "Reach more markets without duplicating your product catalog.",
      intro: "Prepare your brand for approved hubs, local distribution, storage, packing, dispatch, and qualified B2B connections.",
      outcomes: [
        ["Bring approved details forward", "Review FLAME PH member and business details before choosing what to sync."],
        ["Reuse MarketplacePH products", "Select MarketplacePH listings and SKUs instead of encoding descriptions, images, or prices again."],
        ["Plan service coverage", "Describe target markets, handling needs, volume bands, replenishment, and services required."],
      ],
      ownership: "MarketplacePH remains the source for listings, SKUs, commercial prices, sellable stock, and consumer orders.",
      next: "Sign in to prepare a brand application",
    },
    hubs: {
      kicker: "For micro-fulfillment hub operators",
      title: "Present real operating capacity for review.",
      intro: "Describe a facility's coverage, capacity, equipment, staffing, controls, safety practices, and service commitments without claiming approval before review.",
      outcomes: [
        ["Document the facility", "Record facility control, public-safe location, storage types, equipment, hours, and capacity bands."],
        ["Define services and limits", "State receiving, pick-pack, dispatch, inventory controls, exclusions, and service levels."],
        ["Separate review from availability", "Keep application, review, approved capability, current availability, and performance as distinct states."],
      ],
      ownership: "NegosyoDepot will own reviewed hub capabilities and operational availability; selecting an area never grants approval for it.",
      next: "Sign in to prepare a hub application",
    },
    logistics: {
      kicker: "For logistics and mobility providers",
      title: "Offer B2B fulfillment capacity with clear lanes and constraints.",
      intro: "Independent couriers, delivery companies, trucking operators, freight providers, and qualified local riders can prepare a capability profile for review.",
      outcomes: [
        ["Describe service modes", "Record vehicle or vessel classes, lanes, schedules, lead-time bands, and parcel or load limits."],
        ["Show operational capability", "State tracking, proof-of-delivery, temperature control, insurance, permits, and escalation contacts where applicable."],
        ["Protect the boundary", "This journey covers B2B fulfillment capacity, not ordinary MarketplacePH rider booking."],
      ],
      ownership: "NegosyoDepot will own reviewed B2B logistics capability; MarketplacePH continues to own ordinary marketplace delivery booking.",
      next: "Sign in to prepare a logistics application",
    },
    providers: {
      kicker: "For B2B providers and professionals",
      title: "Show what your business can reliably provide.",
      intro: "Build a capability profile for supply, wholesale, manufacturing, packaging, equipment, warehousing, compliance, accounting, legal, technology, marketing, and other enterprise services.",
      outcomes: [
        ["Define capability", "State services, industries, engagement types, service areas, MOQ or capacity bands, and lead times."],
        ["Submit evidence for review", "Licenses, certifications, and professional credentials remain unverified until an authorized reviewer approves them."],
        ["Respond to qualified requests", "Use request-for-quote handoffs without turning professional services into duplicate retail listings."],
      ],
      ownership: "NegosyoDepot will own B2B capability profiles and matching; MarketplacePH remains the retail catalog and order system.",
      next: "Sign in to prepare a provider profile",
    },
  };

  const defaultMetadata = {
    title: "NegosyoDepot — Find a business you can start",
    description: "Discover negosyo packages, franchises, reseller opportunities and expansion partners. Find a business. Start a Negosyo. Grow with FLAME PH.",
  };
  const fulfillmentMetadata = {
    overview: {
      title: "Fulfillment by MSMEs | NegosyoDepot",
      description: "Connect MSME brands with reviewed hubs, B2B logistics, and qualified providers through NegosyoDepot and the FLAME PH ecosystem.",
    },
    brands: {
      title: "MSME Brand Fulfillment | NegosyoDepot",
      description: "Prepare an MSME brand for reviewed hubs, local distribution, storage, packing, dispatch, and qualified B2B connections.",
    },
    hubs: {
      title: "Micro-Fulfillment Hubs | NegosyoDepot",
      description: "Prepare a micro-fulfillment hub capability profile covering facilities, service areas, capacity, controls, and availability.",
    },
    logistics: {
      title: "B2B Logistics Providers | NegosyoDepot",
      description: "Prepare B2B delivery, trucking, freight, or mobility capabilities with clear lanes, schedules, constraints, and proof controls.",
    },
    providers: {
      title: "B2B Service Providers | NegosyoDepot",
      description: "Prepare a reviewed B2B capability profile for supply, wholesale, manufacturing, professional, and enterprise services.",
    },
  };

  function setMetadata(metadata) {
    document.title = metadata.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", metadata.description);
  }

  function updateMetadataFromHash() {
    const path = location.hash.slice(1).split("?")[0] || "/";
    if (!path.startsWith("/fulfillmentbymsmes")) {
      setMetadata(defaultMetadata);
      return;
    }
    const slug = path.split("/")[2] || "overview";
    setMetadata(fulfillmentMetadata[slug] || fulfillmentMetadata.overview);
  }

  function roleCard(slug, icon, title, text) {
    return `<a class="fbm-role-card" href="#/fulfillmentbymsmes/${slug}">
      <span class="fbm-role-icon" aria-hidden="true">${icon}</span>
      <span><strong>${title}</strong><small>${text}</small><b>Explore this journey →</b></span>
    </a>`;
  }

  function overview() {
    return `<section class="fbm-hero">
      <div class="container fbm-hero-grid">
        <div>
          <div class="section-kicker">NegosyoDepot · A FLAME PH ecosystem program</div>
          <h1>Fulfillment by MSMEs, built around clear roles.</h1>
          <p>Connect brand owners, reviewed local hubs, B2B logistics capacity, and qualified providers while keeping identity in FLAME PH and retail commerce in MarketplacePH.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#fbm-roles">Choose your role</a>
            <a class="btn btn-outline" href="#/dashboard">Open workspace</a>
          </div>
          <p class="fbm-status"><strong>Pilot foundation:</strong> applications, accreditation, stock movement, and payments are not yet active. Availability will be shown only after review and approval.</p>
        </div>
        <aside class="fbm-boundary-card" aria-label="Ecosystem responsibilities">
          <span>One account, distinct responsibilities</span>
          <div><b>FLAME PH</b><small>Identity, membership, approved profile sync</small></div>
          <div><b>MarketplacePH</b><small>Products, prices, retail stock and consumer orders</small></div>
          <div><b>NegosyoDepot</b><small>Capabilities, matching and fulfillment operations</small></div>
        </aside>
      </div>
    </section>
    <section class="section section-white" id="fbm-roles">
      <div class="container">
        <div class="section-head"><div><div class="section-kicker">Choose your role</div><h2>Start with the work you need to do.</h2></div><p>Each journey asks only for role-relevant information and will reuse approved information when synchronization becomes available.</p></div>
        <div class="fbm-role-grid">
          ${roleCard("brands", "▣", "MSME brand owner", "Prepare products, target markets, handling needs, and hub requests.")}
          ${roleCard("hubs", "⌂", "Micro-fulfillment hub", "Present facilities, coverage, capacity, controls, and availability.")}
          ${roleCard("logistics", "↗", "Logistics and mobility", "Describe B2B lanes, modes, schedules, constraints, and proof capability.")}
          ${roleCard("providers", "✦", "B2B provider or professional", "Offer reviewed enterprise capabilities and respond to qualified requests.")}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container fbm-process">
        <div><div class="section-kicker">Planned member journey</div><h2>Sign in, review, complete, submit.</h2><p>No uncontrolled copying and no retyping of confirmed information.</p></div>
        <ol>
          <li><b>1</b><span><strong>Sign in with FLAME PH</strong><small>Authentication confirms who you are.</small></span></li>
          <li><b>2</b><span><strong>Preview approved fields</strong><small>Compare source, destination, action, and visibility.</small></span></li>
          <li><b>3</b><span><strong>Complete missing details</strong><small>Add only role-specific operational information.</small></span></li>
          <li><b>4</b><span><strong>Review and submit</strong><small>Receive a reference and track review status.</small></span></li>
        </ol>
      </div>
    </section>`;
  }

  function rolePage(slug, role) {
    return `<section class="fbm-hero fbm-role-hero">
      <div class="container">
        <div class="breadcrumbs"><a href="#/">Home</a> / <a href="#/fulfillmentbymsmes">Fulfillment by MSMEs</a> / ${role.kicker.replace("For ", "")}</div>
        <div class="section-kicker">${role.kicker}</div>
        <h1>${role.title}</h1>
        <p>${role.intro}</p>
        <div class="hero-actions"><a class="btn btn-primary" href="#/login?next=${encodeURIComponent(`/fulfillmentbymsmes/${slug}`)}">${role.next}</a><a class="btn btn-outline" href="#/fulfillmentbymsmes">Compare roles</a></div>
        <p class="fbm-status"><strong>Not yet accepting live applications.</strong> This page establishes the approved journey while secure forms, review controls, and audit records are built.</p>
      </div>
    </section>
    <section class="section section-white">
      <div class="container">
        <div class="section-head"><div><div class="section-kicker">What this journey will support</div><h2>Clear information before any commitment.</h2></div></div>
        <div class="fbm-outcome-grid">${role.outcomes.map(([title, text]) => `<article><span aria-hidden="true">✓</span><h3>${title}</h3><p>${text}</p></article>`).join("")}</div>
        <div class="fbm-ownership"><strong>System boundary</strong><p>${role.ownership}</p></div>
      </div>
    </section>
    <section class="section">
      <div class="container fbm-handoff">
        <div><div class="section-kicker">Before applications open</div><h2>What happens next</h2><p>We are building purpose-specific consent, saved drafts, evidence protection, reviewer roles, status history, and audit-safe integration before collecting operational submissions.</p></div>
        <div class="panel"><h3>Need retail selling now?</h3><p>Use MarketplacePH for product listings, commercial prices, consumer orders, and marketplace stock.</p><a class="btn btn-outline" href="https://www.marketplaceph.com/" target="_blank" rel="noopener noreferrer">Go to MarketplacePH</a></div>
      </div>
    </section>`;
  }

  window.fulfillmentByMsmesPage = function (path) {
    const slug = path.split("/")[2] || "";
    setMetadata(fulfillmentMetadata[slug] || fulfillmentMetadata.overview);
    return journeys[slug] ? rolePage(slug, journeys[slug]) : overview();
  };

  window.addEventListener("hashchange", () => requestAnimationFrame(updateMetadataFromHash));
  updateMetadataFromHash();

  fulfillmentMegaMenus = function () {
    return `${link("/", "Home", "top-nav-link")}
      ${link("/explore", "Buy or Start a Business", "top-nav-link")}
      ${link("/sell-business", "Sell or Pasalo a Business", "top-nav-link")}
      ${link("/buy-franchise", "Buy Franchise", "top-nav-link")}
      ${link("/sell-franchise", "Sell Franchise", "top-nav-link")}
      ${link("/fulfillmentbymsmes", "Fulfillment by MSMEs", "top-nav-link")}
      ${link("/dashboard", "My Workspace", "top-nav-link")}
      <details class="mega-menu more-menu"><summary>More</summary><div class="mega-panel"><div class="more-links">
        ${link("/dashboard", "My Workspace", "workspace-more-link")}${link("/fulfillmentbymsmes/providers", "B2B Network")}${link("/funder-finder", "Funder Finder")}${link("/investor-funder", "Investor/Funder")}${link("/looking-for", "Looking for")}${link("/resources", "Resources")}${link("/ecosystem", "FLAME PH ecosystem")}${link("/trust", "Trust & safety")}
      </div></div></details>`;
  };

  const phase1BaseHeader = header;
  window.header = header = function fulfillmentByMsmesHeader() {
    const html = phase1BaseHeader();
    const navigation = `<nav class="nav mega-navigation" id="nav" aria-label="Main navigation">${fulfillmentMegaMenus()}</nav>`;
    return html.replace(/<nav class="nav mega-navigation"[\s\S]*?<\/nav>/, navigation);
  };

  mobileDock = function () {
    return `<nav class="mobile-dock" aria-label="Quick navigation">
      <a class="dock-item ${current === "/" ? "active" : ""}" href="#/"><span aria-hidden="true">⌂</span><span>Home</span></a>
      <a class="dock-item ${current === "/explore" ? "active" : ""}" href="#/explore"><span aria-hidden="true">⌕</span><span>Find</span></a>
      <a class="dock-item ${current.startsWith("/fulfillmentbymsmes") || current === "/fulfillment" ? "active" : ""}" href="#/fulfillmentbymsmes"><span aria-hidden="true">▣</span><span>Fulfillment</span></a>
      <a class="dock-item ${current === "/dashboard" ? "active" : ""}" href="#/dashboard"><span aria-hidden="true">▦</span><span>My Workspace</span></a>
      <a class="dock-item ${current === "/login" ? "active" : ""}" href="#/login"><span aria-hidden="true">♙</span><span>Sign in</span></a>
    </nav>`;
  };
})();
