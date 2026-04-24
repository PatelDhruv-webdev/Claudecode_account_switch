import fs from 'fs';
import os from 'os';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

import {
  ACCOUNTS_ROOT,
  readRegistry,
  writeRegistry,
  getActive,
  setActive,
  getBinaryPath,
  setBinaryPath,
  accountDir,
  isLoggedIn,
  toSlug,
} from './registry.js';
import { findClaudeBinary } from './finder.js';
import { writeShellFunction, removeShellFunction, detectShellRc } from './shell.js';

const ok  = msg => console.log(chalk.green('  ✓ ') + msg);
const inf = msg => console.log(chalk.cyan('  → ') + msg);
const wrn = msg => console.log(chalk.yellow('  ! ') + msg);
const err = msg => console.log(chalk.red('  ✗ ') + msg);
const dim = msg => console.log(chalk.dim('    ' + msg));
const br  = ()  => console.log('');

// ─── setup ────────────────────────────────────────────────────────────────────

export async function cmdSetup() {
  br();
  inf('Setting up claude-accounts...');
  br();

  // Find binary
  inf('Searching for claude binary...');
  const binary = findClaudeBinary();

  if (!binary) {
    err('Claude Code binary not found.');
    dim('Install Claude Code first: npm install -g @anthropic-ai/claude-code');
    br();
    process.exit(1);
  }

  ok(`Found binary: ${binary}`);
  setBinaryPath(binary);

  // Create accounts root
  if (!fs.existsSync(ACCOUNTS_ROOT)) {
    fs.mkdirSync(ACCOUNTS_ROOT, { recursive: true });
    ok(`Created ${ACCOUNTS_ROOT}`);
  } else {
    ok(`Directory exists: ${ACCOUNTS_ROOT}`);
  }

  // Write shell function
  const { rcFile, alreadyInstalled } = writeShellFunction();
  if (alreadyInstalled) {
    wrn(`Shell function already installed in ${rcFile}`);
  } else {
    ok(`Shell function written to ${rcFile}`);
  }

  br();
  ok('Setup complete!');
  br();
  dim('Next steps:');
  dim('  1. Reload your shell:  source ' + detectShellRc());
  dim('  2. Add an account:     claude-accounts add');
  dim('  3. Switch account:     claude-accounts use 1');
  dim('  4. Launch Claude:      claude');
  br();
}

// ─── add ──────────────────────────────────────────────────────────────────────

export async function cmdAdd() {
  br();
  const { label } = await inquirer.prompt([
    {
      type: 'input',
      name: 'label',
      message: 'Account label (e.g. "personal" or "work"):',
      validate: v => v.trim().length > 0 ? true : 'Label cannot be empty',
    },
  ]);

  const trimmed = label.trim();
  const slug = toSlug(trimmed);
  const accounts = readRegistry();

  if (accounts.find(a => a.slug === slug)) {
    br();
    err(`An account with slug "${slug}" already exists.`);
    dim('Use a different label, or run: claude-accounts list');
    br();
    return;
  }

  const dir = accountDir(slug);
  fs.mkdirSync(dir, { recursive: true });

  const account = {
    id: accounts.length + 1,
    label: trimmed,
    slug,
    dir,
    createdAt: new Date().toISOString(),
  };

  accounts.push(account);
  writeRegistry(accounts);

  br();
  ok(`Account "${trimmed}" created (slug: ${slug})`);
  dim(`Config dir: ${dir}`);
  br();
  inf(`To activate: claude-accounts use ${account.id}`);
  br();
}

// ─── list ─────────────────────────────────────────────────────────────────────

export async function cmdList() {
  const accounts = readRegistry();
  const active = getActive();

  br();
  if (accounts.length === 0) {
    wrn('No accounts yet. Run: claude-accounts add');
    br();
    return;
  }

  console.log(chalk.bold('  Accounts:'));
  br();

  for (const a of accounts) {
    const isActive = active && active.slug === a.slug;
    const loggedIn = isLoggedIn(a.slug);
    const marker = isActive ? chalk.green(' ▶ ') : '   ';
    const badge = loggedIn ? chalk.green('[logged in]') : chalk.dim('[not logged in]');
    const name = isActive ? chalk.green(chalk.bold(a.label)) : a.label;
    console.log(`${marker}${chalk.dim(a.id + '.')} ${name} ${badge}`);
    dim(`dir: ${a.dir}`);
  }

  br();
  if (active) {
    inf(`Active: ${active.label}`);
  } else {
    wrn('No active account. Run: claude-accounts use <n>');
  }
  br();
}

// ─── use ──────────────────────────────────────────────────────────────────────

export async function cmdUse(args) {
  const accounts = readRegistry();

  if (accounts.length === 0) {
    br();
    err('No accounts found. Run: claude-accounts add');
    br();
    return;
  }

  let target;

  if (args.length > 0) {
    const n = parseInt(args[0], 10);
    target = isNaN(n) ? accounts.find(a => a.slug === args[0] || a.label === args[0])
                      : accounts.find(a => a.id === n);
    if (!target) {
      br();
      err(`Account "${args[0]}" not found.`);
      dim('Run: claude-accounts list');
      br();
      return;
    }
  } else {
    br();
    const { chosen } = await inquirer.prompt([
      {
        type: 'list',
        name: 'chosen',
        message: 'Select account to activate:',
        choices: accounts.map(a => ({
          name: `${a.id}. ${a.label}${isLoggedIn(a.slug) ? chalk.green(' [logged in]') : chalk.dim(' [not logged in]')}`,
          value: a,
        })),
      },
    ]);
    target = chosen;
  }

  setActive(target.slug);
  br();
  ok(`Switched to account: ${chalk.bold(target.label)}`);
  dim(`Config dir: ${target.dir}`);
  br();
  if (!isLoggedIn(target.slug)) {
    inf('This account has no session yet. Run: claude  then  /login');
  }
  br();
}

// ─── status ───────────────────────────────────────────────────────────────────

export async function cmdStatus() {
  const active = getActive();
  const binary = getBinaryPath();

  br();
  if (!active) {
    wrn('No active account.');
    dim('Run: claude-accounts use <n>');
    br();
    return;
  }

  console.log(chalk.bold('  Active account:'));
  br();
  inf(`Label:   ${chalk.bold(active.label)}`);
  inf(`Slug:    ${active.slug}`);
  inf(`Dir:     ${active.dir}`);
  inf(`Login:   ${isLoggedIn(active.slug) ? chalk.green('logged in') : chalk.dim('not logged in')}`);
  if (binary) inf(`Binary:  ${binary}`);
  br();
}

// ─── remove ───────────────────────────────────────────────────────────────────

export async function cmdRemove(args) {
  const accounts = readRegistry();

  if (accounts.length === 0) {
    br();
    err('No accounts found. Run: claude-accounts add');
    br();
    return;
  }

  if (args.length === 0) {
    br();
    err('Specify account number. Example: claude-accounts remove 2');
    dim('Run: claude-accounts list  to see account numbers');
    br();
    return;
  }

  const n = parseInt(args[0], 10);
  const target = isNaN(n) ? accounts.find(a => a.slug === args[0] || a.label === args[0])
                           : accounts.find(a => a.id === n);

  if (!target) {
    br();
    err(`Account "${args[0]}" not found.`);
    dim('Run: claude-accounts list');
    br();
    return;
  }

  br();
  wrn(`About to delete account "${target.label}" and its config directory.`);
  dim(`Dir: ${target.dir}`);
  br();

  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Delete account "${target.label}"?`,
      default: false,
    },
  ]);

  if (!confirmed) {
    br();
    inf('Cancelled.');
    br();
    return;
  }

  if (fs.existsSync(target.dir)) {
    fs.rmSync(target.dir, { recursive: true, force: true });
  }

  const remaining = accounts.filter(a => a.slug !== target.slug)
    .map((a, i) => ({ ...a, id: i + 1 }));
  writeRegistry(remaining);

  const active = getActive();
  if (active && active.slug === target.slug) {
    const activeFile = path.join(ACCOUNTS_ROOT, '.active');
    if (fs.existsSync(activeFile)) fs.unlinkSync(activeFile);
    wrn('Removed active account. Run: claude-accounts use <n>  to set a new one.');
  }

  br();
  ok(`Account "${target.label}" removed.`);
  br();
}

// ─── uninstall ────────────────────────────────────────────────────────────────

export async function cmdUninstall() {
  br();
  const { removed, rcFile } = removeShellFunction();
  if (removed) {
    ok(`Shell function removed from ${rcFile}`);
  } else {
    wrn(`Shell function not found in ${rcFile}`);
  }
  br();
  inf('To fully remove, also delete ~/.claude-accounts/');
  dim('  rm -rf ~/.claude-accounts');
  br();
}

// ─── help ─────────────────────────────────────────────────────────────────────

export async function cmdHelp() {
  br();
  console.log(chalk.bold('  claude-accounts') + chalk.dim(' — manage multiple Claude Code accounts'));
  br();
  console.log(chalk.bold('  Usage:'));
  br();

  const commands = [
    ['setup', 'install', 'Find claude binary and install shell function'],
    ['add', 'new, create', 'Add a new account'],
    ['list', 'ls', 'List all accounts'],
    ['use [n]', 'switch, activate', 'Switch active account (interactive if no arg)'],
    ['status', 'current, whoami', 'Show currently active account'],
    ['remove <n>', 'delete, rm', 'Delete an account and its config dir'],
    ['uninstall', '', 'Remove shell function from .zshrc / .bashrc'],
    ['help', '--help, -h', 'Show this help message'],
  ];

  for (const [cmd, aliases, desc] of commands) {
    const cmdStr = chalk.cyan(('  claude-accounts ' + cmd).padEnd(30));
    const aliasStr = aliases ? chalk.dim(' (' + aliases + ')') : '';
    console.log(cmdStr + '  ' + desc + aliasStr);
  }

  br();
  console.log(chalk.bold('  How it works:'));
  br();
  dim('Each account gets its own config directory under ~/.claude-accounts/<slug>/');
  dim('A shell function intercepts "claude" and sets CLAUDE_CONFIG_DIR accordingly.');
  br();
  console.log(chalk.bold('  Quick start:'));
  br();
  dim('  1. claude-accounts setup     # install shell function');
  dim('  2. source ~/.zshrc           # reload shell');
  dim('  3. claude-accounts add       # add your first account');
  dim('  4. claude-accounts use 1     # activate it');
  dim('  5. claude                    # launch Claude and run /login');
  br();
}
