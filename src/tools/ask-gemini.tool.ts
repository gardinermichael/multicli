import { z } from 'zod';
import { UnifiedTool } from './registry.js';
import { executeGeminiCLI, processChangeModeOutput } from '../utils/geminiExecutor.js';
import { 
  ERROR_MESSAGES, 
  STATUS_MESSAGES
} from '../constants.js';
import { applyPromptBudget, resolveModel } from '../utils/costGuard.js';

const askGeminiArgsSchema = z.object({
  prompt: z.string().min(1).describe("The question or task for Gemini. REQUIRED — MUST be a non-empty string. Gemini has filesystem access — use @ syntax to reference files (e.g., '@src/index.ts review this'). Do NOT pre-read or inline file contents — just describe the task and reference files with @."),
  model: z.string().optional().describe("Optional. Model override. If omitted, Multi-CLI uses a low-cost default model (configurable via MULTICLI_DEFAULT_GEMINI_MODEL)."),
  sandbox: z.boolean().default(false).describe("Optional. Do NOT set unless explicitly needed. Run in sandbox mode (-s flag) for safely testing code changes in an isolated environment. Defaults to false."),
  changeMode: z.boolean().default(false).describe("Optional. Do NOT set unless explicitly needed. Return structured edit suggestions instead of plain text. Defaults to false."),
  chunkIndex: z.union([z.number(), z.string()]).optional().describe("Internal — do NOT set unless you received a chunked changeMode response. Which chunk to return (1-based)."),
  chunkCacheKey: z.string().optional().describe("Internal — do NOT set unless you received a chunked changeMode response. Cache key from a prior response for fetching subsequent chunks."),
});

export const askGeminiTool: UnifiedTool = {
  name: "Ask-Gemini",
  description: "Ask Google Gemini a question or give it a task. Gemini has filesystem access via @ syntax — do NOT pre-gather context or inline file contents into the prompt. Just describe what you need and use @file references. You MUST call List-Gemini-Models first to select an appropriate model. Do NOT set optional parameters unless you have a specific reason.",
  zodSchema: askGeminiArgsSchema,
  prompt: {
    description: "Execute 'gemini <prompt>' to get Gemini AI's response. Supports enhanced change mode for structured edit suggestions.",
  },
  category: 'gemini',
  execute: async (args, onProgress) => {
    const { prompt, model, sandbox, changeMode, chunkIndex, chunkCacheKey } = args; if (!prompt?.trim()) { throw new Error(ERROR_MESSAGES.NO_PROMPT_PROVIDED); }
    const selectedModel = resolveModel('gemini', model as string | undefined);
    const guardedPrompt = applyPromptBudget(prompt as string);
  
    if (changeMode && chunkIndex && chunkCacheKey) {
      return processChangeModeOutput(
        '', // empty for cache...
        chunkIndex as number,
        chunkCacheKey as string,
        guardedPrompt.prompt
      );
    }
    
    const result = await executeGeminiCLI(
      guardedPrompt.prompt,
      selectedModel,
      !!sandbox,
      !!changeMode,
      onProgress
    );
    
    if (changeMode) {
      return processChangeModeOutput(
        result,
        args.chunkIndex as number | undefined,
        undefined,
        guardedPrompt.prompt
      );
    }
    const budgetNote = guardedPrompt.wasTruncated && guardedPrompt.note ? `${guardedPrompt.note}\n` : '';
    return `${STATUS_MESSAGES.GEMINI_RESPONSE}\n${budgetNote}${result}`; // changeMode false
  }
};
