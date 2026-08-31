@AGENTS.md

**Starting fresh on this project?** Read the "Picking this up" section at the top of
[`README.md`](./README.md) first. It says what exists, what comes next, and which
decisions have already been settled.

# nahw — deployment

Nahw is public at **https://nahw.barada.dev**, running on the baradapi Pi (`ssh baradapi`)
through Coolify. It was migrated off Pi-side source builds in April 2026.

**`git push` to `main` is the deploy.** Nothing else. GitHub Actions builds a `linux/arm64`
image, pushes it to `ghcr.io/rafikee/nahw:latest`, and calls the Coolify API, which pulls
the image and restarts the container.

```bash
~/.claude/skills/newapp/scripts/watch-deploy.sh nahw          # follow the build + deploy
~/.claude/skills/newapp/scripts/verify-app.sh nahw u8km6isr7bcfonf4xdfuz8rr 3000
gh workflow run build-and-deploy -R rafikee/nahw   # force a deploy with no code change
```

**Don't watch "the latest run" and don't stop at a 200.** Both lie on a redeploy:

- `gh run watch` with no run id (and `gh run list --limit 1`) takes the newest row, and
  GitHub often hasn't created your run yet seconds after a push — so it reports the
  *previous* commit's `completed success`. `watch-deploy.sh` keys on
  `headSha == git rev-parse HEAD` instead, and waits when there's no run yet.
- `curl https://nahw.barada.dev/` returns 200 from the container you're replacing. `verify-app.sh`
  compares GHCR's `:latest` digest against both the `:<HEAD sha>` tag and the digest the
  running container was pulled from, which is what actually proves Coolify pulled. Run it
  from inside this repo or it skips the HEAD half.

**Never `docker build` on the Pi, and never deploy by hand.** Source builds peg the Pi's
load past 20 and drop SSH. That is the entire reason this pipeline exists.

## This app's values

| | |
|---|---|
| Public URL | `https://nahw.barada.dev` |
| Image | `ghcr.io/rafikee/nahw:latest` (public) |
| Coolify app UUID | `u8km6isr7bcfonf4xdfuz8rr` |
| Ports | host `3000` → container `3000` |
| Data | bind mount `/data/coolify/nahw-data` → `/data`, `DATABASE_PATH=/data/nahw.db` |
| Server | `baradapi` (Pi 5) |

The old source-build app `anu61busrc7vvzcdhqsknga3` is stopped and pending deletion. If you
ever see a container named with that UUID running, something re-triggered the old app.

## Secrets and env vars

Never bake them into the image — it's public. Coolify injects env at runtime; set them in
the Coolify UI at https://coolify.barada.dev or via
`/api/v1/applications/u8km6isr7bcfonf4xdfuz8rr/envs`, then redeploy.

## Production data

```bash
ssh baradapi "sudo sqlite3 /data/coolify/nahw-data/nahw.db 'SELECT COUNT(*) FROM subscribers'"
```

Sudo is required — the bind-mount directory is root-owned.

**This database is not backed up.** The Pi's nightly restic job covers
`/var/lib/docker/volumes`, and this is a host bind mount outside that path. Anything that
loses the SD card loses every subscriber, rating, and event. Also note the WAL is usually
far larger than the `.db` file, so any copy-based backup must take `nahw.db-wal` and
`nahw.db-shm` too, or use `sqlite3 .backup`.

## When a deploy doesn't take

```bash
cd ~/dev/nahw && ~/.claude/skills/newapp/scripts/verify-app.sh nahw u8km6isr7bcfonf4xdfuz8rr 3000
```

Eight checks from the image outward; the first failure names the layer. A 502 with a healthy
container means the host port isn't bound or the tunnel ingress is wrong. `running:unknown`
in Coolify is normal for an app with no healthcheck.

Full pipeline docs: `~/dev/baradapi-ghcr-runbook.md` (how this app was migrated, with the
gotcha catalogue) and `~/dev/new-app-runbook.md` (the greenfield path). Changing the port
or hostname touches three places — Coolify `ports_mappings`, `/etc/cloudflared/config.yml`
on the Pi, and the Cloudflare DNS record.
