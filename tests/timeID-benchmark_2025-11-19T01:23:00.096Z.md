# TimeID Benchmark Report

**Date:** 2025-11-19T01:23:00.096Z

## 1. Environment

| Component | Details |
| :--- | :--- |
| **CPU Model** | Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz |
| **Cores / Threads** | 8 |
| **Clock Speed** | 2500 MHz |
| **Architecture** | x64 |
| **Memory (RAM)** | 16.00 GB |
| **OS Platform** | Darwin (21.6.0) |
| **Node.js Version** | v24.10.0 |
| **V8 Engine** | 13.6.233.10-node.28 |

## 2. Benchmark Results

| Benchmark Test | Operations / Sec | Latency (ns/op) |
| :--- | :--- | :--- |
| encodeTime (Math Only) | **9,793,637** | 102.11 |
| TimeIDr.newID (String) | **2,511,702** | 398.14 |
| TimeIDr.newTimeIDr (Object) | **2,338,117** | 427.69 |
| TimeID.decodeID (Time Only) | **8,574,617** | 116.62 |
| TimeIDr.decodeID (Full) | **5,810,295** | 172.11 |

---
*Generated automatically by benchmark.js*