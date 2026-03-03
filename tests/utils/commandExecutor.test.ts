import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';

vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

import { executeCommand } from '../../src/utils/commandExecutor.js';

function createMockProcess() {
  const proc = {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    on: vi.fn(),
  };
  // Wire up event handlers
  const handlers: Record<string, Function> = {};
  proc.on.mockImplementation((event: string, handler: Function) => {
    handlers[event] = handler;
    return proc;
  });

  return {
    proc,
    emitStdout(data: string) {
      proc.stdout.emit('data', Buffer.from(data));
    },
    emitStderr(data: string) {
      proc.stderr.emit('data', Buffer.from(data));
    },
    emitClose(code: number) {
      handlers['close']?.(code);
    },
    emitError(err: Error) {
      handlers['error']?.(err);
    },
  };
}

describe('commandExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves with trimmed stdout on exit code 0', async () => {
    const mock = createMockProcess();
    vi.mocked(spawn).mockReturnValue(mock.proc as any);

    const promise = executeCommand('echo', ['hello']);
    mock.emitStdout('  hello world  \n');
    mock.emitClose(0);

    const result = await promise;
    expect(result).toBe('hello world');
  });

  it('rejects with stderr message on non-zero exit code', async () => {
    const mock = createMockProcess();
    vi.mocked(spawn).mockReturnValue(mock.proc as any);

    const promise = executeCommand('bad', ['cmd']);
    mock.emitStderr('something went wrong');
    mock.emitClose(1);

    await expect(promise).rejects.toThrow('exit code 1: something went wrong');
  });

  it('rejects with "Unknown error" when stderr is empty on failure', async () => {
    const mock = createMockProcess();
    vi.mocked(spawn).mockReturnValue(mock.proc as any);

    const promise = executeCommand('bad', []);
    mock.emitClose(1);

    await expect(promise).rejects.toThrow('Unknown error');
  });

  it('rejects on spawn error', async () => {
    const mock = createMockProcess();
    vi.mocked(spawn).mockReturnValue(mock.proc as any);

    const promise = executeCommand('nonexistent', []);
    mock.emitError(new Error('ENOENT'));

    await expect(promise).rejects.toThrow('Failed to spawn command: ENOENT');
  });

  it('calls onProgress with incremental stdout data', async () => {
    const mock = createMockProcess();
    vi.mocked(spawn).mockReturnValue(mock.proc as any);
    const progressCalls: string[] = [];

    const promise = executeCommand('cmd', [], (newOutput) => {
      progressCalls.push(newOutput);
    });

    mock.emitStdout('chunk1');
    mock.emitStdout('chunk2');
    mock.emitStdout('chunk3');
    mock.emitClose(0);

    await promise;
    expect(progressCalls).toEqual(['chunk1', 'chunk2', 'chunk3']);
  });

  it('settles only once when error fires before close', async () => {
    const mock = createMockProcess();
    vi.mocked(spawn).mockReturnValue(mock.proc as any);

    const promise = executeCommand('cmd', []);
    mock.emitError(new Error('spawn failed'));
    // Close after error should not cause double rejection
    mock.emitClose(1);

    await expect(promise).rejects.toThrow('Failed to spawn command');
  });
});
