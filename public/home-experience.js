(() => {
  if (typeof home !== "function" || typeof layout !== "function") return;

  const publicHome = home;
  const baseLayout = layout;
  const reactionKey = "nd_feed_reactions_v1";
  const commentKey = "nd_feed_comments_v1";

  const paths = [
    ["sell-business", "Sell or Pasalo a Business", "Explain the real reason for selling, prepare clean records, and agree in writing what assets, debts, staff, and permits are included.", "/sell-business", "selling a business"],
    ["buy-business", "Buy or Start a Business", "Compare the asking price with actual earnings, inspect permits and obligations, and ask an independent adviser before paying.", "/explore", "buying or taking over a business"],
    ["sell-franchise", "Sell a Franchise", "Prove that the business can be repeated, document the operating system, and budget for training and ongoing franchisee support.", "/sell-franchise", "turning a business into a franchise"],
    ["buy-franchise", "Buy a Franchise", "Study the full cost, talk to current and former franchisees, and understand the renewal, territory, supply, and exit terms.", "/buy-franchise", "buying a franchise"],
    ["fulfillment", "Fulfillment by MSMEs", "Match orders with approved local capacity, confirm service levels and custody records, and start with a small trackable pilot.", "/fulfillmentbymsmes", "local MSME fulfillment"],
    ["b2b-network", "FLAME PH B2B Network", "Use a complete business profile, make a specific request, and verify identity, capacity, terms, and references before a deal.", "/fulfillmentbymsmes/providers", "business-to-business networking"],
  ];

  const posts = [
    { id: "supplier-capacity", kind: "Supplier update", initials: "PS", author: "Packaging Supplier", meta: "Sample B2B post · Supplier", body: "We have sample capacity for food-safe pouches and labels. A useful supplier post should state minimum order, lead time, delivery area, and which certifications a buyer may verify.", tag: "#SupplierReadiness" },
    { id: "buyer-request", kind: "Buyer request", initials: "BB", author: "Business Buyer", meta: "Sample B2B post · Buyer", body: "Looking for an operating neighborhood food business to study. A serious buyer should share a budget range, preferred area, hands-on availability, and proof-of-funds process without posting sensitive documents publicly.", tag: "#BusinessForSale" },
    { id: "franchise-guide", kind: "Seller guide", initials: "FG", author: "Franchise Guide", meta: "Educational post", body: "A franchise fee is only one part of the investment. Ask for the total opening budget, required suppliers, recurring fees, training, territory rules, renewal terms, and realistic working capital.", tag: "#FranchiseTips" },
    { id: "fulfillment-pilot", kind: "Network practice", initials: "FN", author: "Fulfillment Network", meta: "Educational post", body: "Before scaling a fulfillment partnership, run a small pilot with item counts, custody handoffs, service levels, exception handling, and a shared reconciliation record.", tag: "#FulfillmentByMSMEs" },
  ];

  const readStore = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
  };
  const writeStore = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  };
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

  function businessPathSection() {
    return `<section class="section business-paths" aria-labelledby="business-paths-title"><div class="container"><div class="section-head"><div><div class="section-kicker">Practical guides for your next move</div><h2 id="business-paths-title">Choose a business path with fewer surprises.</h2><p>Start with plain-language tips, then verify the people, numbers, documents, and terms before committing money.</p></div></div><div class="business-path-grid">${paths.map(([slug, title, tip, href, label]) => `<article class="business-path-card"><div class="business-path-visual path-${slug}" role="img" aria-label="Illustration of ${label}"></div><div class="business-path-copy"><h3>${title}</h3><p>${tip}</p><a class="link-arrow" href="#${href}">Read the guide <span aria-hidden="true">→</span></a></div></article>`).join("")}</div><p class="business-path-note">These guides are educational, not legal, accounting, or investment advice. Verify each transaction with qualified independent advisers.</p></div></section>`;
  }

  function sectionWithout(html, marker) {
    const markerIndex = html.indexOf(marker);
    if (markerIndex < 0) return html;
    const start = html.lastIndexOf("<section", markerIndex);
    const end = html.indexOf("</section>", markerIndex);
    return start >= 0 && end >= 0 ? html.slice(0, start) + html.slice(end + 10) : html;
  }

  function improvedPublicHome() {
    let html = publicHome();
    html = sectionWithout(html, "Featured packages and franchise kits");
    html = sectionWithout(html, "More than a marketplace");
    const insertion = html.indexOf('<section class="section">');
    return insertion >= 0 ? html.slice(0, insertion) + businessPathSection() + html.slice(insertion) : html + businessPathSection();
  }

  function reactionState(postId) {
    const state = readStore(reactionKey)[postId] || {};
    return { like: Boolean(state.like), love: Boolean(state.love) };
  }

  function commentsFor(postId) {
    const comments = readStore(commentKey)[postId];
    return Array.isArray(comments) ? comments.slice(-5) : [];
  }

  function feedPost(post) {
    const reactions = reactionState(post.id);
    const comments = commentsFor(post.id);
    return `<article class="feed-card" data-feed-post="${post.id}"><header class="feed-card-header"><span class="feed-avatar" aria-hidden="true">${post.initials}</span><div><strong>${post.author}</strong><span>${post.meta}</span></div><span class="feed-kind">${post.kind}</span></header><p class="feed-body">${post.body}</p><a class="feed-tag" href="#/explore">${post.tag}</a><div class="feed-counts" aria-live="polite"><span data-reaction-summary>${Number(reactions.like) + Number(reactions.love)} reaction${Number(reactions.like) + Number(reactions.love) === 1 ? "" : "s"}</span><span data-comment-summary>${comments.length} comment${comments.length === 1 ? "" : "s"}</span></div><div class="feed-actions" aria-label="Post actions"><button type="button" data-reaction="like" aria-pressed="${reactions.like}"><span aria-hidden="true">👍</span> Like</button><button type="button" data-reaction="love" aria-pressed="${reactions.love}"><span aria-hidden="true">♥</span> Love</button><button type="button" data-comment-toggle aria-expanded="false"><span aria-hidden="true">💬</span> Comment</button><button type="button" data-share-post><span aria-hidden="true">↗</span> Share</button></div><div class="feed-comments" ${comments.length ? "" : "hidden"} data-comments>${comments.map(comment => `<p><strong>You</strong> ${escapeHtml(comment)}</p>`).join("")}</div><form class="feed-comment-form" data-comment-form hidden><label class="sr-only" for="comment-${post.id}">Comment on ${post.author}'s post</label><input id="comment-${post.id}" name="comment" maxlength="280" required placeholder="Write a helpful business comment"><button type="submit" class="btn btn-primary">Post</button><small>Saved only on this device in this preview.</small></form></article>`;
  }

  function signedInHome() {
    const member = window.NegosyoDepotAuth?.member || {};
    const firstName = escapeHtml((member.name || member.displayName || "Ka-FLAME member").split(" ")[0]);
    return `<section class="member-home"><div class="container member-home-heading"><div><div class="section-kicker">My business network</div><h1>Good day, ${firstName}.</h1><p>See useful B2B updates, requests, guides, and official business information in one focused feed.</p></div><a class="btn btn-primary" href="#/post">Post a business update</a></div><div class="container social-layout"><aside class="social-left" aria-label="Workspace shortcuts"><section class="social-panel"><h2>My Workspace</h2><a href="#/dashboard">Workspace overview <span>→</span></a><a href="#/profile">Complete my business profile <span>→</span></a><a href="#/looking-for">What I am looking for <span>→</span></a><a href="#/compare">Saved comparisons <span>→</span></a></section><section class="social-panel social-safety"><h2>Deal safely</h2><p>Keep sensitive records private. Verify identity, authority, inventory, financial claims, and written terms before transacting.</p><a href="#/trust">Trust &amp; safety</a></section></aside><main class="social-feed" aria-label="Business network feed"><section class="feed-composer"><span class="feed-avatar" aria-hidden="true">${firstName.slice(0, 1).toUpperCase()}</span><div><strong>Share a useful business update</strong><p>Post an offer, buyer request, capacity update, or lesson—with clear terms and no sensitive information.</p></div><a class="btn btn-outline" href="#/post">Create post</a></section><div class="feed-disclosure">Preview feed: sample posts are clearly labeled. Reactions and comments stay on this device until a reviewed server-side feed is approved.</div>${posts.map(feedPost).join("")}</main><aside class="social-right" aria-label="Business news and tips"><section class="social-panel news-panel"><h2>Business news desk</h2><p>Go directly to official sources for current announcements and statistics.</p><a href="https://www.dti.gov.ph/archives/news-archives/" target="_blank" rel="noopener noreferrer"><strong>DTI news and advisories</strong><span>Programs, consumer, and MSME updates ↗</span></a><a href="https://psa.gov.ph/statistics" target="_blank" rel="noopener noreferrer"><strong>Philippine Statistics Authority</strong><span>Official economic and industry data ↗</span></a><a href="https://www.sec.gov.ph/notices/" target="_blank" rel="noopener noreferrer"><strong>SEC notices</strong><span>Company and regulatory notices ↗</span></a></section><section class="social-panel"><h2>Quick learning</h2>${paths.slice(0, 4).map(([, title,, href]) => `<a href="#${href}">${title}<span>Read tips →</span></a>`).join("")}</section></aside></div>${businessPathSection()}</section>`;
  }

  function enhanceFooter() {
    const grid = document.querySelector(".footer-grid");
    if (!grid || grid.querySelector("[data-business-path-footer]")) return;
    const group = document.createElement("div");
    group.setAttribute("data-business-path-footer", "");
    group.innerHTML = `<h4>Business paths</h4>${paths.map(([, title,, href]) => `<a href="#${href}">${title}</a>`).join("")}`;
    grid.insertBefore(group, grid.querySelector(".footer-account"));
  }

  function repairNestedMain() {
    const nestedMain = document.querySelector("main main.social-feed");
    if (!nestedMain) return;
    const section = document.createElement("section");
    [...nestedMain.attributes].forEach(attribute => section.setAttribute(attribute.name, attribute.value));
    while (nestedMain.firstChild) section.append(nestedMain.firstChild);
    nestedMain.replaceWith(section);
  }

  function repairHeaderName() {
    document.querySelector(".nd-header-brand")?.removeAttribute("aria-label");
  }

  window.home = home = function homeExperience() {
    return window.NegosyoDepotAuth?.signedIn === true ? signedInHome() : improvedPublicHome();
  };

  window.layout = layout = function homeExperienceLayout(body) {
    baseLayout(body);
    repairNestedMain();
    repairHeaderName();
    enhanceFooter();
  };

  document.addEventListener("click", async event => {
    const button = event.target instanceof Element ? event.target.closest("[data-reaction], [data-comment-toggle], [data-share-post]") : null;
    if (!button) return;
    const card = button.closest("[data-feed-post]");
    if (!card) return;
    const postId = card.dataset.feedPost;
    if (button.hasAttribute("data-reaction")) {
      const key = button.dataset.reaction;
      const all = readStore(reactionKey);
      const next = { ...(all[postId] || {}), [key]: button.getAttribute("aria-pressed") !== "true" };
      all[postId] = next;
      writeStore(reactionKey, all);
      button.setAttribute("aria-pressed", String(next[key]));
      const count = Number(Boolean(next.like)) + Number(Boolean(next.love));
      card.querySelector("[data-reaction-summary]").textContent = `${count} reaction${count === 1 ? "" : "s"}`;
    } else if (button.hasAttribute("data-comment-toggle")) {
      const form = card.querySelector("[data-comment-form]");
      form.hidden = !form.hidden;
      button.setAttribute("aria-expanded", String(!form.hidden));
      if (!form.hidden) form.querySelector("input").focus();
    } else {
      const post = posts.find(item => item.id === postId);
      const shareData = { title: `${post.author} on NegosyoDepot`, text: post.body, url: location.origin + location.pathname + "#/" };
      try {
        if (navigator.share) await navigator.share(shareData);
        else { await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`); toast("Post link and text copied"); }
      } catch (error) { if (error?.name !== "AbortError") toast("Sharing is unavailable in this browser"); }
    }
  });

  document.addEventListener("submit", event => {
    const form = event.target.closest?.("[data-comment-form]");
    if (!form) return;
    event.preventDefault();
    const card = form.closest("[data-feed-post]");
    const input = form.elements.comment;
    const value = input.value.trim();
    if (!value) return;
    const all = readStore(commentKey);
    const comments = Array.isArray(all[card.dataset.feedPost]) ? all[card.dataset.feedPost] : [];
    comments.push(value);
    all[card.dataset.feedPost] = comments.slice(-5);
    if (!writeStore(commentKey, all)) { toast("This browser could not save the comment"); return; }
    const list = card.querySelector("[data-comments]");
    const row = document.createElement("p");
    const label = document.createElement("strong");
    label.textContent = "You";
    row.append(label, document.createTextNode(` ${value}`));
    list.append(row);
    list.hidden = false;
    card.querySelector("[data-comment-summary]").textContent = `${all[card.dataset.feedPost].length} comment${all[card.dataset.feedPost].length === 1 ? "" : "s"}`;
    input.value = "";
    toast("Comment saved on this device");
  });

  if (typeof page === "function") page();
})();
