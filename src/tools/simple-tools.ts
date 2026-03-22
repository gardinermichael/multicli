import { z } from 'zod';
import { UnifiedTool } from './registry.js';
import { executeCommand } from '../utils/commandExecutor.js';
import { formatCatalog } from '../modelCatalog.js';
import { getOpencodeClassifiedCatalog } from '../utils/opencodeCatalog.js';

const helpArgsSchema = z.object({});

export const geminiHelpTool: UnifiedTool = {
  name: "Gemini-Help",
  description: "Receive help information from the Gemini CLI",
  zodSchema: helpArgsSchema,
  prompt: {
    description: "Receive help information from the Gemini CLI",
  },
  category: 'gemini',
  execute: async (args, onProgress) => {
    return executeCommand("gemini", ["-help"], onProgress);
  }
};

export const codexHelpTool: UnifiedTool = {
  name: "Codex-Help",
  description: "Receive help information from the Codex CLI",
  zodSchema: helpArgsSchema,
  prompt: {
    description: "Receive help information from the Codex CLI",
  },
  category: 'codex',
  execute: async (args, onProgress) => {
    return executeCommand("codex", ["--help"], onProgress);
  }
};

export const claudeHelpTool: UnifiedTool = {
  name: "Claude-Help",
  description: "Receive help information from the Claude Code CLI",
  zodSchema: helpArgsSchema,
  prompt: {
    description: "Receive help information from the Claude Code CLI",
  },
  category: 'claude',
  execute: async (args, onProgress) => {
    return executeCommand("claude", ["--help"], onProgress);
  }
};

const noArgsSchema = z.object({});
const copilotModelsInfo = [
  "COPILOT — Model Guidance",
  "",
  "MODEL SELECTION RULE: default to a balanced model for most tasks, reserve frontier models for high-stakes reasoning, and use fast models for trivial work.",
  "",
  "[FAST]",
  "  Use when: Quick lookups, lightweight summaries, small repetitive edits.",
  "  Representative model IDs: claude-haiku-4.5, gemini-3-flash, gpt-5-mini",
  "",
  "[BALANCED]",
  "  Use when: Most coding tasks, debugging loops, multi-step implementation.",
  "  Representative model IDs: claude-sonnet-4.6, gpt-5.2, gpt-5.3-codex",
  "",
  "[POWERFUL]",
  "  Use when: Architecture, deep debugging, high-risk changes, nuanced review.",
  "  Representative model IDs: gpt-5.4, gemini-3.1-pro, claude-opus-4.6",
  "",
  "Programmatic mode notes:",
  "  - Use '-p' for non-interactive execution.",
  "  - Use '--no-ask-user' for autonomous runs.",
  "  - Use '--allow-all-tools' (or explicit '--allow-tool') to avoid permission prompts in automation.",
  "  - For path errors, use '--add-dir <path>' or '--allow-all-paths' only when explicitly intended.",
  "",
  "ACP mode notes:",
  "  - Copilot can run as an ACP server via '--acp --stdio'.",
  "  - ACP transport is stdin/stdout NDJSON; client SDK integration is supported.",
  "",
  "How to get exact model strings in your current environment:",
  "  - Run: copilot help",
  "  - Docs state model strings are listed in the '--model' option description and can vary by account/policy.",
  "",
  "References:",
  "  - https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference",
  "  - https://docs.github.com/en/copilot/reference/copilot-cli-reference/acp-server",
  "  - https://docs.github.com/en/copilot/reference/ai-models/model-comparison",
].join('\\n');

export const geminiListModelsTool: UnifiedTool = {
  name: "List-Gemini-Models",
  description: "List available Gemini model families, their strengths, and known model IDs. You MUST call this before Ask-Gemini to choose the right model for your task. It's the law.",
  zodSchema: noArgsSchema,
  prompt: {
    description: "List available Gemini models with family descriptions",
  },
  category: 'gemini',
  execute: async () => {
    return formatCatalog('gemini');
  }
};

export const codexListModelsTool: UnifiedTool = {
  name: "List-Codex-Models",
  description: "List available Codex model families, their strengths, and known model IDs. You MUST call this before Ask-Codex to choose the right model for your task. It's the law.",
  zodSchema: noArgsSchema,
  prompt: {
    description: "List available Codex models with family descriptions",
  },
  category: 'codex',
  execute: async () => {
    return formatCatalog('codex');
  }
};

export const claudeListModelsTool: UnifiedTool = {
  name: "List-Claude-Models",
  description: "List available Claude model families, their strengths, and known model IDs. You MUST call this before Ask-Claude to choose the right model for your task. It's the law.",
  zodSchema: noArgsSchema,
  prompt: {
    description: "List available Claude models with family descriptions",
  },
  category: 'claude',
  execute: async () => {
    return formatCatalog('claude');
  }
};

export const opencodeHelpTool: UnifiedTool = {
  name: "OpenCode-Help",
  description: "Receive help information from the OpenCode CLI",
  zodSchema: helpArgsSchema,
  prompt: {
    description: "Receive help information from the OpenCode CLI",
  },
  category: 'opencode',
  execute: async (args, onProgress) => {
    return executeCommand("opencode", ["--help"], onProgress);
  }
};

export const copilotHelpTool: UnifiedTool = {
  name: "Copilot-Help",
  description: "Receive help information from the GitHub Copilot CLI",
  zodSchema: helpArgsSchema,
  prompt: {
    description: "Receive help information from the GitHub Copilot CLI",
  },
  category: 'copilot',
  execute: async (args, onProgress) => {
    return executeCommand("copilot", ["--help"], onProgress);
  }
};

export const opencodeListModelsTool: UnifiedTool = {
  name: "List-OpenCode-Models",
  description: "List available OpenCode models from all configured providers, classified into tiers. You MUST call this before Ask-OpenCode to choose the right model for your task. Models are dynamically discovered from your providers.",
  zodSchema: noArgsSchema,
  prompt: {
    description: "List available OpenCode models with tier classifications",
  },
  category: 'opencode',
  execute: async () => {
    return getOpencodeClassifiedCatalog();
  }
};

export const copilotListModelsTool: UnifiedTool = {
  name: "List-Copilot-Models",
  description: "List Copilot model guidance and automation-safe usage patterns. Includes representative model IDs from GitHub model-comparison docs and explains how to obtain exact currently available model strings via 'copilot help'.",
  zodSchema: noArgsSchema,
  prompt: {
    description: "List Copilot model guidance, programmatic mode flags, ACP mode notes, and source links.",
  },
  category: 'copilot',
  execute: async () => {
    return copilotModelsInfo;
  }
};
