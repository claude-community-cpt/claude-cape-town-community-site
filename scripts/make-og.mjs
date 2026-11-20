// Draws public/og.png, the 1200x630 picture shown when a link to the site is
// shared. Run `node scripts/make-og.mjs` after changing the brand or the wording.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const font = (file) => readFileSync(new URL(`../public/fonts/${file}`, import.meta.url)).toString("base64");
const spark = readFileSync(new URL("../src/assets/brand/spark-ivory.svg", import.meta.url), "utf8").replace(
  'fill="#FAF9F5"',
  'fill="#141413"',
);

const html = `<!doctype html><style>
@font-face{font-family:CCDisplay;src:url(data:font/woff2;base64,${font("AnthropicSerifDisplay-Light.woff2")})}
@font-face{font-family:CCLabel;src:url(data:font/woff2;base64,${font("AnthropicSansDisplay-Semibold.woff2")})}
body{margin:0;width:1200px;height:630px;background:#d97757;color:#141413;display:flex;flex-direction:column;justify-content:space-between;padding:64px 72px;box-sizing:border-box}
svg{width:72px;height:72px}
h1{margin:0;font:300 168px/0.98 CCDisplay;letter-spacing:-0.02em}
h1 span{display:block}h1 span+span{margin-left:120px}
p{margin:0;font:600 22px CCLabel;letter-spacing:.09em;text-transform:uppercase}
</style>${spark}<h1><span>Hello,</span><span>Cape Town</span></h1><p>Claude Community Cape Town</p>`;

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => Promise.all([document.fonts.load("300 100px CCDisplay"), document.fonts.load("600 22px CCLabel")]));
await page.screenshot({ path: new URL("../public/og.png", import.meta.url).pathname });
await browser.close();
console.log("wrote public/og.png");
