#!/usr/bin/env node
/**
 * Layer-specific coverage threshold checker
 * Validates that each architectural layer meets its coverage targets
 * as defined in PLANS.md MVP-TEST-02
 *
 * Set environment variable COVERAGE_STRICT=true to enforce strict thresholds (Phase 2)
 * Default (MVP): Warning mode - reports gaps but doesn't fail
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const coveragePath = resolve('./coverage/coverage-final.json');
const strictMode = process.env.COVERAGE_STRICT === 'true';
let coverage;

try {
  coverage = JSON.parse(readFileSync(coveragePath, 'utf8'));
} catch (_error) {
  console.error('❌ Could not read coverage file. Run `pnpm test:coverage` first.');
  process.exit(1);
}

// Layer definitions with target thresholds from PLANS.md
const layers = {
  domain: {
    pattern: /src\/lib\/domain/,
    lines: 0,
    total: 0,
    target: 100,
    description: 'Domain Layer (entities, value objects, services)',
  },
  application: {
    pattern: /src\/lib\/use-cases/,
    lines: 0,
    total: 0,
    target: 90,
    description: 'Application Layer (use cases)',
  },
  presentation: {
    pattern: /src\/components/,
    lines: 0,
    total: 0,
    target: 60,
    description: 'Presentation Layer (UI components)',
  },
};

// Calculate coverage per layer
for (const [file, data] of Object.entries(coverage)) {
  for (const [_layerName, layer] of Object.entries(layers)) {
    if (layer.pattern.test(file)) {
      const { s, statementMap } = data;
      const totalStatements = Object.keys(statementMap).length;
      const coveredStatements = Object.values(s).filter((count) => count > 0).length;

      layer.lines += coveredStatements;
      layer.total += totalStatements;
    }
  }
}

// Report results
console.log('\n📊 Layer-Specific Coverage Report\n');
console.log('─'.repeat(70));

let failed = false;
for (const [layerName, layer] of Object.entries(layers)) {
  const coverage = layer.total > 0 ? ((layer.lines / layer.total) * 100).toFixed(2) : 0;
  const status = coverage >= layer.target ? '✓' : '✗';
  const statusColor = coverage >= layer.target ? '\x1b[32m' : '\x1b[31m'; // Green or Red
  const resetColor = '\x1b[0m';

  console.log(
    `${statusColor}${status}${resetColor} ${layerName.padEnd(15)} ${coverage.padStart(6)}% ` +
      `(target: ${layer.target}%) - ${layer.description}`,
  );

  if (coverage < layer.target) {
    failed = true;
  }
}

console.log('─'.repeat(70));

if (failed) {
  if (strictMode) {
    console.log('\n❌ Some layers are below their coverage targets.');
    console.log('   Run `pnpm test:coverage` to see detailed coverage report.\n');
    process.exit(1);
  } else {
    console.log('\n⚠️  Some layers are below Phase 2 targets (currently in MVP mode).');
    console.log('   These gaps are tracked in PLANS.md and will be addressed in Phase 2.');
    console.log('   Set COVERAGE_STRICT=true to enforce strict thresholds.\n');
    process.exit(0);
  }
} else {
  console.log('\n✅ All layers meet their coverage targets!\n');
  process.exit(0);
}
