# zensoft.top 高可用架构（备案约束下的双节点）

## 架构

```
                Cloudflare（HTML 60s 边缘缓存 + /api/media/* 一年缓存）
                              │
                101.37.124.50 主服务器（已备案，唯一公网入口）
                nginx = SLB：upstream 三路轮询 + 失败重试
                    ├─ 127.0.0.1:3000        本机 Node（裸机 systemd）
                    ├─ 139.224.228.193:8443  二号节点（未备案，纯内网后端）
                    │     nginx(8443, 仅允许主 IP) → Docker 容器 Node
                    └─ 39.184.194.28:8444    三号节点（家宽，Traefik 网关）
                          Traefik(8444 plain + 8443 TLS, ipAllowList 仅主 IP)
                          → Docker 容器 Node @127.0.0.1:13000
                              │
                数据同步：主 → 二号机/三号机，每 5 分钟（sqlite .backup 快照 + uploads + 产品子站）
                          各目标同步后自动重启应用（主 upstream 自动兜底，用户无感）
```

## 合规要点

- 二号机（139.224.228.193）**无备案**，永不监听公网 80/443；只开 8443（非标端口）且
  nginx `allow 101.37.124.50; deny all`。阿里云安全组需将 8443 入站限制为 101.37.124.50/32。
- 三号机（39.184.194.28，家宽 NAT）：portal 由 Traefik 网关暴露——8444（plain HTTP，集群专用，
  主 nginx upstream 对接）与 8443（TLS，自有证书）；两条路由均 ipAllowList 只放 101.37.124.50，
  其余 403。不监听 80/443，符合备案约束。SSH 入口为路由器映射的 **8222**。
- 三号机是**家宽动态 IP**：重拨变更后集群自动降级双机（max_fails 摘除，服务不受影响），
  恢复三节点需改三处 IP：主 nginx upstream（zensoft.conf）、zensoft-sync.sh TARGETS、
  deploy-portal.sh NODES。
- 公网入口只有备案服务器。主服务器整机故障 = 站点不可用（无合规的快速切换路径），
  恢复手段：服务器重启（systemd 自拉起）或修复后按本文档恢复。

## 故障矩阵

| 故障 | 行为 | 恢复 |
|---|---|---|
| 任一节点应用挂/重启 | nginx 秒级重试其他节点 | 自动，无需人工 |
| 任一备节点整机下线 | upstream 摘除，流量走其余节点 | 自动 |
| 三号机家宽重拨换 IP | connect 超时 → max_fails 摘除，降级双机 | 自动降级；恢复需按上文改三处 IP |
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
| 主 /etc/nginx/conf.d/zensoft.conf | `deploy/zensoft-ha-primary.conf`（upstream 三路 SLB + admin 固定本机） |
| 主 /etc/nginx/snippets/zensoft-static-meta.conf | `deploy/zensoft-static-meta.conf`（robots/sitemap 由 nginx 静态直出，内容与 app/robots.ts、sitemap.ts 保持同步；修 Lighthouse 抓取超时） |
| 备 /etc/nginx/conf.d/zensoft-internal.conf | `deploy/zensoft-ha-secondary-internal.conf`（8443 内网后端） |
| 备 /etc/nginx/nginx.conf | 默认 server 已钉在 127.0.0.1（勿改回 0.0.0.0） |
| 主 /usr/local/bin/zensoft-sync.sh | `deploy/zensoft-sync.sh`（cron */5，双目标：二号机 22 端口 / 三号机 8222 端口） |
| 备 /etc/systemd/system/zensoft.service | `deploy/zensoft-secondary-docker.service`（Docker 运行时；/app 挂载必须可写，ISR 回写需要） |
| 三号机 39.184.194.28 | Docker 运行时单元同二号机（应用监听 127.0.0.1:13000，3000 被 new-api 占用）；Traefik 网关 8444/8443 portal 路由（ipAllowList 仅主 IP）；SSH 入口 8222（路由器映射）；仓库在 /home/soft/portal-src |
| 两台 /etc/ssh/sshd_config | 密码登录已关闭（`PasswordAuthentication no` + `PermitRootLogin prohibit-password`，仅密钥；Mac `id_ed25519` 已授权，锁死时用阿里云控制台网页终端救急） |
| 两台 /etc/sysctl.d/99-zensoft-no-ping.conf | 内核禁 ping（`net.ipv4.icmp_echo_ignore_all=1`，只忽略 echo-request，不影响 PMTUD/SSH/同步/网站） |
| 仓库 deploy/build-linux.sh | 本机一键构建 linux/amd64 产物（arm64 构建 + x64 原生模块替换） |
| 仓库 deploy/deploy-portal.sh | 三机滚动发布（二号机 → 三号机 → 主机） |

## 运维操作

- **发布**：`deploy/build-linux.sh` → `deploy/deploy-portal.sh <release-name>`（三机滚动，零停机）
  - ISR 落盘前提：应用对 `/opt/zensoft` 可写（主 systemd `ReadWritePaths` 已含；备机容器勿用 `:ro` 挂载），且 release 目录属主为 zensoft（deploy 脚本已 chown）。否则每分钟刷 "Failed to update prerender cache EROFS"。
  - sharp 换 x64 后必须补 `sharp/node_modules/semver`（build-linux.sh 已处理），否则 /api/media 整体 500。
  - 三号机若家宽 IP 已变：先按"合规要点"更新三处 IP 再发布。
- **回滚一台**：`ssh -p <22或8222> <host> 'ln -sfn /opt/zensoft/releases/<旧release>/app /opt/zensoft/current && systemctl restart zensoft'`
- **手动同步**：`ssh root@101.37.124.50 /usr/local/bin/zensoft-sync.sh`
- **演练**（建议每季度）：
  1. 备机：`systemctl stop zensoft` → 公网应全绿（流量全走主）
  2. 主机：`systemctl stop zensoft` → 公网应全绿（备机承接，注意此时后台不可写）
  3. 恢复两台，观察 upstream 自动回归

## 升级路径（未做，按需启用）

1. 二号机完成阿里云备案接入 → Cloudflare 加第二条 A 记录（双公网入口，整机故障自动容错）
2. Cloudflare Load Balancer（~$5/月）→ 原生健康检查与自动剔除
3. 状态外移（DB → Supabase、uploads → 对象存储）→ 两节点完全对等无状态
