# VibeForge Portal

[vibeforge2014](https://github.com/vibeforge2014) 的 macOS 产品入口。ChargePilot 是当前唯一在售产品，MinuteFlow 暂不开放购买。基于 Next.js(App Router)+ TypeScript + Tailwind CSS + Motion。

## 收录的站点

| 产品 | 类别 | 链接 |
|------|------|------|
| ChargePilot | macOS 电池管理 | https://vibeforge2014.github.io/chargepilot-site/ |
| MinuteFlow | 录音·转录·纪要 | https://vibeforge2014.github.io/meeting-assistant-site/ |

产品数据集中在 `src/data/products.ts`,新增或更新站点时只改这一个文件。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:3000
```

> 注意:本地 dev 时 `basePath` 仍会生效(默认 `/portal`)。若本地预览想用根路径,把 `next.config.mjs` 中的 `repo` 改为 `""` 即可。

## 部署到 GitHub Pages

本门户本身也部署为 GitHub Pages(static export)。

1. 在 GitHub 新建仓库,例如 `portal`(或 `vibeforge2014.github.io`)。
2. 打开 `next.config.mjs`,把 `const repo = "portal"` 改成你的仓库名;若部署到 `vibeforge2014.github.io` 则改为 `""`。
3. 推送代码后,在仓库 **Settings → Pages** 中选择部署方式(推荐用 GitHub Actions 或 `gh-pages` 分支)。
4. 用 `gh-pages` 一键发布:

   ```bash
   npm run deploy   # 先 build,再把 out/ 推到 gh-pages 分支
   ```

构建产物在 `out/` 目录(static export,无需 Node 运行时)。

## 设计要点

- **流体交互**:卡片悬停抬升、按下即时回弹,弹簧为临界阻尼(无 overshoot),路径对称。
- **材质深度**:顶栏为半透明玻璃(`backdrop-filter`),内容在其下滚动。
- **排版**:系统字体栈;大标题负字距 + 紧行高,正文宽松行高。
- **可访问性**:
  - `prefers-reduced-motion` → 动画降级为交叉淡入,无弹簧/视差。
  - `prefers-reduced-transparency` → 玻璃面变为实色。
  - `prefers-contrast: more` → 近实色背景 + 高对比边框。
  - 明暗主题自动跟随系统。
  - 卡片为真实 `<a>`,可键盘 Tab 聚焦并回车打开。

## 技术栈

- Next.js 14(App Router,`output: export`)
- TypeScript
- Tailwind CSS 3
- Motion(弹簧动画)
