import Benchmark from 'benchmark';
import { timeIDr } from '../src/timeID.js';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { ulid } from 'ulid';
import { randomUUID, getRandomValues } from 'node:crypto';
import { createId as cuid2 } from '@paralleldrive/cuid2';
import KSUID from 'ksuid';
import { uid } from 'uid';
import { styleText } from 'node:util';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

// --- Metadata Configuration ---
const LIBRARIES = [
    {
        id: 'baseline_math',
        name: 'Math.random() [Baseline]',
        fn: () => Math.random(),
        entropy: 'N/A',
        uniqueness: 'N/A'
    },
    {
        id: 'baseline_crypto',
        name: 'crypto.getRandomValues()',
        fn: () => getRandomValues(new Uint8Array(16)),
        entropy: 'N/A',
        uniqueness: 'N/A'
    },
    {
        id: 'native_uuid',
        name: 'crypto.randomUUID (C++)',
        fn: () => randomUUID(),
        entropy: '122 bits',
        uniqueness: '122 bits'
    },
    {
        id: 'uid',
        name: 'uid (Pure JS)',
        fn: () => uid(),
        entropy: '~44 bits',
        uniqueness: '~44 bits'
    },
    {
        id: 'nanoid',
        name: 'nanoid (Pure JS)',
        fn: () => nanoid(),
        entropy: '126 bits',
        uniqueness: '126 bits'
    },
    {
        id: 'uuid',
        name: 'uuid v4 (Pure JS)',
        fn: () => uuidv4(),
        entropy: '122 bits',
        uniqueness: '122 bits'
    },
    {
        id: 'cuid2',
        name: 'cuid2 (Pure JS)',
        fn: () => cuid2(),
        entropy: '~96+ bits',
        uniqueness: '~96+ bits'
    },
    {
        id: 'ulid',
        name: 'ulid (Pure JS)',
        fn: () => ulid(),
        entropy: '80 bits',
        uniqueness: '128 bits'
    },
    {
        id: 'ksuid',
        name: 'ksuid (Pure JS)',
        fn: () => KSUID.randomSync().string,
        entropy: '128 bits',
        uniqueness: '160 bits'
    },
    // --- TimeID Configurations ---
    {
        id: 'timeid_default',
        name: 'timeIDr (Default - 12)',
        fn: () => timeIDr.newID(),
        entropy: '72 bits',
        uniqueness: '120 bits' // 48 time + 72 random
    },
    {
        id: 'timeid_unique',
        name: 'timeIDr (Unique Parity - 13)',
        fn: () => timeIDr.newID(undefined, 13),
        entropy: '78 bits',
        uniqueness: '126 bits' // Matches NanoID Total Uniqueness
    },
    {
        id: 'timeid_parity',
        name: 'timeIDr (Bit Parity - 21)',
        fn: () => timeIDr.newID(undefined, 21),
        entropy: '126 bits', // Matches NanoID Entropy
        uniqueness: '174 bits'
    }
];

// --- System Information Helper ---
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

console.log(styleText('bold', '\n🚀 Starting The "God" Comparison Benchmark...\n' + '='.repeat(60)));

const suite = new Benchmark.Suite;

// Add all tests to suite
LIBRARIES.forEach(lib => {
    suite.add(lib.name, lib.fn);
});

// --- Execute ---
suite.on('cycle', function(event) {
    console.log(String(event.target));
})
    .on('complete', function() {
        console.log('\n' + '='.repeat(60));
        console.log(styleText('green', '🏆 Fastest is ' + this.filter('fastest').map('name')));

        // Find TimeID Default for baseline comparison
        const timeIDBench = this.filter(b => b.name.includes('(Default - 12)'))[0];
        const timeIDHz = timeIDBench ? timeIDBench.hz : 0;

        // Sort by Speed
        const sortedBenches = this.map(b => b).sort((a, b) => b.hz - a.hz);

        const tableRows = sortedBenches.map(bench => {
            const libConfig = LIBRARIES.find(l => l.name === bench.name);
            const opsSec = Math.round(bench.hz);
            const rme = bench.stats.rme.toFixed(2);

            let relative = "N/A";
            if (timeIDHz > 0) {
                const percent = ((bench.hz - timeIDHz) / timeIDHz) * 100;
                const sign = percent > 0 ? '+' : '';
                relative = `${sign}${percent.toFixed(1)}%`;
                if (bench.name === timeIDBench.name) relative = "-";
            }

            return `| ${bench.name.padEnd(30)} | **${fmt(opsSec)}** | ±${rme}% | ${libConfig.entropy} | ${libConfig.uniqueness} | ${relative} |`;
        });

        // --- Generate Report ---
        const sys = getSystemInfo();
        const timestamp = new Date().toISOString();

        const markdown = `
# TimeID Comprehensive Benchmark Report

**Date:** ${timestamp}

## 1. Environment
* **CPU:** ${sys.cpu} (${sys.cores} cores)
* **Node.js:** ${sys.nodeVersion} (V8 ${sys.v8Version})
* **OS:** ${sys.platform} ${sys.release}

## 2. Metrics Definitions
* **Entropy:** Bits of pure randomness (unpredictability).
* **Uniqueness:** Total bits of collision resistance (Entropy + Timestamp).
* **Vs Default:** Performance relative to \`timeIDr (Default - 12)\`.

## 3. Shootout Results

| Library | Ops/Sec | Margin | Entropy | Uniqueness | Vs Default |
| :--- | :--- | :--- | :--- | :--- | :--- |
${tableRows.join('\n')}

---
*Generated automatically by timeID.benchmark_comparison.js*
`;

        console.log(styleText('bold', '\n📝 Generated Markdown Report:'));
        console.log(markdown);

        // --- Save to File ---
        const args = process.argv.slice(2);
        const shouldSave = args.includes('--save') || args.includes('-s');

        if (shouldSave) {
            const filename = `timeID-god-benchmark_${timestamp}.md`;
            const absPath = path.resolve(process.cwd(), filename);
            fs.writeFileSync(absPath, markdown.trim());
            console.log(styleText('green', `\n✅ Report saved to: ${absPath}`));
        }
    })
    .run({ 'async': true });