# BaseCamp marketing site

Static marketing and policy site for BaseCamp, an iOS app for crews of
RV-owning friends. The production surface is intentionally small: semantic
HTML, two CSS files, one progressive-enhancement JavaScript file, code-authored
SVG artwork, and no forms, tracking, external assets, build step, or backend.

The app and App Store listing are pre-launch. Website CTAs are informational.

## Production topology

```text
                                    every 5 minutes
 Git origin/main  <----------------------------------------------+
      |                                                           |
      | git fetch                                                  |
      v                                                           |
 /opt/basecampcrew-site -- rsync allowlisted site files --> /var/www/basecampcrew
                                                                |
 Internet                                                       v
    |              Lightsail public NIC                    nginx (static only)
    |          +---------------------------+              :80 -> HTTPS apex
    +--------->| nftables input policy     |------------> :443 apex + www redirect
               |                           |                    |
 US client --->| 80/443 if source in       |                    +-- TLS certificate
               | us_ipv4 / us_ipv6 sets    |                        Let's Encrypt
 non-US ------>| DROP                      |                        DNS-01 / Route 53
               |                           |
 admin ------->| tailscale0: all ports     |<----- Tailscale SSH / tailnet only
               | public port 22: no rule   |
               +---------------------------+
                          ^
                          | weekly atomic set refresh
                          |
                    ipdeny US CIDRs

 systemd timers
   basecampcrew-pull-deploy.timer  -> site refresh every 5 minutes
   basecampcrew-geo-refresh.timer  -> US CIDR refresh weekly
   certbot.timer                   -> TLS renewal checks
```

The cloud firewall and nftables serve different purposes. The Lightsail
firewall should ultimately expose only 80 and 443 publicly. Administrative
access is through Tailscale SSH; nftables has no public SSH accept rule.

## Initial bootstrap runbook

Prerequisites: Ubuntu 24.04 on Lightsail, DNS for `basecampcrew.com` and `www`
pointing to the instance, and the repository available on the server. Keep the
original SSH session open throughout bootstrap: the firewall preserves that
established connection but blocks new public SSH sessions.

1. In the Lightsail networking console, temporarily allow TCP 22 only long
   enough to bootstrap. Connect using the Lightsail temporary SSH key.
2. Put the repository at `/opt/basecampcrew-site` (clone it there, or move an
   already-authenticated clone there). `origin/main` must be readable without
   interactive prompts. Then run:

   ```bash
   cd /opt/basecampcrew-site
   sudo deploy/bootstrap.sh
   ```

   The script is idempotent. It installs unattended security updates, nginx,
   nftables, Certbot with Route 53 support, current stable Tailscale from
   `pkgs.tailscale.com`, the webroot, timers, scripts, and system configs. It
   atomically loads the firewall near the end. The current public SSH session
   remains established, but a replacement public SSH connection will not work.

3. In the same still-open shell, bring up Tailscale SSH:

   ```bash
   sudo tailscale up --ssh
   ```

   Tailscale prints an authentication URL. Send/open that URL for the tailnet
   owner, approve the device, then verify a second terminal can connect over
   the device's Tailscale name or 100.x address using Tailscale SSH.
4. Follow [`deploy/certbot-setup.md`](deploy/certbot-setup.md) to install scoped
   Route 53 credentials, issue the apex + www certificate with DNS-01, enable
   the production nginx site, and test renewal.
5. Verify `https://basecampcrew.com` from a US network and the `www` redirect.
6. Only after Tailscale SSH is confirmed, close TCP 22 in the Lightsail
   firewall. Leave public TCP 80 and 443 open there; nftables applies the US
   source restriction on the instance.

Check the final state:

```bash
sudo nginx -t
sudo nft list ruleset
sudo systemctl --no-pager --full status nginx nftables tailscaled
sudo systemctl list-timers --all | grep -E 'basecampcrew|certbot'
```

## Certificate renewal runbook

Certificates renew with the packaged `certbot.timer` and Route 53 DNS-01
credentials in `/root/.aws/credentials` (root-only, mode 600).

```bash
sudo certbot renew --dry-run
sudo journalctl -u certbot.service --since '30 days ago'
```

If a real renewal succeeds but nginx still serves the old certificate, verify
the deploy hook described in [`deploy/certbot-setup.md`](deploy/certbot-setup.md),
then run `sudo nginx -t && sudo systemctl reload nginx`.

**Do not switch to HTTP-01.** US-only geo-blocking prevents Let's Encrypt's
non-US multi-perspective HTTP validators from reaching the challenge.

## Geo-list refresh runbook

The weekly timer downloads both US IPv4 and IPv6 CIDR lists from ipdeny. It
rejects malformed or unexpectedly small responses, compiles the complete
nftables transaction in check mode, and then applies it as one atomic batch.
Any download, validation, or apply failure leaves the kernel's previous rules
intact. The persisted geo file changes only after the live swap succeeds.

```bash
sudo systemctl start basecampcrew-geo-refresh.service
sudo journalctl -u basecampcrew-geo-refresh.service -n 50 --no-pager
sudo nft list set inet basecampcrew us_ipv4
sudo nft list set inet basecampcrew us_ipv6
```

If ipdeny is unavailable, do not replace `geo.nft` by hand with an empty list.
The correct response is to keep the last-known-good sets and retry later.

## Redeploy runbook

The deploy timer checks `origin/main` every five minutes. When it moves, the
script resets the server clone to that exact revision, copies only `index.html`,
`*.html`, `css/`, `js/`, and `assets/` into a staging directory, backs up the
current webroot, syncs with `--delete`, runs `nginx -t`, and reloads nginx. A
failed nginx check or reload restores the previous webroot.

Trigger and inspect it manually:

```bash
sudo systemctl start basecampcrew-pull-deploy.service
sudo journalctl -u basecampcrew-pull-deploy.service -n 50 --no-pager
git -C /opt/basecampcrew-site rev-parse HEAD origin/main
```

To redeploy an unchanged revision after repairing the webroot, temporarily move
the clone's local `HEAD` to the prior commit with an ordinary non-destructive
checkout, then run the service; or perform the same allowlisted `rsync` pattern
manually. Do not put server or AWS credentials in the repository.

## Rebuild from scratch

1. Create a fresh Ubuntu 24.04 Lightsail instance and point DNS only when ready.
2. Temporarily admit the Lightsail SSH key on TCP 22 and clone the repo to
   `/opt/basecampcrew-site`.
3. Run the initial bootstrap sequence above without closing the original SSH
   session.
4. Recreate `/root/.aws/credentials` from the scoped Certbot IAM user, mode 600.
5. Run the DNS-01 Certbot command; enable the nginx vhost.
6. Confirm Tailscale SSH from a separate terminal, then remove TCP 22 from the
   Lightsail firewall.
7. Run the geo and pull-deploy services once; verify timers, HTTPS, headers,
   apex canonicalization, and a non-US denial test if available.
8. After the new instance passes checks, move the static IP or DNS and retire
   the old instance according to the normal Lightsail process.

## Security and operating notes

- Geo-blocking is a coarse control, not identity or abuse protection. A VPN,
  proxy, compromised US host, or stale geolocation record can bypass it.
- A legitimate US visitor whose address is misclassified may be blocked until
  the source list is corrected.
- HSTS is set to 15,768,000 seconds. The CSP permits only same-origin scripts,
  styles, images, and fonts plus `data:` images for the inline-data favicon. It
  permits no connections, objects, forms, or frames.
- The app's location-sharing claims apply to app behavior. This static website
  has no collection, analytics, cookies, or backend.

## Future deployment upgrade

The current pull model deliberately keeps GitHub free of server secrets. A
future upgrade can use GitHub Actions with a short-lived Tailscale auth method
and an ephemeral tailnet runner to push the allowlisted site artifact over the
private network. That flow should retain staging, rollback, `nginx -t`, and
least-privilege rules; it should not reopen public SSH or store long-lived
Tailscale/AWS keys in repository secrets.

## Local review

No build is required. Serve the repository root with any static HTTP server;
opening `index.html` directly also works. JavaScript adds only entrance and
parallax motion—the content is visible and navigable when JavaScript is absent.
