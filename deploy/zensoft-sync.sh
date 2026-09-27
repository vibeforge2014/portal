#!/bin/bash
# zensoft 主→备 数据同步（主服务器 cron 每 5 分钟执行）
# 目标：二号机 139.224.228.193（SSH 22）+ 三号机 39.184.194.28（SSH 8222，家宽路由器映射）
# 内容：SQLite 一致性快照 + 上传目录 + 产品子站静态页；完成后重启各目标应用（约 1-2 秒，
#       期间主服务器 nginx upstream 自动把流量重试到其他节点，用户无感）。
# 部署：主服务器 /usr/local/bin/zensoft-sync.sh && chmod +x
# cron：*/5 * * * * /usr/local/bin/zensoft-sync.sh >> /var/log/zensoft-sync.log 2>&1
# 注意：三号机是家宽动态 IP（39.184.194.28），重拨变更后需同步更新本文件 TARGETS 与
#       主 nginx upstream；未更新时该节点被 max_fails 自动摘除，集群降级双机，服务不受影响。

set -euo pipefail

SSH_OPTS=(-i /root/.ssh/zensoft_sync -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 -o ServerAliveInterval=5)

exec 9>/run/zensoft-sync.lock
flock -n 9 || exit 0

mkdir -p /tmp/zensoft-sync
sqlite3 /var/lib/zensoft/data/zensoft.db ".backup /tmp/zensoft-sync/zensoft.db"

# host|ssh端口
TARGETS=("139.224.228.193|22" "39.184.194.28|8222")

for spec in "${TARGETS[@]}"; do
  IFS='|' read -r host ssh_port <<< "$spec"
  E="ssh ${SSH_OPTS[*]} -p $ssh_port"
  # 先传数据，全部成功后才重启目标应用（失败则保持目标旧数据，一致性优先）
  rsync -az --timeout=60 -e "$E" /tmp/zensoft-sync/zensoft.db root@$host:/var/lib/zensoft/data/zensoft.db
  rsync -az --delete --timeout=60 -e "$E" /var/lib/zensoft/uploads/ root@$host:/var/lib/zensoft/uploads/
  rsync -az --delete --timeout=60 -e "$E" /var/www/zensoft/sites/ root@$host:/var/www/zensoft/sites/
  # 目标 Node 持有旧数据库文件句柄，清 WAL 并重启后加载新库
  ssh "${SSH_OPTS[@]}" -p "$ssh_port" root@$host 'rm -f /var/lib/zensoft/data/zensoft.db-wal /var/lib/zensoft/data/zensoft.db-shm; chown zensoft:zensoft /var/lib/zensoft/data/zensoft.db /var/lib/zensoft/uploads /var/www/zensoft/sites; systemctl restart zensoft'
done

echo "$(date '+%F %T') sync ok"
