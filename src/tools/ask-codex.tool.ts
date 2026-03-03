import { z } from 'zod';
import { UnifiedTool } from './registry.js';
import { executeCodexCLI } from '../utils/codexExecutor.js';
import { ERROR_MESSAGES, STATUS_MESSAGES } from '../constants.js';

const askCodexArgsSchema = z.object({
  prompt: z.string().min(1).describe("The question or task for Codex. REQUIRED — MUST be a non-empty string, empty strings will be rejected."),
  model: z.string().min(1).describe("REQUIRED — you MUST first call List Codex Models, review the available model families and their strengths, then select the best model for your task's scope and complexity. It's the law. Empty strings will be rejected."),
  sandbox: z.enum(['read-only', 'workspace-write', 'danger-full-access']).optional().describe("Optional. Do NOT set unless explicitly needed. Sandbox mode: 'read-only' (safe), 'workspace-write' (default), or 'danger-full-access' (unrestricted)."),
  approvalPolicy: z.enum(['never', 'on-request', 'on-failure', 'untrusted']).optional().describe("Optional. Do NOT set unless explicitly needed. Approval policy: 'never', 'on-request' (default), 'on-failure', or 'untrusted'."),
});

export const askCodexTool: UnifiedTool = {
  name: "Ask Codex",
  description: "Ask OpenAI Codex a question or give it a task. You MUST call List Codex Models first to review available models and select one appropriate for your task — it's the law. Passing an empty model string will fail. Do NOT set optional parameters unless you have a specific reason.",
  zodSchema: askCodexArgsSchema,
  prompt: {
    description: "Execute 'codex exec <prompt> --full-auto' to get Codex's response.",
  },
  category: 'codex',
  execute: async (args, onProgress) => {
    const { prompt, model, sandbox, approvalPolicy } = args;

    if (!prompt?.trim()) {
      throw new Error(ERROR_MESSAGES.NO_PROMPT_PROVIDED);
    }

    const result = await executeCodexCLI(
      prompt as string,
      model as string,
      sandbox as string | undefined,
      approvalPolicy as string | undefined,
      onProgress
    );

    return `${STATUS_MESSAGES.CODEX_RESPONSE}\n${result}`;
  }
};
