import test from "node:test";
import assert from "node:assert/strict";
import { decodeTime, isValid } from "ulid";
import { createFixedClock, createIdGenerator, systemClock, type Clock } from "../src/index.js";

void test("system clock reports the current epoch time in milliseconds", () => {
  const before = Date.now();
  const time = systemClock.now();
  const after = Date.now();
  assert.ok(time >= before && time <= after);
});

void test("fixed clock always reports its configured time", () => {
  const clock = createFixedClock(1_700_000_000_000);
  assert.equal(clock.now(), 1_700_000_000_000);
  assert.equal(clock.now(), 1_700_000_000_000);
});

void test("generates valid ULIDs timestamped by the injected clock", () => {
  const generateId = createIdGenerator({ clock: createFixedClock(1_700_000_000_000) });
  const id = generateId();
  assert.ok(isValid(id));
  assert.equal(decodeTime(id), 1_700_000_000_000);
});

void test("generates unique, sortable ids within the same millisecond", () => {
  const generateId = createIdGenerator({ clock: createFixedClock(1_700_000_000_000) });
  const ids = Array.from({ length: 1_000 }, () => generateId());
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), ids);
});

void test("keeps ids sortable when the clock moves backwards", () => {
  const times = [1_700_000_000_005, 1_700_000_000_001];
  const clock: Clock = { now: () => times.shift() ?? 0 };
  const generateId = createIdGenerator({ clock });
  const first = generateId();
  const second = generateId();
  assert.ok(second > first);
});
