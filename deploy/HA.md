# zensoft.top 高可用架构（备案约束下的三节点）

## 架构

```
                Cloudflare（HTML 60s 边缘缓存 + /api/media/* 一年缓存）
                              │
                101.37.124.50 主服务器（已备案，唯一公网入口）
                nginx = SLB：upstream 轮询 + 失败重试
                    ├─ 127.0.0.1:3000   本机 Node（裸机 systemd）
                    ├─ 139.224.228.193:8443   二号节点（未备案，内网后端）
                    │     nginx(8443, 仅允许主 IP) → Docker 容器 Node:3000
                    └─ 39.184.194.28:8444    三号节点（家宽动态 IP，后端）
                          Traefik(8444 plain + 8443 TLS，仅允许主 IP)
                          ├─ Docker 容器 Node @127.0.0.1:13000
                          └─ PDF/Word 转换入口 @127.0.0.1:13020
                               → 内网 API → Gotenberg/LibreOffice
                              │
                数据同步：主 → 两个后端，每 5 分钟（sqlite .backup 快照 + uploads + 产品子站）
                          后端同步后自动重启应用（主 upstream 自动兜底）
```

## 合规要点

- 二号机（139.224.228.193）**无备案**，永不监听公网 80/443；只开 8443（非标端口）且
  nginx `allow 101.37.124.50; deny all`。阿里云安全组需将 8443 入站限制为 101.37.124.50/32。
- 三号机通过 Traefik 的 8444（HTTP，集群专用）和 8443（TLS）提供 portal 路由，两条路由
  均只允许主服务器 IP；SSH 入口为路由器映射的 8222。家宽 IP 是动态的，变更后需同步更新
  主 nginx upstream、主机同步脚本和发布脚本；不把三号机作为 portal 公网入口。
- 公网入口只有备案服务器。主服务器整机故障 = 站点不可用（无合规的快速切换路径），
  恢复手段：服务器重启（systemd 自拉起）或修复后按本文档恢复。

## 故障矩阵

| 故障 | 行为 | 恢复 |
|---|---|---|
| 任一节点应用挂/重启 | nginx 秒级重试其他节点 | 自动，无需人工 |
| 任一后端整机下线 | upstream 摘除，流量走其余节点 | 自动 |
| 三号机家宽重拨换 IP | connect 超时后摘除，降级为两个节点 | 更新主 nginx、同步脚本和发布脚本的地址 |
| PDF/Word 转换容器故障 | 两个在线转换工具提示服务不可用，其他 29 个 PDF 工具与 portal 不受影响 | 在三号机检查 `/opt/zensoft-pdf-converter/current` 与容器日志，重新运行转换服务发布脚本 |
| 主机整机下线 | 站点不可用（见上） | 重启主机；systemd 自拉起全套 |
| 主机与后端网络断 | 同步 cron 失败（日志在 /var/log/zensoft-sync.log），其余节点继续服务 | 网络恢复即自愈 |

## 关键约束

1. **SQLite 单写者**：后台 `/admin`、`/api/admin/*` 在主 nginx 固定转发本机。
   永远不要在两个后端直接改数据（会被下次同步覆盖）。
2. **同步延迟 ≤5 分钟**：后台发布内容最晚 5 分钟后对两个后端可见；新上传的图片资源
   5 分钟窗口内只在主存在（后台预览始终走主，不受影响）。
3. 两个后端 Node 跑在 Docker 容器里（node:22-bookworm-slim + 挂载 release 目录），
   与主服务器产物字节一致。二号机资源上限 512m/1.5cpu。
4. 三号机 portal 应用监听 127.0.0.1:13000；主机用 `/root/.ssh/zensoft_sync` 将数据及发布产物
   转发到两台后端。Mac 的 `~/.ssh/zensoft_deploy` 只需能连接主机。
5. PDF/Word 转换服务只运行在三号机。API 与 Gotenberg 只接入 Docker internal 网络，只有无文件权限的
   ingress 容器监听 `127.0.0.1:13020`；Traefik 8443 再以主服务器 IP 白名单对外提供专用路由。
   任务目录为 `0700`，单并发、最多排队 8 个，下载后删除且 15 分钟兜底清理。

## 文件清单

| 位置 | 内容 |
|---|---|
| 主 /etc/nginx/conf.d/zensoft.conf | `deploy/zensoft-ha-primary.conf`（upstream SLB + admin 固定本机） |
| 二号 /etc/nginx/conf.d/zensoft-internal.conf | `deploy/zensoft-ha-secondary-internal.conf`（8443 内网后端） |
| 二号 /etc/nginx/nginx.conf | 默认 server 已钉在 127.0.0.1（勿改回 0.0.0.0） |
| 主 /usr/local/bin/zensoft-sync.sh | `deploy/zensoft-sync.sh`（cron */5） |
| 二号 /etc/systemd/system/zensoft.service | `deploy/zensoft-secondary-docker.service`（Docker 运行时；/app 挂载必须可写，ISR 回写需要） |
| 主 /etc/nginx/snippets/zensoft-static-meta.conf | `deploy/zensoft-static-meta.conf`；robots 由 nginx 返回，sitemap 从 `/var/www/zensoft/sitemap.xml` 静态读取 |
| 三号节点 | Docker portal Node 127.0.0.1:13000（3000 被 new-api 占用）；Traefik 8444/8443 仅允许主 IP；SSH 8222；仓库在 /home/soft/portal-src |
| 三号 `/opt/zensoft-pdf-converter` | PDF/Word 转换 release、compose 配置与当前版本软链；任务数据在 `/var/lib/zensoft-pdf-converter/jobs` |
| 三号 `/home/soft/gateway/dynamic/pdf-converter.yml` | `deploy/pdf-converter-traefik.yml`（TLS 路由与主服务器 IP 白名单） |
| 主和二号 /etc/ssh/sshd_config | 密码登录已关闭（`PasswordAuthentication no` + `PermitRootLogin prohibit-password`，仅密钥；锁死时用阿里云控制台网页终端救急） |
| 主和二号 /etc/sysctl.d/99-zensoft-no-ping.conf | 内核禁 ping（`net.ipv4.icmp_echo_ignore_all=1`，只忽略 echo-request，不影响 PMTUD/SSH/同步/网站） |
| 仓库 deploy/build-linux.sh | 本机一键构建 linux/amd64 产物（arm64 构建 + x64 原生模块替换） |
| 仓库 deploy/deploy-portal.sh | 三节点滚动发布（先两个后端，再主机），并刷新静态站点地图 |

## 运维操作

- **发布**：`deploy/build-linux.sh` → `deploy/deploy-portal.sh <release-name>`（先两个后端，再主机）。
  三号节点 IP 变化时用 `ZENSOFT_THIRD_HOST=<当前 IP>` 显式覆盖，并同步更新主机 nginx upstream 与同步脚本。
  发布脚本从本机连主机，再由主机既有同步密钥转发到后端；不要在任何节点上编译。
  - ISR 落盘前提：应用对 `/opt/zensoft` 可写（主 systemd `ReadWritePaths` 已含；备机容器勿用 `:ro` 挂载），且 release 目录属主为 zensoft（deploy 脚本已 chown）。否则每分钟刷 "Failed to update prerender cache EROFS"。
  - sharp 换 x64 后必须补 `sharp/node_modules/semver`（build-linux.sh 已处理），否则 /api/media 整体 500。
  - `/sitemap.xml` 在主机 nginx 静态提供。发布脚本从主 Node 拉取生成结果并原子替换静态文件；
    新工具页上线时，确认公网站点地图包含其 URL。
- **发布转换服务**：本机运行 `PDF_CONVERTER_TAG=<tag> services/pdf-converter/build-images.sh`，再运行
  `PDF_CONVERTER_TAG=<tag> deploy/deploy-pdf-converter.sh <release-name>`。脚本只向服务器传输并加载
  本机构建的 `linux/amd64` 镜像，服务器不得执行镜像构建、npm 安装或应用编译。
- **回滚一台**：`ssh -p <22或8222> <host> 'ln -sfn /opt/zensoft/releases/<旧release>/app /opt/zensoft/current && systemctl restart zensoft'`
- **手动同步**：`ssh root@101.37.124.50 /usr/local/bin/zensoft-sync.sh`
- **演练**（建议每季度）：
  1. 停一个后端的 `zensoft` → 公网应全绿（流量走其余节点）
  2. 恢复该后端，再停主机的 `zensoft` → 公网应全绿（两个后端承接，注意此时后台不可写）
  3. 恢复主机，观察 upstream 自动回归

## 升级路径（未做，按需启用）

1. 二号机完成阿里云备案接入 → Cloudflare 加第二条 A 记录（双公网入口，整机故障自动容错）
2. Cloudflare Load Balancer（~$5/月）→ 原生健康检查与自动剔除
3. 状态外移（DB → Supabase、uploads → 对象存储）→ 两节点完全对等无状态
