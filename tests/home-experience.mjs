import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const port = Number(process.env.HOME_TEST_PORT || 3218);
const target = process.env.HOME_TEST_URL?.replace(/\/$/, "") || `http://127.0.0.1:${port}`;
const chromePath = process.env.CHROME_PATH || (process.platform === "win32" ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : undefined);
let server;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForServer() {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    try { if ((await fetch(target)).status < 500) return; } catch {}
    await wait(400);
  }
  throw new Error(`Timed out waiting for ${target}`);
}

if (!process.env.HOME_TEST_URL) {
  const nextBin = import.meta.resolve("next/dist/bin/next").replace(/^file:\/\//, "").replace(/^\/(.:\/)/, "$1");
  server = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: process.cwd(), env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" }, stdio: "ignore" });
  await waitForServer();
}

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
try {
  for (const width of [320, 390, 820, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.route("**/api/me", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ enabled: true, signedIn: false, check: false }) }));
    await page.goto(`${target}/#/`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Choose a business path with fewer surprises." }).waitFor();
    assert(await page.locator(".business-path-card").count() === 6, `${width}px: expected six business guide cards`);
    assert(!(await page.getByText("Featured packages and franchise kits", { exact: true }).count()), `${width}px: redundant featured-package section remains`);
    assert(!(await page.getByText("More than a marketplace", { exact: true }).count()), `${width}px: redundant process section remains`);
    assert(await page.locator('[data-business-path-footer] a').count() === 6, `${width}px: footer business paths are incomplete`);
    if (width === 390) {
      const violations = (await new AxeBuilder({ page }).analyze()).violations.filter(violation => ["serious", "critical"].includes(violation.impact));
      assert(!violations.length, `Anonymous home accessibility: ${violations.map(violation => violation.id).join(", ")}`);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(overflow === 0, `${width}px: anonymous home has ${overflow}px horizontal overflow`);
    if (width <= 820) {
      const labels = await page.locator(".mobile-dock .dock-item > span:last-child").allTextContents();
      assert(JSON.stringify(labels) === JSON.stringify(["Home", "Find", "Fulfillment", "My Workspace", "More"]), `${width}px: mobile journeys are not task-oriented`);
      const sizes = await page.locator(".mobile-dock .dock-item").evaluateAll(items => items.map(item => ({ height: item.getBoundingClientRect().height, font: Number.parseFloat(getComputedStyle(item).fontSize) })));
      assert(sizes.every(size => size.height >= 44), `${width}px: mobile dock has a target under 44px`);
      assert(sizes.every(size => size.font >= 13), `${width}px: mobile dock text is still too small`);
      const iconSizes = await page.locator(".mobile-dock .dock-symbol").evaluateAll(items => items.map(item => item.getBoundingClientRect().width));
      assert(iconSizes.every(size => size >= 48), `${width}px: mobile dock icons are still too small`);
      const footerSizes = await page.locator(".footer a").evaluateAll(items => items.filter(item => item.getClientRects().length).map(item => Number.parseFloat(getComputedStyle(item).fontSize)));
      assert(footerSizes.every(size => size >= 16), `${width}px: footer links are still too small`);
      const buttonSizes = await page.locator(".btn").evaluateAll(items => items.filter(item => item.getClientRects().length).map(item => Number.parseFloat(getComputedStyle(item).fontSize)));
      assert(buttonSizes.every(size => size === 16), `${width}px: visible action buttons do not share the 16px size`);
    }
    assert(!errors.length, `${width}px: ${errors.join("; ")}`);
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, serviceWorkers: "block" });
  const page = await context.newPage();
  await page.route("**/api/me", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ enabled: true, signedIn: true, member: { name: "Test Member" } }) }));
  await page.goto(`${target}/#/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Good day, Test." }).waitFor();
  assert(await page.locator("[data-feed-post]").count() === 4, "Signed-in home does not show four feed posts");
  const firstPost = page.locator("[data-feed-post]").first();
  const like = firstPost.getByRole("button", { name: /Like/ });
  await like.click();
  assert(await like.getAttribute("aria-pressed") === "true", "Like action did not announce its selected state");
  await firstPost.getByRole("button", { name: /Comment/ }).click();
  await firstPost.getByRole("textbox").fill("Helpful sample comment");
  await firstPost.getByRole("button", { name: "Post" }).click();
  assert(await firstPost.getByText("Helpful sample comment").isVisible(), "Local comment was not rendered");
  assert(await page.getByRole("link", { name: /DTI news and advisories/ }).count() === 1, "Official business news source is missing");
  assert(await page.locator("main main").count() === 0, "Signed-in home contains a nested main landmark");
  const accessibilityViolations = (await new AxeBuilder({ page }).analyze()).violations.filter(violation => ["serious", "critical"].includes(violation.impact));
  assert(!accessibilityViolations.length, `Signed-in home accessibility: ${accessibilityViolations.flatMap(violation => violation.nodes.map(node => `${violation.id}:${node.target.join(" ")}`)).join(", ")}`);
  const signedInOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(signedInOverflow === 0, `Signed-in mobile home has ${signedInOverflow}px horizontal overflow`);
  await context.close();
  console.log("Home experience passed: anonymous guides, signed-in feed, interactions, footer, dock, and 4 responsive widths.");
} finally {
  await browser.close();
  server?.kill();
}
