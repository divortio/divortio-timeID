# Performance & Benchmarks

**divortio-timeID** is engineered for high-throughput systems. It avoids common JavaScript performance pitfalls like excessive object allocation and floating-point overhead.

## Benchmark Results

On a modern V8 environment (Node.js v24+ or Chrome), you can expect the following throughput:

| Metric | Class / Method | Throughput | Description |
| :--- | :--- | :--- | :--- |
| **Core Encoding** | `TimeID.encodeTime` | **~10.8 Million ops/sec** | Pure timestamp encoding (8 chars). Minimal CPU cost. |
| **ID Generation** | `TimeIDRandom.newID` | **~2.6 Million ops/sec** | Generating a full, unique 20-char ID (Timestamp + Randomness). |
| **Decoding** | `TimeIDRandom.decodeID` | **~6.0 Million ops/sec** | Parsing a string back into a Date object. |

## Key Optimizations

### 1. Zero-Allocation Hot Paths
In typical JS libraries, calling `new ID()` creates a class instance (Object) on the heap, which must later be Garbage Collected (GC).
Our `newID()` static method generates the string **directly** using primitive string concatenation. This bypasses the heap entirely for the ID generation path, reducing GC pauses significantly under load.

### 2. SFC32 & Bitwise Batching
Standard `Math.random()` returns a 64-bit float (`double`), which is slow to convert into integers for array indexing.
* **SFC32 (Simple Fast Counter):** We use a custom, high-performance PRNG optimized for 32-bit integer math (`Math.imul`).
* **Batching:** Instead of calling the RNG for every character, we generate **one** 32-bit integer and extract **5 characters** from it using bitwise masking (`val & 0x3F`). This reduces RNG calls by **80%**.

### 3. Int8Array Lookups
Decoding uses a pre-computed `Int8Array` (size 128) to map ASCII codes directly to integer values. This allows O(1) lookups (`array[code]`) instead of slower Hash Map lookups (`object[char]`).

## Running the Benchmarks

You can verify these results on your own hardware using the included benchmark script.

```bash
# Run benchmark and output to console
npm run bench

# Run benchmark and save report to file
node tests/timeID.benchmark.js --save
````
