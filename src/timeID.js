// @ts-check

/**
 * @fileoverview A utility library for generating Lexicographically Sortable Unique Identifiers (TimeIDs).
 * These IDs combine a base64-encoded timestamp with random characters to ensure uniqueness and correct
 * sort order (chronological) when sorted as strings.
 *
 * Optimization Focus:
 * - Zero-allocation hot paths.
 * - SFC32 PRNG (Simple Fast Counter) for maximum throughput.
 * - Double-Character Lookup Table (LUT) to reduce branching and concatenation by 50%.
 * - Int8Array for O(1) character decoding lookups.
 * - Specialized Unrolled Paths for length 12 (Default) and 21 (Bit-Parity).
 */

const CHAR_DICT_STR = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~';
const CHAR_DICT = CHAR_DICT_STR.split('');

// Define CHAR_MAP for backward compatibility and public static access
/** @type {Object<string, number>} */
const CHAR_MAP = {};

// --- DECODING LOOKUP (O(1)) ---
const ASCII_LOOKUP = new Int8Array(128).fill(-1);
for (let i = 0; i < CHAR_DICT_STR.length; i++) {
    const code = CHAR_DICT_STR.charCodeAt(i);
    const char = CHAR_DICT_STR[i];
    ASCII_LOOKUP[code] = i;
    CHAR_MAP[char] = i; // Populate legacy map
}

// --- DOUBLE-CHAR LOOKUP TABLE (O(1)) ---
const DOUBLE_CHAR_DICT = new Array(4096);
for (let i = 0; i < 4096; i++) {
    const c1 = CHAR_DICT[i & 0x3F];
    const c2 = CHAR_DICT[(i >>> 6) & 0x3F];
    DOUBLE_CHAR_DICT[i] = c1 + c2;
}

// --- PRNG: SFC32 ---
let _a, _b, _c, _d;
(function seedSFC32() {
    _a = Date.now() >>> 0;
    _b = (Math.random() * 0xFFFFFFFF) | 0;
    _c = (Math.random() * 0xFFFFFFFF) | 0;
    _d = 1;
    for (let i = 0; i < 15; i++) {
        let t = (_a + _b) | 0; _d = (_d + 1) | 0;
        _a = _b ^ (_b >>> 9); _b = (_c + (_c << 3)) | 0;
        _c = (_c << 21) | (_c >>> 11); _c = (_c + t) | 0;
    }
})();

const nextInt32 = function() {
    let t = (_a + _b) | 0; _d = (_d + 1) | 0;
    _a = _b ^ (_b >>> 9); _b = (_c + (_c << 3)) | 0;
    _c = (_c << 21) | (_c >>> 11); _c = (_c + t) | 0;
    return (t + _d) | 0;
}

/**
 * Generates a random string of a specified length.
 */
const newRND = function (length = 12) {
    // FAST PATH 1: Default length (12 chars)
    // 3 Random Ints -> 6 Double Lookups
    if (length === 12) {
        let r = nextInt32();
        let str = DOUBLE_CHAR_DICT[r & 0xFFF] +
            DOUBLE_CHAR_DICT[(r >>> 12) & 0xFFF];

        r = nextInt32();
        str += DOUBLE_CHAR_DICT[r & 0xFFF] +
            DOUBLE_CHAR_DICT[(r >>> 12) & 0xFFF];

        r = nextInt32();
        str += DOUBLE_CHAR_DICT[r & 0xFFF] +
            DOUBLE_CHAR_DICT[(r >>> 12) & 0xFFF];

        return str;
    }

    // FAST PATH 2: Bit-Parity length (21 chars)
    // 21 chars = 10 Double Lookups + 1 Single Lookup
    // Requires 5.25 Random Ints -> We fetch 6
    if (length === 21) {
        let r = nextInt32();
        let str = DOUBLE_CHAR_DICT[r & 0xFFF] + DOUBLE_CHAR_DICT[(r >>> 12) & 0xFFF]; // 4 chars

        r = nextInt32();
        str += DOUBLE_CHAR_DICT[r & 0xFFF] + DOUBLE_CHAR_DICT[(r >>> 12) & 0xFFF]; // +4 = 8

        r = nextInt32();
        str += DOUBLE_CHAR_DICT[r & 0xFFF] + DOUBLE_CHAR_DICT[(r >>> 12) & 0xFFF]; // +4 = 12

        r = nextInt32();
        str += DOUBLE_CHAR_DICT[r & 0xFFF] + DOUBLE_CHAR_DICT[(r >>> 12) & 0xFFF]; // +4 = 16

        r = nextInt32();
        str += DOUBLE_CHAR_DICT[r & 0xFFF] + DOUBLE_CHAR_DICT[(r >>> 12) & 0xFFF]; // +4 = 20

        r = nextInt32();
        str += CHAR_DICT[r & 0x3F]; // +1 = 21 chars

        return str;
    }

    // SLOW PATH: Arbitrary length
    // 1. Enforce Minimum (12)
    let len = length < 12 ? 12 : length;
    // 2. Enforce Maximum (1024)
    if (len > 1024) len = 1024;

    let str = '';
    let i = 0;

    while (i < len) {
        let r = nextInt32();
        // Check if we can do a double lookup (i+2 <= len)
        if (i + 1 < len) {
            str += DOUBLE_CHAR_DICT[r & 0xFFF];
            i += 2;
            if (i === len) break;
            r >>>= 12;

            // We can do one more double lookup from this int?
            // 30 bits total. Used 12. 18 left. Yes.
            if (i + 1 < len) {
                str += DOUBLE_CHAR_DICT[r & 0xFFF];
                i += 2;
                if (i === len) break;
                // Used 24 bits. 6 left.
            }
        } else {
            // Odd character at the end
            str += CHAR_DICT[r & 0x3F];
            break;
        }
    }
    return str;
}

const decodeTime = function (tid) {
    if (!tid || typeof tid !== 'string' || tid.length < 8) return null;
    let ts = 0;
    for (let i = 0; i < 8; i++) {
        const code = tid.charCodeAt(i);
        if (code > 127) return null;
        const val = ASCII_LOOKUP[code];
        if (val === -1) return null;
        ts = ts * 64 + val;
    }
    return ts;
}

const DIV_64 = 0.015625;

const encodeTime = function (time) {
    let ts = typeof time === 'number' ? time : (time instanceof Date ? time.getTime() : null);
    if (ts === null || ts < 0) throw new TypeError(`Expected instanceof number or Date, received: ${typeof time}`);

    let c7 = CHAR_DICT[ts % 64]; ts = Math.floor(ts * DIV_64);
    let c6 = CHAR_DICT[ts % 64]; ts = Math.floor(ts * DIV_64);

    let c5 = CHAR_DICT[ts & 0x3F]; ts >>>= 6;
    let c4 = CHAR_DICT[ts & 0x3F]; ts >>>= 6;
    let c3 = CHAR_DICT[ts & 0x3F]; ts >>>= 6;
    let c2 = CHAR_DICT[ts & 0x3F]; ts >>>= 6;
    let c1 = CHAR_DICT[ts & 0x3F]; ts >>>= 6;
    let c0 = CHAR_DICT[ts & 0x3F];

    return c0 + c1 + c2 + c3 + c4 + c5 + c6 + c7;
}

const encodeTimeNow = function (time = Date.now()) {
    return encodeTime(time);
}

class TimeID {
    date; time; tID;
    static CHAR_MAP = CHAR_MAP;
    static CHAR_DICT = CHAR_DICT_STR;

    constructor(date, time, tID) {
        this.date = date; this.time = time; this.tID = tID;
    }

    static decodeTime = decodeTime;
    static encodeTime = encodeTime;
    static encodeTimeNow = encodeTimeNow;

    static newTimeID(dateTime = new Date()) {
        if (dateTime instanceof Date) {
            return new this(dateTime, dateTime.getTime(), this.encodeTime(dateTime.getTime()));
        } else if (typeof (dateTime) === 'number' && dateTime > 0) {
            return new this(new Date(dateTime), dateTime, this.encodeTime(dateTime));
        }
        throw new TypeError(`Expected instanceof Date|number`);
    }

    static newTID(dateTime = new Date()) { return encodeTime(dateTime); }
    static newID(dateTime = new Date()) { return encodeTime(dateTime); }

    static decodeTimeID(tid) {
        const ts = decodeTime(tid);
        if (ts !== null) return new TimeID(new Date(ts), ts, tid);
    }
    static decodeTID(tid) { return TimeID.decodeTimeID(tid); }
    static decodeID(tid) { return TimeID.decodeTID(tid); }
}

class TimeIDRandom extends TimeID {
    tIDr; randomness;

    constructor(date, time, tid, randomness, delimiter = '') {
        super(date, time, tid);
        this.randomness = randomness;
        this.tIDr = tid + delimiter + randomness;
    }

    static newRandomness(length = 12) { return newRND(length) }

    static newTimeIDr(dateTime = new Date(), length = 12, delimiter = '') {
        if (dateTime instanceof Date) {
            return new TimeIDRandom(dateTime, dateTime.getTime(), encodeTime(dateTime.getTime()), newRND(length), delimiter);
        } else if (typeof (dateTime) === 'number' && dateTime > 0) {
            return new TimeIDRandom(new Date(dateTime), dateTime, encodeTime(dateTime), newRND(length), delimiter);
        }
        throw new TypeError(`Expected instanceof Date|number`);
    }

    static newTIDr(dateTime = new Date(), length = 12, delimiter = '') {
        return encodeTime(dateTime) + delimiter + newRND(length);
    }
    static newID(dateTime = new Date(), length = 12, delimiter = '') {
        return encodeTime(dateTime) + delimiter + newRND(length);
    }

    static decodeTimeIDr(tidr, delimiter = '') {
        if (typeof tidr === 'string') {
            if (tidr.length >= 8) {
                const timePart = tidr.substring(0, 8);
                const ts = decodeTime(timePart);
                if (ts !== null) {
                    const startIndex = 8 + delimiter.length;
                    if (delimiter.length > 0) {
                        const actualDelimiter = tidr.substring(8, startIndex);
                        if (actualDelimiter !== delimiter) return undefined;
                    }
                    const randomness = tidr.substring(startIndex);
                    return new TimeIDRandom(new Date(ts), ts, timePart, randomness, delimiter);
                }
                return undefined;
            }
            throw new TypeError(`Expected string length >= 8, received: '${tidr}' length: ${tidr.length}`);
        }
    }
    static decodeTIDr(tidr, delimiter = '') { return TimeIDRandom.decodeTimeIDr(tidr, delimiter); }
    static decodeID(tidr, delimiter = '') { return TimeIDRandom.decodeTIDr(tidr, delimiter); }
}

export const timeID  = TimeID;
export const timeIDr = TimeIDRandom;