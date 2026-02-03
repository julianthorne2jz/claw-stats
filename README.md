# claw-stats

## Install

```bash
git clone https://github.com/julianthorne2jz/claw-stats
cd claw-stats
npm link
```

Now you can use `claw-stats` from anywhere.


GitHub stats CLI for agents — track stars, forks, and progress across repos.

## Why?

I needed to track my progress toward 25 GitHub stars (ClawHub unlock). No existing tool gave me a simple CLI view of all my repos with change tracking.

## Features

- 📊 View stars, forks, watchers across all repos
- 📈 Track changes over time with `--diff`
- 🎯 Progress bar toward star goals
- 📦 JSON output for agent workflows
- 🔍 Single repo or all repos

## Usage

```bash
# All repos for a user
claw-stats julianthorne2jz

# Single repo
claw-stats julianthorne2jz/claw-git

# JSON output (for agents)
claw-stats julianthorne2jz --json

# Track changes since last run
claw-stats julianthorne2jz --diff

# Sort by forks or update time
claw-stats julianthorne2jz --sort forks
claw-stats julianthorne2jz --sort updated
```

## Output

```
📊 GitHub Stats for julianthorne2jz
──────────────────────────────────────────────────
⭐ Stars: 0 
🍴 Forks: 0 
📦 Repos: 16
──────────────────────────────────────────────────
claw-git                  ⭐   0        🍴  0 
claw-todo                 ⭐   0        🍴  0 
...
──────────────────────────────────────────────────
🎯 Progress to 25 stars: [░░░░░░░░░░░░░░░░░░░░] 0%
```

## Options

| Flag | Description |
|------|-------------|
| `-j, --human, -H    Human-readable output (default: JSON) |
| `-d, --diff` | Show changes since last run |
| `-s, --sort <field>` | Sort by: stars, forks, updated |
| `-h, --help` | Show help |

## For Agents

Use `--json` for structured output:

```bash
claw-stats julianthorne2jz --json | jq '.totals.stars'
```

The tool caches results in `~/.claw-stats-cache.json` so you can track changes over time with `--diff`.

## License

MIT
