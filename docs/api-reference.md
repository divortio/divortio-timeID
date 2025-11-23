
# API Reference

The library exports two main classes:
1.  **`timeIDr` (TimeIDRandom)**: The primary tool for generating unique IDs.
2.  **`timeID` (TimeID)**: The base primitive for raw timestamp encoding.

---

## `timeIDr` (TimeIDRandom)

> **Extends:** `TimeID`

This is the main class for generating unique, collision-resistant, sortable identifiers. It combines the timestamp logic of `TimeID` with a high-performance random number generator.

### `static newID(dateTime?, length?, delimiter?)`

Generates a new unique ID string.

* **dateTime** `(Date | number)`: The time to encode. Defaults to `Date.now()`.
* **length** `(number)`: The length of the random suffix. Defaults to `12`.
    * *Note:* Total ID length = 8 (timestamp) + delimiter length + `length` (randomness).
* **delimiter** `(string)`: Optional separator between timestamp and randomness (e.g., `"-"` or `"_"`). Defaults to empty string.
* **Returns:** `string`

```javascript
// Default
timeIDr.newID(); // "08kL_1z2xXyY..."

// Custom Time & Length
const past = new Date('2020-01-01');
timeIDr.newID(past, 16); // "07xY_... (16 chars random)"

// With Delimiter
timeIDr.newID(new Date(), 12, "-"); // "08kL_1z2-xXyY..."
````

### `static decodeID(tidr, delimiter?)`

Decodes a string back into a `TimeIDRandom` object.

* **tidr** `(string)`: The ID string to decode.
* **delimiter** `(string)`: The expected delimiter used during creation.
* **Returns:** `TimeIDRandom | undefined`
  * Returns `undefined` if the string is too short, invalid, or the delimiter is missing.

<!-- end list -->

```javascript
const obj = timeIDr.decodeID("08kL_1z2-xXyY...", "-");
console.log(obj.date); // Date object
console.log(obj.time); // Timestamp (number)
console.log(obj.randomness); // "xXyY..."
```

-----

## `timeID` (TimeID)

> **The Primitive**

This class handles **only** the timestamp portion (the first 8 characters). It is deterministic: the same time always produces the same string. Use this if you need compact timestamps but handle uniqueness yourself (or don't need it).

### `static newID(dateTime?)`

Generates an 8-character encoded timestamp.

* **dateTime** `(Date | number)`: The time to encode. Defaults to `Date.now()`.
* **Returns:** `string` (Always 8 characters).

<!-- end list -->

```javascript
const code = timeID.newID(); // "08kL_1z2"
```

### `static encodeTime(time)`

A pure function alias for `newID`, often clearer when transforming data.

* **time** `(Date | number)`: The time to encode.
* **Returns:** `string` (8 characters).
* **Throws:** `TypeError` if input is invalid.

### `static decodeTime(tid)`

Decodes an 8-character string back to a timestamp.

* **tid** `(string)`: The 8-character encoded string.
* **Returns:** `number | null` (The timestamp in milliseconds).

<!-- end list -->

```javascript
const ms = timeID.decodeTime("08kL_1z2");
console.log(new Date(ms));
```
