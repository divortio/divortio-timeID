
# divortio-timeID

> **High-Performance Lexicographically Sortable Unique Identifiers** for JavaScript.

**TimeID: A sortable ID generator that is 180x faster than ULID and faster than NanoID.**

**divortio-timeID** is a zero-dependency library for generating unique IDs that are **sortable by creation time**. It combines a high-precision timestamp with random characters, making it ideal for database primary keys where chronological sorting is required without a separate index.

## 📖 The Story

### The Problem
"I wanted sortable IDs (like ULID) but found the reference implementations too slow for high-throughput systems."

### The Solution
"I built TimeID using SFC32 and a custom bitwise-batched Base64 encoding."

### The Result
"It generates sortable, collision-resistant IDs at **4 Million ops/sec**—matching UUID v4 and beating NanoID, while maintaining chronological sorting."

## ✨ Features

* **🚀 Blazing Fast:** Generates **~4.2 million IDs/sec** on standard hardware.
* **📅 Sortable:** IDs generated later sort alphabetically after IDs generated earlier.
* **🔒 Collision Resistant:** Uses the **SFC32** (Simple Fast Counter) PRNG for high-quality randomness.
* **📦 Zero Dependencies:** Pure, native JavaScript (ESM).
* **💾 Memory Efficient:** Optimized "Zero-Allocation" hot paths to reduce Garbage Collection pressure.

## 🧩 Core Concepts

The library exports two distinct classes to handle different needs:

| Class | Export | Description | Structure |
| :--- | :--- | :--- | :--- |
| **TimeIDRandom** | `timeIDr` | **The default choice.** Generates globally unique, sortable IDs. Ideal for DB Primary Keys. | `[Timestamp] + [Randomness]` |
| **TimeID** | `timeID` | **The primitive.** Deterministically encodes/decodes timestamps only. No randomness. | `[Timestamp]` |

## 🚀 Quick Start

### Installation

```bash
npm install divortio-timeID
````

### Basic Usage (Unique IDs)

Use `timeIDr` when you need collision-resistant identifiers (e.g., for database records).

```javascript
import { timeIDr } from 'divortio-timeID';

// 1. Generate a unique, sortable ID (20 characters default)
const id = timeIDr.newID(); 
console.log(id); 
// Output: "08kL_1z2~8s7d6f5g4h3" (Timestamp + Randomness)

// 2. Decode the ID to get the creation time
const decoded = timeIDr.decodeID(id);
console.log(decoded.date); 
// Output: 2025-11-18T20:30:00.000Z
```

### Advanced Usage (Timestamp Encoding)

Use `timeID` when you only want to compress a timestamp into a short, sortable string (8 chars) and don't need uniqueness.

```javascript
import { timeID } from 'divortio-timeID';

// Encode current time into 8 chars
const shortCode = timeID.newID();
console.log(shortCode); // "08kL_1z2"

// It is deterministic (Same time = Same ID)
const timestamp = 1731985500123;
console.log(timeID.encodeTime(timestamp)); // Always returns the same string
```

## ⚔️ Performance vs The World

`divortio-timeID` is designed to be the fastest sortable ID generator in the JavaScript ecosystem.

| Library | Type | Ops/Sec | Sortable? | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **`crypto.randomUUID`** | Native C++ | \~12,400,000 | ❌ No | The theoretical speed limit (Native). |
| **`divortio-timeID`** | **Pure JS** | **\~4,200,000** | **✅ Yes** | **Matches UUID speed, but sortable.** |
| `uuid` (v4) | Pure JS | \~4,200,000 | ❌ No | The industry standard. |
| `nanoid` | Pure JS | \~3,800,000 | ❌ No | Famous for being lightweight/fast. |
| `ulid` | Pure JS | \~22,000 | ✅ Yes | The reference implementation is heavy. |

*Benchmark run on Node.js v24.10.0.*

## ⚡ Internal Performance Snapshot

Benchmarks for the core library functions on consumer hardware:

| Operation | Throughput | Latency |
| :--- | :--- | :--- |
| **Core Encoding** (`TimeID`) | \~12,000,000 ops/sec | \~83 ns |
| **ID Generation** (`TimeIDRandom`) | \~4,200,000 ops/sec | \~238 ns |
| **Decoding** | \~6,000,000 ops/sec | \~167 ns |

*Measured on: 2015 Macbook Pro 15" (Intel Core i7-4870HQ @ 2.50GHz)*

**Expect significantly higher performance on modern Apple Silicon or recent Intel/AMD chips.**

## 📚 Documentation

Detailed documentation is available in the [`/docs`](https://www.google.com/search?q=./docs/README.md) directory.

* [**API Reference**](https://www.google.com/search?q=./docs/api-reference.md): Detailed method signatures for `TimeID` vs `TimeIDRandom`.
* [**Architecture**](https://www.google.com/search?q=./docs/architecture.md): Visualization of how `TimeID` acts as the prefix for `TimeIDRandom`.
* [**Performance & Benchmarks**](https://www.google.com/search?q=./docs/performance.md): Deep dive into optimization techniques (SFC32, LUTs).
