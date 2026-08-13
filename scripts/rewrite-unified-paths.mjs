import { promises as fs } from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "dist");
const textExtensions = new Set([".css", ".html", ".js", ".json", ".map", ".txt"]);

async function visit(directory, transform) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(file, transform);
    } else if (textExtensions.has(path.extname(entry.name))) {
      const before = await fs.readFile(file, "utf8");
      const after = await transform(before, file);
      if (after !== before) await fs.writeFile(file, after);
    }
  }
}

await visit(path.join(root, "minuteflow"), (text, file) => {
  let result = text.replaceAll("/meeting-assistant-site", "/minuteflow");
  if (path.extname(file) === ".html") {
    result = result
      .replaceAll('src="./assets/', 'src="/minuteflow/assets/')
      .replaceAll('href="./assets/', 'href="/minuteflow/assets/')
      .replaceAll('href="./favicon.png"', 'href="/minuteflow/favicon.png"')
      .replaceAll('href="./brand-mark.png"', 'href="/minuteflow/brand-mark.png"');
  }
  return result;
});

const requiredFiles = [
  "index.html",
  "chargepilot/index.html",
  "minuteflow/index.html",
  "tailtalk/index.html",
];

for (const file of requiredFiles) {
  await fs.access(path.join(root, file));
}

// Distinguish two kinds of broken links:
//  - missingAssets: real broken references (CSS/JS/images, nested paths) → fatal.
//  - missingRoots: storefront product subsite roots (e.g. /serverhub/) whose
//    subsite simply isn't part of this assembled deploy. These are optional —
//    app visibility is controlled at runtime by the portal, and an enabled app
//    may legitimately not have a deployed subsite yet — so they only warn.
const isSubsiteRoot = (raw) => /^\/[^/]+\/?$/.test(raw);
const missingAssets = new Set();
const missingRoots = new Set();
await visit(root, async (text) => {
  for (const match of text.matchAll(/(?:href|src)=["'](\/[^"'#?]*)/g)) {
    const raw = decodeURIComponent(match[1]);
    const target = path.join(root, raw);
    try {
      const stat = await fs.stat(target);
      if (stat.isDirectory()) await fs.access(path.join(target, "index.html"));
    } catch {
      (isSubsiteRoot(raw) ? missingRoots : missingAssets).add(match[1]);
    }
  }
  return text;
});

if (missingAssets.size > 0) {
  throw new Error(`Missing local assets:\n${[...missingAssets].sort().join("\n")}`);
}
if (missingRoots.size > 0) {
  console.warn(
    `Warning: subsite roots not present in this build (non-blocking):\n  ${[...missingRoots].sort().join("\n  ")}`,
  );
}

console.log(`Unified site is ready in ${root}`);
