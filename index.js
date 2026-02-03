#!/usr/bin/env node
/**
 * claw-stats — GitHub stats CLI for agents
 * Track stars, forks, and progress across your repos
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(process.env.HOME || '.', '.claw-stats-cache.json');

// Parse args
const args = process.argv.slice(2);
const flags = {
  help: args.includes('--help') || args.includes('-h'),
  json: args.includes('--json') || args.includes('-j'),
  diff: args.includes('--diff') || args.includes('-d'),
  sort: 'stars',
  user: null,
  repo: null
};

// Extract --sort value
const sortIdx = args.findIndex(a => a === '--sort' || a === '-s');
if (sortIdx !== -1 && args[sortIdx + 1]) {
  flags.sort = args[sortIdx + 1];
}

// Extract positional args (user or user/repo)
const positional = args.filter(a => !a.startsWith('-') && a !== flags.sort);
if (positional.length > 0) {
  const arg = positional[0];
  if (arg.includes('/')) {
    [flags.user, flags.repo] = arg.split('/');
  } else {
    flags.user = arg;
  }
}

// Help
if (flags.help) {
  console.log(`
claw-stats — GitHub stats CLI for agents

Usage:
  claw-stats <user>            Show all repos for user
  claw-stats <user>/<repo>     Show single repo stats
  claw-stats --diff            Compare with last run

Options:
  -j, --json           Output JSON
  -d, --diff           Show changes since last run
  -s, --sort <field>   Sort by: stars, forks, updated (default: stars)
  -h, --help           Show this help

Examples:
  claw-stats julianthorne2jz
  claw-stats julianthorne2jz --json
  claw-stats julianthorne2jz/claw-git
  claw-stats julianthorne2jz --diff
`);
  process.exit(0);
}

// Require user
if (!flags.user) {
  // Try to detect from git remote
  try {
    const { execSync } = require('child_process');
    const remote = execSync('git remote get-url origin 2>/dev/null', { encoding: 'utf8' });
    const match = remote.match(/github\.com[:/]([^/]+)/);
    if (match) {
      flags.user = match[1];
    }
  } catch (e) {
    // ignore
  }
}

if (!flags.user) {
  console.error('Error: GitHub username required');
  console.error('Usage: claw-stats <user>');
  process.exit(1);
}

// Fetch from GitHub API
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'claw-stats/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`GitHub API error: ${res.statusCode} - ${data}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Load cache
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return {};
}

// Save cache
function saveCache(data) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    // ignore
  }
}

// Format number with K/M suffix
function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

// Format diff
function formatDiff(current, previous) {
  if (previous === undefined || previous === null || isNaN(previous)) return '(new)';
  const diff = current - previous;
  if (isNaN(diff) || diff === 0) return '';
  return diff > 0 ? `(+${diff})` : `(${diff})`;
}

// Main
async function main() {
  try {
    const cache = loadCache();
    const cacheKey = flags.user;
    const previousData = cache[cacheKey] || {};
    
    let repos = [];
    
    if (flags.repo) {
      // Single repo
      const url = `https://api.github.com/repos/${flags.user}/${flags.repo}`;
      const repo = await fetchJSON(url);
      repos = [repo];
    } else {
      // All repos
      const url = `https://api.github.com/users/${flags.user}/repos?per_page=100&sort=updated`;
      repos = await fetchJSON(url);
    }
    
    if (!Array.isArray(repos)) {
      repos = [repos];
    }
    
    // Filter out forks unless explicitly requested
    repos = repos.filter(r => !r.fork);
    
    // Sort
    repos.sort((a, b) => {
      switch (flags.sort) {
        case 'forks':
          return b.forks_count - a.forks_count;
        case 'updated':
          return new Date(b.updated_at) - new Date(a.updated_at);
        case 'stars':
        default:
          return b.stargazers_count - a.stargazers_count;
      }
    });
    
    // Calculate totals
    const totals = {
      repos: repos.length,
      stars: repos.reduce((sum, r) => sum + r.stargazers_count, 0),
      forks: repos.reduce((sum, r) => sum + r.forks_count, 0),
      watchers: repos.reduce((sum, r) => sum + r.watchers_count, 0)
    };
    
    // Build output
    const output = {
      user: flags.user,
      timestamp: new Date().toISOString(),
      totals,
      repos: repos.map(r => ({
        name: r.name,
        stars: r.stargazers_count,
        forks: r.forks_count,
        watchers: r.watchers_count,
        language: r.language,
        updated: r.updated_at,
        url: r.html_url,
        description: r.description
      }))
    };
    
    // Save to cache
    cache[cacheKey] = {
      timestamp: output.timestamp,
      totals: output.totals,
      repos: output.repos.reduce((acc, r) => {
        acc[r.name] = { stars: r.stars, forks: r.forks };
        return acc;
      }, {})
    };
    saveCache(cache);
    
    // Output
    if (!flags.human && !flags.H) {
      console.log(JSON.stringify(output, null, 2));
      return;
    }
    
    // Pretty print
    console.log(`\n📊 GitHub Stats for ${flags.user}`);
    console.log('─'.repeat(50));
    
    // Show diff from previous if available
    const prevTotals = previousData.totals || {};
    const starsDiff = flags.diff ? formatDiff(totals.stars, prevTotals.stars) : '';
    const forksDiff = flags.diff ? formatDiff(totals.forks, prevTotals.forks) : '';
    
    console.log(`⭐ Stars: ${totals.stars} ${starsDiff}`);
    console.log(`🍴 Forks: ${totals.forks} ${forksDiff}`);
    console.log(`📦 Repos: ${totals.repos}`);
    console.log('─'.repeat(50));
    
    // Repo table
    const prevRepos = previousData.repos || {};
    
    for (const r of repos) {
      const prev = prevRepos[r.name] || {};
      const sd = flags.diff ? formatDiff(r.stars, prev.stars) : '';
      const fd = flags.diff ? formatDiff(r.forks, prev.forks) : '';
      
      const stars = r.stars !== undefined ? r.stars : 0;
      const forks = r.forks !== undefined ? r.forks : 0;
      const line = `${r.name.padEnd(25)} ⭐${String(stars).padStart(4)} ${sd.padEnd(6)} 🍴${String(forks).padStart(3)} ${fd}`;
      console.log(line);
    }
    
    console.log('─'.repeat(50));
    
    // Progress toward goal
    const goal = 25;
    const progress = Math.min(100, (totals.stars / goal) * 100).toFixed(0);
    const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
    console.log(`🎯 Progress to ${goal} stars: [${bar}] ${progress}%`);
    console.log();
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
