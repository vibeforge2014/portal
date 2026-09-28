#!/bin/bash
# Publish a locally built Linux standalone release to the three live portal nodes.
# Never build on a server. The primary relays files to the two backends using its
# existing sync key, so this Mac only needs its primary deploy key.
set -euo pipefail

RELEASE_NAME="${1:?用法: deploy/deploy-portal.sh <release-name>}"
[[ "$RELEASE_NAME" =~ ^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$ ]] || { echo "无效的 release 名称" >&2; exit 1; }

SRC="${SRC:-/tmp/zensoft-linux-build/.next/standalone}"
DEPLOY_KEY="${ZENSOFT_DEPLOY_KEY:-$HOME/.ssh/zensoft_deploy}"
PRIMARY="root@101.37.124.50"
SECONDARY_HOST="${ZENSOFT_SECONDARY_HOST:-139.224.228.193}"
THIRD_HOST="${ZENSOFT_THIRD_HOST:-39.184.194.28}" # 家宽动态 IP，变更时显式覆盖
REMOTE="/opt/zensoft/releases/$RELEASE_NAME/app"

[[ -f "$SRC/server.js" && -d "$SRC/.next/static" && -d "$SRC/public" ]] || { echo "缺少完整本机构建产物: $SRC" >&2; exit 1; }
[[ -f "$DEPLOY_KEY" ]] || { echo "缺少主机部署密钥: $DEPLOY_KEY" >&2; exit 1; }
[[ "$SECONDARY_HOST" =~ ^[0-9.]+$ && "$THIRD_HOST" =~ ^[0-9.]+$ ]] || { echo "后端 IP 无效" >&2; exit 1; }

primary_ssh() {
  ssh -i "$DEPLOY_KEY" -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=8 "$PRIMARY" "$@"
}

backend_ssh() {
  local host="$1" port="$2" command="$3"
  primary_ssh "ssh -i /root/.ssh/zensoft_sync -o BatchMode=yes -o ConnectTimeout=8 -p $port root@$host '$command'"
}

deploy_backend() {
  local host="$1" port="$2" app_port="$3"
  echo "==> 后端 $host:$port"
  backend_ssh "$host" "$port" "test ! -e '$REMOTE' && mkdir -p '$REMOTE'"
  primary_ssh "rsync -az --timeout=120 --exclude .data -e 'ssh -i /root/.ssh/zensoft_sync -o BatchMode=yes -o ConnectTimeout=8 -p $port' '$REMOTE/' 'root@$host:$REMOTE/'"
  backend_ssh "$host" "$port" "chown -R zensoft:zensoft '/opt/zensoft/releases/$RELEASE_NAME' && ln -sfn '$REMOTE' /opt/zensoft/current && systemctl restart zensoft"
  backend_ssh "$host" "$port" "curl --retry 5 --retry-connrefused --retry-delay 1 -fsS http://127.0.0.1:$app_port/api/health/ | grep -q ok"
  backend_ssh "$host" "$port" "curl --retry 5 --retry-connrefused --retry-delay 1 -fsS -o /dev/null http://127.0.0.1:$app_port/"
}

echo "==> 预检三台节点"
primary_ssh "test ! -e '$REMOTE'"
backend_ssh "$SECONDARY_HOST" 22 "test ! -e '$REMOTE'"
backend_ssh "$THIRD_HOST" 8222 "test ! -e '$REMOTE'"

echo "==> 上传到主机暂存目录（不切换流量）"
primary_ssh "mkdir -p '$REMOTE'"
RSYNC_RSH="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=8" \
  rsync -az --timeout=120 --exclude '.data' "$SRC/" "$PRIMARY:$REMOTE/"

deploy_backend "$SECONDARY_HOST" 22 3000
deploy_backend "$THIRD_HOST" 8222 13000

echo "==> 切换主机"
primary_ssh "chown -R zensoft:zensoft '/opt/zensoft/releases/$RELEASE_NAME' && ln -sfn '$REMOTE' /opt/zensoft/current && systemctl restart zensoft"
primary_ssh "curl --retry 5 --retry-connrefused --retry-delay 1 -fsS http://127.0.0.1:3000/api/health/ | grep -q '\"status\":\"ok\"'"
primary_ssh "curl --retry 5 --retry-connrefused --retry-delay 1 -fsS -o /dev/null http://127.0.0.1:3000/"

echo "==> 更新 nginx 静态站点地图"
primary_ssh "curl -fsSL http://127.0.0.1:3000/sitemap.xml -o /var/www/zensoft/sitemap.xml.new && grep -q '<urlset' /var/www/zensoft/sitemap.xml.new && chmod 0644 /var/www/zensoft/sitemap.xml.new && mv /var/www/zensoft/sitemap.xml.new /var/www/zensoft/sitemap.xml"
primary_ssh "curl -fsS -H 'Host: zensoft.top' http://127.0.0.1/sitemap.xml | cmp - /var/www/zensoft/sitemap.xml"

echo "==> 公网验证"
curl -fsS -o /dev/null -w "https://www.zensoft.top/ : %{http_code}\n" https://www.zensoft.top/
echo "发布完成：$RELEASE_NAME"
