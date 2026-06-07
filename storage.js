// storage.js - 集中 localStorage schema 的單一深模組
// 所有 key 字串定義於此；跨模組直接讀取彼此 key 的洩漏（尤其 advancedMode.js → app.js）
// 改為透過此模組的方法存取，讓 key 重命名只需改此一處。
window.FinStorage = (function () {
  'use strict';

  const KEYS = {
    // app.js 擁有
    COMPLETED_TOPICS:   'finmath_completed_topics',
    COMPLETED_CHECKSUM: 'finmath_completed_checksum',
    EXAM_PASSED:        'finmath_exam_passed',
    EXAM_SIG:           'finmath_exam_sig',
    DELIVERABLE_DONE:   'finmath_deliverable_done',
    DELIVERABLE_SIG:    'finmath_deliverable_sig',
    // studyTools.js 擁有
    MISTAKES:           'finmath_mistakes',
    DIAGNOSTIC:         'finmath_diagnostic',
    // advancedMode.js 擁有
    ADVANCED_CHECKS:    'finmath_advanced_checks',
    ADVANCED_CHECKS_SIG:'finmath_advanced_checks_sig',
    ADVANCED_SEEN:      'finmath_advanced_seen',
    // #19/#21 - setup guide + research notes
    SETUP_DISMISSED:    'finmath_setup_dismissed',
    NOTE_PREFIX:        'finmath_note_',
  };

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }
  function safeGetJSON(key) {
    try { const v = safeGet(key); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  function safeSetJSON(key, value) {
    safeSet(key, JSON.stringify(value));
  }

  // advancedMode.js 用此方法取得已完成章節數，而非直接讀取 COMPLETED_TOPICS key
  function getCompletedTopics() {
    return safeGetJSON(KEYS.COMPLETED_TOPICS) || [];
  }

  return { KEYS, safeGet, safeSet, safeGetJSON, safeSetJSON, getCompletedTopics };
})();
