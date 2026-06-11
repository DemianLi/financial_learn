// tests/progressKey.test.js
// 測試 ProgressKey.encode / decode 的外部行為（公開介面）
// 不測試 BigInt 計算或 base62 的內部細節。

import { test } from 'node:test';
import assert from 'node:assert/strict';

// ProgressKey 為 browser IIFE；以 globalThis 模擬 window 環境後 import
import '../src/progressKey.js';
const PK = globalThis.ProgressKey;

const EMPTY_STATE = {
  examPassed: [],
  deliverableDone: [],
  advancedChecks: {},
};

// ─── 2. 滿進度 round-trip ────────────────────────────────────────────────────
const FULL_STATE = {
  examPassed:      ['a1','a2','a3','b1','b2','b3','c1','c2','c3','d1','d2','d3','e1','e2','e3','f1','f2','f3'],
  deliverableDone: ['a1','a2','a3','b1','b2','b3','c1','c2','c3','d1','d2','d3','e1','e2','e3','f1','f2','f3'],
  advancedChecks:  {
    g1:[0,1,2,3], g2:[0,1,2,3], g3:[0,1,2,3], g4:[0,1,2,3], g5:[0,1,2,3],
    g6:[0,1,2,3], g7:[0,1,2,3], g8:[0,1,2,3], g9:[0,1,2,3], g10:[0,1,2,3],
  },
};

test('滿進度 encode 後 decode 可還原（所有 bits = 1）', () => {
  const key = PK.encode(FULL_STATE);
  const result = PK.decode(key);

  assert.deepEqual(result.examPassed,      FULL_STATE.examPassed);
  assert.deepEqual(result.deliverableDone, FULL_STATE.deliverableDone);
  assert.deepEqual(result.advancedChecks,  FULL_STATE.advancedChecks);
});
test('空進度 encode 後 decode 可還原', () => {
  const key = PK.encode(EMPTY_STATE);
  const result = PK.decode(key);

  assert.deepEqual(result.examPassed, []);
  assert.deepEqual(result.deliverableDone, []);
  assert.deepEqual(result.advancedChecks, {});
});

// ─── 3. 部分進度 round-trip ──────────────────────────────────────────────────
test('部分進度 encode 後 decode 可還原（任意組合）', () => {
  const partial = {
    examPassed:      ['a1', 'b2', 'f3'],
    deliverableDone: ['a1', 'c1'],
    advancedChecks:  { g3: [0, 2], g10: [1, 3] },
  };
  const result = PK.decode(PK.encode(partial));

  assert.deepEqual(result.examPassed,      partial.examPassed);
  assert.deepEqual(result.deliverableDone, partial.deliverableDone);
  assert.deepEqual(result.advancedChecks,  partial.advancedChecks);
});

// ─── 4. 篡改 checksum → null ─────────────────────────────────────────────────
test('篡改 checksum 後 decode 回傳 null', () => {
  const key = PK.encode(EMPTY_STATE);
  const tampered = key.slice(0, -1) + (key.at(-1) === 'a' ? 'b' : 'a');
  assert.equal(PK.decode(tampered), null);
});

// ─── 5. 錯誤前綴 → null ──────────────────────────────────────────────────────
test('前綴不是 FM1 時 decode 回傳 null', () => {
  assert.equal(PK.decode('XX1-a7Bx9q-RzKm4w-XyZ1pQ-3r'), null);
});

// ─── 6. 長度錯誤 → null ──────────────────────────────────────────────────────
test('長度不足時 decode 回傳 null', () => {
  assert.equal(PK.decode('FM1-short'), null);
});
