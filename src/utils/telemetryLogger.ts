import { appendFileSync } from 'node:fs';

export interface TelemetryEvent {
  timestamp: string;
  request_id: string;
  client: string;
  provider: string;
  tool_name: string;
  status: 'success' | 'error';
  latency_ms: number;
  bottleneck: 'provider_latency' | 'schema_parsing' | 'validation' | 'unknown';
  context_tokens_sent: number;
  context_tokens_received: number;
  retry_count: number;
  cache_hit: boolean;
  model?: string;
  error?: string;
}

function estimateTokens(text: string | undefined): number {
  if (!text) return 0;
  // Rough approximation good enough for latency/cost trend analysis.
  return Math.ceil(text.length / 4);
}

export function getContextTokensSent(args: Record<string, unknown>): number {
  const prompt = typeof args.prompt === 'string' ? args.prompt : '';
  return estimateTokens(prompt);
}

export function writeTelemetryEvent(event: TelemetryEvent): void {
  const line = `${JSON.stringify(event)}\n`;
  const logPath = process.env.MULTICLI_LOG_PATH;
  const logToStderr = process.env.MULTICLI_LOG_STDERR === 'true';

  try {
    if (logPath) {
      appendFileSync(logPath, line, { encoding: 'utf-8' });
    }
    if (logToStderr) {
      process.stderr.write(line);
    }
  } catch {
    // Telemetry must never break normal tool execution.
  }
}
