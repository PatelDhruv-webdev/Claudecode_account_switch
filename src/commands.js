import fs from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';

import {
  readRegistry,
  writeRegistry,
  getBinaryPath,
  setBinaryPath,
  accountDir,
  isLoggedIn,
  toSlug,
} from './registry.js';
import { findClaudeBinary } from './finder.js';
import { writeAliases, removeAliases, detectShellRc } from './shell.js';
import { showBanner, showMergeAnimation } from './animation.js';

const ok  = msg => console.log(chalk.green('  ✓ ') + msg);
const inf = msg => console.log(chalk.cyan('  → ') + msg);
const wrn = msg => console.log(chalk.yellow('  ! ') + msg);
const err = msg => console.log(chalk.red('  ✗ ') + msg);
const dim = msg => console.log(chalk.dim('    ' + msg));
const br  = ()  => console.log('');

// ─── setup ────────────────────────────────────────────────────────────────────

export async function cmdSetup() {
  await showBanner();
  await showMergeAnimation();

  // Find binary
  inf('Searching for Claude Code binary...');
  const binary = findClaudeBinary();
  if (!binary) {
    br();
    err('Claude Code binary not found.');
    dim('Install it first:  npm install -g @anthropic-ai/claude-code');
    br();
    process.exit(1);
  }
  ok(`Found: ${chalk.dim(binary)}`);
  br();

  // Ask for two account names
  const { name1 } = await inquirer.prompt([{
    type: 'input',
    name: 'name1',
    message: 'Name for account 1 (e.g. "personal"):',
    default: 'personal',
    validate: v => v.trim().length > 0 ? true : 'Name cannot be empty',
  }]);

  const { name2 } = await inquirer.prompt([{
    type: 'input',
    name: 'name2',
    message: 'Name for account 2 (e.g. "work"):',
    default: 'work',
    validate: v => {
      if (!v.trim()) return 'Name cannot be empty';
      if (toSlug(v.trim()) === toSlug(name1.trim())) return 'Must be different from account 1';
      return true;
    },
  }]);

  const accounts = [
    { id: 1, label: name1.trim(), slug: toSlug(name1.trim()), dir: accountDir(toSlug(name1.trim())), createdAt: new Date().toISOString() },
    { id: 2, label: name2.trim(), slug: toSlug(name2.trim()), dir: accountDir(toSlug(name2.trim())), createdAt: new Date().toISOString() },
  ];

  // Create dirs, save registry, write aliases
  for (const a of accounts) fs.mkdirSync(a.dir, { recursive: true });
  setBinaryPath(binary);
  writeRegistry(accounts);
  const { rcFile } = writeAliases(accounts, binary);

  br();
  ok(chalk.bold('Setup complete!'));
  br();
  for (const a of accounts) {
    ok(`${chalk.cyan('claude-' + a.slug)}  →  ${chalk.dim(a.dir)}`);
  }
  br();
  inf(`Shell aliases written to: ${chalk.bold(rcFile)}`);
  br();
  console.log(chalk.bold('  Next steps:'));
  br();
  dim(`1. Reload your shell:      source ${detectShellRc()}`);
  dim(`2. Authenticate account 1: claude-${accounts[0].slug}   then run  /login`);
  dim(`3. Authenticate account 2: claude-${accounts[1].slug}   then run  /login`);
  dim(`4. Code in parallel:       open two terminal tabs and run each!`);
  br();
}

// ─── add ──────────────────────────────────────────────────────────────────────

export async function cmdAdd(args) {
  const binary = getBinaryPath();
  if (!binary) {
    br(); err('Run claude-multi setup first.'); br(); return;
  }

  let label;
  if (args.length > 0) {
    label = args.join(' ');
  } else {
    br();
    const res = await inquirer.prompt([{
      type: 'input',
      name: 'label',
      message: 'Name for new account:',
      validate: v => v.trim().length > 0 ? true : 'Name cannot be empty',
    }]);
    label = res.label;
  }

  const slug     = toSlug(label.trim());
  const accounts = readRegistry();

  if (accounts.find(a => a.slug === slug)) {
    br(); err(`Account "claude-${slug}" already exists.`); br(); return;
  }

  const dir = accountDir(slug);
  fs.mkdirSync(dir, { recursive: true });

  accounts.push({ id: accounts.length + 1, label: label.trim(), slug, dir, createdAt: new Date().toISOString() });
  writeRegistry(accounts);
  writeAliases(accounts, binary);

  br();
  ok(`Added ${chalk.cyan('claude-' + slug)}`);
  ok(`Config dir: ${chalk.dim(dir)}`);
  br();
  inf(`Run: source ${detectShellRc()}`);
  inf(`Then: claude-${slug}  →  /login`);
  br();
}

// ─── list ─────────────────────────────────────────────────────────────────────

export async function cmdList() {
  const accounts = readRegistry();
  br();

  if (accounts.length === 0) {
    wrn('No accounts yet. Run: claude-multi setup');
    br(); return;
  }

  console.log(chalk.bold('  Accounts:'));
  br();
  for (const a of accounts) {
    const badge = isLoggedIn(a.slug) ? chalk.green('[logged in]') : chalk.dim('[not logged in]');
    console.log(`  ${chalk.dim(a.id + '.')} ${chalk.cyan('claude-' + a.slug)} ${badge}`);
    dim(`dir: ${a.dir}`);
  }
  br();
  inf('Open each in a separate terminal tab to run both simultaneously!');
  br();
}

// ─── remove ───────────────────────────────────────────────────────────────────

export async function cmdRemove(args) {
  const accounts = readRegistry();
  const binary   = getBinaryPath();

  if (accounts.length === 0) {
    br(); err('No accounts. Run: claude-multi setup'); br(); return;
  }
  if (args.length === 0) {
    br(); err('Specify name or number. Example: claude-multi remove work'); br(); return;
  }

  const id     = args[0];
  const n      = parseInt(id, 10);
  const target = isNaN(n)
    ? accounts.find(a => a.slug === toSlug(id) || a.slug === id)
    : accounts.find(a => a.id === n);

  if (!target) {
    br(); err(`Account "${id}" not found.`); dim('Run: claude-multi list'); br(); return;
  }

  br();
  wrn(`About to delete claude-${target.slug} and its config dir.`);
  br();

  const { confirmed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirmed',
    message: `Delete claude-${target.slug}?`,
    default: false,
  }]);

  if (!confirmed) { br(); inf('Cancelled.'); br(); return; }

  if (fs.existsSync(target.dir)) fs.rmSync(target.dir, { recursive: true, force: true });

  const remaining = accounts
    .filter(a => a.slug !== target.slug)
    .map((a, i) => ({ ...a, id: i + 1 }));
  writeRegistry(remaining);
  if (binary) writeAliases(remaining, binary);

  br();
  ok(`Removed claude-${target.slug}`);
  if (remaining.length > 0) inf(`Remaining: ${remaining.map(a => chalk.cyan('claude-' + a.slug)).join(', ')}`);
  br();
  inf(`Run: source ${detectShellRc()}`);
  br();
}

// ─── uninstall ────────────────────────────────────────────────────────────────

export async function cmdUninstall() {
  br();
  const { removed, rcFile } = removeAliases();
  if (removed) {
    ok(`Aliases removed from ${rcFile}`);
  } else {
    wrn(`No managed aliases found in ${rcFile}`);
  }
  br();
  inf('To also delete all account data:  rm -rf ~/.claude-multi');
  br();
}

// ─── help ─────────────────────────────────────────────────────────────────────

export async function cmdHelp() {
  br();
  console.log(chalk.bold('  claude-multi') + chalk.dim(' — manage multiple Claude Code accounts'));
  br();

  const cmds = [
    ['setup',         '',         'Animated setup: name accounts, write aliases to .zshrc'],
    ['add [name]',    '',         'Add another account'],
    ['list',          'ls',       'Show all accounts and login status'],
    ['remove <name>', 'rm',       'Delete an account and its config dir'],
    ['uninstall',     '',         'Remove all aliases from .zshrc / .bashrc'],
    ['help',          '--help -h','Show this message'],
  ];

  console.log(chalk.bold('  Commands:'));
  br();
  for (const [cmd, aliases, desc] of cmds) {
    const c = chalk.cyan(('  claude-multi ' + cmd).padEnd(34));
    const a = aliases ? chalk.dim(` (${aliases})`) : '';
    console.log(c + '  ' + desc + a);
  }

  br();
  console.log(chalk.bold('  After setup — run in parallel in separate tabs:'));
  br();
  dim('  claude-personal     launches Claude with your personal account');
  dim('  claude-work         launches Claude with your work account');
  dim('  claude              prints reminder to use the above');
  br();
  console.log(chalk.bold('  How it works:'));
  br();
  dim('  Each account gets its own ~/.claude-multi/<name>/ config dir.');
  dim('  Shell aliases set CLAUDE_CONFIG_DIR before launching the binary.');
  dim('  Sessions are 100% isolated — login, history, settings all separate.');
  br();
}
