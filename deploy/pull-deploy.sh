#!/usr/bin/env bash
set -Eeuo pipefail

readonly REPO_DIR="/opt/basecampcrew-site"
readonly WEBROOT="/var/www/basecampcrew"
readonly LOCK_FILE="/run/lock/basecampcrew-deploy.lock"

log() { logger -t basecampcrew-deploy -- "$*"; printf '%s\n' "$*"; }
fail() { log "FAILED: $*"; exit 1; }

[[ ${EUID} -eq 0 ]] || fail "must run as root"
[[ -d ${REPO_DIR}/.git ]] || fail "clone not found at ${REPO_DIR}"
command -v rsync >/dev/null || fail "rsync is unavailable"

exec 9>"$LOCK_FILE"
flock -n 9 || exit 0

git -C "$REPO_DIR" fetch --quiet --prune origin main || fail "git fetch failed"
current="$(git -C "$REPO_DIR" rev-parse HEAD)"
target="$(git -C "$REPO_DIR" rev-parse origin/main)"
# First-run guard: an up-to-date clone with an empty webroot must still deploy.
if [[ "$current" == "$target" && -f "$WEBROOT/index.html" ]]; then
    log "No deployment change"
    exit 0
fi

git -C "$REPO_DIR" reset --hard origin/main >/dev/null || fail "reset to origin/main failed"

stage_dir="$(mktemp -d /var/www/basecampcrew-stage.XXXXXX)"
backup_dir="$(mktemp -d /var/www/basecampcrew-backup.XXXXXX)"
trap 'rm -rf -- "$stage_dir" "$backup_dir"' EXIT

rsync -a --delete --prune-empty-dirs \
    --include='/index.html' --include='/*.html' \
    --include='/css/' --include='/css/***' \
    --include='/js/' --include='/js/***' \
    --include='/assets/' --include='/assets/***' \
    --exclude='*' "$REPO_DIR/" "$stage_dir/" || fail "site staging failed"

[[ -s ${stage_dir}/index.html ]] || fail "staged site has no index.html"

rsync -a --delete "$WEBROOT/" "$backup_dir/" || fail "webroot backup failed"
rsync -a --delete "$stage_dir/" "$WEBROOT/" || fail "webroot update failed"
chown -R www-data:www-data "$WEBROOT"

if ! nginx -t; then
    rsync -a --delete "$backup_dir/" "$WEBROOT/"
    chown -R www-data:www-data "$WEBROOT"
    fail "nginx validation failed; previous site restored"
fi

systemctl reload nginx || {
    rsync -a --delete "$backup_dir/" "$WEBROOT/"
    chown -R www-data:www-data "$WEBROOT"
    nginx -t && systemctl reload nginx || true
    fail "nginx reload failed; previous site restored"
}

log "Deployed ${target}"
