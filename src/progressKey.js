// progressKey.js — 學習進度金鑰序列化模組
// 職責：把 { examPassed, deliverableDone, advancedChecks } 壓縮成一個短字串，並還原。
// 不擁有任何狀態，不讀寫 localStorage。
(function (global) {
  'use strict';

  const TOPIC_ORDER = ['a1','a2','a3','b1','b2','b3','c1','c2','c3','d1','d2','d3','e1','e2','e3','f1','f2','f3'];
  const ADV_ORDER   = ['g1','g2','g3','g4','g5','g6','g7','g8','g9','g10'];
  const SECURE_SALT   = 'FinMathSecureSalt2026';
  const PREFIX        = 'FM';
  const VERSION       = '1';
  const PAYLOAD_CHARS = 13;
  const CHECKSUM_CHARS = 4;
  const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function simpleHash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return Math.abs(h & 0xFFFFFFFF).toString(36);
  }

  function checksumOf(payload) {
    // simpleHash 以 base36 輸出，短 payload 可能不足 4 字元，補零確保長度一致
    const raw = simpleHash(payload + SECURE_SALT);
    return raw.padStart(CHECKSUM_CHARS, '0').slice(0, CHECKSUM_CHARS);
  }

  function bigintToBase62(n, length) {
    let result = '';
    const base = 62n;
    for (let i = 0; i < length; i++) {
      result = BASE62[Number(n % base)] + result;
      n = n / base;
    }
    return result;
  }

  function base62ToBigint(s) {
    let n = 0n;
    for (const c of s) n = n * 62n + BigInt(BASE62.indexOf(c));
    return n;
  }

  function stateToBits(state) {
    let bits = 0n;
    TOPIC_ORDER.forEach((id, i) => {
      if ((state.examPassed || []).includes(id))      bits |= (1n << BigInt(i));
      if ((state.deliverableDone || []).includes(id)) bits |= (1n << BigInt(18 + i));
    });
    ADV_ORDER.forEach((gid, gi) => {
      const done = (state.advancedChecks && state.advancedChecks[gid]) || [];
      for (let item = 0; item < 4; item++) {
        if (done.includes(item)) bits |= (1n << BigInt(36 + gi * 4 + item));
      }
    });
    return bits;
  }

  function bitsToState(bits) {
    const examPassed      = TOPIC_ORDER.filter((_, i) => (bits >> BigInt(i)) & 1n);
    const deliverableDone = TOPIC_ORDER.filter((_, i) => (bits >> BigInt(18 + i)) & 1n);
    const advancedChecks  = {};
    ADV_ORDER.forEach((gid, gi) => {
      const done = [];
      for (let item = 0; item < 4; item++) {
        if ((bits >> BigInt(36 + gi * 4 + item)) & 1n) done.push(item);
      }
      if (done.length > 0) advancedChecks[gid] = done;
    });
    return { examPassed, deliverableDone, advancedChecks };
  }

  function addDashes(raw) {
    const head = raw.slice(0, 3);
    const rest = raw.slice(3);
    const parts = [];
    for (let i = 0; i < rest.length; i += 6) parts.push(rest.slice(i, i + 6));
    return head + '-' + parts.join('-');
  }

  function encode(state) {
    const payload  = bigintToBase62(stateToBits(state), PAYLOAD_CHARS);
    const checksum = checksumOf(payload);
    return addDashes(PREFIX + VERSION + payload + checksum);
  }

  function decode(key) {
    if (!key || typeof key !== 'string') return null;
    const raw = key.replace(/-/g, '');
    if (!raw.startsWith(PREFIX + VERSION)) return null;
    const body     = raw.slice(PREFIX.length + VERSION.length);
    const payload  = body.slice(0, PAYLOAD_CHARS);
    const checksum = body.slice(PAYLOAD_CHARS);
    if (payload.length !== PAYLOAD_CHARS || checksum.length !== CHECKSUM_CHARS) return null;
    if (checksumOf(payload) !== checksum) return null;
    return bitsToState(base62ToBigint(payload));
  }

  global.ProgressKey = { encode, decode };
})(typeof globalThis !== 'undefined' ? globalThis : /* istanbul ignore next */ window);
