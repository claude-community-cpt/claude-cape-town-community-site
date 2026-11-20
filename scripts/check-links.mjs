// Checks that every internal link, image and script in the built site points
// at something that exists, including #anchors. Run after `npm run build`.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const pages = walk(dist).filter((f) => f.endsWith(".html"));
const idsByFile = new Map();
const idsOf = (file) => {
  if (!idsByFile.has(file)) {
    idsByFile.set(file, new Set([...readFileSync(file, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsByFile.get(file);
};
const resolve = (path) => {
  const target = join(dist, decodeURIComponent(path));
  if (existsSync(target) && statSync(target).isFile()) return target;
  const index = join(target, "index.html");
  return existsSync(index) ? index : null;
};

const problems = [];
let checked = 0;
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  const srcsets = [...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1].split(",").map((s) => s.trim().split(" ")[0]));
  for (const ref of [...refs, ...srcsets]) {
    if (/^(https?:|mailto:|tel:|data:)/.test(ref)) continue;
    checked++;
    const [path, hash] = ref.split("#");
    const here = page.slice(dist.length);
    if (path && !path.startsWith("/")) {
      problems.push(`${here}: "${ref}" is a relative link; start it with /`);
      continue;
    }
    const file = path ? resolve(path) : page;
    if (!file) problems.push(`${here}: "${ref}" does not exist`);
    else if (hash && file.endsWith(".html") && !idsOf(file).has(hash)) problems.push(`${here}: "${ref}" has no matching id`);
    else if (path && file.endsWith("index.html") && !path.endsWith("/")) problems.push(`${here}: "${ref}" needs a trailing slash`);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} broken link(s)`);
  process.exit(1);
}
console.log(`${checked} internal links across ${pages.length} pages: all good`);
