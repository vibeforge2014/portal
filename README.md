# ZenSoft Portal

绍兴市臻书科技有限公司旗下 ZenSoft 品牌官网与内容管理后台。项目基于 Next.js 16、React 19、SQLite、Zod、Argon2id 和 Motion。

## 功能

- 双语官网，收录 ChargePilot、MinuteFlow、ServerHub、Tellyra、Tivon、TuneSync、TailTalk、Lattice、Visto 九款应用。
- `/admin` 单管理员后台：品牌 Logo、页面文案、产品、媒体、SEO、发布与上一版回滚。
- `/admin` 订单板块：ChargePilot 支付订单（支付宝/微信）与激活码管理——列表/筛选/汇总、
  重发确认邮件、吊销/恢复激活码、远程解绑设备、补偿发放激活码。
  数据存放在 Supabase Postgres（支付回调在那边履约），后台经 service key 服务端直连。
- 草稿与线上快照分离；发布前的线上版本作为唯一上一版保留。
- PNG/WebP 上传校验、重新编码和 256px 缩略图。
- Argon2id 密码、哈希会话令牌、Strict Cookie、CSRF、登录限速和首次改密。

## 本地开发

```bash
npm install
ZENSOFT_BOOTSTRAP_PASSWORD='请使用至少12位的临时密码' npm run dev
```

默认地址为 `http://localhost:3000`。数据库与上传文件位于 `.data/`。第一次登录时创建 `admin`，并要求立即修改密码。

可用环境变量：

- `ZENSOFT_DATA_DIR`：持久数据目录。
- `ZENSOFT_UPLOAD_DIR`：上传目录。
- `ZENSOFT_DB_PATH`：SQLite 文件路径。
- `ZENSOFT_ADMIN_USERNAME`：首次初始化用户名，默认 `admin`。
- `ZENSOFT_BOOTSTRAP_PASSWORD`：首次初始化临时密码。
- `ZENSOFT_SECURE_COOKIES=false`：仅限本地 HTTP 调试；生产环境不要关闭。

订单板块（可选；未配置时其余后台功能不受影响）：

- `SUPABASE_URL`：Supabase 项目地址。
- `SUPABASE_SERVICE_KEY`：service role 密钥，仅服务端持有，切勿提交或泄露。
- `DIRECTMAIL_ACCESS_KEY_ID` / `DIRECTMAIL_ACCESS_KEY_SECRET` / `DIRECTMAIL_ACCOUNT_NAME`：阿里云邮件推送凭据（重发/补发激活码邮件用）。
- `DIRECTMAIL_FROM_ALIAS`：发件人显示名，默认 `ZenSoft`。

## 验证

```bash
npm run typecheck
npm test
npm audit --audit-level=high
npm run build
```

GitHub Actions 只执行构建、测试和安全审计；生产内容不再发布到 Cloudflare Pages。

## 生产部署

生产服务器使用 Node.js 22、Next.js standalone、非 root `zensoft` 用户、systemd 和 Nginx。应用仅监听 `127.0.0.1:3000`，持久数据位于 `/var/lib/zensoft`，版本位于 `/opt/zensoft/releases`。

当前 IP 阶段由 Nginx 提供自签名 HTTPS，并将 `/admin` 从 HTTP 跳转到 HTTPS。`zensoft.top` DNS 生效后，应更换为受信任证书并开启全站 HTTPS。

### 在 macOS 上出包给 Linux 服务器的坑（2026-09-22 实测）

Next standalone 的文件追踪只复制构建机上实际加载的原生二进制：Mac 上 `next build`
出的包里 better-sqlite3 / argon2 只有 darwin-arm64，Linux 服务器启动即报
`No native build was found for platform=linux arch=x64`。打包后必须把本机
`node_modules/{better-sqlite3,argon2}/prebuilds/` 全平台目录补进产物（或改在
Linux CI 出包），并删掉产物里冒烟测试遗留的 `.data/`。完整流程与回滚命令见
部署机上的 `portal-deploy-*/DEPLOY.md`。
