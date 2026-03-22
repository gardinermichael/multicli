import { executeCommand } from './commandExecutor.js';
import { CLI } from '../constants.js';

export async function executeCopilotCLI(
  prompt: string,
  model: string | undefined,
  addDirs: string[] | undefined,
  allowAllPaths: boolean | undefined,
  onProgress?: (newOutput: string) => void
): Promise<string> {
  const args: string[] = [
    CLI.COPILOT_FLAGS.PROMPT, prompt,
    CLI.COPILOT_FLAGS.NO_ASK_USER,
    CLI.COPILOT_FLAGS.ALLOW_ALL_TOOLS,
    CLI.COPILOT_FLAGS.SILENT,
  ];

  if (model?.trim()) {
    args.push(CLI.COPILOT_FLAGS.MODEL, model);
  }

  if (allowAllPaths) {
    args.push(CLI.COPILOT_FLAGS.ALLOW_ALL_PATHS);
  }

  if (Array.isArray(addDirs)) {
    for (const dir of addDirs) {
      if (dir?.trim()) {
        args.push(CLI.COPILOT_FLAGS.ADD_DIR, dir);
      }
    }
  }

  return executeCommand(CLI.COMMANDS.COPILOT, args, onProgress);
}
