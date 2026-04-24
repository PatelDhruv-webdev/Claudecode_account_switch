# claude-accounts

Manage multiple [Claude Code](https://claude.ai/code) accounts by switching `CLAUDE_CONFIG_DIR` between isolated config directories.

---

## Install

```bash
npm install -g claude-accounts
```

---

## Quick start

```bash
# 1. Run setup (finds claude binary, installs shell function)
claude-accounts setup

# 2. Reload your shell
source ~/.zshrc   # or source ~/.bashrc

# 3. Add two accounts
claude-accounts add    # enter "personal" when prompted
claude-accounts add    # enter "work" when prompted

# 4. Activate the first account and log in
claude-accounts use 1
claude             # then run /login inside Claude Code
```

From now on, `claude` is intercepted by a shell function that sets `CLAUDE_CONFIG_DIR` to the active account's isolated directory before launching the real binary.

---

## Commands

| Command | Aliases | What it does |
|---|---|---|
| `claude-accounts setup` | `install` | Find binary, create dirs, write shell function to .zshrc |
| `claude-accounts add` | `new`, `create` | Prompt for label, create config dir, add to registry |
| `claude-accounts list` | `ls` | Print all accounts with active marker and login status |
| `claude-accounts use [n]` | `switch`, `activate` | Set active account (interactive picker if no arg) |
| `claude-accounts status` | `current`, `whoami` | Show active account info |
| `claude-accounts remove <n>` | `delete`, `rm` | Delete config dir and remove from registry |
| `claude-accounts uninstall` | | Remove shell function from .zshrc / .bashrc |
| `claude-accounts help` | `--help`, `-h` | Print usage |

---

## How it works

Claude Code stores its login session (API keys, preferences) in a config directory that defaults to `~/.claude`. By setting the `CLAUDE_CONFIG_DIR` environment variable, you can point it at any directory instead — each directory acts as a completely independent account.

`claude-accounts` gives each account its own folder under `~/.claude-accounts/<slug>/` and installs a shell function named `claude` that:

1. Reads `~/.claude-accounts/.active` to find the active account slug
2. Reads `~/.claude-accounts/.binary` to find the real `claude` binary path
3. Runs the real binary with `CLAUDE_CONFIG_DIR` set to that account's directory

```
User types: claude
  → shell function runs
  → reads ~/.claude-accounts/.active  → "personal"
  → reads ~/.claude-accounts/.binary  → "/usr/local/bin/claude-real"
  → runs: CLAUDE_CONFIG_DIR=~/.claude-accounts/personal /usr/local/bin/claude-real
```

---

## Per-project usage

You can also pin a project to a specific account without switching your global active account. Add this to your project's `.env` file:

```bash
CLAUDE_CONFIG_DIR=~/.claude-accounts/work
```

Claude Code will use the `work` account automatically when launched from that project directory (with a tool like `direnv` or by exporting the variable in your shell).

---

## Directory layout

```
~/.claude-accounts/
  .active          ← current active slug
  .binary          ← path to real claude binary
  registry.json    ← list of all accounts
  personal/        ← config dir for "personal" account
    *.json         ← session files written by Claude Code
  work/            ← config dir for "work" account
    *.json
```

---

## Uninstall

```bash
# Remove the shell function from .zshrc / .bashrc
claude-accounts uninstall

# Remove all account data (optional)
rm -rf ~/.claude-accounts

# Uninstall the npm package
npm uninstall -g claude-accounts
```

---

## Contributing

Bug reports and pull requests welcome at [GitHub](https://github.com/pateldhruv-webdev/claudecode_account_switch).

1. Fork the repo
2. Create a feature branch: `git checkout -b my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push and open a pull request

Please keep the code in plain JavaScript (ESM) with no build step and minimal dependencies.

---

## License

MIT
