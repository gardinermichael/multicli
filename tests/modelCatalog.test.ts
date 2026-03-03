import { describe, it, expect } from 'vitest';
import { getCatalog, formatCatalog } from '../src/modelCatalog.js';

// ===========================================================================
// getCatalog
// ===========================================================================

describe('getCatalog', () => {
  const clis = ['gemini', 'codex', 'claude'] as const;

  it.each(clis)('should return a catalog with cli, tiers, and note for "%s"', (cli) => {
    const catalog = getCatalog(cli);

    expect(catalog).toBeDefined();
    expect(catalog.cli).toBe(cli);
    expect(catalog).toHaveProperty('tiers');
    expect(catalog).toHaveProperty('note');
    expect(typeof catalog.note).toBe('string');
  });

  it.each(clis)('should have exactly 3 tiers for "%s"', (cli) => {
    const catalog = getCatalog(cli);
    expect(catalog.tiers).toHaveLength(3);
  });

  it.each(clis)('should have tiers in order fast, balanced, powerful for "%s"', (cli) => {
    const catalog = getCatalog(cli);
    const tierNames = catalog.tiers.map(t => t.tier);
    expect(tierNames).toEqual(['fast', 'balanced', 'powerful']);
  });

  it.each(clis)('should have at least one model ID in every tier for "%s"', (cli) => {
    const catalog = getCatalog(cli);
    for (const tier of catalog.tiers) {
      expect(tier.models.length).toBeGreaterThanOrEqual(1);
      for (const model of tier.models) {
        expect(typeof model).toBe('string');
        expect(model.length).toBeGreaterThan(0);
      }
    }
  });

  it.each(clis)('should have non-empty useWhen for every tier in "%s"', (cli) => {
    const catalog = getCatalog(cli);
    for (const tier of catalog.tiers) {
      expect(tier.useWhen).toBeTruthy();
      expect(tier.useWhen.length).toBeGreaterThan(0);
    }
  });

  it.each(clis)('should include "DEFAULT" in the fast tier label for "%s"', (cli) => {
    const catalog = getCatalog(cli);
    const fastTier = catalog.tiers.find(t => t.tier === 'fast');
    expect(fastTier).toBeDefined();
    expect(fastTier!.label).toContain('DEFAULT');
  });
});

// ===========================================================================
// formatCatalog
// ===========================================================================

describe('formatCatalog', () => {
  const clis = ['gemini', 'codex', 'claude'] as const;

  it.each(clis)('should include all model IDs from the catalog for "%s"', (cli) => {
    const catalog = getCatalog(cli);
    const formatted = formatCatalog(cli);

    for (const tier of catalog.tiers) {
      for (const modelId of tier.models) {
        expect(formatted).toContain(modelId);
      }
    }
  });

  it.each(clis)('should include "MODEL SELECTION RULE" text for "%s"', (cli) => {
    const formatted = formatCatalog(cli);
    expect(formatted).toContain('MODEL SELECTION RULE');
  });

  it.each(clis)('should include tier labels [FAST], [BALANCED], [POWERFUL] for "%s"', (cli) => {
    const formatted = formatCatalog(cli);
    expect(formatted).toContain('[FAST]');
    expect(formatted).toContain('[BALANCED]');
    expect(formatted).toContain('[POWERFUL]');
  });
});
