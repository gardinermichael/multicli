import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/commandExecutor.js', () => ({
  executeCommand: vi.fn().mockResolvedValue('mock response'),
}));

vi.mock('../../src/utils/changeModeParser.js', () => ({
  parseChangeModeOutput: vi.fn().mockReturnValue([]),
  validateChangeModeEdits: vi.fn().mockReturnValue({ valid: true, errors: [] }),
}));

vi.mock('../../src/utils/changeModeTranslator.js', () => ({
  formatChangeModeResponse: vi.fn().mockReturnValue(''),
  summarizeChangeModeEdits: vi.fn().mockReturnValue(''),
}));

vi.mock('../../src/utils/changeModeChunker.js', () => ({
  chunkChangeModeEdits: vi.fn().mockReturnValue([]),
}));

vi.mock('../../src/utils/chunkCache.js', () => ({
  cacheChunks: vi.fn(),
  getChunks: vi.fn(),
}));

import { executeGeminiCLI } from '../../src/utils/geminiExecutor.js';
import { executeCommand } from '../../src/utils/commandExecutor.js';

describe('geminiExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds correct base args with model and prompt', async () => {
    await executeGeminiCLI('explain this code', 'gemini-2.5-pro');

    expect(executeCommand).toHaveBeenCalledWith(
      'gemini',
      ['-m', 'gemini-2.5-pro', 'explain this code'],
      undefined
    );
  });

  it('passes multi-word prompts without executor-level quoting', async () => {
    await executeGeminiCLI('Respond with a brief greeting confirming connectivity', 'gemini-2.5-pro');

    const args = vi.mocked(executeCommand).mock.calls[0][1];
    // Prompt should be a bare string — quoting is handled by sanitizeArgForCmd in executeCommand
    expect(args[2]).toBe('Respond with a brief greeting confirming connectivity');
  });

  it('passes @ prompts without executor-level quoting', async () => {
    await executeGeminiCLI('@src/index.ts explain this file', 'gemini-2.5-pro');

    const args = vi.mocked(executeCommand).mock.calls[0][1];
    // @ prompts must NOT be pre-wrapped in quotes — sanitizeArgForCmd handles quoting centrally
    expect(args[2]).toBe('@src/index.ts explain this file');
    expect(args[2]).not.toMatch(/^"/);
  });

  it('adds sandbox flag when enabled', async () => {
    await executeGeminiCLI('task', 'gemini-2.5-pro', true);

    const args = vi.mocked(executeCommand).mock.calls[0][1];
    expect(args).toContain('-s');
  });

  it('passes onProgress callback through', async () => {
    const onProgress = vi.fn();
    await executeGeminiCLI('task', 'gemini-2.5-pro', false, false, onProgress);

    expect(executeCommand).toHaveBeenCalledWith(
      'gemini',
      expect.any(Array),
      onProgress
    );
  });
});
