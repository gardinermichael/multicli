type Provider = 'gemini' | 'claude' | 'codex' | 'opencode' | 'copilot';

function parseEnvInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseMode(name: string, fallback: 'truncate' | 'error' | 'off'): 'truncate' | 'error' | 'off' {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === 'truncate' || raw === 'error' || raw === 'off') return raw;
  return fallback;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function resolveModel(provider: Provider, requestedModel?: string): string {
  const requested = requestedModel?.trim();
  if (requested) return requested;

  switch (provider) {
    case 'gemini':
      return process.env.MULTICLI_DEFAULT_GEMINI_MODEL?.trim() || 'gemini-2.5-flash-lite';
    case 'claude':
      return process.env.MULTICLI_DEFAULT_CLAUDE_MODEL?.trim() || 'claude-haiku-4-5';
    case 'codex':
      return process.env.MULTICLI_DEFAULT_CODEX_MODEL?.trim() || 'gpt-5.1-codex-mini';
    case 'opencode':
      return process.env.MULTICLI_DEFAULT_OPENCODE_MODEL?.trim() || 'google-vertex/gemini-2.5-flash';
    case 'copilot':
      return process.env.MULTICLI_DEFAULT_COPILOT_MODEL?.trim() || '';
    default:
      return requested || '';
  }
}

export interface PromptBudgetResult {
  prompt: string;
  estimatedTokens: number;
  wasTruncated: boolean;
  note?: string;
}

export function applyPromptBudget(prompt: string): PromptBudgetResult {
  const mode = parseMode('MULTICLI_INPUT_BUDGET_MODE', 'truncate');
  const maxTokens = parseEnvInt('MULTICLI_MAX_INPUT_TOKENS', 8000);
  const estimated = estimateTokens(prompt);

  if (mode === 'off' || estimated <= maxTokens) {
    return {
      prompt,
      estimatedTokens: estimated,
      wasTruncated: false,
    };
  }

  if (mode === 'error') {
    throw new Error(
      `Input exceeds MULTICLI_MAX_INPUT_TOKENS (${estimated} > ${maxTokens}). ` +
      `Set MULTICLI_INPUT_BUDGET_MODE=truncate to auto-truncate or off to disable guard.`
    );
  }

  const maxChars = Math.max(256, maxTokens * 4);
  const truncatedPrompt = prompt.slice(0, maxChars);
  return {
    prompt: truncatedPrompt,
    estimatedTokens: estimated,
    wasTruncated: true,
    note:
      `Multi-CLI budget guard truncated prompt from ~${estimated} to ~${estimateTokens(truncatedPrompt)} tokens ` +
      `(MULTICLI_MAX_INPUT_TOKENS=${maxTokens}).`,
  };
}
