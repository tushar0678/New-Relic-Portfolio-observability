const { By, until } = $driver;

const BASE_URL = "https://tushar0678.github.io/";
const BASE_HOST = "tushar0678.github.io";
const SECTION = "PORTFOLIO";

const CONFIG = {
  minPagesToVisit: 2,
  maxPagesToVisit: 6,
  pageLoadTimeout: 20000,
  bodyTimeout: 8000,
  pagePause: 800,
  maxImagesToCheckPerPage: 2,
  maxLinksToValidatePerPage: 5,
  maxRuntimeMs: 105000
};

const ERROR_PATTERNS = [
  "this page isn’t in our collection",
  "this page isn't in our collection",
  "we can’t find the page you’re looking for",
  "we can't find the page you're looking for",
  "400 bad request", "401 unauthorized", "403 forbidden", "404 not found", "404 error",
  "500 internal server error", "502 bad gateway", "503 service unavailable", "504 gateway timeout",
  "page not found", "internal server error", "bad gateway", "service unavailable",
  "temporarily unavailable", "something went wrong", "unexpected error", "access denied",
  "failed to load", "failed to fetch", "network error", "connection timed out",
  "connection refused", "application error", "server error"
];

function clean(v) { return String(v || "").replace(/\s+/g, " ").trim(); }

function safeSet(key, value) {
  try {
    if ($util?.insights?.set) $util.insights.set(key, String(value || ""));
  } catch (e) {}
}

function normalize(url) {
  try {
    const u = new URL(url, BASE_URL);
    if (u.hostname !== BASE_HOST) return null;
    u.hash = "";
    u.search = "";
    return u.toString();
  } catch (e) { return null; }
}

function buildError(type, message, url, pageType) {
  return { type, message, url, pageType, section: SECTION };
}

async function getVisibleText() {
  try { return clean(await $browser.findElement(By.css("body")).getText()).toLowerCase(); }
  catch (e) { return ""; }
}

async function detectErrorPage(url) {
  const title = clean(await $browser.getTitle()).toLowerCase();
  const body = await getVisibleText();
  const pattern = ERROR_PATTERNS.find(p => (title + " " + body).includes(p));
  if (pattern) return buildError("PAGE_ERROR", `Detected error pattern: ${pattern}`, url, "PAGE");
  if (title.includes("404") || title.includes("not found") || title.includes("error")) {
    return buildError("PAGE_ERROR", `Error-like title: ${title}`, url, "PAGE");
  }
  return null;
}

async function validateTitleAndHeadings(url, errors) {
  const title = clean(await $browser.getTitle());
  if (!title || title.length < 5) errors.push(buildError("TITLE_INVALID", "Page title is missing or too short", url, "PAGE"));
  let headings = [];
  try { headings = await $browser.findElements(By.css("h1, h2")); } catch (e) {}
  if (!headings.length) errors.push(buildError("HEADING_MISSING", "No H1/H2 heading found", url, "PAGE"));
}

async function validateImages(url, errors) {
  let checked = 0;
  try {
    const images = await $browser.findElements(By.css("img"));
    for (const img of images) {
      if (checked >= CONFIG.maxImagesToCheckPerPage) break;
      let visible = false;
      try { visible = await img.isDisplayed(); } catch (e) {}
      if (!visible) continue;
      const result = await $browser.executeScript(
        "return {complete: arguments[0].complete, naturalWidth: arguments[0].naturalWidth, src: arguments[0].src || ''};", img
      );
      checked++;
      if (!result.complete || result.naturalWidth === 0) {
        errors.push(buildError("BROKEN_IMAGE", `Broken image: ${result.src}`, url, "PAGE"));
      }
    }
  } catch (e) {
    errors.push(buildError("IMAGE_CHECK", `Image validation failed: ${e.message}`, url, "PAGE"));
  }
}

async function discoverInternalLinks() {
  const found = [];
  try {
    const anchors = await $browser.findElements(By.css("a[href]"));
    for (const a of anchors) {
      try {
        const url = normalize(await a.getAttribute("href"));
        if (url) found.push(url);
      } catch (e) {}
    }
  } catch (e) {}
  return [...new Set(found)];
}

async function validatePage(url) {
  const errors = [];
  const pageType = url === BASE_URL ? "HOME" : "SUBPAGE";
  try {
    await $browser.get(url);
    await $browser.wait(until.elementLocated(By.css("body")), CONFIG.bodyTimeout);
    await $browser.sleep(CONFIG.pagePause);
  } catch (e) {
    return { errors: [buildError("LOAD_FAILURE", `Unable to load page: ${e.message}`, url, pageType)], links: [] };
  }

  const pageError = await detectErrorPage(url);
  if (pageError) return { errors: [pageError], links: [] };
  await validateTitleAndHeadings(url, errors);
  await validateImages(url, errors);
  return { errors, links: await discoverInternalLinks() };
}

async function main() {
  const startTime = Date.now();
  const queue = [BASE_URL];
  const visited = new Set();
  const queued = new Set(queue);
  const allErrors = [];

  while (queue.length > 0 && visited.size < CONFIG.maxPagesToVisit) {
    if (Date.now() > startTime + CONFIG.maxRuntimeMs) break;
    const url = queue.shift();
    if (!url || visited.has(url)) continue;
    visited.add(url);

    const result = await validatePage(url);
    allErrors.push(...result.errors);

    let discovered = 0;
    for (const link of result.links) {
      if (discovered >= CONFIG.maxLinksToValidatePerPage) break;
      if (!queued.has(link) && !visited.has(link)) {
        queue.push(link);
        queued.add(link);
        discovered++;
      }
    }
  }

  safeSet("ErrorMessage", allErrors.map(e => e.message).join(" || "));
  safeSet("ErrorType", allErrors.map(e => e.type).join(","));
  safeSet("PageType", allErrors.map(e => e.pageType).join(","));
  safeSet("Section", SECTION);
  safeSet("Url", allErrors.map(e => e.url).join(" || "));

  console.log(`Portfolio pages visited: ${visited.size}`);
  console.log(`Portfolio validation errors: ${allErrors.length}`);
  if (allErrors.length > 0) throw new Error(allErrors.map(e => `[${e.type}] ${e.message} | ${e.url}`).join("\n"));
}

main();
