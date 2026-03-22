import { spawn } from "child_process";

// Detect Windows platform for shell compatibility
const isWindows = process.platform === "win32";

function parseEnvInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableErrorMessage(message: string): boolean {
  const m = message.toLowerCase();

  // Permanent/logic failures should not be retried.
  if (
    m.includes("invalid arguments") ||
    m.includes("unknown tool") ||
    m.includes("resource_exhausted")
  ) {
    return false;
  }

  return (
    m.includes("timed out") ||
    m.includes("etimedout") ||
    m.includes("econnreset") ||
    m.includes("econnrefused") ||
    m.includes("eai_again") ||
    m.includes("enotfound") ||
    m.includes("socket hang up") ||
    m.includes("temporarily unavailable") ||
    m.includes("rate limit") ||
    m.includes("429")
  );
}

/**
 * Format a single argument for safe use with cmd.exe (shell: true on Windows).
 * Ensures the argument survives cmd.exe parsing as one argv entry.
 *
 * Rules:
 * - Empty strings → `""` (otherwise lost entirely)
 * - Args with whitespace or quotes → wrapped in double quotes
 *   - Inside quotes: `"` → `""`, `%` → `%%`
 *   - Trailing backslashes doubled (prevents `\"` escaping the closing quote)
 *   - Shell operators (&|<>^) are literal inside quotes — no caret needed
 * - Args without whitespace or quotes → unquoted
 *   - `%` → `%%`, shell operators get caret-escaped
 */
export function sanitizeArgForCmd(arg: string): string {
  if (arg === '') return '""';

  // Newlines act as command separators in cmd.exe even inside double quotes.
  // Replace with spaces to preserve word boundaries safely.
  const sanitized = arg.replace(/[\r\n]+/g, ' ');

  const needsQuotes = /[\s"]/.test(sanitized);

  if (needsQuotes) {
    // Inside double quotes: only % and " need escaping.
    // Shell operators (&|<>^) are treated as literals by cmd.exe inside quotes.
    // Trailing backslashes must be doubled so they don't escape the closing quote
    // in the target process's CommandLineToArgvW parser.
    const escaped = sanitized
      .replace(/%/g, '%%')
      .replace(/"/g, '""')
      .replace(/\\+$/, m => m + m);
    return `"${escaped}"`;
  } else {
    // Unquoted: escape % and caret-escape shell operators (including parentheses)
    return sanitized
      .replace(/%/g, '%%')
      .replace(/[&|<>^()]/g, c => `^${c}`);
  }
}

export async function executeCommand(
  command: string,
  args: string[],
  onProgress?: (newOutput: string) => void,
  timeoutMs?: number,
): Promise<string> {
  const maxAttempts = Math.max(1, parseEnvInt("MULTICLI_RETRY_MAX_ATTEMPTS", 2));
  const initialDelayMs = parseEnvInt("MULTICLI_RETRY_INITIAL_DELAY_MS", 300);
  const jitterMs = parseEnvInt("MULTICLI_RETRY_JITTER_MS", 150);
  const effectiveTimeoutMs = timeoutMs ?? parseEnvInt("MULTICLI_COMMAND_TIMEOUT_MS", 300000);

  const runOnce = () =>
    new Promise<string>((resolve, reject) => {
      // Use shell: true on Windows to properly execute .cmd files and resolve PATH.
      // Sanitize args to prevent cmd.exe metacharacter injection.
      const safeArgs = isWindows ? args.map(sanitizeArgForCmd) : args;
      const childProcess = spawn(command, safeArgs, {
        env: process.env,
        shell: isWindows,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let isResolved = false;
      let lastReportedLength = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;

      if (effectiveTimeoutMs && effectiveTimeoutMs > 0) {
        timer = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            childProcess.kill('SIGTERM');
            reject(new Error(`Command timed out after ${effectiveTimeoutMs}ms`));
          }
        }, effectiveTimeoutMs);
      }

      childProcess.stdout.on("data", (data) => {
        if (isResolved) return;
        stdout += data.toString();

        // Report new content if callback provided
        if (onProgress && stdout.length > lastReportedLength) {
          const newContent = stdout.substring(lastReportedLength);
          lastReportedLength = stdout.length;
          onProgress(newContent);
        }
      });

      childProcess.stderr.on("data", (data) => {
        if (isResolved) return;
        stderr += data.toString();
      });

      childProcess.on("error", (error) => {
        if (!isResolved) {
          isResolved = true;
          if (timer) clearTimeout(timer);
          reject(new Error(`Failed to spawn command: ${error.message}`));
        }
      });

      childProcess.on("close", (code) => {
        if (!isResolved) {
          isResolved = true;
          if (timer) clearTimeout(timer);
          if (code === 0) {
            const output = stdout.trim();
            if (output || !stderr.trim()) {
              resolve(output);
            } else {
              // Some CLIs (e.g. OpenCode) exit 0 but write errors only to stderr.
              // Surface the error instead of silently returning an empty string.
              reject(new Error(`Command produced no output. stderr: ${stderr.trim()}`));
            }
          } else {
            const errorMessage = stderr.trim() || "Unknown error";
            reject(new Error(`Command failed with exit code ${code}: ${errorMessage}`));
          }
        }
      });
    });

  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      return await runOnce();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const canRetry = attempt < maxAttempts && isRetryableErrorMessage(message);
      if (!canRetry) {
        throw error;
      }

      const base = initialDelayMs * Math.pow(2, attempt - 1);
      const jitter = jitterMs > 0 ? Math.floor(Math.random() * (jitterMs + 1)) : 0;
      const delay = base + jitter;
      await sleep(delay);
    }
  }

  throw new Error("Command failed after retry attempts");
}
