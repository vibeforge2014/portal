#!/usr/bin/env bash
# 在 zensoft.top 服务器（101.37.124.50）上以 root 执行：
#   bash setup-sites-server.sh
#
# 一次性初始化产品站点静态托管：
#   1. 创建 deploy 用户（zensoft-deploy）与专用 SSH deploy key
#   2. 创建 /var/www/zensoft/sites/<product>/ 目录
#   3. 如发现旧的 norelle.cc 站点目录（chargepilot 等），提示手工迁移
#   4. 安装 nginx location 片段并 reload
set -euo pipefail

DEPLOY_USER=zensoft-deploy
SITES_ROOT=/var/www/zensoft/sites
NGINX_SNIPPET=/etc/nginx/snippets/zensoft-sites.conf
PRODUCTS="visto minuteflow chargepilot serverhub tellyra tailtalk"

echo "== 1. deploy 用户 =="
if id "$DEPLOY_USER" &>/dev/null; then
  echo "已存在：$DEPLOY_USER"
else
  useradd -m -s /bin/bash "$DEPLOY_USER"
  echo "已创建：$DEPLOY_USER"
fi

KEY_HOME=$(getent passwd "$DEPLOY_USER" | cut -d: -f6)
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$KEY_HOME/.ssh"
touch "$KEY_HOME/.ssh/authorized_keys"
chown "$DEPLOY_USER:$DEPLOY_USER" "$KEY_HOME/.ssh/authorized_keys"
chmod 600 "$KEY_HOME/.ssh/authorized_keys"

if [ ! -f "$KEY_HOME/.ssh/id_ed25519" ]; then
  runuser -u "$DEPLOY_USER" -- ssh-keygen -t ed25519 -N '' -f "$KEY_HOME/.ssh/id_ed25519" -C "$DEPLOY_USER@zensoft"
  # 自有 key 加入 authorized_keys，供 GitHub Actions 反向 rsync 使用时替换
  cat "$KEY_HOME/.ssh/id_ed25519.pub" >> "$KEY_HOME/.ssh/authorized_keys"
  echo "已生成 deploy keypair（私钥仅用于本机调试；GitHub Secrets 请使用下面新生成的）："
else
  echo "deploy keypair 已存在"
fi

GHA_KEY="$KEY_HOME/.ssh/github_actions_deploy_key"
if [ ! -f "$GHA_KEY" ]; then
  runuser -u "$DEPLOY_USER" -- ssh-keygen -t ed25519 -N '' -f "$GHA_KEY" -C "github-actions@zensoft"
  cat "$GHA_KEY.pub" >> "$KEY_HOME/.ssh/authorized_keys"
fi
echo
echo "===== GitHub Secret ZENSOFT_SSH_KEY（私钥，含换行原样粘贴）====="
cat "$GHA_KEY"
echo "===== 结束（ZENSOFT_SSH_HOST=101.37.124.50，ZENSOFT_SSH_USER=$DEPLOY_USER）====="
echo

echo "== 2. 站点目录 =="
for p in $PRODUCTS; do
  install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$SITES_ROOT/$p"
  echo "ok: $SITES_ROOT/$p"
done

echo
echo "== 3. 旧 norelle.cc 内容发现（若有请手工 rsync 迁移到 $SITES_ROOT/chargepilot 等）=="
for probe in /var/www/chargepilot /srv/www/chargepilot /opt/zensoft/sites/chargepilot /var/www/norelle; do
  [ -d "$probe" ] && echo "发现目录：$probe"
done
nginx -T 2>/dev/null | grep -n 'chargepilot\|norelle' | head -10 || echo "（nginx 配置中无 chargepilot/norelle 相关 location）"

echo
echo "== 4. nginx 片段 =="
install -d -m 755 /etc/nginx/snippets
cp -n "$(dirname "$0")/zensoft-sites.nginx.conf" "$NGINX_SNIPPET" 2>/dev/null || {
  echo "请把仓库内 deploy/zensoft-sites.nginx.conf 上传为 $NGINX_SNIPPET 后重跑"; exit 1; }

echo "记得在 zensoft.top 的 server 块（/etc/nginx/conf.d/*.conf）内加入："
echo "    include $NGINX_SNIPPET;"
echo "然后：nginx -t && systemctl reload nginx"
