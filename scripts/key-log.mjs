#!/usr/bin/env node
/**
 * Mirrors Terebyte's public log of share keys (members' public keys for sharing files with each other)
 * into keys/, and checks it. Every entry ever published is kept in keys/log.jsonl; each run fetches the
 * new ones, recomputes the whole Merkle tree (RFC 6962) from every entry kept here, and checks the root
 * equals the one terebyte.com serves. If the history was ever rewritten, the root won't match and the
 * run fails without writing anything. keys/heads.jsonl records each head that checked out.
 *
 *   node scripts/key-log.mjs [https://terebyte.com]
 *
 * No dependencies; Node 20 or later.
 */
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";

const site = process.argv[2] ?? "https://terebyte.com";
const LOG = "keys/log.jsonl";
const HEADS = "keys/heads.jsonl";

const sha256 = (...parts) => {
  const h = createHash("sha256");
  for (const p of parts) h.update(p);
  return h.digest();
};
const leafHash = (entry) => sha256(Buffer.from([0]), Buffer.from(`terebyte/v1/share-key\n${entry.shareId}\n`, "utf8"), Buffer.from(entry.bundle, "base64"));
const split = (n) => {
  let k = 1;
  while (k * 2 < n) k *= 2;
  return k;
};
const rootOf = (hashes) => {
  if (hashes.length === 0) return sha256(Buffer.alloc(0));
  if (hashes.length === 1) return hashes[0];
  const k = split(hashes.length);
  return sha256(Buffer.from([1]), rootOf(hashes.slice(0, k)), rootOf(hashes.slice(k)));
};

const lines = (file) => (existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);

async function get(path) {
  const response = await fetch(`${site}${path}`, { headers: { "user-agent": "terebyte-transparency-mirror" } });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

const kept = lines(LOG);
const fresh = [];
let head;
// Each page comes with the head it's bounded by; read until the entries reach the latest head.
for (let after = kept.length - 1; ; ) {
  const page = await get(`/api/sharing/log?after=${after}`);
  head = page.head;
  fresh.push(...page.entries);
  if (kept.length + fresh.length >= head.size || page.entries.length === 0) break;
  after = page.entries[page.entries.length - 1].index;
}
const all = [...kept, ...fresh];
all.forEach((entry, i) => {
  if (entry.index !== i) throw new Error(`Entry ${entry.index} where ${i} was expected: the log skipped or repeated.`);
});
// The server's head may have grown since the last page: check against the tree of exactly the entries held.
const root = rootOf(all.map(leafHash)).toString("base64");
if (head.size !== all.length) throw new Error(`The head says ${head.size} entries; ${all.length} were listed.`);
if (head.root !== root) throw new Error("The log's root doesn't match its entries: its history isn't what was published before.");
for (const entry of fresh) appendFileSync(LOG, `${JSON.stringify({ index: entry.index, shareId: entry.shareId, bundle: entry.bundle, at: entry.at })}\n`);
const last = lines(HEADS).at(-1);
if (!last || last.size !== head.size) appendFileSync(HEADS, `${JSON.stringify({ size: head.size, root: head.root, checkedAt: new Date().toISOString().slice(0, 16) + "Z" })}\n`);
console.log(`${all.length} entries, root ${root}${fresh.length ? `, ${fresh.length} new` : ""}`);
