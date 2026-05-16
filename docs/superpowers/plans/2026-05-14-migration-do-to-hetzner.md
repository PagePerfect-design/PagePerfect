# DigitalOcean → Hetzner Migration Runbook

> **For the operator:** This is a baby-step runbook. The author (Claude) presents one step at a time and waits for your confirmation before showing the next. Every step has Action, Verify, Report-back. Do NOT skip ahead. If something looks wrong, stop and paste what you see — we'll diagnose before continuing.

**Goal:** Move PagePerfect's backend + PocketBase + Redis from DigitalOcean (Coolify) to a fresh Hetzner CX42 VPS (Coolify). Frontend stays on Vercel — unchanged.

**Spec:** `docs/superpowers/specs/2026-05-14-migration-do-to-hetzner-design.md`

**Total steps:** 33, grouped into 11 phases.

---

## ⚠ Permanent rules (apply to every step)

- **Never touch DNS records other than the specific records named in the step.** Email (MX, SPF, DKIM, DMARC), Microsoft 365 (autodiscover, enterpriseenrollment, enterpriseregistration, selector1/2._domainkey, MS=), and Vercel (`www` CNAME) records must NOT be edited. Breaking these breaks email or the frontend.
- **Never paste a secret value (API key, password, webhook secret) into chat.** When asked to "report back," paste the *name* of the secret you copied, not the value. If you must show me a value for diagnosis, redact it (`sk_live_RED***ACTED`).
- **DO production stays running until Phase 11.** It is the rollback safety net. Do not stop any DO container until I tell you to in Phase 11.
- **One step at a time.** If you finish a step, paste your output, and I'll show you the next step. Don't run ahead.

---

## Phase 1 — Hetzner VPS provisioned (account already done)

Total: 4 steps.

### Step 1: Locate or generate an SSH keypair on your Mac

**Action.** Open a Terminal on your Mac. Check if you already have an SSH keypair:

```bash
ls -la ~/.ssh/id_ed25519.pub ~/.ssh/id_rsa.pub 2>/dev/null
```

- If you see at least one `.pub` file listed → you have a key. Skip to Step 2.
- If both are missing → generate one with this command (just press Enter at every prompt, including the passphrase prompt unless you want one):

  ```bash
  ssh-keygen -t ed25519 -C "abuaa@pageperfect-migration" -f ~/.ssh/id_ed25519
  ```

**Verify.** Run `cat ~/.ssh/id_ed25519.pub` (or `id_rsa.pub`). You should see a single line starting with `ssh-ed25519 AAAA…` (or `ssh-rsa AAAA…`) ending with the comment.

**Report back.** Paste just the first 25 characters of the public key (e.g. `ssh-ed25519 AAAAC3NzaC1l...`) — enough so I can confirm the format is right. **Do NOT paste the full key** (the private one is the secret; the public one is fine, but we don't need it for proof).

---

### Step 2: Add the SSH public key to Hetzner

**Action.** Go to https://console.hetzner.com/. Click your `pageperfect` project → in the left sidebar click **Security** → **SSH Keys** → **Add SSH Key**.

Run this on your Mac to copy the *public* key to your clipboard:

```bash
cat ~/.ssh/id_ed25519.pub | pbcopy
```

(Use `id_rsa.pub` if that's what you have.) Then paste into Hetzner's "Public Key" textarea. Name it something like `abuaa-mac`. Click **Add SSH Key**.

**Verify.** The key appears in the SSH Keys list under the `pageperfect` project.

**Report back.** "SSH key added" + the key name you used.

---

### Step 3: Provision the Hetzner CX42 VPS

**Action.** In the Hetzner Console, with the `pageperfect` project selected, click **+ CREATE SERVER** (the button you saw in the screenshot).

Settings:

- **Location:** Falkenstein (FSN1) — *or* whichever is closest to most of your users. UK users: any EU location is fine. US users: Hillsboro (HIL1) or Ashburn (ASH1).
- **Image:** Ubuntu 24.04 (under "OS images")
- **Type:** Shared vCPU → **CX42** (4 vCPU, 16 GB RAM, 160 GB SSD, ~€11.99/mo)
- **Networking:** Leave "Public IPv4 & IPv6" checked. No private networks needed for now.
- **SSH Keys:** Select the key you added in Step 2.
- **Firewalls:** Leave unticked for now — we'll configure UFW inside the VPS.
- **Backups:** Optional (adds 20% to monthly cost). I'd say YES — it's worth it for a state-bearing host. Toggle on.
- **Placement groups:** Skip.
- **Labels:** Skip.
- **Cloud config:** Skip.
- **Name:** `pp-prod` (or anything memorable).

Click **Create & Buy now**. Wait ~30 seconds. The server appears in the list with a status of "Running" and a public IPv4 address.

**Verify.** The new server shows up under the `pageperfect` project with a green "Running" indicator and a public IPv4 address (something like `49.12.x.x` for FSN1).

**Report back.** Paste:
- The server's public IPv4 address
- Confirmation that you chose Falkenstein (or which DC)
- "Backups: yes" or "Backups: no"

---

### Step 4: SSH into the new server as root

**Action.** On your Mac, run:

```bash
ssh root@<HETZNER_IP>
```

Replace `<HETZNER_IP>` with the IPv4 you reported in Step 3. First time, you'll get:

```
The authenticity of host '... (...)' can't be established.
ED25519 key fingerprint is SHA256:...
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Type `yes` and press Enter.

You should land in a root shell prompt that looks like `root@pp-prod:~#`.

**Verify.** Run `hostname` and `lsb_release -a`. Expected:

```
hostname → pp-prod (or whatever you named the server)
lsb_release → "Ubuntu 24.04 LTS"
```

**Report back.** Paste the output of `hostname && lsb_release -d`. Looks like:

```
pp-prod
Description:	Ubuntu 24.04.x LTS
```

Stay logged in — we'll continue in Step 5.

---

## Phase 1.5 — Complete inventory (no edits)

Total: 4 read-only data-gathering steps. We will NOT make any changes during this phase — just collect ground truth.

### Step 5: Re-screenshot the FULL Microsoft 365 DNS records list

**Action.** Go to `admin.cloud.microsoft.com` → Settings → Domains → `pageperfect.studio` → DNS records. The "Custom records" section is what we need.

Scroll the list from top to bottom. Take one or more screenshots so the **entire** records list is visible. Save them somewhere I can read (e.g. drag onto the chat).

We need to identify every record that points at `134.122.102.159` (the DO IP). The zone-file download earlier did NOT include the custom A records — Microsoft 365's export is incomplete — so a careful screenshot is the truth source.

**Verify.** You can count records in the screenshots and read every value clearly.

**Report back.** Paste the screenshot(s) into the chat. I will identify every record pointing at DO IP and confirm the cutover list (`api`, `pb`, `studio` + anything else).

---

### Step 6: Capture the Stripe webhook URL

**Action.** Open https://dashboard.stripe.com/webhooks. Make sure the toggle in the top-left is on **"Production"** (not test mode). You should see one or more endpoint URLs listed.

Click into each one and copy its **URL** (just the URL, not the signing secret).

**Verify.** You have the production webhook URL(s) — likely `https://api.pageperfect.studio/api/stripe/webhook` or similar.

**Report back.** Paste each URL. Confirm whether it's domain-based (`https://api.pageperfect.studio/...`) or IP-based (`https://134.122.102.159/...` or similar). **Do NOT paste the signing secret.**

---

### Step 7: Capture the Lulu xPress webhook URL

**Action.** Log into the Lulu xPress developer console (you'll know your exact URL — probably https://developers.lulu.com/ or similar). Find the webhook / notification configuration for your account. Copy the URL.

**Verify.** You have the Lulu webhook URL.

**Report back.** Paste the URL. Confirm if it's domain-based or IP-based.

If Lulu doesn't have a webhook configured (some setups poll instead), report "No webhook configured" and we'll skip Lulu in Phase 9.

---

### Step 8: Export DO Coolify backend env vars (screenshot)

**Action.** Go to your DO Coolify dashboard. Find the PagePerfect backend application (Coolify resource ID `y48k0cw0gcog8cggsogswsgo` — should show up as "pp-backend" or similar). Click into it → **Environment Variables** tab.

Take a screenshot of the FULL list of env-var names. The Coolify UI usually shows values as `••••` (dots) by default — that's fine. We need the **names** to build the Hetzner-side checklist.

**Verify.** You can read every env-var name (the left column).

**Report back.** Paste the screenshot(s). If any are sensitive even by name (none should be), redact those name characters with `RED***ACT`. I will produce a numbered checklist of every env var that needs copying.

---

## Phase 2 — Server hardening

Total: 5 steps. All run on the Hetzner VPS via SSH (you should still be logged in as root from Step 4 — if not, `ssh root@<HETZNER_IP>` again).

### Step 9: Create a non-root user

**Action.** In the SSH session, run (replace `pp` with whatever username you prefer — keep it short, lowercase):

```bash
adduser pp
```

You'll be prompted for a password. Pick a strong password (e.g. from 1Password). Press Enter through the GECOS prompts (Full Name, Room Number, etc. — leave blank). Confirm with `Y`.

Then grant sudo:

```bash
usermod -aG sudo pp
```

**Verify.** Run `id pp`. Expected: `uid=1000(pp) gid=1000(pp) groups=1000(pp),27(sudo)`.

**Report back.** Paste the `id pp` output.

---

### Step 10: Copy your SSH key to the new user

**Action.** Still as root:

```bash
mkdir -p /home/pp/.ssh
cp /root/.ssh/authorized_keys /home/pp/.ssh/authorized_keys
chown -R pp:pp /home/pp/.ssh
chmod 700 /home/pp/.ssh
chmod 600 /home/pp/.ssh/authorized_keys
```

**Verify.** From a NEW Terminal window on your Mac (keep the root session open as a safety net), test:

```bash
ssh pp@<HETZNER_IP>
```

You should land in a `pp@pp-prod:~$` prompt. From there:

```bash
sudo whoami
```

Enter your `pp` password. Expected output: `root` — proves sudo works.

**Report back.** "SSH as pp works. Sudo works." Stay logged in as `pp` for the next steps; close the root window only AFTER Step 11 confirms password+root login are disabled.

---

### Step 11: Disable root SSH and password-based SSH

**Action.** As `pp`:

```bash
sudo nano /etc/ssh/sshd_config
```

Find and change these lines (uncomment by removing `#` if needed):

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Save: `Ctrl+O`, Enter, `Ctrl+X`.

Reload SSH:

```bash
sudo systemctl reload ssh
```

**Verify.** From a NEW Terminal window on your Mac, try as root:

```bash
ssh root@<HETZNER_IP>
```

Expected: `Permission denied (publickey).` — root login is now refused. ✓

Then try with the wrong password (force password auth):

```bash
ssh -o PreferredAuthentications=password pp@<HETZNER_IP>
```

Expected: `Permission denied (publickey).` — password login is refused. ✓

Then confirm key-based pp login still works:

```bash
ssh pp@<HETZNER_IP>
```

Expected: lands at `pp@pp-prod:~$`.

**Report back.** "Root SSH blocked. Password SSH blocked. Key-based pp SSH works."

If any of those fail differently, **STOP** and paste the exact error before continuing — don't lock yourself out.

---

### Step 12: Install + enable UFW firewall

**Action.** As `pp` on the Hetzner box:

```bash
sudo apt update
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable
```

When `sudo ufw enable` prompts `Command may disrupt existing ssh connections. Proceed with operation (y|n)?` — type `y`.

**Verify.**

```bash
sudo ufw status verbose
```

Expected output includes:
```
Status: active
Default: deny (incoming), allow (outgoing)
22/tcp                     ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
```

**Report back.** Paste the `ufw status verbose` output.

---

### Step 13: Install fail2ban + unattended-upgrades

**Action.**

```bash
sudo apt install -y fail2ban unattended-upgrades
sudo systemctl enable --now fail2ban
sudo dpkg-reconfigure -plow unattended-upgrades
```

When the unattended-upgrades dialog appears, select **Yes** to enable automatic security upgrades.

**Verify.**

```bash
sudo systemctl status fail2ban --no-pager | head -5
sudo systemctl is-enabled unattended-upgrades
```

Expected:
- `fail2ban` status: `active (running)`
- `unattended-upgrades`: `enabled`

**Report back.** "fail2ban running. unattended-upgrades enabled."

---

## Phase 3 — Install Coolify

Total: 4 steps.

### Step 14: Add A record for `coolify.pageperfect.studio`

**Action.** In Microsoft 365 admin center → Settings → Domains → `pageperfect.studio` → DNS records → **+ Add record** → **A**.

Settings:
- **Host name:** `coolify`
- **Points to address:** the Hetzner public IPv4 from Step 3
- **TTL:** 1 hour (default) is fine

Click **Save**.

**⚠ Watch-out:** You're ADDING a new record, not editing an existing one. Do NOT touch the `api`, `pb`, `studio`, MX, TXT, or CNAME records. They stay as they are.

**Verify.** From your Mac:

```bash
dig +short coolify.pageperfect.studio
```

Expected: returns the Hetzner IP. May take 5-60 minutes to propagate. If it returns nothing, wait and retry.

**Report back.** Paste the `dig` output once it returns the Hetzner IP.

---

### Step 15: Run the Coolify installer

**Action.** As `pp` on the Hetzner box:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

This will take ~3-5 minutes. It installs Docker, pulls Coolify images, and starts the dashboard. You'll see lots of output ending with something like `Coolify installation complete. Access it at http://<IP>:8000`.

**Verify.** Visit `http://<HETZNER_IP>:8000` in your browser. You should see the Coolify first-run setup wizard.

**Report back.** "Coolify installer finished. Setup wizard visible at http://<IP>:8000." (Don't actually configure it yet — that's Step 16.)

---

### Step 16: Complete Coolify first-run setup + enable TLS via `coolify.pageperfect.studio`

**Action.** In the Coolify wizard:

1. **Admin account:** create an admin email (your normal email) + a strong password (1Password). 
2. **Instance settings:** find **FQDN** / **Coolify URL** / **Public URL** (label varies). Set to `https://coolify.pageperfect.studio` (note the **https** — Coolify will request a Let's Encrypt cert automatically).
3. **Save.** Coolify reloads and may issue a cert. Wait ~30 seconds.

If you reach Coolify via the IP+port URL during this, that's OK — set the FQDN inside, save, then visit the new FQDN.

**Verify.** Open `https://coolify.pageperfect.studio` (note: **https**). You should see the Coolify login page. Padlock should be green / valid (Let's Encrypt cert).

**Report back.** "Coolify dashboard reachable at https://coolify.pageperfect.studio. TLS valid." If you hit a cert error, that's usually a Let's Encrypt rate-limit or DNS not yet propagated — paste the error and we'll diagnose.

---

### Step 17: Enable 2FA on the Coolify admin account

**Action.** In Coolify dashboard → Profile (top right) → **Security** → enable 2FA. Scan the QR with 1Password / Google Authenticator / Authy. Save the backup codes somewhere safe (1Password).

**Verify.** Log out, log back in — you should be prompted for the TOTP code.

**Report back.** "2FA enabled. Backup codes saved."

---

## Phase 4 — Temporary staging subdomains

Total: 2 steps.

### Step 18: Add A record for `new-api.pageperfect.studio`

**Action.** In Microsoft 365 admin DNS → **+ Add record** → **A**:
- **Host name:** `new-api`
- **Points to:** Hetzner IP
- **TTL:** 1 hour

Save.

**⚠ Watch-out:** Adding, not editing. Do not touch the existing records.

**Verify.** `dig +short new-api.pageperfect.studio` returns the Hetzner IP.

**Report back.** `dig` output.

---

### Step 19: Add A record for `new-pb.pageperfect.studio`

**Action.** Same as Step 18 but for `new-pb`:
- **Host name:** `new-pb`
- **Points to:** Hetzner IP
- **TTL:** 1 hour

Save.

**Verify.** `dig +short new-pb.pageperfect.studio` returns the Hetzner IP.

**Report back.** `dig` output.

---

## Phase 5 — Recreate three apps in Coolify

Total: 4 steps.

### Step 20: Connect Coolify to GitHub (install the Coolify GitHub App on the PagePerfect repo)

**Action.** In Coolify → **Sources** (left sidebar) → **+ Add** → **GitHub App** → click **Register a new GitHub App**.

Coolify redirects you to GitHub. Accept defaults. Install the app on the `PagePerfect-design/PagePerfect` repository (Only select repositories → pick `PagePerfect`). Click **Install**.

You're bounced back to Coolify. The GitHub App should show as Connected.

**Verify.** In Coolify → Sources → you see a GitHub source listed and able to enumerate the `PagePerfect-design/PagePerfect` repo.

**Report back.** "Coolify GitHub App connected. PagePerfect repo visible."

---

### Step 21: Create `pp-redis` in Coolify

**Action.** In Coolify → pick your project (Coolify default project is fine) → **+ New Resource** → **Database** → **Redis**.

Settings:
- **Name:** `pp-redis`
- **Image:** `redis:7.2` (set in the image-version field)
- **Public access:** OFF — Redis is internal-only.
- Leave other settings at defaults.

Click **Deploy**.

**Verify.** Resource status shows **Running** with a green dot. Redis is reachable internally at `pp-redis:6379` (Coolify's service DNS).

**Report back.** "pp-redis deployed and running." Include the internal hostname Coolify shows for it (usually `pp-redis-<hash>` or similar — exact format matters for `REDIS_URL`).

---

### Step 22: Create `pp-pocketbase` in Coolify

**Action.** In Coolify → same project → **+ New Resource** → **Application** → **Docker Image** (or **Public Repository** if Coolify segments them differently).

Settings:
- **Name:** `pp-pocketbase`
- **Image:** `ghcr.io/muchobien/pocketbase:latest`
- **Domain:** `https://new-pb.pageperfect.studio`
- **Port:** 8090 (PocketBase default)
- **Persistent storage:** add a volume named `pb-data` mounted at `/pb_data` (PocketBase stores its database here — critical for persistence)
- **Public access:** ON

Click **Deploy**. Wait ~30 seconds.

**Verify.** Visit `https://new-pb.pageperfect.studio/_/` — you should see the PocketBase admin "first run" page (create superuser account). Do NOT create a superuser yet — that comes from the restored snapshot in Phase 7.

**Report back.** "pp-pocketbase deployed. /_ admin page reachable." If TLS doesn't work yet (cert pending), wait a minute and retry.

---

### Step 23: Create `pp-backend` in Coolify

**Action.** In Coolify → same project → **+ New Resource** → **Application** → **Public Repository** (or **Private Repository** via the GitHub App connected in Step 20).

Settings:
- **Source:** GitHub App → `PagePerfect-design/PagePerfect`
- **Branch:** `main`
- **Build pack:** **Dockerfile**
- **Dockerfile path:** `backend/Dockerfile`
- **Base directory:** `/backend`
- **Name:** `pp-backend`
- **Domain:** `https://new-api.pageperfect.studio`
- **Port:** 4000
- **Healthcheck:** `/api/health` (matches what the Dockerfile's `HEALTHCHECK` calls)

Do NOT click Deploy yet — env vars are not set. We'll deploy after Phase 6.

**Verify.** Application is created in Coolify and shows as "Configured but not deployed" or similar.

**Report back.** "pp-backend created in Coolify. Not yet deployed. Awaiting env vars."

---

## Phase 6 — Copy env vars

Total: 2 steps. This is the most error-prone phase. We will copy each variable one at a time. **Never paste secret values into our chat — only names.**

### Step 24: Build the env-var checklist from your DO Coolify screenshot

**Action.** You already shared the DO Coolify env vars screenshot in Step 8. I will now produce a numbered checklist of every variable to copy. (You don't take action this step — wait for me to post the list.)

**Verify.** I produce the checklist.

**Report back.** "Awaiting checklist." Then once you have it, run the next step.

---

### Step 25: Copy every env var from DO Coolify to Hetzner Coolify (pp-backend)

**Action.** On a split-screen layout:
- LEFT window: DO Coolify → `y48k0...` (pp-backend) → Environment Variables. Click the eye icon next to each variable to reveal its value.
- RIGHT window: Hetzner Coolify → pp-backend → Environment Variables → **+ Add Variable**.

For each variable in the checklist I gave you in Step 24:
1. Reveal the value on DO.
2. Create the variable on Hetzner with the same NAME and VALUE.
3. Click the checkbox in your local printed copy of the checklist.

**Special handling for these specific variables:**

- `REDIS_URL` — on DO it points at the DO Redis. On Hetzner, set it to the Coolify-internal URL of `pp-redis` (e.g. `redis://pp-redis:6379` or whatever Step 21 told you the internal hostname is). NOT the same as DO.
- `POCKETBASE_URL` — on DO it points at the DO PocketBase. On Hetzner, set it to either the Coolify-internal URL (`http://pp-pocketbase:8090`) or the public URL (`https://new-pb.pageperfect.studio`) depending on your backend code's expectation. Use the public URL if uncertain (works both ways).
- `ALLOWED_ORIGINS` — must include `https://pageperfect.studio`, `https://www.pageperfect.studio`, AND `https://new-api.pageperfect.studio` (the staging URL). Comma-separated.
- `NODE_ENV` — `production`.

Click **Save** after each addition.

**Verify.** Count the variables. Hetzner pp-backend env-var count = DO pp-backend env-var count (give or take REDIS_URL / POCKETBASE_URL / ALLOWED_ORIGINS edits).

**Report back.** "All N variables copied. <list the names of any that were edited rather than copy-pasted: REDIS_URL, POCKETBASE_URL, ALLOWED_ORIGINS, anything else>."

Now deploy: click **Deploy** on pp-backend. Wait 5-15 minutes (first build pulls texlive + ghostscript — slow). Watch the Coolify logs. The build may take 10+ minutes due to image size.

**If the deploy fails**, paste the last 30 lines of the Coolify build log. Common issues: missing env var, dockerfile path wrong, base directory wrong. We'll diagnose.

If the deploy succeeds (container running, healthcheck passing), report:

"pp-backend deployed and healthy at https://new-api.pageperfect.studio."

---

## Phase 7 — Migrate PocketBase data

Total: 3 steps.

### Step 26: Take a PocketBase backup on DO

**Action.** Visit your DO PocketBase admin URL (whatever subdomain you've been using on DO; likely `https://pb.pageperfect.studio` which still resolves to DO right now).

Log in as superuser → **Settings** (gear icon in left nav) → **Backups** → **Create backup**.

When the backup completes (~30 seconds for typical PP data sizes), the new `pb_backup_*.zip` row appears. Click the row → **Download**.

**Verify.** A `.zip` file lands in your Mac's Downloads folder. It contains the entire PocketBase dataset.

**Report back.** "PocketBase backup created. Filename: `pb_backup_YYYYMMDD_HHMMSS.zip`. Size: XX MB."

---

### Step 27: Restore the backup onto Hetzner PocketBase

**Action.** Visit the Hetzner PocketBase admin URL: `https://new-pb.pageperfect.studio/_/`.

If this is the first visit, PocketBase will ask you to create a superuser account FIRST. Use the same email + password as DO — when we restore the backup, this initial superuser will be overwritten with the DO one anyway, but having a placeholder lets us reach the admin UI.

Once logged in → **Settings** → **Backups** → **Upload** → choose the `.zip` from Step 26.

Then click the uploaded row → **Restore**. PocketBase will ask you to confirm — it will restart. Wait ~30 seconds.

Log in again — this time with the DO PocketBase admin credentials (the original ones; the placeholder is overwritten).

**Verify.** In Hetzner PocketBase admin → **Collections** → click each of `users`, `manuscripts`, `print_orders`, `_superusers`. The row count should match what's on DO (give or take a couple from in-flight activity).

**Report back.** Paste a table:

```
Collection         | DO count | Hetzner count
users              |   <N>    |   <N>
manuscripts        |   <N>    |   <N>
print_orders       |   <N>    |   <N>
_superusers        |   <N>    |   <N>
```

Counts should match within ±5.

---

### Step 28: Verify backend ↔ PocketBase connectivity

**Action.** Curl the backend's health endpoint on Hetzner:

```bash
curl -i https://new-api.pageperfect.studio/api/health
```

Then trigger an endpoint that actually queries PocketBase (read-only, safe — adjust path if your backend has a different one):

```bash
curl -i https://new-api.pageperfect.studio/api/status
```

If the backend can reach PocketBase, you'll see a 200 with a status payload. If PocketBase is unreachable, you'll see a 500 or "PocketBase unreachable" error.

**Verify.** Both endpoints return 2xx.

**Report back.** Paste both `curl` outputs (just the HTTP line + first ~5 lines of body).

---

## Phase 8 — Validate

Total: 2 steps.

### Step 29: Backend smoke test — manuscript compile

**Action.** From your Mac, fire a tiny compile request at the Hetzner backend:

```bash
curl -i -X POST https://new-api.pageperfect.studio/api/compile \
  -H 'Content-Type: application/json' \
  -d '{"markdown":"# Hello\n\nThis is a test.","template":"symphony","trim":"5x8"}'
```

(If the exact endpoint or payload format is different, adjust — the goal is: trigger a compile, get a job ID or a PDF.)

Wait up to 30 seconds. The response should be either:
- A job ID (if compiles are async)
- A streaming PDF (if compiles are inline)
- A 4xx error if the input is malformed

**Verify.** You get a 200 (or 202 for async). If you get a 200, the compile pipeline works end-to-end on Hetzner.

**Report back.** Paste the curl response (truncate the body if it's a PDF — just the headers + first 200 chars are enough).

If you get a 500, paste the full response and the last 30 lines of Coolify's `pp-backend` logs.

---

### Step 30: Stripe test-mode webhook delivery

**Action.** Go to Stripe Dashboard → switch to **Test mode** (top-left toggle) → Developers → Webhooks → **+ Add endpoint**.

- **URL:** `https://new-api.pageperfect.studio/api/stripe/webhook` (adjust to your real path if different)
- **Events:** select `checkout.session.completed` (or whatever your code listens for; if unsure, pick that one for the test)
- Click **Add endpoint**

Then on the endpoint page → **Send test webhook** → pick `checkout.session.completed` → Send.

**Verify.** The "Last delivery" shows ✓ 200. Stripe successfully reached the Hetzner backend.

**Report back.** Either "Stripe test webhook delivered ✓ 200" or the error code + last 30 lines of `pp-backend` logs.

After verification, **delete this test webhook endpoint** so we don't have a hanging test webhook config — production webhook stays at the original DO URL until Phase 9.

---

## Phase 9 — Cutover

Total: 5 steps. This is the moment production traffic shifts. **Read each step's Action and Verify TWICE before clicking.**

### Step 31 (T-24h): Lower TTL on the three production A records

**Action.** *24 hours before* you want to cut over, edit the three A records in Microsoft 365 admin DNS:

1. Edit the existing record `api` (the A record pointing to `134.122.102.159`): change TTL from 1 hour → **5 minutes (300 seconds)**. **Do not change the value yet.** Save.
2. Same for `pb`.
3. Same for `studio`.

Lowering the TTL doesn't change where traffic goes — it just makes the eventual flip propagate faster.

**⚠ Watch-out:** Only edit the TTL on the 3 named A records. Do NOT touch other records, do NOT change the IP value yet.

**Verify.**

```bash
dig +noall +answer api.pageperfect.studio
dig +noall +answer pb.pageperfect.studio
dig +noall +answer studio.pageperfect.studio
```

Each should still return `134.122.102.159` but with a TTL of 300 (or close to it; TTLs decrement until propagation completes).

**Report back.** Paste the `dig` outputs.

Then **wait 24 hours.** This is intentional — it lets the lower TTL propagate everywhere globally so that the eventual flip is felt within ~5 minutes worldwide.

---

### Step 32: Flip the three A records from DO IP to Hetzner IP

**Action.** Now we cut over. Edit each of the three A records:

1. `api.pageperfect.studio` — change the **Points to** value from `134.122.102.159` → Hetzner IP. Save.
2. `pb.pageperfect.studio` — same.
3. `studio.pageperfect.studio` — same. (Unless Phase 1.5 confirmed it's unused, in which case you could delete the record entirely. Default action: flip to Hetzner to be safe.)

**⚠ Watch-out:**
- THREE records only. Not the apex, not www, not MX, not TXT, not the CNAMEs.
- Do not delete records. Only edit the IP value.
- Double-check each one before clicking Save.

**Verify.** Wait 2 minutes, then:

```bash
dig +noall +answer api.pageperfect.studio
dig +noall +answer pb.pageperfect.studio
dig +noall +answer studio.pageperfect.studio
```

Each should now return the Hetzner IP. May take up to 5 minutes for global propagation.

Then test the actual sites:

```bash
curl -I https://api.pageperfect.studio/api/health
curl -I https://pb.pageperfect.studio/_/health
```

Each should return 200 (or whatever your healthcheck returns for the protected admin endpoint, but the request should land on Hetzner Coolify's routing).

**Report back.** Paste the `dig` outputs + the `curl` outputs.

---

### Step 33: Update GitHub webhook (Hetzner Coolify auto-deploy)

**Action.** Go to https://github.com/PagePerfect-design/PagePerfect/settings/hooks.

You'll see at least one webhook — the DO Coolify deploy webhook pointing at the DO IP/Coolify URL. There may also be one from Hetzner Coolify added automatically in Step 20 — confirm it's present.

If the Hetzner webhook is there and active: **delete the DO webhook.** GitHub still has the active Hetzner one and pushes auto-deploy to the new host.

If only the DO webhook is present: in Hetzner Coolify → pp-backend → Settings → make sure the GitHub Auto-Deploy toggle is ON. Coolify will register a new webhook automatically. Wait 30s, refresh the GitHub Webhooks page. You should now see both. Delete the DO webhook.

**Verify.** From the Hetzner Coolify pp-backend → make a tiny no-op commit on `main` to test:

```bash
cd /Users/abuaa/Projects/PagePerfect
git checkout main
git pull
echo "" >> README.md
git add README.md
git commit -m "chore: trigger Hetzner Coolify deploy test"
git push origin main
```

In Hetzner Coolify, you should see a new deploy kick off within 30 seconds.

**Report back.** "Hetzner Coolify webhook active. Test commit triggered deploy. DO webhook deleted." If anything misbehaves, paste the GitHub webhook delivery log (Recent Deliveries) for diagnosis.

---

### Step 34: Verify Stripe + Lulu webhooks (and any other URL-based external service)

**Action.**

1. **Stripe.** Production mode → Developers → Webhooks → look at the existing production endpoint. The URL is `https://api.pageperfect.studio/...` (per Step 6). The URL is unchanged because DNS now points at Hetzner. **No edit needed.** But: check the recent deliveries log — they should be hitting Hetzner now (look for new entries after the DNS flip).
2. **Lulu.** Same. URL is domain-based; no edit needed.
3. **Cloudflare Turnstile.** Visit Turnstile dashboard, confirm `pageperfect.studio` is in the allowed-hostnames list. It almost certainly already is. No edit needed.
4. **Vercel.** No edit needed. The frontend calls `api.pageperfect.studio` which now points at Hetzner. Make a request through the production site to test.

**Verify.** Open `https://www.pageperfect.studio` in a fresh incognito window. Sign up for a test account → log in → upload a manuscript → compile → preview. The full flow should work end-to-end. If anything breaks, paste the browser console error + the matching Coolify backend log entry.

**Report back.** "Production end-to-end test passed: signup, login, compile, preview." If anything failed, paste error details.

---

## Phase 10 — Post-cutover monitoring

Total: 1 step (spans 7 days).

### Step 35: 7-day watch window

**Action.** For 7 days after cutover:

- Each day, check:
  - Hetzner Coolify dashboard for any failing deploys or unhealthy containers.
  - Stripe dashboard → Webhooks → recent deliveries — should all be 200.
  - Lulu webhook deliveries — should all be 200.
  - Any user reports of brokenness in your support inbox.
- **Do NOT touch DO containers during this window** — they are the rollback safety net.

If anything serious breaks during the 7 days and we can't fix on Hetzner quickly, the rollback is: re-edit the 3 A records back to `134.122.102.159` (DO IP). Within 5 minutes traffic returns to DO. Diagnose on Hetzner offline.

**Verify.** 7 days pass with no rollback triggered.

**Report back.** Daily quick check-in is fine (just "Day 1: clean" / "Day 2: clean" / etc.) or one big report at day 7. If something goes wrong, ping me immediately.

---

## Phase 11 — Decommission DO

Total: 2 steps. Only run AFTER 7 quiet days.

### Step 36: Stop and remove DO PP containers

**Action.** In DO Coolify → for each of:
- `y48k0cw0gcog8cggsogswsgo` (pp-backend on DO)
- The PocketBase application
- The PP-specific `redis:7.2` (`ds08oc...`)
- Optionally `bbjhn12jicwxbrmifmpgu555` (the old frontend container — only if Phase 1.5 / Vercel investigation confirmed it's not serving anything anymore)

→ click into the resource → **Stop** → wait → **Delete**.

**⚠ Watch-out:** Do NOT touch the Supabase containers, the n8n container, the Coolify containers themselves, or anything else. Only the PagePerfect-specific resources.

**Verify.** On the DO host (SSH in):

```bash
docker ps
```

The PP containers should be gone. The other 20+ containers should still be present.

```bash
df -h /
free -h
```

Both should show meaningfully more free space + RAM compared to before.

**Report back.** Paste `docker ps | wc -l`, `df -h /`, `free -h`. Confirms PP containers removed and resources freed.

---

### Step 37: Final tidy + close-out

**Action.**

1. In Hetzner Coolify, remove the staging routes if you want (`new-api.pageperfect.studio` and `new-pb.pageperfect.studio` are now redundant — the production routes are live). Or leave them as a permanent staging environment.
2. In Microsoft 365 DNS, remove the `new-api` and `new-pb` A records (optional — they're harmless if left).
3. Raise the TTL on `api`, `pb`, `studio` back from 300s to 3600s (1 hour) — lower TTLs mean more DNS lookups; we only needed it low during cutover.
4. Set up Hetzner snapshot backups (optional — Hetzner Cloud → server → Backups). ~20% additional monthly cost.
5. Optional: downsize DO droplet at next billing cycle if it makes sense given remaining workload (Supabase + n8n).

**Verify.** Production runs entirely from Hetzner; DO hosts only the non-PagePerfect apps.

**Report back.** "Migration complete. Hetzner: production. DO: Supabase / n8n only."

---

## Definition of done

- [ ] Hetzner CX42 running Ubuntu 24.04, hardened (UFW, fail2ban, no root SSH, no password SSH, key-only)
- [ ] Coolify reachable at `https://coolify.pageperfect.studio`, TLS valid, 2FA enabled
- [ ] `pp-backend` running, healthcheck passing
- [ ] `pp-pocketbase` running, all collections present, counts match DO (±5)
- [ ] `pp-redis` running, internal connectivity verified
- [ ] DNS records `api`, `pb`, `studio` point at Hetzner IP, propagated globally
- [ ] Vercel frontend operating unchanged (no redeploy required, no env-var change required)
- [ ] Stripe production webhook delivery succeeds against Hetzner (verified in dashboard)
- [ ] Lulu webhook delivery succeeds against Hetzner (or N/A if no webhook)
- [ ] GitHub push to `main` triggers Hetzner Coolify deploy
- [ ] 7 days post-cutover with no rollback triggered
- [ ] DO `pp-backend`, `pocketbase`, and PP-specific `redis` containers stopped and removed; Supabase + n8n untouched
- [ ] TTLs restored to 3600 on the three flipped A records
- [ ] Spec + this runbook archived to `docs/superpowers/specs/` + `plans/`

## Self-review notes

- 37 steps grouped into 11 phases ≈ ~30 was-the-original-estimate; close enough.
- Every step has Action / Verify / Report-back.
- Steps 14, 18, 19, 31, 32 (DNS edits) all explicitly call out "only the named record."
- Step 11 (disable root SSH) has a "test from a second window before closing the first" pattern to prevent lock-out.
- Step 25 (env-var copy) explicitly warns "never paste secret values into chat."
- Phase 9 (cutover) is split across 4 steps so each is independently verifiable.
- Phase 11 decommission is gated on 7 quiet days.
- Rollback path is explicit at every cutover phase.
