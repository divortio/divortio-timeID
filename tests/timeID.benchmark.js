import { timeID, timeIDr } from '../src/timeID.js';
import { styleText } from 'node:util';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

// --- Configuration ---
const DURATION_MS = 1000;
const WARMUP_ITERATIONS = 15000;

/**
 * Gather System Information (Cross-Platform, Zero-Dependency)
 */
function getSystemInfo() {
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : 'Unknown CPU';
    const cores = cpus.length;
    const speed = cpus.length > 0 ? cpus[0].speed : 0;
    const memTotalGB = (os.totalmem() / (1024 ** 3)).toFixed(2);

    return {
        cpu: cpuModel,
        cores: cores,
        speed: `${speed} MHz`,
        arch: os.arch(),
        platform: os.type(),
        release: os.release(),
        totalMem: `${memTotalGB} GB`,
        nodeVersion: process.version,
        v8Version: process.versions.v8
    };
}

/**
 * Format numbers for display
 */
const fmt = (num) => new Intl.NumberFormat('en-US').format(Math.round(num));
const fmtFloat = (num) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

/**
 * The Benchmark Runner
 * Includes Dead Code Elimination (DCE) prevention.
 */
function runBench(label, fn) {
    process.stdout.write(`Running: ${styleText('cyan', label)}... `);

    // 1. Warmup
    for (let i = 0; i < WARMUP_ITERATIONS; i++) fn();

    // 2. Measure
    const start = performance.now();
    let iterations = 0;
    let elapsed = 0;

    // DCE Prevention Accumulator
    let dummy = 0;

    while (elapsed < DURATION_MS) {
        // Unroll loop for lower overhead
        let r;
        r = fn(); dummy += (r ? 1 : 0);
        r = fn(); dummy += (r ? 1 : 0);
        r = fn(); dummy += (r ? 1 : 0);
        r = fn(); dummy += (r ? 1 : 0);
        r = fn(); dummy += (r ? 1 : 0);

        r = fn(); dummy += (r ? 1 : 0);
        r = fn(); dummy += (r ? 1 : 0);
        r = fn(); dummy += (r ? 1 : 0);
        r = fn(); dummy += (r ? 1 : 0);
        r = fn(); dummy += (r ? 1 : 0);

        iterations += 10;
        elapsed = performance.now() - start;
    }

    // Prevent dummy optimization
    if (dummy === -1) process.stdout.write('');

    const opsPerSec = (iterations / elapsed) * 1000;
    const nsPerOp = (elapsed / iterations) * 1_000_000;

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    console.log(
        `${styleText('green', '✔')} ${label.padEnd(35)} ` +
        `${styleText('yellow', fmt(opsPerSec).padStart(12))} ops/sec ` +
        `${styleText('gray', `(${fmtFloat(nsPerOp)} ns/op)`)}`
    );

    return { name: label, opsSec: opsPerSec, nsOp: nsPerOp };
}

// --- Main Execution ---

console.log(styleText('bold', '\n🚀 TimeID Performance Benchmark\n' + '='.repeat(60)));

const results = [];

// 1. Core Encoding
console.log(styleText('bold', '\n1. Core Encoding'));
results.push(runBench('encodeTime (Math Only)', () => timeID.encodeTime(1731451200000)));

// 2. Generation
console.log(styleText('bold', '\n2. ID Generation'));
results.push(runBench('TimeIDr.newID (String)', () => timeIDr.newID()));
results.push(runBench('TimeIDr.newTimeIDr (Object)', () => timeIDr.newTimeIDr()));

// 3. Decoding
console.log(styleText('bold', '\n3. Decoding'));
const SAMPLE_ID = timeIDr.newID();
results.push(runBench('TimeID.decodeID (Time Only)', () => timeID.decodeID(SAMPLE_ID.substring(0, 8))));
results.push(runBench('TimeIDr.decodeID (Full)', () => timeIDr.decodeID(SAMPLE_ID)));


// --- Report Generation ---

const sys = getSystemInfo();
const now = new Date();
const timestampISO = now.toISOString();

const markdown = `
# TimeID Benchmark Report

**Date:** ${timestampISO}

## 1. Environment

| Component | Details |
| :--- | :--- |
| **CPU Model** | ${sys.cpu} |
| **Cores / Threads** | ${sys.cores} |
| **Clock Speed** | ${sys.speed} |
| **Architecture** | ${sys.arch} |
| **Memory (RAM)** | ${sys.totalMem} |
| **OS Platform** | ${sys.platform} (${sys.release}) |
| **Node.js Version** | ${sys.nodeVersion} |
| **V8 Engine** | ${sys.v8Version} |

## 2. Benchmark Results

| Benchmark Test | Operations / Sec | Latency (ns/op) |
| :--- | :--- | :--- |
${results.map(r => `| ${r.name} | **${fmt(r.opsSec)}** | ${fmtFloat(r.nsOp)} |`).join('\n')}

---
*Generated automatically by benchmark.js*
`;

console.log('\n' + '='.repeat(60));
console.log(styleText('bold', '📝 Generated Markdown Report:'));
console.log(markdown);

// --- File Saving Logic ---
const args = process.argv.slice(2);
const shouldSave = args.includes('--save') || args.includes('-s');

if (shouldSave) {
    const filename = `timeID-benchmark_${timestampISO}.md`;
    // We use process.cwd() to ensure it saves where the user is running the command
    const absPath = path.resolve(process.cwd(), filename);

    try {
        fs.writeFileSync(absPath, markdown.trim());
        console.log(styleText('green', `\n✅ Report saved to: ${absPath}`));
    } catch (err) {
        console.error(styleText('red', `\n❌ Failed to save report: ${err.message}`));
    }
} else {
    console.log(styleText('gray', '\n(To save this report to a file, run: node tests/timeID.benchmark.js --save)'));
}