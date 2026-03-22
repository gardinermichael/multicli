import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/commandExecutor.js', () => ({
  executeCommand: vi.fn(),
}));

import { executeCopilotCLI } from '../../src/utils/copilotExecutor.js';
import { executeCommand } from '../../src/utils/commandExecutor.js';

describe('copilotExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls copilot in non-interactive mode with model', async () => {
    vi.mocked(executeCommand).mockResolvedValue('response text');

    const result = await executeCopilotCLI('explain this code', 'gpt-5.2', undefined, false);

    expect(executeCommand).toHaveBeenCalledWith(
      'copilot',
      ['-p', 'explain this code', '--no-ask-user', '--allow-all-tools', '-s', '--model', 'gpt-5.2'],
      undefined,
    );
    expect(result).toBe('response text');
  });

  it('adds add-dir and allow-all-paths flags when requested', async () => {
    vi.mocked(executeCommand).mockResolvedValue('done');

    await executeCopilotCLI(
      'scan both repos',
      undefined,
      ['/Users/m/Devs', '/Users/m/Repos'],
      true,
    );

    expect(executeCommand).toHaveBeenCalledWith(
      'copilot',
      [
        '-p', 'scan both repos',
        '--no-ask-user',
        '--allow-all-tools',
        '-s',
        '--allow-all-paths',
        '--add-dir', '/Users/m/Devs',
        '--add-dir', '/Users/m/Repos',
      ],
      undefined,
    );
  });

  it('passes onProgress callback through', async () => {
    vi.mocked(executeCommand).mockResolvedValue('done');
    const onProgress = vi.fn();

    await executeCopilotCLI('test prompt', undefined, undefined, false, onProgress);

    expect(executeCommand).toHaveBeenCalledWith(
      'copilot',
      ['-p', 'test prompt', '--no-ask-user', '--allow-all-tools', '-s'],
      onProgress,
    );
  });
});
