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
