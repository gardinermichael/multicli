#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

PACKAGE="@osanoai/multicli@latest"
SERVER_NAME="Multi-CLI"
MULTICLI_BIN="${MULTICLI_BIN:-}"

if [ -n "$MULTICLI_BIN" ]; then
  if [ ! -f "$MULTICLI_BIN" ]; then
    echo -e "${RED}${BOLD}ERROR: Multi-CLI binary not found at $MULTICLI_BIN${RESET}" >&2
    echo "Run 'npm run build' first, or set MULTICLI_BIN to a valid dist/index.js path." >&2
    exit 1
  fi
  if command -v realpath >/dev/null 2>&1; then
    MULTICLI_BIN="$(realpath "$MULTICLI_BIN")"
  fi
fi

if [ -n "$MULTICLI_BIN" ]; then
  MCP_STDIO_DESC="node $MULTICLI_BIN"
  CLAUDE_MCP_ARGS=(-- node "$MULTICLI_BIN")
  GEMINI_MCP_ARGS=(node "$MULTICLI_BIN")
  CODEX_MCP_ARGS=(-- node "$MULTICLI_BIN")
  OPENCODE_MCP_ENTRY=$(printf '{"type":"local","command":["node","%s"]}' "$MULTICLI_BIN")
else
  MCP_STDIO_DESC="npx -y $PACKAGE"
  CLAUDE_MCP_ARGS=(-- npx -y "$PACKAGE")
  GEMINI_MCP_ARGS=(npx -y "$PACKAGE")
  CODEX_MCP_ARGS=(-- npx -y "$PACKAGE")
  OPENCODE_MCP_ENTRY=$(printf '{"type":"local","command":["npx","-y","%s"]}' "$PACKAGE")
fi

echo ""
echo -e "${CYAN}${BOLD}  Multi-CLI MCP Installer${RESET}"
echo -e "${CYAN}  Bridging Claude, Gemini, Codex, OpenCode, and Copilot${RESET}"
echo ""

# Detect available CLIs
CLAUDE_FOUND=false
GEMINI_FOUND=false
CODEX_FOUND=false
OPENCODE_FOUND=false
COPILOT_FOUND=false

command -v claude   &>/dev/null && CLAUDE_FOUND=true
command -v gemini   &>/dev/null && GEMINI_FOUND=true
command -v codex    &>/dev/null && CODEX_FOUND=true
command -v opencode &>/dev/null && OPENCODE_FOUND=true
command -v copilot  &>/dev/null && COPILOT_FOUND=true

CLIENT_COUNT=0
FOUND_COUNT=0
$CLAUDE_FOUND   && ((FOUND_COUNT++)) || true
$GEMINI_FOUND   && ((FOUND_COUNT++)) || true
$CODEX_FOUND    && ((FOUND_COUNT++)) || true
$OPENCODE_FOUND && ((FOUND_COUNT++)) || true
$COPILOT_FOUND  && ((FOUND_COUNT++)) || true

$CLAUDE_FOUND   && ((CLIENT_COUNT++)) || true
$GEMINI_FOUND   && ((CLIENT_COUNT++)) || true
$CODEX_FOUND    && ((CLIENT_COUNT++)) || true
$OPENCODE_FOUND && ((CLIENT_COUNT++)) || true

# Bail if nothing is installed
if [ "$FOUND_COUNT" -eq 0 ]; then
  echo -e "${RED}${BOLD}Error: No supported AI CLIs found on your PATH.${RESET}"
  echo ""
  echo "Multi-CLI requires at least one of the following to be installed:"
  echo "  • Claude Code  →  npm install -g @anthropic-ai/claude-code"
  echo "  • Gemini CLI   →  npm install -g @google/gemini-cli"
  echo "  • Codex CLI    →  npm install -g @openai/codex"
  echo "  • OpenCode     →  curl -fsSL https://opencode.ai/install | bash"
  echo "  • Copilot CLI  →  npm install -g @github/copilot"
  echo ""
  echo "Install at least two for the full multi-model experience, then re-run this script."
  echo ""
  exit 1
fi

if [ "$CLIENT_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}${BOLD}Detected Copilot CLI, but no supported MCP host CLI was found.${RESET}"
  echo ""
  echo "Copilot is supported as a backend provider, but this installer can only register MCP servers for:"
  echo "  • Claude Code"
  echo "  • Gemini CLI"
  echo "  • Codex CLI"
  echo "  • OpenCode"
  echo ""
  echo "Install one of those CLIs, then rerun this installer."
  echo ""
  exit 1
fi

# Install for each detected CLI
INSTALLED=()
FAILED=()

if $CLAUDE_FOUND; then
  echo -e "  ${CYAN}→ Installing for Claude Code...${RESET}"
  claude mcp remove --scope user "$SERVER_NAME" >/dev/null 2>&1 || true
  if claude mcp add --scope user "$SERVER_NAME" "${CLAUDE_MCP_ARGS[@]}" 2>/dev/null; then
    INSTALLED+=("Claude Code")
  else
    FAILED+=("Claude Code")
  fi
fi

if $GEMINI_FOUND; then
  echo -e "  ${CYAN}→ Installing for Gemini CLI...${RESET}"
  gemini mcp remove --scope user "$SERVER_NAME" >/dev/null 2>&1 || true
  if gemini mcp add --scope user "$SERVER_NAME" "${GEMINI_MCP_ARGS[@]}" 2>/dev/null; then
    INSTALLED+=("Gemini CLI")
  else
    FAILED+=("Gemini CLI")
  fi
fi

if $CODEX_FOUND; then
  echo -e "  ${CYAN}→ Installing for Codex CLI...${RESET}"
  codex mcp remove "$SERVER_NAME" >/dev/null 2>&1 || true
  if codex mcp add "$SERVER_NAME" "${CODEX_MCP_ARGS[@]}" 2>/dev/null; then
    INSTALLED+=("Codex CLI")
  else
    FAILED+=("Codex CLI")
  fi
fi

if $OPENCODE_FOUND; then
  echo -e "  ${CYAN}→ Installing for OpenCode...${RESET}"
  OPENCODE_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
  OPENCODE_CONFIG="$OPENCODE_CONFIG_DIR/opencode.json"
  mkdir -p "$OPENCODE_CONFIG_DIR"

  if [ -f "$OPENCODE_CONFIG" ]; then
    # Config exists — merge our MCP server into it using node (already required)
    if node -e "
      const fs = require('fs');
      const cfg = JSON.parse(fs.readFileSync('$OPENCODE_CONFIG', 'utf-8'));
      cfg.mcp = cfg.mcp || {};
      cfg.mcp['$SERVER_NAME'] = $OPENCODE_MCP_ENTRY;
      fs.writeFileSync('$OPENCODE_CONFIG', JSON.stringify(cfg, null, 2) + '\n');
    " 2>/dev/null; then
      INSTALLED+=("OpenCode")
    else
      FAILED+=("OpenCode")
    fi
  else
    # No config — create one
    if printf '{\n  "mcp": {\n    "%s": %s\n  }\n}\n' "$SERVER_NAME" "$OPENCODE_MCP_ENTRY" > "$OPENCODE_CONFIG" 2>/dev/null; then
      INSTALLED+=("OpenCode")
    else
      FAILED+=("OpenCode")
    fi
  fi
fi

if $COPILOT_FOUND; then
  echo -e "  ${CYAN}→ Copilot CLI detected (backend provider for Ask-Copilot tools).${RESET}"
fi

echo ""

# Verify the install did not leave behind an old hardcoded path in live config files.
echo -e "  ${CYAN}→ Verifying config paths...${RESET}"
STALE_PATHS="$(
  grep -H 'Devs/multicli' \
    "$HOME/.claude.json" \
    "$HOME/.codex/config.toml" \
    "$HOME/.gemini/settings.json" \
    "$HOME/.config/opencode/opencode.json" \
    2>/dev/null || true
)"
if [ -n "$STALE_PATHS" ]; then
  echo -e "${RED}${BOLD}ERROR: stale /Devs/multicli path found in live config.${RESET}" >&2
  echo "$STALE_PATHS" >&2
  echo "Fix the path and rerun install.sh." >&2
  exit 1
fi
echo -e "  ${GREEN}Path check PASSED — no stale paths found.${RESET}"
echo ""

# Report failures
if [ "${#FAILED[@]}" -gt 0 ]; then
  echo -e "${YELLOW}${BOLD}  Warning: installation failed for:${RESET}"
  for cli in "${FAILED[@]}"; do
    echo -e "  ${YELLOW}• $cli${RESET}"
  done
  echo ""
fi

# Nothing installed
if [ "${#INSTALLED[@]}" -eq 0 ]; then
  echo -e "${RED}${BOLD}  Installation failed for all detected CLIs.${RESET}"
  echo "  Try running the install commands manually — see the README for details."
  echo ""
  exit 1
fi

# Success — warn if only one CLI was found (Multi-CLI needs multi)
if [ "$FOUND_COUNT" -eq 1 ]; then
  echo -e "${GREEN}${BOLD}  Installed for: ${INSTALLED[0]}${RESET}"
  echo ""
  echo -e "${YELLOW}${BOLD}  ⚠  Warning: only one AI CLI detected.${RESET}"
  echo -e "${YELLOW}  Multi-CLI is a collaboration tool — it bridges multiple AIs together.${RESET}"
  echo -e "${YELLOW}  With only ${INSTALLED[0]} installed, there's nothing to bridge to.${RESET}"
  echo ""
  echo "  Install at least one more CLI to unlock cross-model collaboration:"
  $CLAUDE_FOUND   || echo "    • Claude Code  →  npm install -g @anthropic-ai/claude-code"
  $GEMINI_FOUND   || echo "    • Gemini CLI   →  npm install -g @google/gemini-cli"
  $CODEX_FOUND    || echo "    • Codex CLI    →  npm install -g @openai/codex"
  $OPENCODE_FOUND || echo "    • OpenCode     →  curl -fsSL https://opencode.ai/install | bash"
  $COPILOT_FOUND  || echo "    • Copilot CLI  →  npm install -g @github/copilot"
  echo ""
else
  echo -e "${GREEN}${BOLD}  Multi-CLI installed successfully!${RESET}"
  echo ""
  echo -e "  Installed for:"
  for cli in "${INSTALLED[@]}"; do
    echo -e "  ${GREEN}  ✓ $cli${RESET}"
  done
  if $COPILOT_FOUND; then
    echo -e "  ${GREEN}  ✓ Copilot CLI detected (Ask-Copilot backend enabled)${RESET}"
  fi
  echo ""
  echo -e "  Registered command: ${GREEN}${MCP_STDIO_DESC}${RESET}"
  echo ""
  echo -e "  Restart your AI client and the cross-model tools will appear automatically."
  echo -e "  No config. No API keys. No setup. Just works."
  echo ""
fi
