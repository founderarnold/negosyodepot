(() => {
  const routeMetadata = {
    "/buy-franchise": {
      title: "Buy a Franchise | NegosyoDepot",
      description: "Understand franchise costs, due diligence, agreements, territory, and practical buying techniques before you commit.",
    },
    "/sell-franchise": {
      title: "Sell a Franchise | NegosyoDepot",
      description: "Learn how to turn a proven business into a responsible franchise with clear systems, economics, support, and disclosures.",
    },
  };
  const defaultMetadata = {
    title: "NegosyoDepot — Find a business you can start",
    description: "Discover negosyo packages, franchises, reseller opportunities and expansion partners. Find a business. Start a Negosyo. Grow with FLAME PH.",
  };

  const numberedSteps = steps => `<div class="guide-step-grid">${steps.map(([title, text], index) => `
    <article class="guide-step">
      <span class="guide-step-number">${String(index + 1).padStart(2, "0")}</span>
      <div><h3>${title}</h3><p>${text}</p></div>
    </article>`).join("")}</div>`;

  function buyFranchisePage() {
    const steps = [
      ["Know what you are buying", "A franchise lets you operate a business using another company’s brand, system, products, and support under a written agreement. You own and run your outlet, but you must follow the agreed standards."],
      ["Set a complete budget", "Count more than the franchise fee. Include the site, fit-out, equipment, permits, deposits, opening inventory, training travel, staff, marketing, royalties, technology fees, and enough working cash for slower early months."],
      ["Check the brand and the people", "Verify the legal company, trademarks, operating history, current outlets, closures, complaints, and the person authorized to offer the franchise. Speak privately with several existing and former franchisees."],
      ["Test the numbers yourself", "Ask for the basis of any sales or payback claim. Build conservative, expected, and strong scenarios using local rent, wages, delivery fees, taxes, product costs, and seasonality. A projection is not a promise."],
      ["Study the agreement", "Review the territory, term, renewal, royalties, required suppliers, pricing controls, marketing fund, training, support, transfer, default, termination, non-compete, dispute, and exit rules with independent advisers."],
      ["Confirm the location and supply chain", "Check whether the territory is truly available, the site meets the brand’s requirements, permits are possible, supplies can arrive reliably, and delivery costs leave enough margin."],
      ["Negotiate, document, then decide", "Put every promise in writing. Do not rely on chat messages or verbal assurances. Take time to compare offers and walk away if important costs, rights, or performance claims cannot be verified."],
    ];

    return `<section class="page-hero"><div class="container">
      <div class="breadcrumbs"><a href="#/">Home</a> / Buy Franchise</div>
      <div class="section-kicker">For future franchisees</div>
      <h1>Buy a franchise with your eyes open.</h1>
      <p>In simple terms, you pay for the right to operate an established brand and follow its business system. The brand can give you a head start, but you still carry the cost and day-to-day risk of running the outlet.</p>
      <div class="hero-actions"><a class="btn btn-primary" href="#/explore?cat=Franchise">Browse franchise opportunities</a><a class="btn btn-outline" href="#buy-franchise-checklist">Review the buyer checklist</a></div>
    </div></section>
    <section class="section"><div class="container">
      <div class="section-head"><div><div class="section-kicker">From interest to signed agreement</div><h2>A practical franchise-buying process</h2></div><p>Slow down the decision, verify the facts, and compare the full cost with realistic local demand.</p></div>
      ${numberedSteps(steps)}
    </div></section>
    <section class="section section-white" id="buy-franchise-checklist"><div class="container two-col">
      <article class="panel"><div class="section-kicker">Questions worth asking</div><h2 style="font-size:28px">Before paying or signing</h2><ul class="guide-checklist"><li>What is the total cash needed until the outlet can support itself?</li><li>Which fees repeat monthly or yearly, and how can they change?</li><li>How many outlets opened, transferred, closed, or were terminated?</li><li>What territory is protected, and can the brand sell online inside it?</li><li>What training and opening support are included in writing?</li><li>Can current and former franchisees confirm the claims?</li><li>What happens if you need to sell, transfer, renew, or close?</li></ul></article>
      <aside class="panel guide-callout"><span class="section-kicker">Buyer technique</span><h3>Compare cash left over, not sales alone.</h3><p>Two outlets can report the same sales but leave very different income after rent, labor, supplies, royalties, delivery commissions, taxes, and debt. Build your own monthly cash-flow estimate and stress-test it at lower sales.</p><a class="btn btn-soft" href="#/compare">Compare opportunities</a></aside>
    </div></section>
    <section class="section"><div class="container"><div class="banner"><div><h3>Ready to explore?</h3><p>Shortlist several franchises, then verify the company, costs, agreement, territory, and existing operators.</p></div><a class="btn btn-primary" href="#/explore?cat=Franchise">View franchise opportunities →</a></div><p class="fine-print" style="margin-top:14px">Educational guidance only; not legal, tax, accounting, investment, or franchise advice. NegosyoDepot does not guarantee a brand, profit, payback period, territory, financing, or business outcome.</p></div></section>`;
  }

  function sellFranchisePage() {
    const steps = [
      ["Prove one business works first", "Franchising is not simply selling your logo. You are offering a repeatable operating system. Confirm that the original business has stable demand, sound unit economics, documented processes, and results that can be explained honestly."],
      ["Protect and organize the brand", "Confirm ownership of the business name, trademarks, recipes, designs, software, manuals, and other intellectual property. Resolve partner rights and supplier permissions before offering them to others."],
      ["Build a system another owner can follow", "Document site selection, setup, purchasing, production, service, staffing, quality checks, reporting, marketing, safety, and customer handling. Test whether a trained operator can reproduce the standard."],
      ["Design fair franchise economics", "Set the initial fee, required investment, royalties, marketing contributions, supply margins, and support cost from real evidence. The franchisee must have a reasonable path to a healthy outlet while the franchisor can fund ongoing support."],
      ["Prepare clear documents and disclosures", "Use qualified Philippine legal, tax, accounting, and intellectual-property advisers. State what the franchise includes, all fees, important risks, responsibilities, restrictions, support, territory, term, renewal, transfer, default, and exit rules."],
      ["Choose franchisees for fit, not only cash", "Assess the applicant’s values, operating ability, available capital, location, involvement, and willingness to follow the system. A poor-fit sale can damage customers, the operator, and the whole brand."],
      ["Support, measure, and improve", "Train before launch, help with opening, monitor agreed standards, share useful performance benchmarks, maintain supply continuity, listen to operators, and handle enforcement consistently and fairly."],
    ];

    return `<section class="page-hero"><div class="container">
      <div class="breadcrumbs"><a href="#/">Home</a> / Sell Franchise</div>
      <div class="section-kicker">For brand owners and future franchisors</div>
      <h1>Turn a proven business into a responsible franchise.</h1>
      <p>In simple terms, you let another owner use your brand and operating system for agreed fees. You are not just collecting a franchise payment—you are committing to teach, support, protect, and improve the system.</p>
      <div class="hero-actions"><a class="btn btn-primary" href="#/post">Prepare a franchise listing</a><a class="btn btn-outline" href="#sell-franchise-checklist">Check franchise readiness</a></div>
    </div></section>
    <section class="section"><div class="container">
      <div class="section-head"><div><div class="section-kicker">From successful outlet to repeatable system</div><h2>A practical franchise-selling process</h2></div><p>Build evidence and operating discipline before recruiting franchisees or accepting fees.</p></div>
      ${numberedSteps(steps)}
    </div></section>
    <section class="section section-white" id="sell-franchise-checklist"><div class="container two-col">
      <article class="panel"><div class="section-kicker">Franchise readiness</div><h2 style="font-size:28px">Before offering a franchise</h2><ul class="guide-checklist"><li>Documented results and realistic unit economics</li><li>Protected brand and clearly owned intellectual property</li><li>Tested operations manual and training program</li><li>Reliable suppliers, quality controls, and support capacity</li><li>Complete investment, fee, risk, and responsibility disclosures</li><li>Written franchisee selection and territory rules</li><li>Independent legal, tax, accounting, and IP review</li></ul></article>
      <aside class="panel guide-callout"><span class="section-kicker">Seller technique</span><h3>Sell the system honestly, not a dream.</h3><p>Use verifiable operating data, explain the assumptions behind any example, and show the work the franchisee must do. Avoid guaranteed income or payback claims. Strong franchise relationships begin with expectations both sides can actually meet.</p><a class="btn btn-soft" href="#/trust">Read trust & safety guidance</a></aside>
    </div></section>
    <section class="section"><div class="container"><div class="banner"><div><h3>Is your business ready to be repeated?</h3><p>Prepare the system, evidence, support plan, and disclosures before publishing a franchise offer.</p></div><a class="btn btn-primary" href="#/post">Start a franchise listing draft →</a></div><p class="fine-print" style="margin-top:14px">Educational guidance only; not legal, tax, accounting, brokerage, intellectual-property, or franchise advice. Publishing a listing does not establish regulatory compliance or guarantee a qualified franchisee or transaction.</p></div></section>`;
  }

  function updateMetadata(path) {
    const metadata = routeMetadata[path] || defaultMetadata;
    document.title = metadata.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", metadata.description);
  }

  function renameWorkspaceLabels() {
    document.querySelectorAll("a, strong, .breadcrumbs").forEach(element => {
      const label = element.textContent.trim();
      if (label === "Workspace") element.textContent = "My Workspace";
      if (element.classList.contains("breadcrumbs") && label === "Home / My workspace") {
        element.textContent = "Home / My Workspace";
      }
    });
  }

  function renderFranchiseRoute() {
    const path = location.hash.slice(1).split("?")[0] || "/";
    const pageContent = path === "/buy-franchise" ? buyFranchisePage() : path === "/sell-franchise" ? sellFranchisePage() : "";
    if (!pageContent) {
      if (!path.startsWith("/fulfillmentbymsmes")) {
        updateMetadata(path);
        requestAnimationFrame(() => updateMetadata(path));
      }
      requestAnimationFrame(renameWorkspaceLabels);
      return;
    }
    current = path;
    layout(pageContent);
    updateMetadata(path);
    requestAnimationFrame(() => updateMetadata(path));
    renameWorkspaceLabels();
    window.scrollTo(0, 0);
  }

  window.addEventListener("DOMContentLoaded", renderFranchiseRoute);
  window.addEventListener("hashchange", renderFranchiseRoute);
})();
