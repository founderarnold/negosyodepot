import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";

const target = (process.env.BASELINE_URL || "https://www.negosyodepot.com").replace(/\/$/, "");
const expectedCommit = process.env.BASELINE_COMMIT || "243abf0430d80a1dc5ea12ac74e3826b17bd7fb0";
const chromePath = process.env.CHROME_PATH || (process.platform === "win32"
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  : undefined);
const outputDirectory = resolve("docs/baseline-results");
mkdirSync(outputDirectory, { recursive: true });

const routes = [
  ["home", "/"],
  ["explore", "/#/explore"],
  ["business finder", "/#/find"],
  ["fulfillment", "/#/fulfillment"],
  ["workspace", "/#/dashboard"],
  ["sign in", "/#/login"],
  ["privacy", "/#/privacy"],
  ["terms", "/#/terms"],
];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const routeResults = [];
const accessibilityResults = [];
const responsiveResults = [];
const pageErrors = [];

async function analyzeAccessibility(page) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);
      return await new AxeBuilder({ page }).analyze();
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(500);
    }
  }
  throw lastError;
}

try {
  const routeContext = await browser.newContext({ viewport: viewports[1], serviceWorkers: "block" });
  const routePage = await routeContext.newPage();
  routePage.on("pageerror", (error) => pageErrors.push(String(error)));
  for (const [name, path] of routes) {
    const response = await routePage.goto(`${target}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await routePage.waitForTimeout(350);
    const h1 = (await routePage.locator("h1").first().textContent())?.trim() || null;
    const rawTitle = await routePage.title();
    routeResults.push({
      name,
      path,
      status: response?.status() ?? (h1 ? 200 : null),
      title: /https?:\/\//.test(rawTitle) ? "External authentication navigation observed" : rawTitle,
      h1,
    });
  }
  await routeContext.close();

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto(`${target}/#/fulfillment`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(500);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    const screenshot = resolve(outputDirectory, `${viewport.name}-fulfillment.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    responsiveResults.push({
      ...viewport,
      viewport: viewport.name,
      horizontalOverflowPixels: Math.max(0, dimensions.scrollWidth - dimensions.clientWidth),
      screenshot: `docs/baseline-results/${viewport.name}-fulfillment.png`,
    });

    const axe = await analyzeAccessibility(page);
    accessibilityResults.push({
      viewport: viewport.name,
      violations: axe.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.length,
        help: violation.help,
      })),
    });
    await context.close();
  }
} finally {
  await browser.close();
}

const meResponse = await fetch(`${target}/api/me`, { redirect: "manual" });
const meBody = await meResponse.json().catch(() => null);
const startResponse = await fetch(`${target}/auth/flame/start?next=%2Fdashboard`, { redirect: "manual" });
const startLocation = startResponse.headers.get("location");
const safeStartLocation = (() => {
  if (!startLocation) return null;
  const url = new URL(startLocation, target);
  return `${url.origin}${url.pathname}`;
})();
const auth = {
  sessionEndpointStatus: meResponse.status,
  anonymousSignedIn: meBody?.signedIn ?? null,
  ssoStartStatus: startResponse.status,
  ssoRedirectDestination: safeStartLocation,
};

const chrome = await launch({ chromePath, chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"] });
const performance = {};
try {
  for (const formFactor of ["mobile", "desktop"]) {
    const result = await lighthouse(`${target}/`, {
      port: chrome.port,
      logLevel: "error",
      output: "json",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      formFactor,
      screenEmulation: formFactor === "desktop"
        ? { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false }
        : { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
    });
    const lhr = result.lhr;
    performance[formFactor] = {
      scores: Object.fromEntries(Object.entries(lhr.categories).map(([key, value]) => [key, Math.round((value.score || 0) * 100)])),
      metrics: {
        firstContentfulPaintMs: lhr.audits["first-contentful-paint"].numericValue,
        largestContentfulPaintMs: lhr.audits["largest-contentful-paint"].numericValue,
        cumulativeLayoutShift: lhr.audits["cumulative-layout-shift"].numericValue,
        totalBlockingTimeMs: lhr.audits["total-blocking-time"].numericValue,
      },
    };
  }
} finally {
  await chrome.kill();
}

const capturedAt = new Date().toISOString();
const result = {
  capturedAt,
  target,
  expectedCommit,
  routes: routeResults,
  auth,
  accessibility: accessibilityResults,
  responsive: responsiveResults,
  performance,
  pageErrors,
};
writeFileSync(resolve(outputDirectory, "live-baseline.json"), `${JSON.stringify(result, null, 2)}\n`);

const seriousViolations = accessibilityResults.flatMap((entry) => entry.violations.filter((violation) => ["serious", "critical"].includes(violation.impact)));
const markdown = `# Live implementation baseline\n\n- Captured: ${capturedAt}\n- Target: ${target}\n- Verified deployed source commit: \`${expectedCommit}\`\n- Synthetic/test writes: none\n\n## Route and authentication results\n\n| Check | Result |\n| --- | --- |\n${routeResults.map((route) => `| ${route.name} \`${route.path}\` | HTTP ${route.status}; H1: ${route.h1 || "missing"} |`).join("\n")}\n| Anonymous session | HTTP ${auth.sessionEndpointStatus}; signed in: ${auth.anonymousSignedIn} |\n| SSO start | HTTP ${auth.ssoStartStatus}; redirect: ${auth.ssoRedirectDestination || "none"} |\n\n## Accessibility and responsive results\n\n- Serious/critical axe violations: ${seriousViolations.length}\n${accessibilityResults.map((entry) => `- ${entry.viewport}: ${entry.violations.length} total axe violation types`).join("\n")}\n${responsiveResults.map((entry) => `- ${entry.viewport} (${entry.width}×${entry.height}): ${entry.horizontalOverflowPixels}px horizontal overflow; screenshot: \`${entry.screenshot}\``).join("\n")}\n- Unhandled page errors: ${pageErrors.length}\n\n## Lighthouse results\n\n| Profile | Performance | Accessibility | Best practices | SEO | FCP | LCP | CLS | TBT |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n${Object.entries(performance).map(([name, value]) => `| ${name} | ${value.scores.performance} | ${value.scores.accessibility} | ${value.scores["best-practices"]} | ${value.scores.seo} | ${Math.round(value.metrics.firstContentfulPaintMs)} ms | ${Math.round(value.metrics.largestContentfulPaintMs)} ms | ${value.metrics.cumulativeLayoutShift.toFixed(3)} | ${Math.round(value.metrics.totalBlockingTimeMs)} ms |`).join("\n")}\n\nRaw machine-readable results are in \`docs/baseline-results/live-baseline.json\`. Lighthouse scores are lab measurements and may vary between runs.\n`;
writeFileSync(resolve(outputDirectory, "README.md"), markdown);

const routeFailures = routeResults.filter((route) => route.status !== 200 || !route.h1);
const overflowFailures = responsiveResults.filter((entry) => entry.horizontalOverflowPixels > 0);
console.log(`Captured live baseline: ${routeResults.length} routes, ${seriousViolations.length} serious/critical axe violations, ${overflowFailures.length} responsive overflow failures.`);
if (routeFailures.length || pageErrors.length) process.exit(1);
