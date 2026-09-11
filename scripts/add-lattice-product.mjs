import Database from "better-sqlite3";

const databasePath = process.argv[2];
if (!databasePath) throw new Error("Usage: node scripts/add-lattice-product.mjs <database-path>");

const lattice = {
  id: "lattice",
  visible: true,
  draft: false,
  order: 7,
  url: "https://lattice-dks.pages.dev/",
  platforms: ["macOS"],
  accentFrom: "#A89BFF",
  accentTo: "#56D4DD",
  glyph: "code",
  iconAssetId: "icon-lattice",
  copy: {
    zh: {
      name: "Lattice",
      category: "macOS AI 命令中心",
      tagline: "一个快捷键，直达整个 Mac",
      description: "原生 macOS 命令中心，可启动应用、毫秒级搜索全盘文件、运行快捷指令并调用 AI 工具。",
      features: ["全盘文件快速搜索", "应用与系统命令", "快捷指令集成", "AI 本地工具调用"],
    },
    en: {
      name: "Lattice",
      category: "AI command center for macOS",
      tagline: "One shortcut to your entire Mac",
      description: "A native macOS command center for launching apps, searching files in milliseconds, running Shortcuts, and calling AI tools.",
      features: ["Fast full-disk search", "App and system commands", "Shortcuts integration", "AI tool execution"],
    },
  },
};

function addLattice(content) {
  const products = content.products.filter((product) => product.id !== lattice.id);
  products.push(lattice);
  const copy = structuredClone(content.copy);
  copy.zh.productTitle = copy.zh.productTitle.replace("七款", "八款");
  copy.en.productTitle = copy.en.productTitle.replace("Seven", "Eight").replace("seven", "eight");
  return { ...content, copy, products: products.map((product, order) => ({ ...product, order })) };
}

const database = new Database(databasePath);
database.pragma("busy_timeout = 10000");
database.pragma("journal_mode = WAL");

const publish = database.transaction(() => {
  const row = database.prepare("SELECT current_json FROM content_state WHERE id = 1").get();
  if (!row) throw new Error("Content state is not initialized");
  const updated = addLattice(JSON.parse(row.current_json));
  const updatedJson = JSON.stringify(updated);
  database.prepare(`
    UPDATE content_state
    SET previous_json = current_json,
        current_json = ?,
        draft_json = ?,
        published_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(updatedJson, updatedJson);
  return updated;
});

const published = publish();
database.close();
console.log(JSON.stringify({ products: published.products.length, added: published.products.at(-1)?.id }));
