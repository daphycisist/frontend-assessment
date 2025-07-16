#!/usr/bin/env node
/*
  Compare two Lighthouse JSON reports and print percentage deltas.
  Usage: node compare-lh.js before.json after.json
*/
const fs = require('fs');

if (process.argv.length < 4) {
  console.error('Usage: node compare-lh.js <before.json> <after.json>');
  process.exit(1);
}

const before = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const after = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));

const metrics = {
  'performance.score': (r) => r.categories.performance.score * 100,
  'interactive(ms)': (r) => r.audits.interactive.numericValue,
  'total-blocking-time(ms)': (r) => r.audits['total-blocking-time'].numericValue,
  'first-contentful-paint(ms)': (r) => r.audits['first-contentful-paint'].numericValue,
};

console.log('Metric'.padEnd(35), 'Before'.padStart(10), 'After'.padStart(10), 'Δ'.padStart(10));
console.log('-'.repeat(65));

for (const [label, fn] of Object.entries(metrics)) {
  const beforeVal = fn(before);
  const afterVal = fn(after);
  const delta = ((beforeVal - afterVal) / beforeVal) * 100;
  console.log(
    label.padEnd(35),
    beforeVal.toFixed(1).padStart(10),
    afterVal.toFixed(1).padStart(10),
    `${delta.toFixed(1)} %`.padStart(10),
  );
}
