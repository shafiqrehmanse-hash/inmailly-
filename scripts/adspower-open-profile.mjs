/**
 * Local AdsPower pilot — verify Local API can open one profile.
 *
 * Prerequisites:
 * 1. AdsPower running on this PC
 * 2. AdsPower → Automation → API → enable Local API (port 50325)
 * 3. Copy API key + one profile user_id (column "ID" in AdsPower, e.g. j8k2xm)
 *
 * Usage:
 *   node scripts/adspower-open-profile.mjs
 *   node scripts/adspower-open-profile.mjs --id YOUR_PROFILE_ID
 *   node scripts/adspower-open-profile.mjs --list
 *   node scripts/adspower-open-profile.mjs --stop --id YOUR_PROFILE_ID
 *
 * Env (optional, or use .env.local):
 *   ADSPOWER_API_KEY=...
 *   ADSPOWER_USER_ID=...
 *   ADSPOWER_BASE_URL=http://local.adspower.net:50325
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

loadEnvLocal();

const BASE = (process.env.ADSPOWER_BASE_URL || "http://local.adspower.net:50325").replace(/\/$/, "");
const API_KEY = process.env.ADSPOWER_API_KEY || "";

function parseArgs() {
  const args = process.argv.slice(2);
  let id = process.env.ADSPOWER_USER_ID || "";
  let list = false;
  let stop = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--list") list = true;
    if (args[i] === "--stop") stop = true;
    if (args[i] === "--id" && args[i + 1]) id = args[++i];
  }
  return { id, list, stop };
}

function headers() {
  const h = { Accept: "application/json" };
  if (API_KEY) h.Authorization = `Bearer ${API_KEY}`;
  return h;
}

async function apiGet(path) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { headers: headers() });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`AdsPower API not JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  return json;
}

async function listProfiles() {
  console.log(`\nFetching profiles from ${BASE} ...\n`);
  const data = await apiGet("/api/v1/user/list?page=1&page_size=15");
  if (data.code !== 0) {
    console.error("Failed:", data.msg || data);
    process.exit(1);
  }
  const rows = data.data?.list || [];
  if (rows.length === 0) {
    console.log("No profiles returned.");
    return;
  }
  console.log("Use --id with the user_id below:\n");
  for (const row of rows) {
    const name = row.name || row.username || "—";
    console.log(`  user_id: ${row.user_id}  |  name: ${name}  |  serial: ${row.serial_number ?? "—"}`);
  }
  console.log("\nExample:");
  console.log(`  node scripts/adspower-open-profile.mjs --id ${rows[0].user_id}`);
}

async function openProfile(userId) {
  console.log(`\nOpening profile user_id=${userId} ...`);
  console.log(`API: ${BASE}/api/v1/browser/start\n`);

  const data = await apiGet(`/api/v1/browser/start?user_id=${encodeURIComponent(userId)}`);

  if (data.code !== 0) {
    console.error("❌ Failed to open profile");
    console.error("   msg:", data.msg || "(no message)");
    console.error("\nTips:");
    console.error("  • Is AdsPower open on this PC?");
    console.error("  • Automation → API → Local API enabled?");
    console.error("  • Correct user_id? Run: node scripts/adspower-open-profile.mjs --list");
    console.error("  • Set ADSPOWER_API_KEY in .env.local if API auth is required");
    process.exit(1);
  }

  console.log("✅ Success — browser should open on your screen!");
  console.log("\nReturn data:");
  console.log("  debug_port:", data.data?.debug_port);
  console.log("  selenium:  ", data.data?.ws?.selenium);
  console.log("  puppeteer: ", data.data?.ws?.puppeteer?.slice(0, 60) + "...");
  console.log("\nIf you see the AdsPower browser window → pilot passed. InMailly Agent will use this same API on VPS.");
  console.log(`\nClose it with:\n  node scripts/adspower-open-profile.mjs --stop --id ${userId}`);
}

async function stopProfile(userId) {
  console.log(`\nClosing profile user_id=${userId} ...`);
  const data = await apiGet(`/api/v1/browser/stop?user_id=${encodeURIComponent(userId)}`);
  if (data.code !== 0) {
    console.error("❌ Stop failed:", data.msg);
    process.exit(1);
  }
  console.log("✅ Profile browser closed.");
}

async function ping() {
  try {
    await fetch(BASE, { method: "GET" }).catch(() => null);
  } catch {
    // ignore
  }
}

async function main() {
  const { id, list, stop } = parseArgs();

  console.log("InMailly × AdsPower local pilot");
  console.log("Base URL:", BASE);
  console.log("API key:", API_KEY ? "(set)" : "(not set — OK if AdsPower allows local without key)");

  await ping();

  if (list) {
    await listProfiles();
    return;
  }

  if (stop) {
    if (!id) {
      console.error("\nProvide --id YOUR_PROFILE_ID to stop.");
      process.exit(1);
    }
    await stopProfile(id);
    return;
  }

  if (!id) {
    console.log("\nNo profile id. Listing first 15 profiles...\n");
    await listProfiles();
    return;
  }

  await openProfile(id);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  console.error("\nIs AdsPower running? Try opening AdsPower app first, then enable Local API in Settings → Automation.");
  process.exit(1);
});
