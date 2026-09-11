import Database from "better-sqlite3";

const databasePath = process.argv[2];
if (!databasePath) throw new Error("Usage: node scripts/add-visto-product.mjs <database-path>");

const visto = {
  id: "visto",
  visible: true,
  draft: true,
  order: 8,
  url: "https://vibeforge2014.github.io/Visto-Site/",
  platforms: ["iOS", "macOS"],
  accentFrom: "#2BD4D4",
  accentTo: "#1CA3EF",
  glyph: "sync",
  iconAssetId: "icon-visto",
  copy: {
    zh: {
      name: "Visto · 拓屏",
      category: "iOS · macOS 副屏拓展",
      tagline: "把 iPhone / iPad 变成 Mac 的第二块屏幕",
      description: "通过 QUIC/TLS 1.3 无线或 USB 直连，将 Mac 画面以低延迟镜像到 iPhone 或 iPad，触控可直接回传为 Mac 输入；画面与输入只在设备间传输，不经云端。",
      features: ["QUIC 无线与 USB 直连", "硬件编解码低延迟", "触控回传 Mac 输入", "本地传输隐私优先"],
    },
    en: {
      name: "Visto",
      category: "iOS · macOS second display",
      tagline: "Turn your iPhone or iPad into a second Mac screen",
      description: "Mirrors your Mac to an iPhone or iPad over QUIC/TLS 1.3 wireless or a USB cable, with hardware codecs, touch input sent straight back to the Mac, and a local-first design — video and input never leave your devices.",
      features: ["QUIC wireless and USB link", "Low-latency hardware codecs", "Touch input back to the Mac", "Local-first privacy"],
    },
  },
};

// Lattice 换正式图标：旧资源 URL 被 immutable 缓存一年，必须换新资源 ID 才能破缓存。
const ICON_SWAPS = { lattice: "icon-lattice-2026" };

function addVisto(content) {
  const products = content.products
    .filter((product) => product.id !== visto.id)
    .map((product) => (ICON_SWAPS[product.id] ? { ...product, iconAssetId: ICON_SWAPS[product.id] } : product));
  products.push(visto);
  const copy = structuredClone(content.copy);
  copy.zh.productTitle = copy.zh.productTitle.replace("八款", "九款").replace("七款", "九款");
  copy.en.productTitle = copy.en.productTitle.replace("Eight", "Nine").replace("eight", "nine").replace("Seven", "Nine").replace("seven", "nine");
  return { ...content, copy, products: products.map((product, order) => ({ ...product, order })) };
}

const database = new Database(databasePath);
database.pragma("busy_timeout = 10000");
database.pragma("journal_mode = WAL");

const publish = database.transaction(() => {
  const row = database.prepare("SELECT current_json FROM content_state WHERE id = 1").get();
  if (!row) throw new Error("Content state is not initialized");
  const updated = addVisto(JSON.parse(row.current_json));
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
  // 换图标的资源行自包含插入，不依赖新代码启动时的播种；旧行归档。
  database.prepare(`
    INSERT OR IGNORE INTO assets (id, name, kind, url, preset, builtin)
    VALUES ('icon-lattice-2026', 'Lattice', 'product-icon', '/icons/lattice-2026.png', 1, 0)
  `).run();
  database.prepare(`UPDATE assets SET archived = 1 WHERE id = 'icon-lattice'`).run();
  return updated;
});

const published = publish();
database.close();
console.log(JSON.stringify({ products: published.products.length, added: published.products.at(-1)?.id }));
