#!/bin/bash
# zensoft 主→备 数据同步（主服务器 cron 每 5 分钟执行）
# 内容：SQLite 一致性快照 + 上传目录 + 产品子站静态页；完成后重启备机应用（约 1-2 秒，
#       期间主服务器 nginx upstream 自动把流量重试到本机，用户无感）。
# 部署：主服务器 /usr/local/bin/zensoft-sync.sh && chmod +x
# cron：*/5 * * * * /usr/local/bin/zensoft-sync.sh >> /var/log/zensoft-sync.log 2>&1

set -euo pipefail

SECONDARY=139.224.228.193
SSH_OPTS=(-i /root/.ssh/zensoft_sync -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 -o ServerAliveInterval=5)
SSH=(ssh "${SSH_OPTS[@]}")
# rsync 的 -e 需要单一字符串形式的完整传输命令
RSYNC=(rsync -az --timeout=60 -e "ssh ${SSH_OPTS[*]}")

exec 9>/run/zensoft-sync.lock
flock -n 9 || exit 0

mkdir -p /tmp/zensoft-sync
sqlite3 /var/lib/zensoft/data/zensoft.db ".backup /tmp/zensoft-sync/zensoft.db"

# 先传数据，全部成功后才重启备机应用（失败则保持备机旧数据，一致性优先）
"${RSYNC[@]}" /tmp/zensoft-sync/zensoft.db root@$SECONDARY:/var/lib/zensoft/data/zensoft.db
"${RSYNC[@]}" --delete /var/lib/zensoft/uploads/ root@$SECONDARY:/var/lib/zensoft/uploads/
"${RSYNC[@]}" --delete /var/www/zensoft/sites/ root@$SECONDARY:/var/www/zensoft/sites/

# 备机 Node 持有旧数据库文件句柄，清 WAL 并重启后加载新库
"${SSH[@]}" root@$SECONDARY 'set -e
  rm -f /var/lib/zensoft/data/zensoft.db-wal /var/lib/zensoft/data/zensoft.db-shm
  chown zensoft:zensoft /var/lib/zensoft/data/zensoft.db /var/lib/zensoft/uploads /var/www/zensoft/sites
  systemctl restart zensoft'

echo "$(date '+%F %T') sync ok"
