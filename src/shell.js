import fs from 'fs';
import os from 'os';
import path from 'path';

const BLOCK_START = '# claude-multi-managed — added by claude-multi CLI';
const BLOCK_END   = '# end claude-multi-managed';

export function detectShellRc() {
  const shell = process.env.SHELL || '';
  if (shell.includes('zsh')) return path.join(os.homedir(), '.zshrc');
  return path.join(os.homedir(), '.bashrc');
}

export function buildAliasBlock(accounts, binaryPath) {
  const lines = [BLOCK_START];

  for (const a of accounts) {
    lines.push(`alias claude-${a.slug}='CLAUDE_CONFIG_DIR=${a.dir} ${binaryPath}'`);
  }

  // Override bare `claude` with a friendly reminder
  const names = accounts.map(a => `claude-${a.slug}`).join(', ');
  lines.push(`alias claude='echo "Use a specific account: ${names}"'`);

  lines.push(BLOCK_END);
  return lines.join('\n');
}

function stripManagedBlock(content) {
  return content.replace(
    /\n?# claude-multi-managed[^\n]*\n[\s\S]*?# end claude-multi-managed\n?/g,
    ''
  );
}

export function writeAliases(accounts, binaryPath) {
  const rcFile = detectShellRc();
  const existing = fs.existsSync(rcFile) ? fs.readFileSync(rcFile, 'utf8') : '';
  const cleaned  = stripManagedBlock(existing);
  const block    = '\n' + buildAliasBlock(accounts, binaryPath) + '\n';
  fs.writeFileSync(rcFile, cleaned + block, 'utf8');
  return { rcFile };
}

export function removeAliases() {
  const rcFile = detectShellRc();
  if (!fs.existsSync(rcFile)) return { rcFile, removed: false };
  const content = fs.readFileSync(rcFile, 'utf8');
  const updated = stripManagedBlock(content);
  if (updated === content) return { rcFile, removed: false };
  fs.writeFileSync(rcFile, updated, 'utf8');
  return { rcFile, removed: true };
}
