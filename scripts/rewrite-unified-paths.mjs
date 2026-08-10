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
      const after = await transform(before);
      if (after !== before) await fs.writeFile(file, after);
    }
  }
}

await visit(path.join(root, "minuteflow"), (text) =>
  text.replaceAll("/meeting-assistant-site/", "/minuteflow/"),
);

// Vinext exports TailTalk's App Router routes relative to the app root, but its
// navigation bootstrap records the public mount path. Keep the RSC payload
// untouched and translate only that bootstrap pathname back to the app route.
await visit(path.join(root, "tailtalk"), (text) =>
  text.replace(
    /(self\.__VINEXT_RSC_NAV__=\{"pathname":")\/tailtalk(?=\/)/,
    "$1",
  ),
);

const requiredFiles = [
  "index.html",
  "tivon/index.html",
  "tellyra/index.html",
  "serverhub/index.html",
  "tailtalk/index.html",
  "chargepilot/index.html",
  "minuteflow/index.html",
  "tunesync/index.html",
];

for (const file of requiredFiles) {
  await fs.access(path.join(root, file));
}

const missing = new Set();
await visit(root, async (text) => {
  for (const match of text.matchAll(/(?:href|src)=["'](\/[^"'#?]*)/g)) {
    const target = path.join(root, decodeURIComponent(match[1]));
    try {
      const stat = await fs.stat(target);
      if (stat.isDirectory()) await fs.access(path.join(target, "index.html"));
    } catch {
      missing.add(match[1]);
    }
  }
  return text;
});

if (missing.size > 0) {
  throw new Error(`Missing local targets:\n${[...missing].sort().join("\n")}`);
}

console.log(`Unified site is ready in ${root}`);
