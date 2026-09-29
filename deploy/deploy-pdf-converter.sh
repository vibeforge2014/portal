#!/bin/bash
# Load locally built converter images on the third node and switch its compose release.
# No image build or package installation is performed on any server.
set -euo pipefail

RELEASE_NAME="${1:?用法: deploy/deploy-pdf-converter.sh <release-name>}"
[[ "$RELEASE_NAME" =~ ^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$ ]] || { echo "无效的 release 名称" >&2; exit 1; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHIVE="${PDF_CONVERTER_IMAGE_ARCHIVE:-/tmp/zensoft-pdf-converter-images.tar}"
TAG="${PDF_CONVERTER_TAG:-20260930}"
[[ "$TAG" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$ ]] || { echo "无效的镜像标签" >&2; exit 1; }
DEPLOY_KEY="${ZENSOFT_DEPLOY_KEY:-$HOME/.ssh/zensoft_deploy}"
PRIMARY="root@101.37.124.50"
THIRD_HOST="${ZENSOFT_THIRD_HOST:-39.184.194.28}"
STAGE="/root/.cache/zensoft-pdf-converter-$RELEASE_NAME"
REMOTE="/opt/zensoft-pdf-converter/releases/$RELEASE_NAME"

[[ -f "$ARCHIVE" ]] || { echo "缺少本机构建镜像: $ARCHIVE" >&2; exit 1; }
[[ -f "$DEPLOY_KEY" ]] || { echo "缺少主机部署密钥: $DEPLOY_KEY" >&2; exit 1; }

primary_ssh() { ssh -i "$DEPLOY_KEY" -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=8 "$PRIMARY" "$@"; }

echo "==> 上传镜像与配置到主服务器暂存目录"
primary_ssh "rm -rf '$STAGE' && mkdir -p '$STAGE'"
rsync -az --timeout=180 -e "ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=8" \
  "$ARCHIVE" "$ROOT/services/pdf-converter/docker-compose.yml" "$ROOT/deploy/pdf-converter-traefik.yml" "$PRIMARY:$STAGE/"

echo "==> 转发到第三节点并加载本机构建镜像"
primary_ssh "ssh -i /root/.ssh/zensoft_sync -o BatchMode=yes -o ConnectTimeout=8 -p 8222 root@$THIRD_HOST 'test ! -e "$REMOTE" && mkdir -p "$REMOTE"'"
primary_ssh "rsync -az --timeout=300 -e 'ssh -i /root/.ssh/zensoft_sync -o BatchMode=yes -o ConnectTimeout=8 -p 8222' '$STAGE/' 'root@$THIRD_HOST:$REMOTE/'"
primary_ssh "ssh -i /root/.ssh/zensoft_sync -o BatchMode=yes -o ConnectTimeout=8 -p 8222 root@$THIRD_HOST 'docker load -i "$REMOTE/zensoft-pdf-converter-images.tar" && rm -f "$REMOTE/zensoft-pdf-converter-images.tar" && mkdir -p /var/lib/zensoft-pdf-converter/jobs && chown -R 10001:10001 /var/lib/zensoft-pdf-converter && chmod 700 /var/lib/zensoft-pdf-converter/jobs && echo PDF_CONVERTER_TAG="$TAG" > "$REMOTE/.env" && ln -sfn "$REMOTE" /opt/zensoft-pdf-converter/current && docker compose --env-file /opt/zensoft-pdf-converter/current/.env -f /opt/zensoft-pdf-converter/current/docker-compose.yml up -d --no-build --pull never'"

echo "==> 安装第三节点受限网关路由"
primary_ssh "scp -i /root/.ssh/zensoft_sync -o BatchMode=yes -o ConnectTimeout=8 -P 8222 '$STAGE/pdf-converter-traefik.yml' 'root@$THIRD_HOST:/home/soft/gateway/dynamic/pdf-converter.yml'"

echo "==> 健康检查"
primary_ssh "ssh -i /root/.ssh/zensoft_sync -o BatchMode=yes -o ConnectTimeout=8 -p 8222 root@$THIRD_HOST 'for attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do curl -fsS --max-time 5 http://127.0.0.1:13020/api/pdf-convert/health/ | grep -q '\"status\":\"ok\"' && exit 0; sleep 3; done; docker compose -f /opt/zensoft-pdf-converter/current/docker-compose.yml logs --tail=80; exit 1'"
primary_ssh "rm -rf '$STAGE'"
echo "转换服务发布完成：$RELEASE_NAME"
