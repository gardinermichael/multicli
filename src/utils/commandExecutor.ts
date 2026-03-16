import { spawn } from "child_process";

// Detect Windows platform for shell compatibility
const isWindows = process.platform === "win32";

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
  return new Promise((resolve, reject) => {
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

    if (timeoutMs && timeoutMs > 0) {
      timer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          childProcess.kill('SIGTERM');
          reject(new Error(`Command timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);
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


    // CLI level errors
    childProcess.stderr.on("data", (data) => {
      if (isResolved) return;
      stderr += data.toString();
      // find RESOURCE_EXHAUSTED when gemini quota is exceeded
      if (stderr.includes("RESOURCE_EXHAUSTED")) {
        // Quota error details are captured in stderr and propagated via reject
      }
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
          reject(
            new Error(`Command failed with exit code ${code}: ${errorMessage}`),
          );
        }
      }
    });
  });
}