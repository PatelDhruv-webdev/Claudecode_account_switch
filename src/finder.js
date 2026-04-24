import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

const MARKER = 'claude-accounts-managed';

function isManagedWrapper(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(200);
    fs.readSync(fd, buf, 0, 200, 0);
    fs.closeSync(fd);
    return buf.toString('utf8').includes(MARKER);
  } catch {
    return false;
  }
}

function isValidBinary(p) {
  if (!p || !fs.existsSync(p)) return false;
  try {
    fs.accessSync(p, fs.constants.X_OK);
  } catch {
    return false;
  }
  return !isManagedWrapper(p);
}

function tryExec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function globNvmPaths() {
  const nvmBase = path.join(os.homedir(), '.nvm', 'versions', 'node');
  if (!fs.existsSync(nvmBase)) return [];
  try {
    return fs.readdirSync(nvmBase)
      .map(v => path.join(nvmBase, v, 'bin', 'claude'))
      .filter(isValidBinary);
  } catch {
    return [];
  }
}

export function findClaudeBinary() {
  // 1. which claude
  const whichResult = tryExec('which claude');
  if (whichResult && isValidBinary(whichResult)) return whichResult;

  // 2. type -a claude — parse each line for a path
  const typeResult = tryExec('type -a claude');
  if (typeResult) {
    for (const line of typeResult.split('\n')) {
      const match = line.match(/is\s+(.+)$/);
      if (match) {
        const p = match[1].trim();
        if (isValidBinary(p)) return p;
      }
    }
  }

  // 3. NVM glob
  const nvmPaths = globNvmPaths();
  if (nvmPaths.length > 0) return nvmPaths[0];

  // 4. Common install paths
  const commonPaths = [
    '/usr/local/bin/claude',
    '/opt/homebrew/bin/claude',
    path.join(os.homedir(), '.npm-global', 'bin', 'claude'),
    path.join(os.homedir(), '.local', 'bin', 'claude'),
  ];
  for (const p of commonPaths) {
    if (isValidBinary(p)) return p;
  }

  return null;
}
