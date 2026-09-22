#!/bin/bash
# 本机一键构建 linux/amd64 产物（红线：两台服务器上严禁编译，见 AGENTS.md）
# 产物：/tmp/zensoft-linux-build/.next/standalone —— 供 deploy/deploy-portal.sh 发布
#
# 两段式（原因见 deploy/HA.md）：
#   1) arm64 容器原生速度跑 next build（QEMU 模拟 amd64 构建会在收集页面数据时段错误）
#   2) amd64 容器重装 better-sqlite3 / argon2 / sharp 并替换进 standalone（glibc 兼容：
#      主服务器 AL4 与二号机 bookworm 容器均可运行预编译产物）
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=/tmp/zensoft-linux-build

# 工具链镜像（better-sqlite3 无预编译时兜底源码编译）；本地已有则直接复用
for ARCH in arm64 amd64; do
  if ! docker image inspect zensoft-builder:$ARCH >/dev/null 2>&1; then
    echo "==> 构建 zensoft-builder:$ARCH 工具链镜像"
    docker build --platform linux/$ARCH -t zensoft-builder:$ARCH - <<'EOF'
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ rsync && rm -rf /var/lib/apt/lists/*
EOF
  fi
done

echo "==> [1/3] arm64 容器 next build"
docker build -f deploy/Dockerfile.build --platform linux/arm64 -t zensoft-portal-build:arm64 .

echo "==> [2/3] 提取 standalone（含 .next/static 与 public）"
rm -rf "$OUT" && mkdir -p "$OUT/.next"
docker rm -f zensoft-extract >/dev/null 2>&1 || true
docker create --name zensoft-extract zensoft-portal-build:arm64 true >/dev/null
docker cp zensoft-extract:/app/.next/standalone "$OUT/.next/standalone"
docker rm zensoft-extract >/dev/null

# 与 lockfile 完全一致的版本，避免 arm64/x64 包版本漂移
BS_VER=$(node -p "require('./package-lock.json').packages['node_modules/better-sqlite3'].version")
ARGON_VER=$(node -p "require('./package-lock.json').packages['node_modules/argon2'].version")
SHARP_VER=$(node -p "require('./package-lock.json').packages['node_modules/sharp'].version")

echo "==> [3/3] 替换 x64 原生模块（better-sqlite3@${BS_VER} argon2@${ARGON_VER} sharp@${SHARP_VER}）"
docker run --rm --platform linux/amd64 -v "$OUT:/work" -w /work zensoft-builder:amd64 bash -euc "
  mkdir /tmp/x64deps && cd /tmp/x64deps
  npm init -y >/dev/null
  npm install --no-save --no-audit --no-fund better-sqlite3@$BS_VER argon2@$ARGON_VER sharp@$SHARP_VER
  S=/work/.next/standalone/node_modules
  rm -rf \$S/better-sqlite3 \$S/argon2 \$S/sharp \$S/@img
  cp -R node_modules/better-sqlite3 node_modules/argon2 node_modules/sharp node_modules/@img \$S/
  # sharp 运行时依赖 semver：仓库里嵌套在 sharp/node_modules 下，干净安装会被提升到顶层，
  # 必须显式补回嵌套位置，否则 sharp 加载失败（media 路由整体 500）
  if [ -d node_modules/semver ] && [ ! -d \$S/sharp/node_modules/semver ]; then
    mkdir -p \$S/sharp/node_modules && cp -R node_modules/semver \$S/sharp/node_modules/
  fi
"

echo "完成：$OUT/.next/standalone （下一步: deploy/deploy-portal.sh <release-name>）"
