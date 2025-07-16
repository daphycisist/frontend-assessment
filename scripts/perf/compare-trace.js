#!/usr/bin/env node
/*
  Very light-weight comparison of two Chrome DevTools performance traces (.json).
  Reports total duration and average FPS (based on frameCommitted events).
  Usage: node compare-trace.js before.json after.json
*/
const fs = require('fs');

if (process.argv.length < 4) {
  console.error('Usage: node compare-trace.js <before.json> <after.json>');
  process.exit(1);
}

function analyseTrace(path) {
  const trace = JSON.parse(fs.readFileSync(path, 'utf8'));
  const events = trace.traceEvents || trace; // DevTools or perfetto style

  const navigate = events.find((e) => e.name === 'TracingStartedInPage');
  const startTs = navigate ? navigate.ts : events[0].ts;
  const endTs = events[events.length - 1].ts;
  const durationMs = (endTs - startTs) / 1000;

  const frames = events.filter(
    (e) => e.name === 'DrawFrame' || e.name === 'FrameCommittedInBrowser',
  );
  const fps = frames.length / (durationMs / 1000);

  return { durationMs, frames: frames.length, fps };
}

function print(label, data) {
  console.log(
    label.padEnd(15),
    `${data.durationMs.toFixed(0)} ms`.padStart(10),
    `${data.fps.toFixed(1)} fps`.padStart(12),
  );
}

const before = analyseTrace(process.argv[2]);
const after = analyseTrace(process.argv[3]);

console.log('Trace'.padEnd(15), 'Duration'.padStart(10), 'Avg FPS'.padStart(12));
console.log('-'.repeat(40));
print('Before', before);
print('After', after);
