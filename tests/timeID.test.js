import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { timeID, timeIDr } from '../src/timeID.js';

// Helper to sleep for ms (to guarantee distinct timestamps)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('TimeID (Timestamp Only)', () => {

    it('should encode and decode the current time accurately', () => {
        const now = Date.now();
        const id = timeID.encodeTime(now);
        const decoded = timeID.decodeTime(id);

        assert.equal(typeof id, 'string');
        assert.equal(id.length, 8, 'Timestamp ID must be exactly 8 characters');
        assert.equal(decoded, now, 'Decoded time must match original time');
    });

    it('should maintain lexicographical sort order', async () => {
        const t1 = Date.now();
        await sleep(2);
        const t2 = Date.now();

        const id1 = timeID.encodeTime(t1);
        const id2 = timeID.encodeTime(t2);

        assert.ok(t1 < t2, 'Time t1 should be less than t2');
        assert.ok(id1 < id2, `String id1 (${id1}) should sort before id2 (${id2})`);
    });

    it('should throw TypeError for invalid inputs', () => {
        assert.throws(() => timeID.encodeTime(-100), TypeError, 'Should reject negative numbers');
        assert.throws(() => timeID.encodeTime('not a number'), TypeError, 'Should reject strings');
        assert.throws(() => timeID.encodeTime(null), TypeError, 'Should reject null');
    });

    it('should return null for invalid strings when decoding', () => {
        // 1. String too short
        assert.equal(timeID.decodeTime('short'), null, 'Should return null for short strings');

        // 2. Invalid character inside the 8-char timestamp
        assert.equal(timeID.decodeTime('bad$char'), null, 'Should return null for invalid dictionary chars');
    });

    it('should successfully decode a timestamp from a longer string (prefixing)', () => {
        const now = Date.now();
        const id = timeID.encodeTime(now);
        const fullID = id + '_someRandomSuffix';

        const decoded = timeID.decodeTime(fullID);
        assert.equal(decoded, now, 'Should extract timestamp from the start of a full ID');
    });

    it('TimeID Class: should instantiate and hold correct values', () => {
        const date = new Date();
        const tidObj = timeID.newTimeID(date);

        assert.ok(tidObj instanceof timeID);
        assert.equal(tidObj.date.getTime(), date.getTime());
        assert.equal(tidObj.time, date.getTime());
        assert.equal(typeof tidObj.tID, 'string');
    });

    it('static newID should return a string directly (Zero-Allocation Check)', () => {
        const id = timeID.newID();
        assert.equal(typeof id, 'string');
        assert.equal(id.length, 8);
    });
});

describe('TimeIDRandom (Timestamp + Randomness)', () => {

    it('should generate an ID with correct length and default structure', () => {
        // Default: 8 char time + 12 char random = 20 chars
        const id = timeIDr.newID();
        assert.equal(id.length, 20);
    });

    it('should handle custom randomness lengths (Slow Path check)', () => {
        const length = 16;
        const id = timeIDr.newID(new Date(), length);
        // 8 (time) + 16 (random) = 24
        assert.equal(id.length, 24);
    });

    it('should enforce minimum randomness length', () => {
        // Request 5 chars -> Should default to 12
        const id = timeIDr.newID(new Date(), 5);
        assert.equal(id.length, 20); // 8 + 12
    });

    it('should enforce maximum randomness length (Safety Cap)', () => {
        // Request 2000 chars -> Should cap at 1024
        const id = timeIDr.newID(new Date(), 2000);
        // 8 (time) + 1024 (random) = 1032
        assert.equal(id.length, 1032);
    });

    it('should generate standalone randomness', () => {
        const rnd = timeIDr.newRandomness(12);
        assert.equal(rnd.length, 12);
        assert.ok(typeof rnd === 'string');
    });

    it('should ensure uniqueness (Statistical Test)', () => {
        const set = new Set();
        const ITERATIONS = 10_000;

        for (let i = 0; i < ITERATIONS; i++) {
            set.add(timeIDr.newID());
        }

        assert.equal(set.size, ITERATIONS, 'Generated 10k IDs without collision');
    });

    it('should handle delimiters correctly', () => {
        const delim = '_-_';
        const id = timeIDr.newID(new Date(), 12, delim);

        // Expect: Time(8) + Delim(3) + Random(12) = 23
        assert.equal(id.length, 23);
        assert.ok(id.includes(delim), 'ID should contain the delimiter');

        const timePart = id.substring(0, 8);
        const midPart = id.substring(8, 11);
        assert.equal(midPart, delim);
        assert.ok(timeID.decodeTime(timePart) > 0);
    });

    it('should decode a full ID back into an object', () => {
        const now = new Date();
        const cleanNow = new Date(now.getTime());
        const delim = '-';

        const idString = timeIDr.newID(cleanNow, 12, delim);
        const decodedObj = timeIDr.decodeID(idString, delim);

        assert.ok(decodedObj instanceof timeIDr);
        assert.equal(decodedObj.date.getTime(), cleanNow.getTime());
        assert.equal(decodedObj.randomness.length, 12);
    });

    it('should fail to decode if delimiter is missing or wrong', () => {
        const idString = timeIDr.newID(new Date(), 12, '-');
        const result = timeIDr.decodeID(idString, '_');
        assert.equal(result, undefined, 'Should return undefined on delimiter mismatch');
    });

    it('should sort chronologically even with randomness', async () => {
        const id1 = timeIDr.newID();
        await sleep(10); // Force time difference
        const id2 = timeIDr.newID();

        assert.ok(id1 < id2, 'Earlier ID should sort before later ID');
    });
});

describe('Internal Integrity', () => {
    it('CHAR_DICT should be ASCII sort safe', () => {
        const dict = timeID.CHAR_DICT;
        for (let i = 0; i < dict.length - 1; i++) {
            const current = dict.charCodeAt(i);
            const next = dict.charCodeAt(i + 1);
            assert.ok(current < next, `Character '${dict[i]}' should come before '${dict[i+1]}' in ASCII`);
        }
    });
});