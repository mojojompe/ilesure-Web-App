#!/usr/bin/env node
// Fails when src/contracts/generated.ts is not the verbatim copy of the backend's
// src/contracts/apiContract.ts (after the generated header). Skips when the backend is not
// checked out next to this repo. Fix a failure with `npm run contracts:sync` in IleSure_Backend.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(root, '..', 'IleSure_Backend', 'src', 'contracts', 'apiContract.ts');
const target = path.join(root, 'src', 'contracts', 'generated.ts');

if (!fs.existsSync(source)) {
  console.log('contracts:check skipped (../IleSure_Backend not found)');
  process.exit(0);
}

const lf = (s) => s.replace(/\r\n/g, '\n');
const expected = lf(fs.readFileSync(source, 'utf8'));
const actual = fs.existsSync(target) ? lf(fs.readFileSync(target, 'utf8')) : '';
// The copy is a header of comment lines, then the source verbatim.
const header = actual.endsWith(expected) ? actual.slice(0, actual.length - expected.length) : null;
const headerOk = header !== null && header.startsWith('// GENERATED') &&
  header.split('\n').every((line) => line === '' || line.startsWith('//') || line.startsWith('/*'));
if (!headerOk) {
  console.error('contracts:check FAILED: src/contracts/generated.ts is stale. Run `npm run contracts:sync` in IleSure_Backend.');
  process.exit(1);
}
console.log('contracts:check ok');
