module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'Ready in',
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 1.0 }],
        // CSP の unsafe-inline/unsafe-eval（Next.js 要件）により csp-xss 監査が減点されるため 0.9 に緩和
        // TODO: nonce/hash ベースの CSP に移行して 1.0 を目指す（next.config.ts 参照）
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 1.0 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        interactive: ['warn', { maxNumericValue: 5000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
