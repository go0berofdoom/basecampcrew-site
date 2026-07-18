#!/usr/bin/env bash
set -Eeuo pipefail

readonly V4_URL="https://www.ipdeny.com/ipblocks/data/countries/us.zone"
readonly V6_URL="https://www.ipdeny.com/ipv6/ipaddresses/blocks/us.zone"
readonly LIVE_GEO="/etc/nftables.d/geo.nft"
readonly BASE_RULES="/etc/nftables.d/nftables-base.nft"

log() { logger -t basecampcrew-geo -- "$*"; printf '%s\n' "$*"; }
fail() { log "FAILED: $*; keeping the previous US network sets"; exit 1; }

[[ ${EUID} -eq 0 ]] || fail "must run as root"
command -v curl >/dev/null || fail "curl is unavailable"
command -v nft >/dev/null || fail "nft is unavailable"
[[ -r ${BASE_RULES} ]] || fail "base rules are missing"

work_dir="$(mktemp -d /tmp/basecampcrew-geo.XXXXXX)"
trap 'rm -rf -- "$work_dir"' EXIT

curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
    --connect-timeout 15 --max-time 90 --retry 3 --retry-all-errors \
    "$V4_URL" -o "$work_dir/us4.raw" || fail "IPv4 download failed"
curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
    --connect-timeout 15 --max-time 90 --retry 3 --retry-all-errors \
    "$V6_URL" -o "$work_dir/us6.raw" || fail "IPv6 download failed"

# Accept only single-token CIDR lines. nft's parser performs the definitive
# address and prefix validation below.
LC_ALL=C awk 'NF == 1 && $1 ~ /^[0-9.]+\/[0-9]+$/ { print $1 } NF != 1 || $1 !~ /^[0-9.]+\/[0-9]+$/ { bad=1 } END { exit bad }' \
    "$work_dir/us4.raw" > "$work_dir/us4" || fail "IPv4 list contains malformed data"
LC_ALL=C awk 'NF == 1 && $1 ~ /^[0-9A-Fa-f:]+\/[0-9]+$/ { print $1 } NF != 1 || $1 !~ /^[0-9A-Fa-f:]+\/[0-9]+$/ { bad=1 } END { exit bad }' \
    "$work_dir/us6.raw" > "$work_dir/us6" || fail "IPv6 list contains malformed data"

v4_count="$(wc -l < "$work_dir/us4" | tr -d ' ')"
v6_count="$(wc -l < "$work_dir/us6" | tr -d ' ')"
(( v4_count >= 100 )) || fail "IPv4 list is unexpectedly small (${v4_count})"
(( v6_count >= 10 )) || fail "IPv6 list is unexpectedly small (${v6_count})"

{
    printf '%s\n' 'table inet basecampcrew {'
    printf '%s\n' '    set us_ipv4 {' '        type ipv4_addr' '        flags interval' '        auto-merge' '        elements = {'
    awk '{ printf "            %s%s\n", $0, (NR == total ? "" : ",") }' total="$v4_count" "$work_dir/us4"
    printf '%s\n' '        }' '    }' '' '    set us_ipv6 {' '        type ipv6_addr' '        flags interval' '        auto-merge' '        elements = {'
    awk '{ printf "            %s%s\n", $0, (NR == total ? "" : ",") }' total="$v6_count" "$work_dir/us6"
    printf '%s\n' '        }' '    }' '}'
} > "$work_dir/geo.nft"

{
    printf '%s\n' 'flush ruleset'
    printf 'include "%s"\n' "$work_dir/geo.nft"
    printf 'include "%s"\n' "$BASE_RULES"
} > "$work_dir/transaction.nft"

nft --check --file "$work_dir/transaction.nft" >/dev/null 2>&1 || fail "downloaded lists do not compile"

# One nft batch atomically changes both sets and the rules that reference them.
# If the batch fails, the kernel keeps the complete prior ruleset.
nft --file "$work_dir/transaction.nft" || fail "atomic ruleset swap failed"

if ! install -o root -g root -m 0644 "$work_dir/geo.nft" "$LIVE_GEO"; then
    log "FAILED: could not persist the new sets; restoring the prior persisted ruleset"
    nft --file /etc/nftables.conf || true
    exit 1
fi

log "OK: installed ${v4_count} IPv4 and ${v6_count} IPv6 US networks"
