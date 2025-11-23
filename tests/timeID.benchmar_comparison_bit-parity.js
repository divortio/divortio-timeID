import Benchmark from 'benchmark';
import { timeIDr } from '../src/timeID.js';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { styleText } from 'node:util';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

// --- Configuration ---
// Target Entropy: ~126 bits (matches NanoID default)
// 21 chars * 6 bits/char = 126 bits
const PARITY_LENGTH = 21;

function getSystemInfo() {
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : 'Unknown CPU';
    const memTotalGB = (os.totalmem() / (1024 ** 3)).toFixed(2);

    return {
        cpu: cpuModel,
        cores: cpus.length,
        speed: cpus.length > 0 ? `${cpus[0].speed} MHz` : 'N/A',
        arch: os.arch(),
        platform: os.type(),
        release: os.release(),
        totalMem: `${memTotalGB} GB`,
        nodeVersion: process.version,
        v8Version: process.versions.v8
    };
}

const fmt = (num) => new Intl.NumberFormat('en-US').format(Math.round(num));
const suite = new Benchmark.Suite;

console.log(styleText('bold', `\n⚖️  Starting Bit-Parity Shootout (~126 bits entropy)...\n` + '='.repeat(60)));

// 1. TimeID (High Entropy Mode)
suite.add(`timeIDr (21 random chars)`, function() {
    // 8 chars time + 21 chars random = 29 chars total
    timeIDr.newID(undefined, PARITY_LENGTH);
})

    // 2. NanoID (Default)
    .add(`nanoid (21 random chars)`, function() {
        nanoid(); // Default is 21 chars (126 bits)
    })

    // 3. UUID v4 (Standard)
    .add(`uuid v4 (122 bits)`, function() {
        uuidv4();
    })

    // --- Event Handlers ---
    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    .on('complete', function() {
        const results = this;

        console.log('\n' + '='.repeat(60));
        console.log(styleText('green', '🏆 Fastest is ' + this.filter('fastest').map('name')));

        const timeIDBench = this.filter(b => b.name.includes('timeIDr'))[0];
        const timeIDHz = timeIDBench ? timeIDBench.hz : 0;

        // Sort results by speed
        const sortedBenches = this.map(b => b).sort((a, b) => b.hz - a.hz);

        const tableRows = sortedBenches.map(bench => {
            const opsSec = Math.round(bench.hz);
            const rme = bench.stats.rme.toFixed(2);

            let relative = "N/A";
            if (timeIDHz > 0) {
                const percent = ((bench.hz - timeIDHz) / timeIDHz) * 100;
                const sign = percent > 0 ? '+' : '';
                relative = `${sign}${percent.toFixed(1)}%`;
                if (bench.name.includes('timeIDr')) relative = "-";
            }

            return `| ${bench.name.padEnd(25)} | **${fmt(opsSec)}** | ±${rme}% | ${relative} |`;
        });

        const sys = getSystemInfo();
        const timestamp = new Date().toISOString();

        const markdown = `
# TimeID Bit-Parity Benchmark

**Date:** ${timestamp}
**Goal:** Compare generation speed when entropy is normalized to ~122-126 bits.

## 1. Environment
* **CPU:** ${sys.cpu} (${sys.cores} cores)
* **Node.js:** ${sys.nodeVersion} (V8 ${sys.v8Version})
* **OS:** ${sys.platform} ${sys.release}

## 2. Parity Configuration
* **UUID v4:** 122 bits (Standard)
* **NanoID:** 126 bits (21 chars @ 6 bits/char)
* **TimeIDr:** 126 bits Randomness (21 chars) + 48 bits Time

## 3. Results

| Library | Ops/Sec | Margin of Error | Vs timeIDr (Parity) |
| :--- | :--- | :--- | :--- |
${tableRows.join('\n')}

---
*Generated automatically by timeID.benchmark_comparison_bit-parity.js*
`;

        console.log(styleText('bold', '\n📝 Generated Markdown Report:'));
        console.log(markdown);

        const args = process.argv.slice(2);
        const shouldSave = args.includes('--save') || args.includes('-s');

        if (shouldSave) {
            const filename = `timeID-parity_${timestamp}.md`;
            const absPath = path.resolve(process.cwd(), filename);
            fs.writeFileSync(absPath, markdown.trim());
            console.log(styleText('green', `\n✅ Report saved to: ${absPath}`));
        }
    })
    .run({ 'async': true });