const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

(async () => {
  const outDir = path.join(process.cwd(), "captures");
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "pt-BR" });
  await page.goto("https://abdesm.hopscrum.com.br/login", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, "00-login.png"), fullPage: true });
  console.log("Captured login screen.");
  await browser.close();
})();
