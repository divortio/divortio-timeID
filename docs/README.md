# Documentation Index

Welcome to the detailed documentation for **divortio-timeID**.

Here you will find deep dives into the API, the architectural decisions behind the sortable format, and the performance optimizations that make this library fast.

## Guides

### 🛠️ [API Reference](./api-reference.md)
Complete documentation for the `TimeID` and `TimeIDRandom` classes. Learn how to:
* Generate IDs with custom lengths.
* Use custom delimiters.
* Handle errors and validation.

### ⚡ [Performance & Benchmarks](./performance.md)
A breakdown of the "Zero-Allocation" and "Bitwise Batching" optimizations.
* How we achieved ~2.8 million IDs/sec.
* Comparison of PRNG engines (SFC32 vs. Math.random).
* Instructions for running the benchmark suite yourself.

### 🏗️ [Architecture & Design](./architecture.md)
Understanding the ID format:
* Why are these IDs sortable?
* The custom Base64 character set.
* Collision resistance analysis.