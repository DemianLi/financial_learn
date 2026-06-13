// masteryStore.js — Dual-Evidence Mastery module
// Single seam for examPassed / deliverableDone / completedTopics state.
// Callers: app.js, studyTools.js, advancedMode.js — none touches FinStorage keys directly for mastery data.
window.MasteryStore = (function () {
  'use strict';

  const SECURE_SALT = "FinMathSecureSalt2026";

  function calculateChecksum(arr) {
    const sorted = [...arr].sort().join(',');
    return AnswerVerifier.simpleHash(sorted + SECURE_SALT);
  }

  function loadVerifiedArray(valKey, sigKey) {
    try {
      const val = FinStorage.safeGet(valKey);
      const sig = FinStorage.safeGet(sigKey);
      if (val) {
        const parsed = JSON.parse(val);
        if (calculateChecksum(parsed) === sig) return parsed;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function saveVerifiedArray(valKey, sigKey, arr) {
    FinStorage.safeSet(valKey, JSON.stringify(arr));
    FinStorage.safeSet(sigKey, calculateChecksum(arr));
  }

  let _topics = [];
  let _examPassed = [];
  let _deliverableDone = [];
  let _completedTopics = [];
  let _onChange = null;

  function init(syllabusTopics, onChange) {
    _topics = syllabusTopics;
    _onChange = onChange;

    // Load completedTopics with tamper-detection
    _completedTopics = (function () {
      try {
        const val = FinStorage.safeGet(FinStorage.KEYS.COMPLETED_TOPICS);
        const checksum = FinStorage.safeGet(FinStorage.KEYS.COMPLETED_CHECKSUM);
        if (val) {
          const parsed = JSON.parse(val);
          if (calculateChecksum(parsed) === checksum) return parsed;
          console.warn("⚠️ 偵測到 LocalStorage 數據篡改！學術誠實防護系統已重置您的學習進度！");
          FinStorage.safeSet(FinStorage.KEYS.COMPLETED_TOPICS, JSON.stringify([]));
          FinStorage.safeSet(FinStorage.KEYS.COMPLETED_CHECKSUM, calculateChecksum([]));
          return [];
        }
        return [];
      } catch (e) { return []; }
    })();

    // Backwards-compatible seed: existing users who completed topics get both evidences
    _examPassed = loadVerifiedArray(FinStorage.KEYS.EXAM_PASSED, FinStorage.KEYS.EXAM_SIG) || [..._completedTopics];
    _deliverableDone = loadVerifiedArray(FinStorage.KEYS.DELIVERABLE_DONE, FinStorage.KEYS.DELIVERABLE_SIG) || [..._completedTopics];
  }

  function _finalize() {
    _completedTopics = _topics
      .filter(t => _examPassed.includes(t.id) && _deliverableDone.includes(t.id))
      .map(t => t.id);
    FinStorage.safeSet(FinStorage.KEYS.COMPLETED_TOPICS, JSON.stringify(_completedTopics));
    FinStorage.safeSet(FinStorage.KEYS.COMPLETED_CHECKSUM, calculateChecksum(_completedTopics));
    if (_onChange) _onChange();
  }

  function recordExamPassed(topicId) {
    if (!_examPassed.includes(topicId)) {
      _examPassed.push(topicId);
      saveVerifiedArray(FinStorage.KEYS.EXAM_PASSED, FinStorage.KEYS.EXAM_SIG, _examPassed);
    }
    _finalize();
  }

  function recordDeliverableDone(topicId, thesisText) {
    if (!_deliverableDone.includes(topicId)) {
      _deliverableDone.push(topicId);
      saveVerifiedArray(FinStorage.KEYS.DELIVERABLE_DONE, FinStorage.KEYS.DELIVERABLE_SIG, _deliverableDone);
    }
    if (thesisText) {
      const stockId = sessionStorage.getItem('finmath_stock_id') || '2330';
      FinStorage.safeSet(FinStorage.KEYS.NOTE_PREFIX + topicId + '_' + stockId, thesisText);
    }
    _finalize();
  }

  return {
    init,
    recordExamPassed,
    recordDeliverableDone,
    isExamPassed: id => _examPassed.includes(id),
    isDeliverableDone: id => _deliverableDone.includes(id),
    isCompleted: id => _completedTopics.includes(id),
    getCompletedTopics: () => [..._completedTopics],
    getExamPassed: () => [..._examPassed],
    getDeliverableDone: () => [..._deliverableDone],
    calculateChecksum,
  };
})();
