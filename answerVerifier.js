// answerVerifier.js - 集中答題驗證邏輯的單一深模組
// simpleHash 與正確選項計算原散佈於 app.js / studyTools.js / advancedMode.js 各一份；
// 統一於此，hash 算法變更只需改此處。
window.AnswerVerifier = (function () {
  'use strict';

  function simpleHash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return Math.abs(h & 0xFFFFFFFF).toString(36);
  }

  // 判斷 selectedIdx 是否為正確選項
  function isCorrect(topicId, qIdx, selectedIdx, answerHash) {
    return simpleHash(topicId + '-' + qIdx + '-' + selectedIdx) === answerHash;
  }

  // 找出題目的正確選項 index（找不到回傳 -1）
  function correctIndexOf(topicId, qIdx, q) {
    for (let i = 0; i < q.options.length; i++) {
      if (simpleHash(topicId + '-' + qIdx + '-' + i) === q.answerHash) return i;
    }
    return -1;
  }

  return { simpleHash, isCorrect, correctIndexOf };
})();
