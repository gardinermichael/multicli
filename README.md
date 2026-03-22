# Multi-CLI MCP

[![npm version](https://img.shields.io/npm/v/@osanoai/multicli)](https://www.npmjs.com/package/@osanoai/multicli)
[![Tests](https://img.shields.io/github/actions/workflow/status/osanoai/multicli/tests.yml?branch=main&label=tests)](https://github.com/osanoai/multicli/actions/workflows/tests.yml)
[![Scan](https://img.shields.io/github/actions/workflow/status/osanoai/multicli/scan.yml?branch=main&label=security%20scan)](https://github.com/osanoai/multicli/actions/workflows/scan.yml)
[![GitHub release](https://img.shields.io/github/v/release/osanoai/multicli)](https://github.com/osanoai/multicli/releases/latest)
[![Node](https://img.shields.io/node/v/@osanoai/multicli)](https://www.npmjs.com/package/@osanoai/multicli)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**An MCP server that lets Claude, Gemini, Codex, OpenCode, and Copilot collaborate via tools.**

```
Claude:   "Hey Gemini, what do you think about this code?"
Gemini:   "It's mass. Let me ask Codex for a second opinion."
Codex:    "You're both wrong. Here's the fix."
OpenCode: "I checked with three providers. They all agree with Codex."
Copilot: "I'll run a fast implementation pass and report back."
```

---

## One-Line Install

```bash
curl -fsSL https://raw.githubusercontent.com/osanoai/multicli/main/install.sh | bash
```

Detects which AI CLIs you have installed and configures Multi-CLI for all of them automatically. No config files, no API keys, no environment variables. If it's on your PATH, it works.

---

## What It Does

Multi-CLI sits between your AI clients and bridges them via the [Model Context Protocol](https://modelcontextprotocol.io/). Install it once, and whichever AI you're talking to gains the ability to call the others.

- **Claude** can ask Gemini, Codex, or OpenCode for help
- **Gemini** can delegate to Claude, Codex, or OpenCode
- **Codex** can consult Claude, Gemini, or OpenCode
- **OpenCode** can call Claude, Gemini, Codex, and Copilot-backed models (across 75+ providers)
- **Claude/Gemini/Codex/OpenCode** can delegate to **Copilot CLI** when installed
- Each client's own tools are hidden (no talking to yourself, that's weird)
- Auto-detects which CLIs you have installed — only shows what's available

---

## The Meta Part

This tool was built by the very AIs it connects.

Claude, Gemini, Codex, OpenCode, and Copilot wrote the code. Claude, Gemini, Codex, OpenCode, and Copilot maintain it. Every night, a CI job queries the latest stable release of each supported CLI for its current model list, diffs the results against what's in the repo, and automatically publishes a new version if anything changed. New model releases get picked up within 24 hours. Deprecated models get cleaned out. The repo stays current without anyone touching it.

Because all install commands use `@latest`, your MCP client pulls the newest version every time it starts — no manual updates, no stale model lists, no maintenance.

Most MCP tools go stale within weeks. This one is self-maintaining by design.

---

## Prerequisites

You need **Node.js >= 20** and at least **two** of these CLIs installed:

| CLI | Install |
|-----|---------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) | `npm install -g @anthropic-ai/claude-code` |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `npm install -g @google/gemini-cli` |
| [Codex CLI](https://github.com/openai/codex) | `npm install -g @openai/codex` |
| [OpenCode](https://opencode.ai) | `curl -fsSL https://opencode.ai/install | bash` |
| [Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli) | `npm install -g @github/copilot` |

> Why two? Because one AI talking to itself is a monologue, not a collaboration.

---

## Manual Installation

Prefer to install per-client yourself? Each command is one line.

### Claude Code

```bash
claude mcp add --scope user Multi-CLI -- npx -y @osanoai/multicli@latest
```

<details>
<summary>Claude Desktop (JSON config)</summary>

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS:

```json
{
  "mcpServers": {
    "Multi-CLI": {
      "command": "npx",
      "args": ["-y", "@osanoai/multicli@latest"]
    }
  }
}
```

Restart Claude Desktop completely after saving.
</details>

---

### Gemini CLI

```bash
gemini mcp add --scope user Multi-CLI npx -y @osanoai/multicli@latest
```

<details>
<summary>Manual config (~/.gemini/settings.json)</summary>

```json
{
  "mcpServers": {
    "Multi-CLI": {
      "command": "npx",
      "args": ["-y", "@osanoai/multicli@latest"]
    }
  }
}
```
</details>

---

### Codex CLI

```bash
codex mcp add Multi-CLI -- npx -y @osanoai/multicli@latest
```

<details>
<summary>Manual config (~/.codex/config.toml) or pass --mcp-config</summary>

```bash
codex --mcp-config mcp.json
```

Where `mcp.json` contains:

```json
{
  "mcpServers": {
    "Multi-CLI": {
      "command": "npx",
      "args": ["-y", "@osanoai/multicli@latest"]
    }
  }
}
```
</details>

---

### OpenCode

OpenCode's `mcp add` command is interactive, so add Multi-CLI to `~/.config/opencode/opencode.json` directly:

```json
{
  "mcp": {
    "Multi-CLI": {
      "type": "local",
      "command": ["npx", "-y", "@osanoai/multicli@latest"]
    }
  }
}
```

If the file already exists, merge the `"Multi-CLI"` entry into the existing `"mcp"` object.

---

### Copilot CLI (Backend Provider)

Install Copilot CLI to enable `Ask-Copilot` tools:

```bash
npm install -g @github/copilot
```

Copilot CLI currently runs as a backend provider in Multi-CLI tool calls. MCP server registration for Copilot as a host client is handled via its own ACP/programmatic modes, not `copilot mcp add`.

---

### Any Other MCP Client

Multi-CLI uses standard stdio transport. If your client supports MCP, point it at:

```
npx -y @osanoai/multicli@latest
```

---

## Available Tools

Once connected, your AI client gains access to tools for the *other* CLIs (never its own):

| Tool | Description |
|------|-------------|
| `List-Gemini-Models` | List available Gemini models and their strengths |
| `Ask-Gemini` | Ask-Gemini a question or give it a task |
| `Fetch-Chunk` | Retrieve chunked responses from Gemini |
| `Gemini-Help` | Get Gemini CLI help info |
| `List-Codex-Models` | List available Codex models |
| `Ask-Codex` | Ask-Codex a question or give it a task |
| `Codex-Help` | Get Codex CLI help info |
| `List-Claude-Models` | List available Claude models |
| `Ask-Claude` | Ask-Claude a question or give it a task |
| `Claude-Help` | Get Claude Code CLI help info |
| `List-OpenCode-Models` | List available OpenCode models from all configured providers |
| `Ask-OpenCode` | Ask-OpenCode a question or give it a task |
| `OpenCode-Help` | Get OpenCode CLI help info |
| `List-Copilot-Models` | Copilot model guidance + programmatic/ACP notes |
| `Ask-Copilot` | Ask-Copilot a question or give it a task (non-interactive by default) |
| `Copilot-Help` | Get Copilot CLI help info |

---

## Usage Examples

Once installed, just talk naturally to your AI:

```
"Ask-Gemini what it thinks about this architecture"
"Have Codex review this function for performance issues"
"Get Claude's opinion on this error message"
"Use OpenCode to get a second opinion from Llama"
```

Or get a second opinion on anything:

```
"I want three perspectives on how to refactor this module —
 ask Gemini and Codex what they'd do differently"
```

---

## How It Works

```
┌─────────────┐     MCP (stdio)      ┌──────────────┐     CLI calls    ┌─────────────┐
│  Your AI    │ ◄──────────────────► │  Multi-CLI   │ ───────────────► │ Other AIs   │
│  Client     │                      │   server     │                  │ (CLI tools) │
└─────────────┘                      └──────────────┘                  └─────────────┘

1. Your AI client connects to Multi-CLI via MCP
2. Multi-CLI detects which CLIs are installed on your system
3. It registers tools for the OTHER clients (hides tools for the calling client)
4. When a tool is called, Multi-CLI executes the corresponding CLI command
5. Results flow back through MCP to your AI client
```

---

## Troubleshooting

**"No usable AI CLIs detected"**
Make sure at least one other CLI is installed and on your PATH:
```bash
which gemini && which codex && which claude && which opencode && which copilot
```

**No tools showing up?**
If only your own CLI is installed, Multi-CLI hides it (no self-calls). Install a *different* CLI to enable cross-model collaboration.

**MCP server not responding?**
1. Check that Node.js >= 20 is installed
2. Run `npx @osanoai/multicli@latest` directly to see if it starts
3. Restart your AI client completely

**Need latency/inefficiency traces?**

Set one of these before starting Multi-CLI:

```bash
export MULTICLI_LOG_PATH=/tmp/multicli-telemetry.jsonl
# or:
export MULTICLI_LOG_STDERR=true
```

Each tool call emits JSONL telemetry (request id, provider, latency, status, token estimates, error).

**Need hard token/cost guardrails?**

Set these optional env vars before starting Multi-CLI:

```bash
# Prompt budget guard (default: truncate)
export MULTICLI_INPUT_BUDGET_MODE=truncate   # truncate | error | off
export MULTICLI_MAX_INPUT_TOKENS=8000

# Global command timeout (default: 300000ms)
export MULTICLI_COMMAND_TIMEOUT_MS=180000

# Low-cost defaults when model is omitted
export MULTICLI_DEFAULT_GEMINI_MODEL=gemini-2.5-flash-lite
export MULTICLI_DEFAULT_CLAUDE_MODEL=claude-haiku-4-5
export MULTICLI_DEFAULT_CODEX_MODEL=gpt-5.1-codex-mini
```

When enabled, Multi-CLI will cap oversized prompts and prefer cheaper default models unless a caller explicitly overrides the model.

---

## Development

```bash
git clone https://github.com/osanoai/multicli.git
cd multicli
npm install
npm run build
npm run dev
```
