<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 服务器部署红线

## 三个运行节点

| | 主（公网入口） | 二号（内网后端） | 三号（家庭网络后端） |
|---|---|---|---|
| 地址 | 101.37.124.50（已备案） | 139.224.228.193（**未备案**） | 39.184.194.28（动态 IP，发布前核对） |
| 规格 | 2C / 1.7G / Alibaba Cloud Linux 4 | 2C / 1.9G / Alibaba Cloud Linux 3 | 见 `deploy/HA.md` |
| 应用 | 裸机 systemd Node，端口 3000 | Docker 容器 Node，端口 3000 | Docker 容器 Node，端口 13000 |
| Web 监听 | 80/443（nginx SLB） | **仅 8443**（nginx，只允许主 IP） | Traefik 8444/8443（只允许主 IP） |

## 红线

- **三个运行节点都严禁执行 `npm ci` / `npm run build` 等编译命令**（2026-09-20 曾因在主服务器构建导致全站宕机 50 分钟）。
- **二号机永不监听公网 80/443**（无备案，合规要求）；角色仅限内网后端 + 数据副本。
- 后台数据只在主服务器写入（`/admin`、`/api/admin` 固定主本机）；二号机和三号机数据是 5 分钟同步的只读副本，其上的改动会被覆盖。
- 构建流程：本机 Docker 构建 standalone 并替换 linux/amd64 原生模块，`deploy/deploy-portal.sh` 三节点滚动发布。Mac 通过专用密钥连接主机，由主机的既有同步密钥转发产物到两个后端。
- 主机 nginx 的 `/sitemap.xml` 从 `/var/www/zensoft/sitemap.xml` 静态返回；每次发布必须刷新该文件，确保与应用生成的站点地图一致。
- 架构与故障矩阵详见 `deploy/HA.md`。
