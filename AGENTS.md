<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 服务器部署红线

- 生产服务器 101.37.124.50（zensoft.top）配置极低：2 vCPU / 1.7GB 内存。
- **严禁在这台服务器上执行 `npm ci` / `npm run build` 等编译构建命令**——2026-09-20 曾因在服务器上构建导致内存耗尽、全站宕机 50 分钟。
- 正确流程：本地用 Docker `--platform linux/amd64`（glibc 镜像如 node:22-bookworm-slim，不要 alpine/musl）构建 standalone 产物，rsync 到 `/opt/zensoft/releases/<时间戳-名称>/app/`，切换 `/opt/zensoft/current` 软链后 `systemctl restart zensoft`。
- 本地 macOS 构建的 standalone 含 darwin 原生二进制（argon2/better-sqlite3/sharp），不能直接上传。
