const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const targetUrl = process.env.TARGET_URL || "https://abdesm.hopscrum.com.br/login";
const username = process.env.TARGET_USER;
const password = process.env.TARGET_PASS;

if (!username || !password) {
  console.error("Set TARGET_USER and TARGET_PASS before running this script.");
  process.exit(1);
}

const outDir = path.join(process.cwd(), "captures");
fs.mkdirSync(outDir, { recursive: true });

const blockedPath = /(logout|delete|destroy|remove|cancel|approve|reject|send|submit|store|update)/i;
const downloadPath = /(\/csv|csv-|\.csv|\/pdf|\.pdf|modelo)/i;

function safeName(value) {
  return value
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)
    .toLowerCase() || "page";
}

async function summarize(page) {
  return await page.evaluate(() => {
    const textOf = (el) => ((el && (el.innerText || el.textContent)) || "").replace(/\s+/g, " ").trim();
    const attr = (el, name) => el.getAttribute(name) || "";
    const labelFor = (el) => {
      const id = attr(el, "id");
      const labelled = attr(el, "aria-label") || attr(el, "placeholder") || attr(el, "name");
      const label = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
      return textOf(label || el.closest("label") || null) || labelled;
    };
    const compact = (items) => [...new Set(items.filter(Boolean))].slice(0, 80);

    return {
      title: document.title,
      url: location.href,
      headings: compact([...document.querySelectorAll("h1,h2,h3")].map(textOf)),
      navTexts: compact([...document.querySelectorAll("nav a, aside a, header a, .sidebar a, .menu a")].map(textOf)),
      links: [...document.querySelectorAll("a[href]")]
        .map((a) => ({ text: textOf(a), href: a.href }))
        .filter((a) => a.href && a.text)
        .slice(0, 150),
      buttons: compact([...document.querySelectorAll("button, [role='button'], input[type='submit']")].map((el) => textOf(el) || attr(el, "value") || attr(el, "aria-label"))),
      fields: compact([...document.querySelectorAll("input, select, textarea")].map(labelFor)),
      tableHeaders: [...document.querySelectorAll("table")]
        .map((table) => compact([...table.querySelectorAll("th")].map(textOf)))
        .filter((headers) => headers.length),
      bodySample: textOf(document.body).slice(0, 3000),
    };
  });
}

async function login(page) {
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});

  const emailInput = page.locator("input[type='email'], input[name*='email' i], input[placeholder*='email' i]").first();
  if (await emailInput.count()) {
    await emailInput.fill(username);
  } else {
    await page.locator("input:not([type='hidden']):not([type='password'])").first().fill(username);
  }

  const passInput = page.locator("input[type='password']").first();
  await passInput.fill(password);

  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {}),
    page.locator("button[type='submit'], input[type='submit'], button").first().click(),
  ]);

  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /aceitar/i }).click({ timeout: 3000 }).catch(() => {});
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "pt-BR",
  });
  const page = await context.newPage();

  await login(page);

  const origin = new URL(page.url()).origin;
  const seen = new Set();
  const seedPaths = [
    "/dashboard",
    "/admin/dashboard",
    "/profile",
    "/escolas",
    "/escolas/create",
    "/alunos",
    "/alunos/create",
    "/usuarios",
    "/usuarios/create",
    "/anos",
    "/anos/create",
    "/campanhas",
    "/campanhas/create",
    "/nutricionistas",
    "/nutricionistas/create",
    "/mapa",
    "/admin/relatorios",
    "/admin/relatorios/escolas",
    "/admin/relatorios/avaliacoes",
    "/admin/relatorios/avaliacoes/individual",
    "/admin/relatorios/avaliacoes/campanha",
    "/configuracoes",
  ];
  const queue = [page.url(), ...seedPaths.map((pathName) => new URL(pathName, origin).toString())];
  const pages = [];

  while (queue.length && pages.length < 40) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(500);

      await page.getByRole("button", { name: /aceitar/i }).click({ timeout: 1000 }).catch(() => {});
      const summary = await summarize(page);
      const name = `${String(pages.length + 1).padStart(2, "0")}-${safeName(summary.url)}`;
      await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true }).catch(async () => {
        await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
      });
      fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(summary, null, 2));
      pages.push(summary);

      for (const link of summary.links) {
        const candidate = new URL(link.href);
        if (candidate.origin !== origin) continue;
        candidate.hash = "";
        const normalized = candidate.toString();
        if (blockedPath.test(candidate.pathname)) continue;
        if (downloadPath.test(candidate.pathname)) continue;
        if (!seen.has(normalized) && !queue.includes(normalized)) queue.push(normalized);
      }
    } catch (error) {
      pages.push({ url, error: error.message });
    }
  }

  fs.writeFileSync(path.join(outDir, "site-map.json"), JSON.stringify(pages, null, 2));
  console.log(`Captured ${pages.length} pages in ${outDir}`);
  await browser.close();
})();
