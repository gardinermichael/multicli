import { z } from 'zod';
import { UnifiedTool } from './registry.js';
import { executeClaudeCLI } from '../utils/claudeExecutor.js';
import { ERROR_MESSAGES, STATUS_MESSAGES } from '../constants.js';
import { applyPromptBudget, resolveModel } from '../utils/costGuard.js';

const askClaudeArgsSchema = z.object({
  prompt: z.string().min(1).describe("The question or task for Claude Code. REQUIRED — MUST be a non-empty string. Claude Code has FULL access to the filesystem and can read files itself. Do NOT pre-read or inline file contents — just describe the task and let Claude explore the codebase."),
  model: z.string().optional().describe("Optional. Model override. If omitted, Multi-CLI uses a low-cost default model (configurable via MULTICLI_DEFAULT_CLAUDE_MODEL)."),
  permissionMode: z.enum(['default', 'acceptEdits', 'bypassPermissions', 'dontAsk', 'plan']).optional().describe("Optional. Do NOT set unless explicitly needed. Permission mode: 'default' (requires approval), 'acceptEdits' (auto-accepts file edits), 'bypassPermissions' (skips all checks — use with care), 'dontAsk', or 'plan'."),
  maxBudgetUsd: z.number().positive().optional().describe("Optional. Do NOT set unless explicitly needed. Maximum dollar amount to spend on API calls for this request."),
  systemPrompt: z.string().optional().describe("Optional. Do NOT set unless explicitly needed. Override or append a system prompt for this request."),
});

export const askClaudeTool: UnifiedTool = {
  name: "Ask-Claude",
  description: "Ask Claude Code a question or give it a task. Claude Code has full filesystem access and will read files itself — do NOT pre-gather context or inline file contents into the prompt. Just describe what you need. You MUST call List-Claude-Models first to select an appropriate model. Do NOT set optional parameters unless you have a specific reason.",
  zodSchema: askClaudeArgsSchema,
  prompt: {
    description: "Execute 'claude --print <prompt>' to get Claude Code's response.",
  },
  category: 'claude',
  execute: async (args, onProgress) => {
    const { prompt, model, permissionMode, maxBudgetUsd, systemPrompt } = args;

    if (!prompt?.trim()) {
      throw new Error(ERROR_MESSAGES.NO_PROMPT_PROVIDED);
    }

    const selectedModel = resolveModel('claude', model as string | undefined);
    const guardedPrompt = applyPromptBudget(prompt as string);

    const result = await executeClaudeCLI(
      guardedPrompt.prompt,
      selectedModel,
      permissionMode as string | undefined,
      maxBudgetUsd as number | undefined,
      systemPrompt as string | undefined,
      onProgress
    );

    const budgetNote = guardedPrompt.wasTruncated && guardedPrompt.note ? `${guardedPrompt.note}\n` : '';
    return `${STATUS_MESSAGES.CLAUDE_RESPONSE}\n${budgetNote}${result}`;
  }
};
