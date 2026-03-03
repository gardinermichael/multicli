export interface ModelFamily {
  family: string;
  description: string;
  knownModels: string[];
  recommended: string;
}

export interface CLICatalog {
  cli: 'gemini' | 'codex' | 'claude';
  families: ModelFamily[];
  note: string;
}

const GEMINI_CATALOG: CLICatalog = {
  cli: 'gemini',
  families: [
    {
      family: 'pro',
      description: 'Deep thinking, highly capable. Best for complex analysis, reasoning, and large codebase understanding.',
      knownModels: ['gemini-3.1-pro-preview', 'gemini-2.5-pro'],
      recommended: 'gemini-3.1-pro-preview',
    },
    {
      family: 'flash',
      description: 'Fast and capable. Good for quick tasks, summaries, and straightforward code generation. Not ideal for deep reasoning or nuanced opinions.',
      knownModels: ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'],
      recommended: 'gemini-3-flash-preview',
    },
  ],
  note: 'Run Gemini Help for the latest CLI options. Model IDs may change as Google releases new versions.',
};

const CODEX_CATALOG: CLICatalog = {
  cli: 'codex',
  families: [
    {
      family: 'codex',
      description: 'Coding specialist. Optimized for code generation, debugging, refactoring, and software engineering tasks.',
      knownModels: ['gpt-5.3-codex', 'gpt-5.2-codex', 'gpt-5.1-codex-max', 'gpt-5.1-codex-mini'],
      recommended: 'gpt-5.3-codex',
    },
    {
      family: 'gpt',
      description: 'General thinking and chat. Strong at reasoning, planning, analysis, and non-coding tasks.',
      knownModels: ['gpt-5.2'],
      recommended: 'gpt-5.2',
    },
  ],
  note: 'Run Codex Help for the latest CLI options. Model IDs may change as OpenAI releases new versions.',
};

const CLAUDE_CATALOG: CLICatalog = {
  cli: 'claude',
  families: [
    {
      family: 'opus',
      description: 'Most capable. Complex reasoning, nuanced analysis, and difficult multi-step tasks.',
      knownModels: ['claude-opus-4-6'],
      recommended: 'claude-opus-4-6',
    },
    {
      family: 'sonnet',
      description: 'Balanced execution and research. Strong at code, analysis, and following detailed instructions.',
      knownModels: ['claude-sonnet-4-6'],
      recommended: 'claude-sonnet-4-6',
    },
    {
      family: 'haiku',
      description: 'Fast and efficient. Best for simple, high-volume tasks where speed matters more than depth.',
      knownModels: ['claude-haiku-4-5-20251001'],
      recommended: 'claude-haiku-4-5-20251001',
    },
  ],
  note: 'Run Claude Help for the latest CLI options. Accepts aliases (opus, sonnet, haiku) or full model IDs.',
};

const CATALOGS: Record<string, CLICatalog> = {
  gemini: GEMINI_CATALOG,
  codex: CODEX_CATALOG,
  claude: CLAUDE_CATALOG,
};

export function getCatalog(cli: 'gemini' | 'codex' | 'claude'): CLICatalog {
  return CATALOGS[cli];
}

export function formatCatalog(cli: 'gemini' | 'codex' | 'claude'): string {
  const catalog = CATALOGS[cli];
  const lines: string[] = [`${catalog.cli.toUpperCase()} — Available Models\n`];

  for (const family of catalog.families) {
    lines.push(`${family.family} family`);
    lines.push(family.description);
    lines.push(`  Recommended: ${family.recommended}`);
    lines.push(`  Known IDs: ${family.knownModels.join(', ')}`);
    lines.push('');
  }

  lines.push(`> ${catalog.note}`);
  return lines.join('\n');
}
