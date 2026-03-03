import { executeCommand } from './commandExecutor.js';
import { CLI } from '../constants.js';

export async function executeClaudeCLI(
  prompt: string,
  model: string,
  permissionMode?: string,
  maxBudgetUsd?: number,
  systemPrompt?: string,
  onProgress?: (newOutput: string) => void
): Promise<string> {
  const args: string[] = [
    CLI.CLAUDE_FLAGS.PRINT,
    CLI.CLAUDE_FLAGS.OUTPUT_FORMAT, "text",
    CLI.CLAUDE_FLAGS.MODEL, model,
    prompt,
  ];

  if (permissionMode) {
    args.push(CLI.CLAUDE_FLAGS.PERMISSION_MODE, permissionMode);
  }

  if (maxBudgetUsd !== undefined) {
    args.push(CLI.CLAUDE_FLAGS.MAX_BUDGET, String(maxBudgetUsd));
  }

  if (systemPrompt) {
    args.push(CLI.CLAUDE_FLAGS.SYSTEM_PROMPT, systemPrompt);
  }

  return executeCommand(CLI.COMMANDS.CLAUDE, args, onProgress);
}
