#!/bin/bash
# zensoft portal 滚动发布：本机 Docker 构建产物 → 三台服务器（先二号机、再三号机、后主机）
# 依赖：deploy/AGENTS.md 红线 —— 产物必须来自本机 Docker linux/amd64 构建，禁止在服务器上编译。
# 用法：deploy/deploy-portal.sh <release-name，如 20260921-xxx>
set -euo pipefail

RELEASE_NAME="${1:?用法: deploy-portal.sh <release-name>}"
SRC="${SRC:-/tmp/zensoft-linux-build/.next/standalone}"
[ -f "$SRC/server.js" ] || { echo "未找到构建产物 $SRC/server.js（先在本机 Docker 构建）"; exit 1; }

# host|ssh端口|本机验证端口
# 三号机 39.184.194.28：SSH 走路由器映射的 8222；应用监听 13000（3000 被 new-api 占用）
# 三号机为家宽动态 IP，重拨后需更新此 IP 与主 nginx upstream。
NODES=(
  "root@139.224.228.193|22|3000"
  "root@39.184.194.28|8222|13000"
  "root@101.37.124.50|22|3000"
)

deploy_one() {
  local host="$1" name="$2" ssh_port="$3" verify_port="$4"
  echo "==> 发布到 $host : $name"
  ssh -p "$ssh_port" "$host" "mkdir -p /opt/zensoft/releases/$name/app"
  rsync -az -e "ssh -p $ssh_port" --exclude '.data' "$SRC/" "$host:/opt/zensoft/releases/$name/app/"
  ssh -p "$ssh_port" "$host" "ln -sfn /opt/zensoft/releases/$name/app /opt/zensoft/current && chown -R zensoft:zensoft /opt/zensoft/releases/$name && systemctl restart zensoft"
  sleep 4
  ssh -p "$ssh_port" "$host" "curl -sS -o /dev/null -m 10 -w '  本机验证: %{http_code}\n' http://127.0.0.1:$verify_port/"
}

# 顺序：二号机 → 三号机 → 主机（主机最后重启，全程由备机承接）
for spec in "${NODES[@]}"; do
  IFS='|' read -r host ssh_port verify_port <<< "$spec"
  deploy_one "$host" "$RELEASE_NAME" "$ssh_port" "$verify_port"
done

echo "==> 公网验证"
curl -sS -o /dev/null -m 15 -w "https://www.zensoft.top/ : %{http_code}\n" https://www.zensoft.top/
echo "完成。回滚: ssh -p <ssh端口> <host> 'ln -sfn /opt/zensoft/releases/<旧release>/app /opt/zensoft/current && systemctl restart zensoft'"
