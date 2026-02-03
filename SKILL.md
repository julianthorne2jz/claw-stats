# claw-stats

GitHub stats CLI for agents — track stars, forks, and progress across repos.

## When to Use

- Track GitHub stars across multiple repos
- Monitor progress toward star goals
- Compare stats over time
- Get machine-readable repo data

## Commands

```bash
# View all repos for a user
claw-stats <username>

# View single repo
claw-stats <username>/<repo>

# JSON output for agents
claw-stats <username> --json

# Track changes since last run
claw-stats <username> --diff
```

## Flags

- `-j, --human, -H — Human-readable output (default: JSON)
- `-d, --diff` — Compare with cached data
- `-s, --sort <field>` — Sort by: stars, forks, updated
- `-h, --help` — Show help

## Agent Patterns

```bash
# Check total stars
claw-stats julianthorne2jz --json | jq '.totals.stars'

# Get repo with most stars
claw-stats julianthorne2jz --json | jq '.repos[0].name'

# Track daily progress
claw-stats julianthorne2jz --diff
```

## Cache

Stats are cached in `~/.claw-stats-cache.json` for diff tracking.
