Certainly. You want a "Hacker News Style" blog post or README section that highlights `timeID`'s advantages with data-backed claims and transparency about the "Bit Parity" results.

This post is designed to be punchy, technical, and honest—exactly the tone that resonates on HN.

-----

### 🚀 Show HN: TimeID – A sortable ID generator that is 180x faster than ULID and faster than NanoID

I built **TimeID** because I was tired of the performance tax on sortable IDs. We all love UUIDs for uniqueness, but database fragmentation kills performance. We love ULIDs for sorting, but the reference implementation is agonizingly slow in JavaScript (\~22k ops/sec).

**TimeID solves this.** It gives you lexicographically sortable, collision-resistant IDs at **4.2 Million ops/sec**—matching the speed of UUID v4 and beating NanoID.

### ⚡ The Benchmarks (Pure JS, Single Thread)

We ran a comprehensive shootout against the industry heavyweights.

| Library | Speed (Ops/Sec) | Sortable? | Notes |
| :--- | :--- | :--- | :--- |
| **`crypto.randomUUID`** | \~12,000,000 | ❌ | The native C++ ceiling. |
| **`timeIDr` (Default)** | **\~4,200,000** | ✅ | **Matches UUID v4 speed, but Sortable.** |
| `uuid` (v4) | \~4,200,000 | ❌ | The industry standard. |
| `nanoid` | \~3,700,000 | ❌ | Famous for being fast. We beat it by \~13%. |
| `ksuid` | \~76,000 | ✅ | K-Sortable, but heavy encoding. |
| `cuid2` | \~46,000 | ❌ | Secure hashing makes it slower. |
| `ulid` | \~22,000 | ✅ | **180x slower than TimeID.** |

### 🔬 The "Honest" Bit-Parity Test

Critics will ask: *"But TimeID generates 12 random chars by default. NanoID/UUID generate \~21. Is that a fair comparison?"*

We ran a specific **"Bit Parity" benchmark** where we forced `timeID` to generate the exact same entropy (126 bits / 21 chars) as NanoID.

* **Result:** `timeID` drops to **\~3.2M ops/sec**.
* **The Trade-off:** You lose \~20% speed compared to UUID to gain **Chronological Sorting**.
* **The Reality:** Even at parity, `timeID` is doing *more work* (Timestamp Encoding + Randomness Generation) than UUID, yet remains in the same performance class.

### 🛠 How it works

1.  **Timestamp (48-bit):** Encoded using a custom, ASCII-ordered Base64 dialect. This ensures `String Sort == Time Sort`.
2.  **Randomness (72-bit):** Generated using **SFC32 (Simple Fast Counter)**, a chaotic PRNG that passes the "BigCrush" statistical test suite.
3.  **Optimization:** We use a **Double-Character Lookup Table (LUT)** to generate two characters per operation, cutting the encoding overhead in half.

### 📦 Install & Usage

```bash
npm install divortio-timeID
```

```javascript
import { timeIDr } from 'divortio-timeID';

const id = timeIDr.newID(); 
// -> "08kL_1z2~8s7d6f5g4h3"
//    [Timestamp][Randomness]
```

-----

**Links:**

* **GitHub:** [github.com/divortio/divortio-timeID](https://www.google.com/search?q=https://github.com/divortio/divortio-timeID)
* **Live Demo:** [divort.io/timeID](https://www.google.com/search?q=https://divort.io/timeID) *(Assuming you host it)*