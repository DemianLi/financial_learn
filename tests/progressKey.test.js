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
  checklistState: {},
};

// ─── 滿進度 round-trip ────────────────────────────────────────────────────────
const FULL_STATE = {
  examPassed:      ['a1','a2','a3','b1','b2','b3','c1','c2','c3','d1','d2','d3','e1','e2','e3','f1','f2','f3'],
  deliverableDone: ['a1','a2','a3','b1','b2','b3','c1','c2','c3','d1','d2','d3','e1','e2','e3','f1','f2','f3'],
  advancedChecks:  {
    g1:[0,1,2,3], g2:[0,1,2,3], g3:[0,1,2,3], g4:[0,1,2,3], g5:[0,1,2,3],
    g6:[0,1,2,3], g7:[0,1,2,3], g8:[0,1,2,3], g9:[0,1,2,3], g10:[0,1,2,3],
  },
  checklistState: {
    a1:[0,1,2], a2:[0,1], a3:[0,1,2],
    b1:[0,1],   b2:[0,1,2], b3:[0,1,2],
    c1:[0,1,2], c2:[0,1],   c3:[0,1],
    d1:[0,1,2], d2:[0,1,2], d3:[0,1],
    e1:[0,1,2], e2:[0,1,2], e3:[0,1],
    f1:[0,1,2], f2:[0,1,2], f3:[0,1,2],
  },
};

test('滿進度 encode 後 decode 可還原（所有 bits = 1）', () => {
  const key = PK.encode(FULL_STATE);
  const result = PK.decode(key);

  assert.deepEqual(result.examPassed,      FULL_STATE.examPassed);
  assert.deepEqual(result.deliverableDone, FULL_STATE.deliverableDone);
  assert.deepEqual(result.advancedChecks,  FULL_STATE.advancedChecks);
  assert.deepEqual(result.checklistState,  FULL_STATE.checklistState);
});

test('空進度 encode 後 decode 可還原', () => {
  const key = PK.encode(EMPTY_STATE);
  const result = PK.decode(key);

  assert.deepEqual(result.examPassed,    []);
  assert.deepEqual(result.deliverableDone, []);
  assert.deepEqual(result.advancedChecks,  {});
  assert.deepEqual(result.checklistState,  {});
});

// ─── 部分進度 round-trip ──────────────────────────────────────────────────────
test('部分進度 encode 後 decode 可還原（任意組合含 checklistState）', () => {
  const partial = {
    examPassed:      ['a1', 'b2', 'f3'],
    deliverableDone: ['a1', 'c1'],
    advancedChecks:  { g3: [0, 2], g10: [1, 3] },
    checklistState:  { a2: [0], d1: [0, 2], f2: [1, 2] },
  };
  const result = PK.decode(PK.encode(partial));

  assert.deepEqual(result.examPassed,      partial.examPassed);
  assert.deepEqual(result.deliverableDone, partial.deliverableDone);
  assert.deepEqual(result.advancedChecks,  partial.advancedChecks);
  assert.deepEqual(result.checklistState,  partial.checklistState);
});

// ─── 篡改 checksum → null ─────────────────────────────────────────────────────
test('篡改 checksum 後 decode 回傳 null', () => {
  const key = PK.encode(EMPTY_STATE);
  const tampered = key.slice(0, -1) + (key.at(-1) === 'a' ? 'b' : 'a');
  assert.equal(PK.decode(tampered), null);
});

// ─── 錯誤前綴 → null ──────────────────────────────────────────────────────────
test('前綴不是 FM1/FM2 時 decode 回傳 null', () => {
  assert.equal(PK.decode('XX2-a7Bx9q-RzKm4w-XyZ1pQ-3r'), null);
});

// ─── 長度錯誤 → null ──────────────────────────────────────────────────────────
test('長度不足時 decode 回傳 null', () => {
  assert.equal(PK.decode('FM2-short'), null);
});

// ─── FM1 向下相容 ─────────────────────────────────────────────────────────────
test('FM1 舊格式仍能正確 decode（checklistState 回傳空物件）', () => {
  // 手動建構合法 FM1 key（空進度，13 個 '0' payload）
  const SECURE_SALT = 'FinMathSecureSalt2026';
  const simpleHash = (str) => {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return Math.abs(h & 0xFFFFFFFF).toString(36);
  };
  const checksumOf = (p) => simpleHash(p + SECURE_SALT).padStart(4, '0').slice(0, 4);

  const payload = '0'.repeat(13);
  const raw = 'FM1' + payload + checksumOf(payload);   // 20 chars
  const rest = raw.slice(3);
  const parts = [];
  for (let i = 0; i < rest.length; i += 6) parts.push(rest.slice(i, i + 6));
  const fm1Key = 'FM1-' + parts.join('-');

  const result = PK.decode(fm1Key);
  assert.ok(result !== null, 'FM1 key should decode successfully');
  assert.deepEqual(result.examPassed,      []);
  assert.deepEqual(result.deliverableDone, []);
  assert.deepEqual(result.advancedChecks,  {});
  assert.deepEqual(result.checklistState,  {}, 'FM1 應回傳空的 checklistState');
});
