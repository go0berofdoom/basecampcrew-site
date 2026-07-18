# DNS-01 certificate setup

> **HTTP-01 will not work for this host.** The US-only nftables policy blocks
> Let's Encrypt's non-US multi-perspective validators. Use Route 53 DNS-01 for
> issuance and renewal.

## 1. Create a scoped IAM policy

Create an IAM user dedicated to Certbot and attach only this policy. The hosted
zone is `Z0010108357DTZLHZP2M7`.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ChangeOnlyBaseCampCrewZone",
      "Effect": "Allow",
      "Action": "route53:ChangeResourceRecordSets",
      "Resource": "arn:aws:route53:::hostedzone/Z0010108357DTZLHZP2M7"
    },
    {
      "Sid": "ReadChangeAndDiscoverZone",
      "Effect": "Allow",
      "Action": [
        "route53:GetChange",
        "route53:ListHostedZones"
      ],
      "Resource": "*"
    }
  ]
}
```

Create an access key for the IAM user. Do not place it in the repository.

## 2. Store credentials on the server

```bash
sudo install -d -o root -g root -m 700 /root/.aws
sudoedit /root/.aws/credentials
```

Enter:

```ini
[default]
aws_access_key_id = REPLACE_WITH_ACCESS_KEY_ID
aws_secret_access_key = REPLACE_WITH_SECRET_ACCESS_KEY
```

Then enforce the required permissions:

```bash
sudo chown root:root /root/.aws/credentials
sudo chmod 600 /root/.aws/credentials
```

## 3. Issue the apex and www certificate

Replace the email only if a different certificate contact is desired:

```bash
sudo certbot certonly \
  --dns-route53 \
  --non-interactive \
  --agree-tos \
  --email hello@basecampcrew.com \
  -d basecampcrew.com \
  -d www.basecampcrew.com
```

Enable the already-installed production vhost after issuance:

```bash
sudo ln -sfn /etc/nginx/sites-available/basecampcrew /etc/nginx/sites-enabled/basecampcrew
sudo rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/basecampcrew-bootstrap
sudo nginx -t
sudo systemctl reload nginx
```

Certbot's packaged systemd timer handles renewals. The Route 53 plugin will
reuse `/root/.aws/credentials`; it does not require inbound validation traffic.

## 4. Verify automatic renewal

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

If `nginx` does not reload automatically after a real renewal, add this
deploy-hook once:

```bash
sudo install -d -o root -g root -m 755 /etc/letsencrypt/renewal-hooks/deploy
sudoedit /etc/letsencrypt/renewal-hooks/deploy/reload-nginx
```

Contents:

```sh
#!/bin/sh
nginx -t && systemctl reload nginx
```

Then run `sudo chmod 755 /etc/letsencrypt/renewal-hooks/deploy/reload-nginx`.
