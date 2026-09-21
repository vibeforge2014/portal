#!/bin/bash
# zensoft portal 滚动发布：本机 Docker 构建产物 → 两台服务器（先备后主）
# 依赖：deploy/AGENTS.md 红线 —— 产物必须来自本机 Docker linux/amd64 构建，禁止在服务器上编译。
# 用法：deploy/deploy-portal.sh <release-name，如 20260921-xxx>
set -euo pipefail

RELEASE_NAME="${1:?用法: deploy-portal.sh <release-name>}"
SRC="${SRC:-/tmp/zensoft-linux-build/.next/standalone}"
[ -f "$SRC/server.js" ] || { echo "未找到构建产物 $SRC/server.js（先在本机 Docker 构建）"; exit 1; }

PRIMARY=root@101.37.124.50
SECONDARY=root@139.224.228.193

deploy_one() {
  local host="$1" name="$2"
  echo "==> 发布到 $host : $name"
  ssh "$host" "mkdir -p /opt/zensoft/releases/$name/app"
  rsync -az --exclude '.data' "$SRC/" "$host:/opt/zensoft/releases/$name/app/"
  ssh "$host" "ln -sfn /opt/zensoft/releases/$name/app /opt/zensoft/current && systemctl restart zensoft"
  sleep 4
  ssh "$host" "curl -sS -o /dev/null -m 10 -w '  本机验证: %{http_code}\n' http://127.0.0.1:3000/"
}

# 先备后主：备机先重启时，主 nginx upstream 把流量留在本机；主机重启时由备机承接
deploy_one "$SECONDARY" "$RELEASE_NAME"
deploy_one "$PRIMARY" "$RELEASE_NAME"

echo "==> 公网验证"
curl -sS -o /dev/null -m 15 -w "https://www.zensoft.top/ : %{http_code}\n" https://www.zensoft.top/
echo "完成。回滚: ssh <host> 'ln -sfn /opt/zensoft/releases/<旧release>/app /opt/zensoft/current && systemctl restart zensoft'"
