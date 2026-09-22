# zensoft.top 高可用架构（备案约束下的双节点）

## 架构

```
                Cloudflare（HTML 60s 边缘缓存 + /api/media/* 一年缓存）
                              │
                101.37.124.50 主服务器（已备案，唯一公网入口）
                nginx = SLB：upstream 轮询 + 失败重试
                    ├─ 127.0.0.1:3000   本机 Node（裸机 systemd）
                    └─ 139.224.228.193:8443   二号节点（未备案，纯内网后端）
                          nginx(8443, 仅允许主 IP) → Docker 容器 Node
                              │
                数据同步：主 → 备，每 5 分钟（sqlite .backup 快照 + uploads + 产品子站）
                          备机同步后自动重启容器（主 upstream 自动兜底，用户无感）
```

## 合规要点

- 二号机（139.224.228.193）**无备案**，永不监听公网 80/443；只开 8443（非标端口）且
  nginx `allow 101.37.124.50; deny all`。阿里云安全组需将 8443 入站限制为 101.37.124.50/32。
- 公网入口只有备案服务器。主服务器整机故障 = 站点不可用（无合规的快速切换路径），
  恢复手段：服务器重启（systemd 自拉起）或修复后按本文档恢复。

## 故障矩阵

| 故障 | 行为 | 恢复 |
|---|---|---|
| 任一节点应用挂/重启 | nginx 秒级重试另一节点 | 自动，无需人工 |
| 备机整机下线 | upstream 摘除，全部流量走主 | 自动 |
| 主机整机下线 | 站点不可用（见上） | 重启主机；systemd 自拉起全套 |
| 主备间网络断 | 同步 cron 失败（日志在 /var/log/zensoft-sync.log），服务不受影响 | 网络恢复即自愈 |

## 关键约束

1. **SQLite 单写者**：后台 `/admin`、`/api/admin/*` 在主 nginx 固定转发本机。
   永远不要在二号机上直接改数据（会被下次同步覆盖）。
2. **同步延迟 ≤5 分钟**：后台发布内容最晚 5 分钟后对备机可见；新上传的图片资源
   5 分钟窗口内只在主存在（后台预览始终走主，不受影响）。
3. 备机 Node 跑在 Docker 容器里（node:22-bookworm-slim + 挂载 release 目录），
   与主服务器产物字节一致；资源上限 512m/1.5cpu。

## 文件清单

| 位置 | 内容 |
|---|---|
| 主 /etc/nginx/conf.d/zensoft.conf | `deploy/zensoft-ha-primary.conf`（upstream SLB + admin 固定本机） |
| 备 /etc/nginx/conf.d/zensoft-internal.conf | `deploy/zensoft-ha-secondary-internal.conf`（8443 内网后端） |
| 备 /etc/nginx/nginx.conf | 默认 server 已钉在 127.0.0.1（勿改回 0.0.0.0） |
| 主 /usr/local/bin/zensoft-sync.sh | `deploy/zensoft-sync.sh`（cron */5） |
| 备 /etc/systemd/system/zensoft.service | Docker 运行时单元 |
| 仓库 deploy/build-linux.sh | 本机一键构建 linux/amd64 产物（arm64 构建 + x64 原生模块替换） |
| 仓库 deploy/deploy-portal.sh | 双机滚动发布（先备后主） |

## 运维操作

- **发布**：`deploy/build-linux.sh` → `deploy/deploy-portal.sh <release-name>`（先备后主，零停机）
  - ISR 落盘前提：应用对 `/opt/zensoft` 可写（主 systemd `ReadWritePaths` 已含；备机容器勿用 `:ro` 挂载），且 release 目录属主为 zensoft（deploy 脚本已 chown）。否则每分钟刷 "Failed to update prerender cache EROFS"。
  - sharp 换 x64 后必须补 `sharp/node_modules/semver`（build-linux.sh 已处理），否则 /api/media 整体 500。
- **回滚一台**：`ssh <host> 'ln -sfn /opt/zensoft/releases/<旧release>/app /opt/zensoft/current && systemctl restart zensoft'`
- **手动同步**：`ssh root@101.37.124.50 /usr/local/bin/zensoft-sync.sh`
- **演练**（建议每季度）：
  1. 备机：`systemctl stop zensoft` → 公网应全绿（流量全走主）
  2. 主机：`systemctl stop zensoft` → 公网应全绿（备机承接，注意此时后台不可写）
  3. 恢复两台，观察 upstream 自动回归

## 升级路径（未做，按需启用）

1. 二号机完成阿里云备案接入 → Cloudflare 加第二条 A 记录（双公网入口，整机故障自动容错）
2. Cloudflare Load Balancer（~$5/月）→ 原生健康检查与自动剔除
3. 状态外移（DB → Supabase、uploads → 对象存储）→ 两节点完全对等无状态
