// studyTools.js - P1 學習工具（錯題本落盤 + 起點診斷）
// 對齊 learn-anything-skill：把學習產出沉澱成可匯出的 Markdown（錯題本／學習計畫），
// 並在學習前做「判斷起點」。plug-and-play：刪除 index.html 對應 <script>/<link> 即可移除。

(function () {
  'use strict';

  const LETTERS = ['A', 'B', 'C', 'D'];
  const MK = 'finmath_mistakes';     // 錯題本
  const DK = 'finmath_diagnostic';   // 起點診斷結果

  // 同步關鍵樣式，避免外部 CSS 非同步載入前 modal 閃現
  if (!document.getElementById('studyToolsCritical')) {
    const s = document.createElement('style');
    s.id = 'studyToolsCritical';
    s.textContent = '.st-overlay{position:fixed;inset:0;opacity:0;pointer-events:none;}';
    document.head.appendChild(s);
  }

  function load(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function simpleHash(str) { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i); return Math.abs(h & 0xFFFFFFFF).toString(36); }

  // 輕量去除 LaTeX 記號，讓題目在錯題本／匯出中可讀
  function stripMath(t) {
    return String(t || '')
      .replace(/\$\$(.*?)\$\$/gs, '$1').replace(/\$(.*?)\$/gs, '$1')
      .replace(/\\mathbf\{([^{}]*)\}/g, '$1').replace(/\\text\{([^{}]*)\}/g, '$1')
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1/$2)')
      .replace(/\\times/g, '×').replace(/\\quad/g, ' ').replace(/[{}]/g, '')
      .replace(/\\[a-zA-Z]+/g, '').replace(/\s+/g, ' ').trim();
  }

  function topicById(id) { return (typeof syllabusData !== 'undefined' && syllabusData.topics.find(t => t.id === id)) || null; }
  function correctIdx(topicId, qIndex, q) {
    for (let i = 0; i < q.options.length; i++) if (simpleHash(topicId + '-' + qIndex + '-' + i) === q.answerHash) return i;
    return -1;
  }

  let mistakes = load(MK) || {};     // key: "topicId#qIndex"
  let diagnostic = load(DK) || null;

  // ---- 記錄錯題（由 app.js 派發的事件觸發）----
  function recordMistake(topicId, qIndex, chosenIdx) {
    const key = topicId + '#' + qIndex;
    const prev = mistakes[key];
    mistakes[key] = { topicId, qIndex, chosenIdx, count: prev ? prev.count + 1 : 1, ts: Date.now() };
    save(MK, mistakes);
    updateBadge();
  }
  function mistakeList() { return Object.values(mistakes).sort((a, b) => b.ts - a.ts); }

  function download(filename, text) {
    try {
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    } catch (e) { console.warn('download failed', e); }
  }

  // =====================================================
  // 錯題本匯出（Markdown）
  // =====================================================
  function mistakesMarkdown() {
    const list = mistakeList();
    let md = `# FinMath Map 錯題本\n\n> 匯出時間：${new Date().toLocaleString()}　|　共 ${list.length} 題\n\n`;
    if (!list.length) { md += '目前沒有錯題，繼續保持！\n'; return md; }
    // 依科目分組
    const bySubject = {};
    list.forEach(m => {
      const t = topicById(m.topicId); if (!t) return;
      (bySubject[t.subject] = bySubject[t.subject] || []).push(m);
    });
    Object.keys(bySubject).sort().forEach(sub => {
      const subInfo = syllabusData.subjects[sub];
      md += `## ${subInfo ? subInfo.title : '科目 ' + sub}\n\n`;
      bySubject[sub].forEach(m => {
        const t = topicById(m.topicId); const q = t.examQuestions[m.qIndex];
        const ci = correctIdx(m.topicId, m.qIndex, q);
        md += `### ${t.title}\n`;
        md += `- 題目：${stripMath(q.question)}\n`;
        md += `- 你的答案：(${LETTERS[m.chosenIdx]}) ${stripMath(q.options[m.chosenIdx])}\n`;
        md += `- 正解：(${LETTERS[ci]}) ${stripMath(q.options[ci])}\n`;
        md += `- 解析：${stripMath(q.explanation)}\n`;
        md += `- 錯誤次數：${m.count}\n\n`;
      });
    });
    md += `---\n_由 FinMath Map 學習工具匯出，對齊 learn-anything-skill 的「錯題/卡點記錄」。_\n`;
    return md;
  }
  function exportMistakesMd() { download('finmath-mistakes-log.md', mistakesMarkdown()); }

  // =====================================================
  // 起點診斷 → 學習計畫
  // =====================================================
  const DIAG_Q = [
    { key: 'level', label: '你的量化／財務基礎？', opts: [
      ['zero', '零基礎，想入門'], ['fin', '看得懂財報基本面'], ['py', '會寫 Python 跑資料'], ['pro', '有投資實戰經驗'] ] },
    { key: 'goal', label: '這次的學習目標？', opts: [
      ['intro', '建立直覺、先入門'], ['base', '系統打底（A–F）'], ['research', '進一步做機構研究（G）'], ['exam', '備考／面試準備'] ] },
    { key: 'hours', label: '每週可投入時數？', opts: [
      ['lt3', '少於 3 小時'], ['3to6', '3–6 小時'], ['6to10', '6–10 小時'], ['gt10', '10 小時以上'] ] }
  ];

  function buildPlan(ans) {
    const hoursMap = { lt3: 2.5, '3to6': 4.5, '6to10': 8, gt10: 12 };
    const wk = hoursMap[ans.hours] || 4.5;
    const totalHours = 18 * 1.5; // 18 章，每章約 1.5 小時（概念+測驗+微產出）
    const weeksAF = Math.max(2, Math.ceil(totalHours / wk));
    const start = '科目 A：基本面坐標系（A1 三維報表）';
    let focus, advNote, pace;
    if (ans.level === 'pro' || ans.level === 'py') {
      focus = '可較快通過 A–B，把時間留給 C 籌碼、D 消息與 F 台股在地化；務必親手跑每章 FinMind 微產出。';
    } else if (ans.level === 'fin') {
      focus = '基本面（A、B）會較順，重點放在量化化（向量/矩陣/機率）與籌碼、風險科目（C、E）。';
    } else {
      focus = '從 A1 紮實打底，先建立「報表＝坐標系」的直覺，不跳步；每章都完成微產出再前進。';
    }
    if (ans.goal === 'research') advNote = '完成 A–F 後直攻進階科目 G（機構研究實戰 10 模組），把研究產出做出來。';
    else if (ans.goal === 'exam') advNote = '多用「學力模擬考」反覆測，並善用錯題本回頭補弱項。';
    else if (ans.goal === 'intro') advNote = '先以 A–B 建立直覺即可，行有餘力再往 C–F。';
    else advNote = '目標 A–F 全通關，建立完整量化分析地圖。';
    pace = `每週約 ${wk} 小時 → 預估 ${weeksAF} 週可走完 A–F（每週約 ${Math.max(1, Math.round(18 / weeksAF))} 章）。`;
    return { start, focus, advNote, pace, weeksAF, wk };
  }

  function planMarkdown(ans, plan) {
    const lv = DIAG_Q[0].opts.find(o => o[0] === ans.level), gl = DIAG_Q[1].opts.find(o => o[0] === ans.goal), hr = DIAG_Q[2].opts.find(o => o[0] === ans.hours);
    return `# FinMath Map 學習計畫（起點診斷）\n\n> 產生時間：${new Date().toLocaleString()}\n\n` +
      `## 起點\n- 基礎：${lv ? lv[1] : ans.level}\n- 目標：${gl ? gl[1] : ans.goal}\n- 每週時數：${hr ? hr[1] : ans.hours}\n\n` +
      `## 建議\n- 起點章節：${plan.start}\n- 學習重點：${plan.focus}\n- 進階方向：${plan.advNote}\n- 節奏：${plan.pace}\n\n` +
      `## 里程碑與驗收\n- 每章通關需兩種證據：① 測驗答對 ② 完成微產出。\n- 每週至少完成 ${Math.max(1, Math.round(18 / plan.weeksAF))} 章並各留下一個微產出。\n- 答錯的題目用「錯題本」記錄，每週回頭重做一次。\n\n` +
      `---\n_由 FinMath Map 起點診斷產生，對齊 learn-anything-skill 的「判斷起點 + 學習計畫」。_\n`;
  }

  // =====================================================
  // UI
  // =====================================================
  function ensureButtons() {
    const ha = document.querySelector('.header-actions');
    if (!ha) return;
    if (!document.getElementById('btnDiagnostic')) {
      const b = document.createElement('button');
      b.id = 'btnDiagnostic'; b.className = 'btn'; b.innerHTML = '🎯 起點診斷';
      b.addEventListener('click', openDiagnostic);
      ha.insertBefore(b, ha.firstChild);
    }
    if (!document.getElementById('btnMistakes')) {
      const b = document.createElement('button');
      b.id = 'btnMistakes'; b.className = 'btn'; b.innerHTML = '📓 錯題本 <span id="stMistakeBadge" class="st-badge" style="display:none;">0</span>';
      b.addEventListener('click', openMistakes);
      ha.insertBefore(b, ha.firstChild);
    }
    updateBadge();
  }
  function updateBadge() {
    const badge = document.getElementById('stMistakeBadge');
    if (!badge) return;
    const n = mistakeList().length;
    badge.textContent = n;
    badge.style.display = n > 0 ? 'inline-block' : 'none';
  }

  function overlay(id) {
    let o = document.getElementById(id);
    if (o) return o;
    o = document.createElement('div');
    o.id = id; o.className = 'modal-overlay st-overlay';
    o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    document.body.appendChild(o);
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('active'); });
    return o;
  }

  // ---- 錯題本 modal ----
  function openMistakes() {
    const o = overlay('mistakesModal');
    const list = mistakeList();
    o.innerHTML = `
      <div class="modal-box" style="max-width:760px; max-height:88vh; display:flex; flex-direction:column;">
        <div class="modal-header">
          <h3>📓 錯題本　<span style="font-size:0.8rem; color:var(--text-secondary);">共 ${list.length} 題</span></h3>
          <button class="modal-close" data-close>&times;</button>
        </div>
        <div class="modal-body" style="overflow-y:auto;">
          ${list.length ? list.map(renderMistakeCard).join('') :
            '<p style="color:var(--text-muted); text-align:center; padding:2rem;">目前沒有錯題。答錯題目時會自動記錄到這裡。</p>'}
        </div>
        <div class="modal-footer">
          ${list.length ? '<button class="btn" data-clear>🗑️ 清空錯題本</button>' : ''}
          <button class="btn btn-primary" data-export ${list.length ? '' : 'disabled'}>📥 匯出 Markdown</button>
        </div>
      </div>`;
    o.querySelector('[data-close]').onclick = () => o.classList.remove('active');
    o.querySelector('[data-export]').onclick = exportMistakesMd;
    const clr = o.querySelector('[data-clear]');
    if (clr) clr.onclick = () => { mistakes = {}; save(MK, mistakes); updateBadge(); openMistakes(); };
    o.classList.add('active');
  }
  function renderMistakeCard(m) {
    const t = topicById(m.topicId); if (!t) return '';
    const q = t.examQuestions[m.qIndex]; const ci = correctIdx(m.topicId, m.qIndex, q);
    return `
      <div class="st-mistake">
        <div class="st-mistake-head"><span>${esc(t.title)}</span><span class="st-count">錯 ${m.count} 次</span></div>
        <p class="st-q">${esc(stripMath(q.question))}</p>
        <div class="st-ans st-wrong">你的答案：(${LETTERS[m.chosenIdx]}) ${esc(stripMath(q.options[m.chosenIdx]))}</div>
        <div class="st-ans st-right">正解：(${LETTERS[ci]}) ${esc(stripMath(q.options[ci]))}</div>
        <details class="st-exp"><summary>解析</summary><p>${esc(stripMath(q.explanation))}</p></details>
      </div>`;
  }

  // ---- 起點診斷 modal ----
  function openDiagnostic() {
    const o = overlay('diagnosticModal');
    o.innerHTML = `
      <div class="modal-box" style="max-width:600px; max-height:88vh; display:flex; flex-direction:column;">
        <div class="modal-header">
          <h3>🎯 起點診斷</h3>
          <button class="modal-close" data-close>&times;</button>
        </div>
        <div class="modal-body" id="diagBody" style="overflow-y:auto;">
          ${diagnostic ? renderPlanView(diagnostic) : renderDiagForm()}
        </div>
      </div>`;
    o.querySelector('[data-close]').onclick = () => o.classList.remove('active');
    wireDiag(o);
    o.classList.add('active');
  }
  function renderDiagForm() {
    return `<p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1rem;">回答 3 題，我幫你判斷起點並產生學習計畫（可匯出 Markdown）。</p>` +
      DIAG_Q.map(q => `
        <div class="st-diag-q" data-key="${q.key}">
          <div class="st-diag-label">${esc(q.label)}</div>
          <div class="st-diag-opts">
            ${q.opts.map(o => `<button class="st-opt" data-val="${o[0]}">${esc(o[1])}</button>`).join('')}
          </div>
        </div>`).join('') +
      `<button class="btn btn-primary" id="btnDiagSubmit" style="width:100%; margin-top:0.5rem;" disabled>產生學習計畫</button>`;
  }
  function renderPlanView(d) {
    const plan = buildPlan(d);
    return `
      <div class="st-plan">
        <h4 style="margin-top:0;">建議學習計畫</h4>
        <div class="st-plan-row"><b>起點章節</b><span>${esc(plan.start)}</span></div>
        <div class="st-plan-row"><b>學習重點</b><span>${esc(plan.focus)}</span></div>
        <div class="st-plan-row"><b>進階方向</b><span>${esc(plan.advNote)}</span></div>
        <div class="st-plan-row"><b>節奏</b><span>${esc(plan.pace)}</span></div>
        <p style="font-size:0.78rem; color:var(--text-muted); margin-top:0.8rem;">每章通關需兩種證據：① 測驗答對 ② 完成微產出。答錯的題會進錯題本。</p>
      </div>
      <div style="display:flex; gap:0.5rem; margin-top:1rem;">
        <button class="btn" id="btnDiagRedo">重新診斷</button>
        <button class="btn btn-primary" id="btnDiagExport" style="flex:1;">📥 匯出學習計畫</button>
      </div>`;
  }
  function wireDiag(o) {
    const body = o.querySelector('#diagBody');
    const answers = diagnostic ? { ...diagnostic } : {};
    // 選項點選
    body.querySelectorAll('.st-diag-q').forEach(qEl => {
      const key = qEl.dataset.key;
      qEl.querySelectorAll('.st-opt').forEach(btn => {
        btn.onclick = () => {
          qEl.querySelectorAll('.st-opt').forEach(b => b.classList.remove('sel'));
          btn.classList.add('sel');
          answers[key] = btn.dataset.val;
          const submit = body.querySelector('#btnDiagSubmit');
          if (submit) submit.disabled = !(answers.level && answers.goal && answers.hours);
        };
      });
    });
    const submit = body.querySelector('#btnDiagSubmit');
    if (submit) submit.onclick = () => { diagnostic = answers; save(DK, diagnostic); body.innerHTML = renderPlanView(diagnostic); wireDiag(o); };
    const redo = body.querySelector('#btnDiagRedo');
    if (redo) redo.onclick = () => { diagnostic = null; save(DK, null); body.innerHTML = renderDiagForm(); wireDiag(o); };
    const exp = body.querySelector('#btnDiagExport');
    if (exp) exp.onclick = () => { const plan = buildPlan(diagnostic); download('finmath-learning-plan.md', planMarkdown(diagnostic, plan)); };
  }

  // ---- init ----
  function init() {
    ensureButtons();
    document.addEventListener('finmath-mistake', e => {
      const d = e.detail || {};
      if (d.topicId != null && d.qIndex != null && d.chosenIdx != null) recordMistake(d.topicId, d.qIndex, d.chosenIdx);
    });
  }

  window.StudyTools = { recordMistake, openMistakes, openDiagnostic, _exportMistakesMd: exportMistakesMd, _mistakesMarkdown: mistakesMarkdown, _buildPlan: buildPlan, _planMarkdown: planMarkdown };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
