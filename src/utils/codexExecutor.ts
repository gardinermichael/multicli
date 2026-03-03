import { executeCommand } from './commandExecutor.js';
import { CLI } from '../constants.js';

export async function executeCodexCLI(
  prompt: string,
  model: string,
  sandbox?: string,
  approvalPolicy?: string,
  onProgress?: (newOutput: string) => void
): Promise<string> {
  const args: string[] = [
    CLI.SUBCOMMANDS.EXEC, prompt,
    CLI.CODEX_FLAGS.FULL_AUTO,
    CLI.CODEX_FLAGS.SKIP_GIT_CHECK,
    CLI.CODEX_FLAGS.COLOR, "never",
    CLI.CODEX_FLAGS.MODEL, model,
  ];

  if (sandbox) {
    args.push(CLI.CODEX_FLAGS.SANDBOX, sandbox);
  }

  if (approvalPolicy) {
    args.push(CLI.CODEX_FLAGS.APPROVAL, approvalPolicy);
  }

  return executeCommand(CLI.COMMANDS.CODEX, args, onProgress);
}
