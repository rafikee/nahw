#!/usr/bin/env bash
# Aggregate subscriber + usage stats from the prod SQLite db on baradapi.
# Aggregates only — never selects email/name/payload columns.
set -euo pipefail

HOST="${NAHW_PROD_HOST:-baradapi}"
IMAGE="${NAHW_PROD_IMAGE:-ghcr.io/rafikee/nahw:latest}"

read -r -d '' NODE_SCRIPT <<'JS' || true
const db = require('better-sqlite3')('/data/nahw.db', { readonly: true });
const one = (sql) => db.prepare(sql).get();
const all = (sql) => db.prepare(sql).all();

console.log('=== subscribers ===');
console.log(one('SELECT COUNT(*) AS total, MIN(created_at) AS first, MAX(created_at) AS latest FROM subscribers'));
console.log('by source:', all('SELECT source, COUNT(*) AS n FROM subscribers GROUP BY source ORDER BY n DESC'));

console.log('\n=== events ===');
console.log(one('SELECT COUNT(*) AS total, COUNT(DISTINCT session_id) AS sessions, MAX(created_at) AS latest FROM events'));
console.log('last 24h:', one("SELECT COUNT(*) AS n, COUNT(DISTINCT session_id) AS sessions FROM events WHERE created_at >= datetime('now','-1 day')"));
console.log('last 7d:',  one("SELECT COUNT(*) AS n, COUNT(DISTINCT session_id) AS sessions FROM events WHERE created_at >= datetime('now','-7 day')"));
console.log('top kinds (7d):', all("SELECT kind, COUNT(*) AS n FROM events WHERE created_at >= datetime('now','-7 day') GROUP BY kind ORDER BY n DESC LIMIT 15"));

console.log('\n=== feedback ===');
console.log(one('SELECT COUNT(*) AS total, AVG(rating) AS avg_rating, MAX(created_at) AS latest FROM feedback'));
console.log('by kind:', all('SELECT kind, COUNT(*) AS n, ROUND(AVG(rating), 2) AS avg_rating FROM feedback GROUP BY kind ORDER BY n DESC'));
JS

ssh "$HOST" "CONTAINER=\$(docker ps --filter ancestor=$IMAGE --format '{{.Names}}' | head -1); test -n \"\$CONTAINER\" || { echo 'no nahw container running' >&2; exit 1; }; docker exec -i \"\$CONTAINER\" node" <<<"$NODE_SCRIPT"
