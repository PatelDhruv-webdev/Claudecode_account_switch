# claude-multi

> Run multiple Claude Code accounts **simultaneously** — each isolated in its own config directory.

[![npm version](https://img.shields.io/npm/v/claude-code-multi)](https://www.npmjs.com/package/claude-code-multi)
[![npm downloads](https://img.shields.io/npm/dm/claude-code-multi)](https://www.npmjs.com/package/claude-code-multi)
[![license](https://img.shields.io/npm/l/claude-code-multi)](LICENSE)

No more logging in and out. Open two terminal tabs and run `claude-personal` in one, `claude-work` in the other — completely separate sessions, at the same time.

---

## Install

```bash
npm install -g claude-code-multi
```

**Requires:** Node.js ≥ 18 and [Claude Code](https://docs.anthropic.com/en/docs/claude-code) already installed.

---

## Quick start

```bash
# 1. Run setup (animated!)
claude-multi setup

# 2. Reload your shell
source ~/.zshrc        # or source ~/.bashrc

# 3. Log in to each account once
claude-personal        # then run /login
claude-work            # then run /login

# 4. Open two terminal tabs and code in parallel
#    Tab 1 → claude-personal
#    Tab 2 → claude-work
```

---

## How it works

Claude Code stores its session in `~/.claude` by default. Setting `CLAUDE_CONFIG_DIR` points it at a different directory — completely isolated from any other account.

`claude-multi setup` automates everything:

1. Finds your `claude` binary automatically
2. Creates `~/.claude-multi/<name>/` for each account
3. Writes shell aliases to `.zshrc` / `.bashrc`:

```bash
alias claude-personal='CLAUDE_CONFIG_DIR=~/.claude-multi/personal /usr/local/bin/claude'
alias claude-work='CLAUDE_CONFIG_DIR=~/.claude-multi/work /usr/local/bin/claude'
alias claude='echo "Use a specific account: claude-personal, claude-work"'
```

The last alias overrides bare `claude` with a reminder so you never launch the wrong account by accident.

---

## Running in parallel

```
Tab 1                            Tab 2
──────────────────────────────── ────────────────────────────────
$ claude-personal                $ claude-work
> working on side project        > working on client code
  completely isolated session      completely isolated session
```

One account hitting a rate limit doesn't affect the other — just switch tabs and keep going.

---

## Commands

| Command | Alias | Description |
|---|---|---|
| `claude-multi setup` | `install` | Animated setup — names accounts, writes aliases |
| `claude-multi add [name]` | `new`, `create` | Add another account |
| `claude-multi list` | `ls` | Show all accounts and login status |
| `claude-multi remove <name>` | `rm` | Delete an account and its config dir |
| `claude-multi uninstall` | | Remove all managed aliases from shell rc |
| `claude-multi help` | `--help`, `-h` | Show usage |

---

## Add more accounts

```bash
claude-multi add freelance
source ~/.zshrc
claude-freelance        # then /login
```

---

## Per-project account

Add to your project's `.env` (works with `direnv`):

```bash
CLAUDE_CONFIG_DIR=~/.claude-multi/work
```

Claude Code automatically uses the `work` account in that directory.

---

## Uninstall

```bash
# Remove shell aliases
claude-multi uninstall

# Remove all account data (optional)
rm -rf ~/.claude-multi

# Remove the package
npm uninstall -g claude-code-multi
```

---

## Contributing

Bug reports and pull requests welcome at [GitHub](https://github.com/pateldhruv-webdev/claudecode_account_switch).

Plain JavaScript (ESM), no build step, minimal dependencies.

---

## License

MIT
