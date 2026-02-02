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
node index.js <username>

# View single repo
node index.js <username>/<repo>

# JSON output for agents
node index.js <username> --json

# Track changes since last run
node index.js <username> --diff
```

## Flags

- `-j, --json` — Output JSON
- `-d, --diff` — Compare with cached data
- `-s, --sort <field>` — Sort by: stars, forks, updated
- `-h, --help` — Show help

## Agent Patterns

```bash
# Check total stars
node index.js julianthorne2jz --json | jq '.totals.stars'

# Get repo with most stars
node index.js julianthorne2jz --json | jq '.repos[0].name'

# Track daily progress
node index.js julianthorne2jz --diff
```

## Cache

Stats are cached in `~/.claw-stats-cache.json` for diff tracking.
