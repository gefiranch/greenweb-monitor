// Synthetic data used only in automated tests, never in the production UI.
export function pageSpeedFixture() {
  return {
    lighthouseResult: {
      finalUrl: 'https://example.com/', fetchTime: '2026-11-06T08:00:00.000Z',
      configSettings: { formFactor: 'mobile' },
      categories: { performance: { score: 0.94 } },
      audits: {
        'total-byte-weight': { numericValue: 1000000, numericUnit: 'byte', score: 1 },
        'unused-javascript': { score: 0.4, displayValue: 'Potential savings of 80 KiB', details: { overallSavingsBytes: 81920 } },
      },
    },
  };
}
