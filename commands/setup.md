---
description: Configure claude-dashboard status line settings
argument-hint: "[language] [plan]"
allowed-tools: Read, Write, Bash(jq:*), Bash(cat:*), Bash(mkdir:*)
---

# Claude Dashboard Setup

Configure the claude-dashboard status line plugin.

## Arguments

- `$1`: Language preference
  - `auto` (default): Detect from system language
  - `en`: English
  - `ko`: Korean (한국어)

- `$2`: Subscription plan
  - `max` (default): Shows 5h + 7d (all models) + 7d-S (Sonnet)
  - `pro`: Shows 5h only

## Tasks

### 1. Create configuration file

Create `~/.claude/claude-dashboard.local.json` with user preferences:

```json
{
  "language": "$1 or auto",
  "plan": "$2 or max",
  "cache": {
    "ttlSeconds": 60
  }
}
```

### 2. Update settings.json

Add or update the statusLine configuration in `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ${CLAUDE_PLUGIN_ROOT}/dist/index.js"
  }
}
```

**Important**: Use `${CLAUDE_PLUGIN_ROOT}` for the plugin path to ensure portability.

### 3. Verify setup

After configuration:
1. Check that the configuration file was created successfully
2. Verify the settings.json was updated
3. Inform the user that the status line will appear on the next message

### 4. Show example output

Display what the status line will look like based on their plan:

**Max plan:**
```
🤖 Opus │ ████████░░ 80% │ 160K/200K │ $1.25 │ 5h: 42% (2h30m) │ 7d: 69% │ 7d-S: 2%
```

**Pro plan:**
```
🤖 Sonnet │ ██████░░░░ 60% │ 120K/200K │ $0.45 │ 5h: 42% (2h30m)
```

## Notes

- If no arguments provided, use defaults (auto language, max plan)
- The status line will start working immediately after configuration
- To change settings later, run this command again with new arguments
