import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/commandExecutor.js', () => ({
  executeCommand: vi.fn().mockResolvedValue('mock response'),
}));

import { executeCodexCLI } from '../../src/utils/codexExecutor.js';
import { executeCommand } from '../../src/utils/commandExecutor.js';

describe('codexExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds correct base args', async () => {
    await executeCodexCLI('fix this bug', 'gpt-5.2-codex');

    expect(executeCommand).toHaveBeenCalledWith(
      'codex',
      [
        'exec', 'fix this bug',
        '--full-auto',
        '--skip-git-repo-check',
        '--color', 'never',
        '-m', 'gpt-5.2-codex',
      ],
      undefined
    );
  });

  it('adds -s sandbox when provided', async () => {
    await executeCodexCLI('task', 'gpt-5.2-codex', 'read-only');

    const args = vi.mocked(executeCommand).mock.calls[0][1];
    expect(args).toContain('-s');
    expect(args).toContain('read-only');
  });

  it('adds -a approvalPolicy when provided', async () => {
    await executeCodexCLI('task', 'gpt-5.2-codex', undefined, 'never');

    const args = vi.mocked(executeCommand).mock.calls[0][1];
    expect(args).toContain('-a');
    expect(args).toContain('never');
  });

  it('includes both sandbox and approvalPolicy when both provided', async () => {
    await executeCodexCLI('task', 'gpt-5.2-codex', 'workspace-write', 'on-failure');

    const args = vi.mocked(executeCommand).mock.calls[0][1];
    expect(args).toContain('-s');
    expect(args).toContain('workspace-write');
    expect(args).toContain('-a');
    expect(args).toContain('on-failure');
  });

  it('passes onProgress callback through', async () => {
    const onProgress = vi.fn();
    await executeCodexCLI('task', 'gpt-5.2-codex', undefined, undefined, onProgress);

    expect(executeCommand).toHaveBeenCalledWith(
      'codex',
      expect.any(Array),
      onProgress
    );
  });
});
