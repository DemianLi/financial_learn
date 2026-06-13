// progressKey.js — 學習進度金鑰序列化模組
// 職責：把 { examPassed, deliverableDone, advancedChecks, checklistState } 壓縮成一個短字串，並還原。
// 不擁有任何狀態，不讀寫 localStorage。
(function (global) {
  'use strict';

  const TOPIC_ORDER = ['a1','a2','a3','b1','b2','b3','c1','c2','c3','d1','d2','d3','e1','e2','e3','f1','f2','f3'];
  const ADV_ORDER   = ['g1','g2','g3','g4','g5','g6','g7','g8','g9','g10'];

  // Bit layout:
  //   bits  0–17 : examPassed (18 topics)
  //   bits 18–35 : deliverableDone (18 topics)
  //   bits 36–75 : advancedChecks (10 G-topics × 4 items)
  //   bits 76–122: checklistState (47 bits, per-topic partial checklist)
  const CHECKLIST_BITS = [
    { id: 'a1', offset:  76, count: 3 },
    { id: 'a2', offset:  79, count: 2 },
    { id: 'a3', offset:  81, count: 3 },
    { id: 'b1', offset:  84, count: 2 },
    { id: 'b2', offset:  86, count: 3 },
    { id: 'b3', offset:  89, count: 3 },
    { id: 'c1', offset:  92, count: 3 },
    { id: 'c2', offset:  95, count: 2 },
    { id: 'c3', offset:  97, count: 2 },
    { id: 'd1', offset:  99, count: 3 },
    { id: 'd2', offset: 102, count: 3 },
    { id: 'd3', offset: 105, count: 2 },
    { id: 'e1', offset: 107, count: 3 },
    { id: 'e2', offset: 110, count: 3 },
    { id: 'e3', offset: 113, count: 2 },
    { id: 'f1', offset: 115, count: 3 },
    { id: 'f2', offset: 118, count: 3 },
    { id: 'f3', offset: 121, count: 3 },
  ];

  const SECURE_SALT    = 'FinMathSecureSalt2026';
  const PREFIX         = 'FM';
  const VERSION        = '2';
  const PAYLOAD_CHARS  = 21;   // ceil(log_62(2^124)) = 21; covers bits 0–123
  const PAYLOAD_V1     = 13;   // FM1 legacy payload length (bits 0–75)
  const CHECKSUM_CHARS = 4;
  const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function simpleHash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return Math.abs(h & 0xFFFFFFFF).toString(36);
  }

  function checksumOf(payload) {
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
    CHECKLIST_BITS.forEach(({ id, offset, count }) => {
      const checked = (state.checklistState && state.checklistState[id]) || [];
      for (let item = 0; item < count; item++) {
        if (checked.includes(item)) bits |= (1n << BigInt(offset + item));
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
    const checklistState = {};
    CHECKLIST_BITS.forEach(({ id, offset, count }) => {
      const checked = [];
      for (let item = 0; item < count; item++) {
        if ((bits >> BigInt(offset + item)) & 1n) checked.push(item);
      }
      if (checked.length > 0) checklistState[id] = checked;
    });
    return { examPassed, deliverableDone, advancedChecks, checklistState };
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
    if (!raw.startsWith(PREFIX)) return null;

    const ver = raw[PREFIX.length];
    let payloadLen;
    if (ver === '1')      payloadLen = PAYLOAD_V1;
    else if (ver === '2') payloadLen = PAYLOAD_CHARS;
    else return null;

    const body     = raw.slice(PREFIX.length + 1);
    const payload  = body.slice(0, payloadLen);
    const checksum = body.slice(payloadLen);
    if (payload.length !== payloadLen || checksum.length !== CHECKSUM_CHARS) return null;
    if (checksumOf(payload) !== checksum) return null;

    const state = bitsToState(base62ToBigint(payload));
    if (ver === '1') state.checklistState = {};   // FM1 沒有 checklist bits
    return state;
  }

  // ── Browser-only helpers (depend on MasteryStore / FinStorage / AnswerVerifier) ──

  const ADV_SALT = 'FinMathAdvancedSalt2026';

  function currentState() {
    return {
      examPassed:      MasteryStore.getExamPassed(),
      deliverableDone: MasteryStore.getDeliverableDone(),
      advancedChecks:  FinStorage.safeGetJSON(FinStorage.KEYS.ADVANCED_CHECKS) || {},
      checklistState:  FinStorage.safeGetJSON(FinStorage.KEYS.CHECKLIST_STATE)  || {},
    };
  }

  function applyState(decoded, mode) {
    let target;
    if (mode === 'union') {
      const cur = currentState();
      const ep  = [...new Set([...cur.examPassed,      ...decoded.examPassed])];
      const dd  = [...new Set([...cur.deliverableDone, ...decoded.deliverableDone])];
      const adv = { ...cur.advancedChecks };
      for (const [gid, items] of Object.entries(decoded.advancedChecks)) {
        adv[gid] = [...new Set([...(adv[gid] || []), ...items])].sort((a, b) => a - b);
      }
      const cl = { ...cur.checklistState };
      for (const [tid, items] of Object.entries(decoded.checklistState || {})) {
        cl[tid] = [...new Set([...(cl[tid] || []), ...items])].sort((a, b) => a - b);
      }
      target = { examPassed: ep, deliverableDone: dd, advancedChecks: adv, checklistState: cl };
    } else {
      target = decoded;
    }

    FinStorage.safeSet(FinStorage.KEYS.EXAM_PASSED,        JSON.stringify(target.examPassed));
    FinStorage.safeSet(FinStorage.KEYS.EXAM_SIG,           MasteryStore.calculateChecksum(target.examPassed));
    FinStorage.safeSet(FinStorage.KEYS.DELIVERABLE_DONE,   JSON.stringify(target.deliverableDone));
    FinStorage.safeSet(FinStorage.KEYS.DELIVERABLE_SIG,    MasteryStore.calculateChecksum(target.deliverableDone));

    const completed = target.examPassed.filter(id => target.deliverableDone.includes(id));
    FinStorage.safeSet(FinStorage.KEYS.COMPLETED_TOPICS,   JSON.stringify(completed));
    FinStorage.safeSet(FinStorage.KEYS.COMPLETED_CHECKSUM, MasteryStore.calculateChecksum(completed));

    FinStorage.safeSetJSON(FinStorage.KEYS.ADVANCED_CHECKS, target.advancedChecks);
    FinStorage.safeSet(FinStorage.KEYS.ADVANCED_CHECKS_SIG,
      AnswerVerifier.simpleHash(JSON.stringify(target.advancedChecks) + ADV_SALT));

    FinStorage.safeSetJSON(FinStorage.KEYS.CHECKLIST_STATE, target.checklistState || {});

    window.location.reload();
  }

  global.ProgressKey = { encode, decode, currentState, applyState };
})(typeof globalThis !== 'undefined' ? globalThis : /* istanbul ignore next */ window);
