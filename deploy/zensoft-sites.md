# 产品站点统一迁移 zensoft.top 运营手册

六个 site 仓库已合并进各 app 仓库，站点统一由本服务器（zensoft.top，Cloudflare →
本机 nginx）按子路径托管。GitHub Pages 不再使用。

## 站点 → 仓库 → 线上路径

| 产品 | 仓库内目录 | 线上地址 |
|---|---|---|
| Visto | `Visto/site/`（Next.js，BASE_PATH=/visto） | https://zensoft.top/visto/ |
| MinuteFlow | `minuteflow/`（根 SPA，SITE_BASE_PATH=/minuteflow） | https://zensoft.top/minuteflow/ |
| ChargePilot | `aidente/site/`（Vite 多页 + supabase/functions） | https://zensoft.top/chargepilot/ |
| ServerHub | `ServerCat-iOS/ServerHubSupport/`（Next 静态导出） | https://zensoft.top/serverhub/ |
| Tellyra | `aptv-ios/site/`（Next 静态导出） | https://zensoft.top/tellyra/ |
| TailTalk | `TailTalk/TailTalk/website/`（vinext，SITE_BASE_PATH=/tailtalk） | https://zensoft.top/tailtalk/ |

每个仓库都有 `.github/workflows/deploy-site.yml`：改动站点目录并推送到 main
即自动构建 + rsync 到 `/var/www/zensoft/sites/<product>/`。

## 服务器初始化（一次性）

```bash
scp deploy/setup-sites-server.sh deploy/zensoft-sites.nginx.conf root@101.37.124.50:/tmp/
ssh root@101.37.124.50 'bash /tmp/setup-sites-server.sh'
# 按脚本输出把 zensoft-sites.nginx.conf include 进 zensoft.top 的 server 块
ssh root@101.37.124.50 'nginx -t && systemctl reload nginx'
```

脚本会打印 GitHub Secret `ZENSOFT_SSH_KEY` 所需的私钥。

## GitHub Secrets（每个仓库：Visto、minuteflow、chargepilot、ServerCat-iOS、aptv-ios、tailtalk）

- `ZENSOFT_SSH_KEY` ← 脚本输出的私钥
- `ZENSOFT_SSH_HOST` = `101.37.124.50`
- `ZENSOFT_SSH_USER` = `zensoft-deploy`

批量设置（需 gh 已认证）：

```bash
KEY=$(ssh root@101.37.124.50 'cat /home/zensoft-deploy/.ssh/github_actions_deploy_key')
for repo in Visto minuteflow chargepilot ServerCat-iOS aptv-ios tailtalk; do
  gh secret set ZENSOFT_SSH_KEY --repo "vibeforge2014/$repo" --body "$KEY"
  gh secret set ZENSOFT_SSH_HOST --repo "vibeforge2014/$repo" --body '101.37.124.50'
  gh secret set ZENSOFT_SSH_USER --repo "vibeforge2014/$repo" --body 'zensoft-deploy'
done
```

## ChargePilot 安装包迁移（重要）

release 二进制不进 git。把旧 site 仓库积累的安装包一次性推到服务器：

```bash
rsync -av /Users/qz/Desktop/vibeforge/chargepilot-site/public/downloads/ \
  zensoft-deploy@101.37.124.50:/var/www/zensoft/sites/chargepilot/downloads/
```

CI 的 rsync 带 `--exclude=downloads/*.dmg --exclude=downloads/*.zip`，只更新
appcast.xml 和 SHA256 文本，不会删二进制。后续发版：DMG 上传到服务器
downloads/ + 更新 `aidente/site/public/downloads/appcast.xml` + 提交推送。

## 验证

```
https://zensoft.top/visto/            （双语营销站 + docs）
https://zensoft.top/minuteflow/       （SPA；/minuteflow/pricing/ 应渲染定价页）
https://zensoft.top/minuteflow/releases/latest-macos.json   （更新 feed）
https://zensoft.top/chargepilot/      （定价页价格脚本能拉到 Paddle 报价）
https://zensoft.top/chargepilot/downloads/appcast.xml       （Sparkle feed）
https://zensoft.top/serverhub/  https://zensoft.top/tellyra/  https://zensoft.top/tailtalk/
```

## 旧链接退役（验证通过 + ChargePilot 新版发出后）

1. 删除 GitHub 仓库：`Visto-Site`、`chargepilot-site`、`meeting-assistant-site`、
   `serverhub-support`、`tellyra-support`、`tailtalk-site`
   （需要 `gh auth refresh -h github.com -s delete_repo`，然后
   `gh repo delete vibeforge2014/<name> --yes`）
2. 群晖 gitea（zqian24.synology.me:8010）同名仓库手动删除
3. App Store Connect 各产品隐私政策/支持 URL 若指向旧 github.io 地址 → 改为 zensoft.top
4. Paddle 卖家后台若登记了 github.io 域名 → 改为 zensoft.top
5. minuteflow GitHub Pages（可选）：确认 zensoft.top 稳定后关闭
