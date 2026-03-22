import { z } from 'zod';
import { UnifiedTool } from './registry.js';
import { executeCopilotCLI } from '../utils/copilotExecutor.js';
import { ERROR_MESSAGES, STATUS_MESSAGES } from '../constants.js';
import { applyPromptBudget, resolveModel } from '../utils/costGuard.js';

const askCopilotArgsSchema = z.object({
  prompt: z.string().min(1).describe("The question or task for Copilot CLI. REQUIRED — MUST be a non-empty string. Copilot can read/write files and run shell commands when permitted, so describe the task and target paths clearly."),
  model: z.string().optional().describe("Optional. Copilot model override (for example: 'gpt-5'). Leave unset unless you specifically need a model choice."),
  addDirs: z.array(z.string()).optional().describe("Optional. Additional directories Copilot should be allowed to access. Maps to repeated --add-dir flags."),
  allowAllPaths: z.boolean().default(false).describe("Optional. Do NOT set unless explicitly needed. Disable path verification with --allow-all-paths."),
});

export const askCopilotTool: UnifiedTool = {
  name: "Ask-Copilot",
  description: "Ask GitHub Copilot CLI a question or give it a task. Runs in non-interactive mode ('-p') with '--no-ask-user' and '--allow-all-tools' by default for automation-friendly behavior. Use addDirs/allowAllPaths when path access needs to extend beyond the default project boundary.",
  zodSchema: askCopilotArgsSchema,
  prompt: {
    description: "Execute 'copilot -p <prompt> --no-ask-user --allow-all-tools -s' to get Copilot's response.",
  },
  category: 'copilot',
  execute: async (args, onProgress) => {
    const { prompt, model, addDirs, allowAllPaths } = args;

    if (!prompt?.trim()) {
      throw new Error(ERROR_MESSAGES.NO_PROMPT_PROVIDED);
    }

    const selectedModel = resolveModel('copilot', model as string | undefined) || undefined;
    const guardedPrompt = applyPromptBudget(prompt as string);

    const result = await executeCopilotCLI(
      guardedPrompt.prompt,
      selectedModel,
      addDirs as string[] | undefined,
      !!allowAllPaths,
      onProgress
    );

    const budgetNote = guardedPrompt.wasTruncated && guardedPrompt.note ? `${guardedPrompt.note}\n` : '';
    return `${STATUS_MESSAGES.COPILOT_RESPONSE}\n${budgetNote}${result}`;
  }
};
