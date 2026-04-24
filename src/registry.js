import fs from 'fs';
import os from 'os';
import path from 'path';

export const ACCOUNTS_ROOT = path.join(os.homedir(), '.claude-multi');

const REGISTRY_FILE = path.join(ACCOUNTS_ROOT, 'registry.json');
const BINARY_FILE   = path.join(ACCOUNTS_ROOT, '.binary');

function ensureRoot() {
  fs.mkdirSync(ACCOUNTS_ROOT, { recursive: true });
}

export function readRegistry() {
  ensureRoot();
  if (!fs.existsSync(REGISTRY_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
  } catch {
    return [];
  }
}

export function writeRegistry(accounts) {
  ensureRoot();
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(accounts, null, 2), 'utf8');
}

export function getBinaryPath() {
  if (!fs.existsSync(BINARY_FILE)) return null;
  return fs.readFileSync(BINARY_FILE, 'utf8').trim();
}

export function setBinaryPath(p) {
  ensureRoot();
  fs.writeFileSync(BINARY_FILE, p, 'utf8');
}

export function accountDir(slug) {
  return path.join(ACCOUNTS_ROOT, slug);
}

export function isLoggedIn(slug) {
  const dir = accountDir(slug);
  if (!fs.existsSync(dir)) return false;
  try {
    return fs.readdirSync(dir).some(f => f.endsWith('.json'));
  } catch {
    return false;
  }
}

export function toSlug(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
