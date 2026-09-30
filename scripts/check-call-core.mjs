#!/usr/bin/env node
/**
 * Verifies that the vendored call-session core is byte-identical across the three
 * client repos (compared with line endings normalised, so a CRLF checkout is not drift).
 *
 * Canonical copy: ilesure-pwa/src/lib/call/. Edit there, copy verbatim to the siblings,
 * run `npm run check:call-core` in each repo. Siblings are looked up next to this repo
 * (../IleSure, ../ilesure-pwa, ../ilesure-Web-App); one that is not checked out is skipped.
 * This script is itself identical in all three repos.
 *
 * Exit code 1 on drift or when this repo's own copy is missing.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const parent = dirname(root);

const CANONICAL = 'ilesure-pwa';
const MOBILE = 'IleSure';
const PWA = 'ilesure-pwa';
const WEB = 'ilesure-Web-App';

/** Each shared file and the repos that vendor it. */
const SHARED = [
  { file: 'src/lib/call/callSession.ts', repos: [MOBILE, PWA, WEB] },
  { file: 'src/lib/call/browserPeerAdapter.ts', repos: [PWA, WEB] },
];

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const samePath = (a, b) => resolve(a).toLowerCase() === resolve(b).toLowerCase();

const self = [MOBILE, PWA, WEB].find((name) => samePath(join(parent, name), root));
let failed = false;
let compared = 0;

for (const { file, repos } of SHARED) {
  // A repo that does not vendor this file (e.g. mobile and the browser adapter) skips it.
  if (self && !repos.includes(self)) continue;

  const ownPath = join(root, file);
  if (!existsSync(ownPath)) {
    console.error(`x ${file}: missing in this repo`);
    failed = true;
    continue;
  }
  const own = read(ownPath);

  for (const repo of repos) {
    const repoRoot = join(parent, repo);
    if (samePath(repoRoot, root)) continue;
    if (!existsSync(repoRoot)) {
      console.log(`- ${file}: ${repo} not checked out, skipped`);
      continue;
    }
    const otherPath = join(repoRoot, file);
    if (!existsSync(otherPath)) {
      console.warn(`! ${file}: not present in ${repo} (branch without the call core?), skipped`);
      continue;
    }
    compared += 1;
    if (read(otherPath) !== own) {
      failed = true;
      const hint = repo === CANONICAL ? 'copy it from there' : `copy the ${CANONICAL} version over whichever copy is stale`;
      console.error(`x ${file}: differs from ${repo}/${file} (canonical is ${CANONICAL}; ${hint})`);
    } else {
      console.log(`ok ${file}: identical to ${repo}`);
    }
  }
}

if (failed) {
  console.error('\ncheck:call-core failed: the vendored call core has drifted.');
  process.exit(1);
}
console.log(`\ncheck:call-core passed (${compared} comparison${compared === 1 ? '' : 's'}).`);
