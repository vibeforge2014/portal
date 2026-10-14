# 2026-10-14 产品折扣码发布

门户产物：`/opt/k3s-data/zensoft/portal-releases/20261014-discounts`。
基于当前已验证的 `20261014-domains` 构建源，只更新管理员折扣码、共享产品订单及授权相关文件；在 Mac 完成 Linux standalone 构建并替换匹配的 amd64 原生模块。
产物 SHA256：`ffce3a42619e624ac214149e9189fe763962d78b2bcf7efa317202dcc6b90d27`。
唯一写入实例继续位于 node1，单副本 Recreate；保留原镜像、数据卷、上传卷、服务密钥。
旧应用目录保留，切换前 SQLite 在线备份位于新产物目录的 `portal-before-release.db`（0600）。

Supabase 项目 `paeonjdgfjpmuicxwrgg` 已存在 `202610140001` 和 `202610140002` 迁移，未重复执行。
部署了 `alipay-order`、`wechat-order`、`alipay-notify`、`wechat-notify`。
ChargePilot 购买页经既有 GitHub Actions 更新 Pages 及阿里云静态源站，保留下载与 appcast；门户 sitemap 从新实例刷新。

## 后台 Supabase 连接

家庭节点直连托管 Supabase 的 TLS 连接被重置；阿里云主机直连正常。
因此仅为后台 REST 数据库访问新增受限转发：

- 阿里云 `/etc/nginx/conf.d/zensoft-portal-products-acme.conf` 的 `developer.zensoft.top` HTTPS vhost 新增 `/internal-supabase/rest/v1/`，固定上游为本项目 `/rest/v1/`。
- 只允许家庭公网 `39.184.194.28` 与回环来源，其他来源 403；其他 `/internal-supabase/` 路径 403。保持 Authorization/apikey 原样转发，由 Supabase 检验权限；不在 nginx 保存服务密钥。
- 两段 HTTPS 均验证证书。转发请求关闭 access log，避免数据库查询参数写入 nginx 访问日志。
- `zensoft-portal-env` 的 `SUPABASE_URL` 为 `https://developer.zensoft.top/internal-supabase`。
- 门户 Deployment 的 `hostAliases` 将 `developer.zensoft.top` 固定到 `101.37.124.50`，保证直接连接阿里云并匹配来源限制。前台公网 DNS 不变。

若家庭公网 IP 改变，除了现有回源配置，还须更新该转发的 `allow` 地址并重新验证。
发布程序应保留 Secret、hostAliases 和现有卷；不得用工作区模板覆盖这些运行配置。

回退只切换应用目录，继续使用当前数据和有效转发。连接配置的原始 Secret/Deployment 位于新产物目录 `egress-before.json`（0600）；nginx 原配置保存在 `/etc/nginx/conf.d/zensoft-portal-products-acme.conf.before-discount-egress-20261014`。直接恢复原 Supabase URL 会重新触发家庭网络连接问题。

线上验收已通过：后台创建百分比及固定减免码、列表显示、停用；微信与支付宝年度报价均验证原价 1900 分，八折 1520 分、减 0.29 元为 1871 分。390 像素手机购买页显示折后金额。临时测试码与会话均已清理，没有创建支付订单、扣款或发送邮件。
