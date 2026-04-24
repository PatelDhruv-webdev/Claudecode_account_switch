import fs from 'fs';
import os from 'os';
import path from 'path';
import { ACCOUNTS_ROOT } from './registry.js';

const BLOCK_START = '# claude-accounts-managed — added by claude-accounts CLI';
const BLOCK_END = '# end claude-accounts-managed';

export function detectShellRc() {
  const shell = process.env.SHELL || '';
  if (shell.includes('zsh')) {
    return path.join(os.homedir(), '.zshrc');
  }
  return path.join(os.homedir(), '.bashrc');
}

export function buildShellFunction() {
  return `${BLOCK_START}
function claude() {
  local active_file="${ACCOUNTS_ROOT}/.active"
  local binary_file="${ACCOUNTS_ROOT}/.binary"
  if [[ -f "$active_file" ]] && [[ -f "$binary_file" ]]; then
    local slug=$(cat "$active_file")
    local config_dir="${ACCOUNTS_ROOT}/$slug"
    local binary=$(cat "$binary_file")
    CLAUDE_CONFIG_DIR="$config_dir" "$binary" "$@"
  else
    echo "No active Claude account. Run: claude-accounts use <n>"
  fi
}
${BLOCK_END}`;
}

export function writeShellFunction() {
  const rcFile = detectShellRc();

  let existing = '';
  if (fs.existsSync(rcFile)) {
    existing = fs.readFileSync(rcFile, 'utf8');
  }

  if (existing.includes(BLOCK_START)) {
    return { rcFile, alreadyInstalled: true };
  }

  const block = '\n' + buildShellFunction() + '\n';
  fs.appendFileSync(rcFile, block, 'utf8');
  return { rcFile, alreadyInstalled: false };
}

export function removeShellFunction() {
  const rcFile = detectShellRc();
  if (!fs.existsSync(rcFile)) return { rcFile, removed: false };

  let content = fs.readFileSync(rcFile, 'utf8');
  // Remove the entire managed block including surrounding newlines
  const pattern = /\n?# claude-accounts-managed[^\n]*\n[\s\S]*?# end claude-accounts-managed\n?/g;
  const updated = content.replace(pattern, '\n');

  if (updated === content) return { rcFile, removed: false };

  fs.writeFileSync(rcFile, updated, 'utf8');
  return { rcFile, removed: true };
}
