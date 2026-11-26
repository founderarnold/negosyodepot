import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import { directRoutes, hashRoutes, primaryNavigation } from "./public-route-manifest.mjs";

const port = Number(process.env.ROUTE_TEST_PORT || 3217);
const suppliedTarget = process.env.ROUTE_TEST_URL?.replace(/\/$/, "");
const target = suppliedTarget || `http://127.0.0.1:${port}`;
const chromePath = process.env.CHROME_PATH || (process.platform === "win32"
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  : undefined);
let server;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(target, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {}
    await new Promise(resolveWait => setTimeout(resolveWait, 400));
  }
  throw new Error(`Timed out waiting for ${target}`);
}

function sourceRouteInventory() {
  const source = readFileSync(resolve("public/app-fulfillment.js"), "utf8");
  const routeNamesMatch = source.match(/const routeNames=(\{.*?\});/s);
  const fulfillmentMatch = source.match(/const fulfillmentPageData=\{([\s\S]*?)\n\};/);
  assert(routeNamesMatch && fulfillmentMatch, "Could not read the public route declarations");
  const namedRoutes = Object.keys(JSON.parse(routeNamesMatch[1]));
  const fulfillmentRoutes = [...fulfillmentMatch[1].matchAll(/"(\/fulfillment\/[^"]+)":/g)].map(match => match[1]);
  const opportunityRoutes = [...source.matchAll(/\{id:"([^"]+)",name:/g)].map(match => `/opportunity/${match[1]}`);
  return [...namedRoutes, ...fulfillmentRoutes, ...opportunityRoutes];
}

function verifyManifestCoverage() {
  const manifestPaths = new Set(hashRoutes.map(route => route.path));
  const required = sourceRouteInventory();
  const missing = required.filter(path => !manifestPaths.has(path));
  assert(!missing.length, `Routes missing from the contract: ${missing.join(", ")}`);
  const duplicatePaths = hashRoutes.map(route => route.path).filter((path, index, paths) => paths.indexOf(path) !== index);
  assert(!duplicatePaths.length, `Duplicate route-contract entries: ${duplicatePaths.join(", ")}`);
}

async function startServer() {
  if (suppliedTarget) return;
  const nextBin = requireResolve("next/dist/bin/next");
  server = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", () => {});
  server.stderr.on("data", () => {});
  await waitForServer();
}

function requireResolve(specifier) {
  return import.meta.resolve(specifier).replace(/^file:\/\//, "").replace(/^\/(.:\/)/, "$1");
}

async function verifyHashRoutes(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on("pageerror", error => errors.push(String(error)));
  page.on("request", request => requests.push(request.url()));
  await page.route("**/auth/flame/start**", route => route.fulfill({ status: 204, body: "" }));
  await page.route("https://www.flameph.org/**", route => route.abort());
  for (const route of hashRoutes) {
    requests.length = 0;
    await page.goto(`${target}/#${route.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (route.path === "/login") {
      await page.waitForTimeout(500);
      const ssoStarted = requests.some(url => url.includes("/auth/flame/start"));
      if (!ssoStarted) {
        await page.getByRole("heading", { level: 1, name: route.heading, exact: true }).waitFor({ state: "visible", timeout: 5000 });
        const loginHash = await page.evaluate(() => location.hash.slice(1).split("?")[0] || "/");
        assert(loginHash === "/login", `SSO-disabled login unexpectedly changed to ${loginHash}`);
      }
      continue;
    }
    const heading = page.getByRole("heading", { level: 1, name: route.heading, exact: true });
    await heading.waitFor({ state: "visible", timeout: 5000 });
    const renderedHashPath = await page.evaluate(() => location.hash.slice(1).split("?")[0] || "/");
    assert(renderedHashPath === route.path, `${route.path} unexpectedly changed to ${renderedHashPath}`);
    assert(!errors.length, `${route.path} raised a page error: ${errors.splice(0).join("; ")}`);
  }
  await context.close();
}

async function verifyDirectRedirects(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
  const page = await context.newPage();
  for (const route of directRoutes) {
    await page.goto(`${target}${route.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.getByRole("heading", { level: 1, name: route.heading, exact: true }).waitFor({ state: "visible", timeout: 5000 });
    assert((await page.url()).includes(route.destinationHash), `${route.path} did not redirect to ${route.destinationHash}`);
  }
  await context.close();
}

async function verifyNavigation(browser) {
  for (const width of [320, 390, 820, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block" });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(String(error)));
    await page.goto(`${target}/#/buy-franchise`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.getByRole("heading", { level: 1, name: "Buy a franchise with your eyes open.", exact: true }).waitFor();

    const mainNavigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
    const menuToggle = page.getByRole("button", { name: "Open menu", exact: true });
    if (!(await mainNavigation.isVisible())) {
      await menuToggle.focus();
      await menuToggle.press("Enter");
      assert(await mainNavigation.isVisible(), `${width}px: keyboard did not open the main menu`);
    }

    const directLabels = await mainNavigation.locator(":scope > a").allTextContents();
    assert(primaryNavigation.every(label => directLabels.includes(label)), `${width}px: primary navigation is incomplete`);
    assert(!(await mainNavigation.locator(':scope > a[href="#/fulfillmentbymsmes/providers"]').count()), `${width}px: B2B Network escaped the More menu`);

    const directTargets = await mainNavigation.locator(":scope > a").all();
    for (const targetLink of directTargets) {
      if (!(await targetLink.isVisible())) continue;
      const height = await targetLink.evaluate(element => element.getBoundingClientRect().height);
      assert(height >= 44, `${width}px: a primary navigation target is only ${height}px high`);
    }

    const moreSummary = page.getByLabel("More navigation options", { exact: true });
    if (await moreSummary.isVisible()) {
      await moreSummary.focus();
      await moreSummary.press("Enter");
      assert(await page.getByRole("link", { name: "B2B Network", exact: true }).isVisible(), `${width}px: More did not reveal B2B Network`);
      const outline = await moreSummary.evaluate(element => {
        const style = getComputedStyle(element);
        return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
      });
      assert(outline.style !== "none" && outline.width >= 2, `${width}px: keyboard focus is not visibly outlined`);
    }

    const contextual = page.getByRole("navigation", { name: "Business opportunities", exact: true });
    assert(await contextual.isVisible(), `${width}px: contextual navigation is missing`);
    const contextualTargets = await contextual.getByRole("link").all();
    for (const targetLink of contextualTargets) {
      const height = await targetLink.evaluate(element => element.getBoundingClientRect().height);
      assert(height >= 44, `${width}px: a contextual navigation target is only ${height}px high`);
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(overflow === 0, `${width}px: document has ${overflow}px horizontal overflow`);
    assert(!pageErrors.length, `${width}px: ${pageErrors.join("; ")}`);

    if (width <= 820) {
      await mainNavigation.press("Escape");
      assert(!(await mainNavigation.isVisible()), `${width}px: Escape did not close the menu`);
      assert((await menuToggle.getAttribute("aria-expanded")) === "false", `${width}px: menu state was not announced after Escape`);
    }
    await context.close();
  }
}

verifyManifestCoverage();
await startServer();
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
try {
  await verifyHashRoutes(browser);
  await verifyDirectRedirects(browser);
  await verifyNavigation(browser);
  console.log(`Route contract passed: ${hashRoutes.length} hash routes, ${directRoutes.length} direct redirects, 5 responsive widths.`);
} finally {
  await browser.close();
  server?.kill();
}
