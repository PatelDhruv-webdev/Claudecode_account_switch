# claude-multi

A CLI tool that automates the [multiple-Claude-accounts setup](https://medium.com/@buwanekasumanasekara/setting-up-multiple-claude-code-accounts-on-your-local-machine-f8769a36d1b1) so you can run two (or more) Claude Code sessions **simultaneously** in separate terminal tabs — each with its own isolated login session.

---

## Install

```bash
npm install -g claude-code-multi
```

---

## Quick start

```bash
# 1. Run the interactive setup (animated!)
claude-multi setup

# 2. Reload your shell
source ~/.zshrc   # or source ~/.bashrc

# 3. Authenticate each account (do this once per account)
claude-personal   # launches Claude → run /login
claude-work       # launches Claude → run /login

# 4. Code in parallel — open two terminal tabs:
#   Tab 1: claude-personal
#   Tab 2: claude-work
```

Both sessions are 100% isolated — separate logins, separate history, separate settings.

---

## Commands

| Command | Aliases | What it does |
|---|---|---|
| `claude-multi setup` | `install` | Animated setup: names your accounts, writes shell aliases to .zshrc |
| `claude-multi add [name]` | `new`, `create` | Add another account |
| `claude-multi list` | `ls` | Show all accounts and whether each is logged in |
| `claude-multi remove <name>` | `rm` | Delete an account and its config dir |
| `claude-multi uninstall` | | Remove all managed aliases from .zshrc / .bashrc |
| `claude-multi help` | `--help`, `-h` | Show usage |

---

## How it works

Claude Code stores its login session in `~/.claude` by default. Set `CLAUDE_CONFIG_DIR` to any path and Claude uses that directory instead — completely independent from any other account.

`claude-multi setup` automates all the manual steps:

1. Finds your real `claude` binary path automatically
2. Creates `~/.claude-multi/<name>/` for each account
3. Writes shell aliases to `.zshrc` / `.bashrc`:

```bash
alias claude-personal='CLAUDE_CONFIG_DIR=~/.claude-multi/personal /usr/local/bin/claude'
alias claude-work='CLAUDE_CONFIG_DIR=~/.claude-multi/work /usr/local/bin/claude'
alias claude='echo "Use a specific account: claude-personal, claude-work"'
```

The last alias overrides bare `claude` with a helpful reminder so you never accidentally launch the wrong account.

---

## Running accounts in parallel

Open two terminal tabs and run a different account in each:

```
Tab 1                           Tab 2
─────────────────────────────── ───────────────────────────────
$ claude-personal               $ claude-work
> working on side project       > working on client code
  completely isolated session     completely isolated session
```

Both run simultaneously. One account hitting a rate limit doesn't affect the other — just switch tabs and keep going.

---

## Add more accounts

```bash
claude-multi add freelance
source ~/.zshrc
claude-freelance   # then /login
```

---

## Per-project default account

Add this to your project's `.env` (works with `direnv` or similar):

```bash
CLAUDE_CONFIG_DIR=~/.claude-multi/work
```

Claude Code will automatically use the `work` account in that project.

---

## Uninstall

```bash
# Remove aliases from .zshrc / .bashrc
claude-multi uninstall

# Remove all account data (optional)
rm -rf ~/.claude-multi

# Remove the npm package
npm uninstall -g claude-code-multi
```

---

## Contributing

Bug reports and pull requests welcome at [GitHub](https://github.com/pateldhruv-webdev/claudecode_account_switch).

Keep it plain JavaScript (ESM), no build step, minimal dependencies.

---

## License

MIT
