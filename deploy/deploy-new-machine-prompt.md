# 任务：把本机部署为 zensoft portal 集群第三节点（只读副本，经本机 8443 网关暴露）

你要在本机把 https://github.com/vibeforge2014/portal（分支 main，Next.js 16 门户站）部署为现有 zensoft.top 集群的**第三个节点**。仓库 `deploy/` 目录是全部参照物：`zensoft-secondary-docker.service`（二号机 Docker 运行时单元，本节点照此）、`HA.md`（集群架构文档）。先读它们再动手。

## 集群背景（决定本节点的一切约束）

- 主服务器 101.37.124.50：唯一公网入口（80/443），nginx 即 SLB，在「本机 Node」与「二号机 139.224.228.193:8443」间轮询。
- 二号机：无备案，仅内网 8443 后端（nginx allow 101.37.124.50），Docker 运行，数据是主库每 5 分钟同步来的**只读副本**。
- 本节点角色 = 二号机同款：**只读副本 + 内网后端**。主 nginx 之后会加第三条 upstream 指向本机 8443 网关上的 portal 路由；数据（SQLite + uploads）由主侧同步推送，**本节点永远不产生业务数据**。
- 主侧接线（nginx upstream 第三条、同步脚本扩展、初始数据快照、同步密钥）由运维稍后在主服务器完成，**不在本提示词范围**——你只做节点侧，做完公网无任何变化。

## 红线（违反会出生产事故或数据分叉）

1. **构建放在 Docker 容器里做，不要在宿主机直接 `npm ci` / `next build`**（原集群曾因宿主构建宕机 50 分钟）。
2. **本节点是只读副本**：不得在本节点后台发布内容、不得手工改 `/var/lib/zensoft` 下的数据库——任何改动都会在下次同步被覆盖，且可能造成数据分叉。也不要为本节点单独开 `/admin` 公网入口。
3. portal 路由**仅允许主服务器 101.37.124.50 访问**（外加本机回环验证）——本节点不是公网直连入口，公开流量仍统一走主服务器。网关上你的其他应用路由不受影响。
4. 任何含密钥的文件**永远不进 git**。

## 第 0 步：体检 + 网关识别，先汇报等确认再动手

机器体检：`uname -m`、`free -h`、`df -h /`、`cat /etc/os-release`、`ldd --version`、`docker --version`、3000 端口占用。

**网关识别**（本机已有对外 8443 的网关，外部统一经它访问内部应用）：
- 确认网关是什么：`docker ps`、`systemctl list-units | grep -Ei "nginx|apisix|kong|traefik|frp|gateway"`、`ss -tlnp | grep 8443`
- 弄清它如何声明路由（配置文件在哪、什么格式）、8443 是 plain HTTP 还是 TLS、现有哪些应用挂在上面
- 汇报：网关类型与版本、路由配置方式、8443 协议、你计划怎么注册 portal 路由

## 部署步骤（节点侧）

### 1. 系统准备
- 创建系统用户 `zensoft`（无登录 shell）
- 目录：`/opt/zensoft/releases/`、`/var/lib/zensoft/data`、`/var/lib/zensoft/uploads`，属主 `zensoft:zensoft`
- **路径与 unit 名不要自创**：必须与上述完全一致（`/opt/zensoft/releases/<name>/app` + `/opt/zensoft/current` 软链、systemd unit 名 `zensoft`、容器名 `zensoft-app`）——主侧的同步脚本和发布脚本按这些名字工作。

### 2. 环境变量 `/etc/zensoft/zensoft.env`
```
ZENSOFT_ADMIN_USERNAME=admin
ZENSOFT_BOOTSTRAP_PASSWORD=<至少12字符随机串>   # 仅为首次点亮用；真实数据由主库快照覆盖后即可删除此行
```
副本节点**不需要** SUPABASE_* / DIRECTMAIL_*（订单与邮件只在主节点发生）。真实管理员账号随主库快照到达，此密码届时作废。

### 3. 本机 Docker 构建（产物 = standalone）
在仓库根目录（`.dockerignore` 已就位）：

```dockerfile
# deploy/Dockerfile.selfbuild —— 本机自建用（amd64/arm64 宿主均原生适用）
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ rsync \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /repo
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx next build \
    && cp -r .next/static .next/standalone/.next/static \
    && cp -r public .next/standalone/public
```

```bash
docker build -t zensoft-build -f deploy/Dockerfile.selfbuild .
mkdir -p /tmp/zensoft-build
docker run --rm -v /tmp/zensoft-build:/out zensoft-build bash -c "cp -a .next/standalone/. /out/"
```

本机自建原生模块天然匹配，**不涉及**跨架构替换——原集群 `build-linux.sh` 的 sharp/semver 坑在这里不存在，不要去动 node_modules。

### 4. 铺设产物
`/opt/zensoft/releases/<YYYYMMDD-name>/app/` 放 `/tmp/zensoft-build/` 全部内容，`ln -sfn .../app /opt/zensoft/current`，`chown -R zensoft:zensoft /opt/zensoft/releases/<name>`。

### 5. systemd 服务（Docker 运行时，照抄二号机单元）
`deploy/zensoft-secondary-docker.service` 原样拷到 `/etc/systemd/system/zensoft.service`，`daemon-reload && enable --now zensoft`。关键点：
- `/opt/zensoft/current:/app` 挂载**绝不能加 `:ro`**——ISR 每 60 秒回写预渲染页面到 `.next/server/app/`，只读会每分钟报 EROFS 且缓存永不刷新。
- 端口绑 `127.0.0.1:3000:3000`，只给本机网关访问。

### 6. 网关注册 portal 路由
按第 0 步弄清的网关配置方式，注册一条路由：
- 后端 `127.0.0.1:3000`；匹配 Host `zensoft.top` / `www.zensoft.top`（或网关的默认路由，以现状为准，汇报你的选择）
- 透传 `Host`、`X-Real-IP`、`X-Forwarded-For`、`X-Forwarded-Proto`
- 访问控制：**允许 101.37.124.50 与 127.0.0.1，其余来源对 portal 路由拒绝**（若网关做不了按路由的来源限制，至少保证应用层可达性仅对内，并在汇报中说明）
- `client_max_body_size`（或等价项）≥ 12m
- 本机验证：`curl -s -o /dev/null -w "%{http_code}\n" -H "Host: www.zensoft.top" http://127.0.0.1:8443/`（按网关实际协议 http/https）应 200

### 7. 安全加固（与集群同标准）
- SSH 仅密钥：`PasswordAuthentication no`、`PermitRootLogin prohibit-password`、`KbdInteractiveAuthentication no`；**先验证密钥登录可用再 reload sshd**。把你运维用的公钥加进 authorized_keys；**不要**动已有的其他密钥。主服务器的同步密钥由运维稍后从主侧追加（带 `from="101.37.124.50"` 限制），无需你生成。
- 内核禁 ping：`/etc/sysctl.d/99-zensoft-no-ping.conf` 写 `net.ipv4.icmp_echo_ignore_all = 1` 后 `sysctl -p`
- 防火墙/安全组：8443 按你网关的现状保留；SSH 只开给需要的来源

### 8. 节点侧验收清单（全过才算完成）
- [ ] `systemctl status zensoft` active；`journalctl -u zensoft` 无 EROFS / 无 sharp 报错
- [ ] `curl -I http://127.0.0.1:3000/` 200
- [ ] 经网关验证：`curl -H "Host: www.zensoft.top" http://127.0.0.1:8443/` 200
- [ ] 从非允许来源访问 portal 路由被拒（403/超时）
- [ ] 等 70 秒再请求一次首页，journal 无新错误（ISR 回写正常）
- [ ] 密码 SSH 已拒，ping 本机公网 IP 不通

完成后汇报：本机公网 IP、网关类型与 portal 路由的注册方式、8443 是 HTTP 还是 TLS、release 名、验收结果。主侧接线（upstream + 同步 + 初始数据 + 同步密钥）等运维拿到这份汇报后进行——在那之前集群行为不变。
