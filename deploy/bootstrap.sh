#!/usr/bin/env bash
set -Eeuo pipefail

[[ ${EUID} -eq 0 ]] || { printf 'Run as root: sudo %s\n' "$0" >&2; exit 1; }

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
readonly WEBROOT="/var/www/basecampcrew"
readonly REPO_DIR="/opt/basecampcrew-site"

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg git rsync nginx nftables unattended-upgrades \
    certbot python3-certbot-dns-route53

install -o root -g root -m 0644 /dev/null /etc/apt/apt.conf.d/20auto-upgrades
printf '%s\n' \
    'APT::Periodic::Update-Package-Lists "1";' \
    'APT::Periodic::Unattended-Upgrade "1";' \
    > /etc/apt/apt.conf.d/20auto-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

install -d -o root -g root -m 0755 /usr/share/keyrings
curl --fail --silent --show-error --location \
    https://pkgs.tailscale.com/stable/ubuntu/noble.noarmor.gpg \
    -o /usr/share/keyrings/tailscale-archive-keyring.gpg
curl --fail --silent --show-error --location \
    https://pkgs.tailscale.com/stable/ubuntu/noble.tailscale-keyring.list \
    -o /etc/apt/sources.list.d/tailscale.list
apt-get update
apt-get install -y tailscale

install -d -o www-data -g www-data -m 0755 "$WEBROOT"
install -d -o root -g root -m 0755 /etc/nftables.d

install -o root -g root -m 0644 "$SCRIPT_DIR/nginx-basecampcrew.conf" /etc/nginx/sites-available/basecampcrew
install -o root -g root -m 0644 "$SCRIPT_DIR/nftables-base.nft" /etc/nftables.d/nftables-base.nft
if [[ ! -s /etc/nftables.d/geo.nft ]]; then
    install -o root -g root -m 0644 "$SCRIPT_DIR/geo.nft" /etc/nftables.d/geo.nft
fi
install -o root -g root -m 0755 "$SCRIPT_DIR/nftables.conf" /etc/nftables.conf
install -o root -g root -m 0755 "$SCRIPT_DIR/geo-refresh.sh" /usr/local/sbin/basecampcrew-geo-refresh
install -o root -g root -m 0755 "$SCRIPT_DIR/pull-deploy.sh" /usr/local/sbin/basecampcrew-pull-deploy

install -o root -g root -m 0644 "$SCRIPT_DIR/basecampcrew-geo-refresh.service" /etc/systemd/system/basecampcrew-geo-refresh.service
install -o root -g root -m 0644 "$SCRIPT_DIR/basecampcrew-geo-refresh.timer" /etc/systemd/system/basecampcrew-geo-refresh.timer
install -o root -g root -m 0644 "$SCRIPT_DIR/basecampcrew-pull-deploy.service" /etc/systemd/system/basecampcrew-pull-deploy.service
install -o root -g root -m 0644 "$SCRIPT_DIR/basecampcrew-pull-deploy.timer" /etc/systemd/system/basecampcrew-pull-deploy.timer

# The production vhost needs the DNS-01 certificate created in the next
# runbook step. Enable it now only when that certificate already exists.
if [[ -s /etc/letsencrypt/live/basecampcrew.com/fullchain.pem && -s /etc/letsencrypt/live/basecampcrew.com/privkey.pem ]]; then
    ln -sfn /etc/nginx/sites-available/basecampcrew /etc/nginx/sites-enabled/basecampcrew
    rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/basecampcrew-bootstrap
else
    # Until DNS-01 issuance, expose no nginx welcome page. Port 80 only points
    # toward the future canonical HTTPS origin.
    printf '%s\n' \
        'server {' \
        '    listen 80 default_server;' \
        '    listen [::]:80 default_server;' \
        '    server_name _;' \
        '    server_tokens off;' \
        "    return 301 https://basecampcrew.com\$request_uri;" \
        '}' > /etc/nginx/sites-enabled/basecampcrew-bootstrap
    rm -f /etc/nginx/sites-enabled/default
fi

systemctl daemon-reload
systemctl enable --now tailscaled nginx
nginx -t
systemctl reload nginx
systemctl enable nftables
systemctl enable --now basecampcrew-geo-refresh.timer basecampcrew-pull-deploy.timer

# Load fresh US sets and the firewall atomically. Existing SSH remains alive
# via the established-connection rule, but no new public SSH can be opened.
if /usr/local/sbin/basecampcrew-geo-refresh; then
    systemctl enable --now nftables
else
    printf '%s\n' 'WARNING: Geo refresh failed. Loading the last-known-good (possibly empty) sets.' >&2
    nft --file /etc/nftables.conf
    systemctl enable --now nftables
fi

if [[ -d ${REPO_DIR}/.git ]]; then
    /usr/local/sbin/basecampcrew-pull-deploy || true
else
    printf 'Clone the repository to %s; the deploy timer will take over afterward.\n' "$REPO_DIR"
fi

printf '%s\n' \
    '' \
    'Bootstrap complete. KEEP THIS SSH SESSION OPEN.' \
    'Next: run tailscale up --ssh, open the printed owner auth URL, then follow deploy/certbot-setup.md.'
