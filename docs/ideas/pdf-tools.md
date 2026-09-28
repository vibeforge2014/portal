# PDF 工具盒 / PDF Toolbox（构想）

## 当前实现与扩展顺序（2026-09-28）

工具没有独立落地页。`/<语言>/tools/pdf/` 永久跳转到合并工具；主站与工具页通过导航菜单列出已完成的功能，点击直达对应操作页。站点地图只包含已实现的工具页。

当前已实现：合并、拆分、压缩、移除页面、提取页面、旋转。三种语言均有独立 URL；文件在浏览器中处理。

参照 [iLovePDF 的工具目录](https://www.ilovepdf.com/)扩展时，按处理方式分批上线：

| 批次 | 工具 | 实现重点 |
|---|---|---|
| 浏览器优先 | 页面排序、JPG 转 PDF、PDF 转 JPG、页码、水印 | 复用 pdf-lib 和 PDF.js；逐项验证大小、方向、文字与图像质量 |
| 独立后端任务 | Word/PowerPoint/Excel 与 PDF 转换、OCR、解锁/加密、修复 | 隔离进程、资源上限、超时和临时文件删除；不要在两台生产入口上直接跑重任务 |
| 质量与安全专项 | 现有文字编辑、真实涂黑、电子签名、PDF/A、表单、AI 翻译/摘要 | 需要分别定义准确性、兼容性及安全验收标准；不以覆盖矩形代替安全涂黑 |

所有新增工具先完成真实处理与结果验证，再放进菜单和站点地图。下拉菜单不放尚未实现的占位链接。参考目录与交互路径，不复制第三方品牌、图标或页面文案。

实现依据：[pdf-lib](https://pdf-lib.js.org/)可在浏览器内处理页面、图文和表单；[LibreOffice 命令行](https://help.libreoffice.org/latest/en-ZA/text/shared/guide/pdf_params.html)可导出 Office 文档；[OCRmyPDF](https://ocrmypdf.readthedocs.io/en/latest/)可为扫描件加可搜索文字层；[qpdf](https://qpdf.readthedocs.io/en/latest/cli.html)提供加密、解密与结构检查；[PyMuPDF 的涂黑 API](https://pymupdf.readthedocs.io/en/latest/page.html)可实际删除覆盖区域内容；PDF/A 应以 [veraPDF](https://docs.verapdf.org/validation/)校验。后端类工具需要另设隔离执行环境，不沿用当前浏览器本地处理声明。

## Problem Statement

如何让全球使用中文或英文的 Mac、iPhone 用户，在提交文件前快速完成 PDF 合并、拆页和压缩，并验证这些具体任务能否为官网带来自然搜索访问？

## Recommended Direction

首批只围绕“准备一份可提交的 PDF”做三个独立工具：合并 PDF、提取或拆分页面、压缩 PDF。每个页面都应让用户直接完成任务，并清楚展示处理结果。压缩结果同时展示文件大小与页面清晰度；不承诺一定压到某个指定体积。

现有大型工具站已经覆盖这些功能。本站的机会需要通过实际体验验证：手机上操作顺手、无需注册、文件处理过程清楚，且能说明文件在哪里处理。“免费、私密”本身不是独特卖点。

工具放在现有官网，以“PDF 工具盒 / PDF Toolbox”作为工具区名称。为简体中文、繁体中文和英文分别提供可直接访问的 URL，并允许用户手动切换语言；不按 IP 或浏览器语言强制跳转。简体和繁体页面应分别撰写标题、按钮及帮助文字，而非只转换字形。各语言页面应包含自身及其他版本的 `hreflang` 标注，并列入站点地图。

## Key Assumptions to Validate

- [ ] **搜索入口存在：**分别检查三种语言下的相关查询与搜索结果，再用 Search Console 按页面、查询词和国家或地区观察收录、展示与点击。不预设搜索量或排名。
- [ ] **新工具有被使用的理由：**让 Mac 和 iPhone 用户实际完成合并、拆页、压缩任务，记录完成率、耗时和卡住的位置；与已有工具的体验比较。
- [ ] **压缩效果可信：**用扫描件、文字 PDF、混合内容及不同体积的样本测试，比较处理前后大小、清晰度和文本可用性。若只能有效处理部分文件类型，应在页面上明确说明。
- [ ] **移动设备能稳定处理典型文件：**在 iPhone Safari 和 Mac 主流浏览器上测试内存、耗时及失败提示，再据此设定文件限制。

## MVP Scope

- 导航下拉菜单直达三个最初实现的工具页：合并、拆页、压缩；不设置独立工具入口页。
- 简体中文、繁体中文、英文的独立页面；每页有对应语言的标题、说明、操作界面和可索引内容。
- 优先在浏览器本地处理文件。若某类压缩确实需要服务端处理，先明确文件大小、资源占用、删除时机和用户提示，再决定是否引入。
- 显示输入与输出文件大小、处理状态、失败原因；压缩时提供结果预览与质量选择。
- 用搜索页面展示与点击验证引流，用任务完成率验证页面是否真正有用。各语言单独观察，不把总量当作唯一结论。

## Not Doing (and Why)

- **OCR、PDF 转 Word、电子签名：**会明显扩大技术与质量范围，首批三项已经足以验证方向。
- **安全涂黑、移除密码：**用户容易误解处理后的安全性，需要单独设计和验证。
- **图片格式转换：**有潜力，但先观察 PDF 工具箱的搜索表现，再决定 HEIC 等图片工具是否作为第二组上线。
- **按文件大小、语种或同义词批量生成相似页面：**每个可索引页面都应提供独立且完整的任务价值。

## Open Questions

- 全球中文流量中，是否需要另行关注中国大陆搜索引擎与访问体验？
- 三项工具中，哪一个在真实查询中同时具备清晰需求和可竞争的搜索结果？
- 压缩工具对哪些 PDF 类型能稳定带来有意义的体积下降？

## Research Notes

- [iLovePDF 工具目录](https://www.ilovepdf.com/zh-cn)：合并、拆分、压缩均已有成熟竞品。
- [Google 多语言站点指南](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)和[本地化版本指南](https://developers.google.com/search/docs/specialty/international/localized-versions)：建议各语言使用独立 URL，并支持 `zh-Hans`、`zh-Hant` 标注。
- [Search Console 效果报告](https://support.google.com/webmasters/answer/7576553?hl=en)：可按页面、查询词、国家或地区观察搜索表现。
- [Google 搜索垃圾内容政策](https://developers.google.com/search/docs/essentials/spam-policies)：反对为操纵排名批量制作缺少独立价值的页面。
