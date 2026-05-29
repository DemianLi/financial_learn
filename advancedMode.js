// advancedMode.js - 進階圖譜控制器（機構市場研究員實戰養成）
// 解鎖條件：完成 A–F 全部 18 章 → 彈出式 Modal 新圖譜，10 個可通關的實戰模組。
// 此檔為 plug-and-play：刪除 index.html 中對應的 <script> 即可完全移除。

(function () {
  'use strict';

  const SVGNS = 'http://www.w3.org/2000/svg';
  const SALT = 'FinMathAdvancedSalt2026';

  // --- Storage helpers (safe) ---
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  function simpleHash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return Math.abs(h & 0xFFFFFFFF).toString(36);
  }
  function checksum(obj) { return simpleHash(JSON.stringify(obj) + SALT); }

  // --- Advanced state (checklist progress per module) ---
  const adv = {
    // checks: { g1: [0,2,3], ... }  已勾選的檢核項 index
    checks: (function () {
      try {
        const raw = store.get('finmath_advanced_checks');
        const sig = store.get('finmath_advanced_checks_sig');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (checksum(parsed) === sig) return parsed;
        }
      } catch (e) { /* fall through */ }
      return {};
    })(),
    activeId: null,
    opened: false
  };

  function saveChecks() {
    store.set('finmath_advanced_checks', JSON.stringify(adv.checks));
    store.set('finmath_advanced_checks_sig', checksum(adv.checks));
  }

  function moduleById(id) {
    return advancedSyllabus.modules.find(m => m.id === id);
  }
  function isModuleComplete(m) {
    const done = adv.checks[m.id] || [];
    return done.length >= m.checklist.length;
  }
  function completedCount() {
    return advancedSyllabus.modules.filter(isModuleComplete).length;
  }

  function isUnlocked() {
    try {
      const raw = store.get('finmath_completed_topics');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) && arr.length >= advancedSyllabus.meta.unlockRequirement;
    } catch (e) { return false; }
  }

  function getProgress() {
    return {
      done: completedCount(),
      total: advancedSyllabus.modules.length,
      unlocked: isUnlocked()
    };
  }

  // 通知主程式（app.js）刷新雷達圖與進度卡
  function notifyMain() {
    try { document.dispatchEvent(new CustomEvent('finmath-advanced-changed')); } catch (e) {}
  }

  // --- KaTeX-free light text (advanced content is prose; keep plain) ---
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ===========================================================
  // MODAL SHELL
  // ===========================================================
  function ensureModal() {
    let modal = document.getElementById('advancedModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'advancedModal';
    modal.className = 'modal-overlay adv-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="modal-box adv-modal-box">
        <div class="modal-header">
          <div>
            <h3 id="advancedModalTitle">🚀 ${esc(advancedSyllabus.meta.title)}</h3>
            <p class="adv-subtitle">${esc(advancedSyllabus.meta.subtitle)}</p>
          </div>
          <button id="btnCloseAdvanced" class="modal-close" aria-label="關閉進階圖譜">&times;</button>
        </div>
        <div class="adv-progress-strip">
          <div class="adv-progress-meta">
            <span>進階通關進度</span>
            <span id="advProgressText">0 / ${advancedSyllabus.modules.length}</span>
          </div>
          <div class="adv-progress-track"><div id="advProgressFill" class="adv-progress-fill"></div></div>
          <div id="advBadge" class="adv-badge" style="display:none;">🏅 ${esc(advancedSyllabus.meta.badge)}</div>
        </div>
        <div class="modal-body adv-body">
          <div class="adv-graph-pane">
            <svg id="advGraph" viewBox="0 0 570 760" width="100%" height="100%"></svg>
          </div>
          <div class="adv-detail-pane" id="advDetail">
            <div class="adv-detail-empty">← 點擊左側節點，開始一個機構研究實戰模組</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#btnCloseAdvanced').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    return modal;
  }

  // ===========================================================
  // GRAPH RENDER
  // ===========================================================
  function renderGraph() {
    const svg = document.getElementById('advGraph');
    if (!svg) return;
    svg.innerHTML = '';
    const accent = advancedSyllabus.meta.color;

    // connections
    advancedSyllabus.connections.forEach(c => {
      const a = moduleById(c.from), b = moduleById(c.to);
      if (!a || !b) return;
      const line = document.createElementNS(SVGNS, 'line');
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      const both = isModuleComplete(a) && isModuleComplete(b);
      line.setAttribute('class', 'adv-link' + (both ? ' done' : ''));
      svg.appendChild(line);
    });

    // nodes
    advancedSyllabus.modules.forEach(m => {
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', 'adv-node');
      g.setAttribute('id', 'adv-node-' + m.id);
      const done = isModuleComplete(m);
      const active = adv.activeId === m.id;
      if (done) g.classList.add('done');
      if (active) g.classList.add('active');

      const hit = document.createElementNS(SVGNS, 'circle');
      hit.setAttribute('cx', m.x); hit.setAttribute('cy', m.y);
      hit.setAttribute('r', 30); hit.setAttribute('fill', 'rgba(0,0,0,0)');
      hit.setAttribute('cursor', 'pointer');
      g.appendChild(hit);

      const ring = document.createElementNS(SVGNS, 'circle');
      ring.setAttribute('cx', m.x); ring.setAttribute('cy', m.y);
      ring.setAttribute('r', 22);
      ring.setAttribute('fill', active ? accent : 'var(--bg-secondary)');
      ring.setAttribute('stroke', done ? accent : (active ? accent : 'rgba(255,255,255,0.25)'));
      ring.setAttribute('stroke-width', '2.5');
      g.appendChild(ring);

      const icon = document.createElementNS(SVGNS, 'text');
      icon.setAttribute('x', m.x); icon.setAttribute('y', m.y + 5);
      icon.setAttribute('text-anchor', 'middle');
      icon.setAttribute('font-size', '16px');
      icon.textContent = m.icon;
      g.appendChild(icon);

      const num = document.createElementNS(SVGNS, 'text');
      num.setAttribute('x', m.x); num.setAttribute('y', m.y - 30);
      num.setAttribute('text-anchor', 'middle');
      num.setAttribute('class', 'adv-node-num');
      num.setAttribute('fill', accent);
      num.textContent = m.num;
      g.appendChild(num);

      const label = document.createElementNS(SVGNS, 'text');
      label.setAttribute('x', m.x); label.setAttribute('y', m.y + 42);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'adv-node-label');
      const short = m.title.split('：')[0];
      label.textContent = short.length > 12 ? short.slice(0, 11) + '…' : short;
      g.appendChild(label);

      if (done) {
        const chk = document.createElementNS(SVGNS, 'text');
        chk.setAttribute('x', m.x + 17); chk.setAttribute('y', m.y - 14);
        chk.setAttribute('text-anchor', 'middle');
        chk.setAttribute('font-size', '13px');
        chk.textContent = '✅';
        g.appendChild(chk);
      }

      g.addEventListener('click', () => selectModule(m.id));
      svg.appendChild(g);
    });
  }

  // ===========================================================
  // DETAIL PANE
  // ===========================================================
  function selectModule(id) {
    adv.activeId = id;
    renderGraph();
    renderDetail();
  }

  function renderDetail() {
    const pane = document.getElementById('advDetail');
    const m = moduleById(adv.activeId);
    if (!pane || !m) return;
    const accent = advancedSyllabus.meta.color;
    const done = adv.checks[m.id] || [];

    pane.innerHTML = `
      <div class="adv-detail-head">
        <span class="adv-detail-num" style="background:${accent}">${esc(m.num)}</span>
        <h2>${esc(m.icon)} ${esc(m.title)}</h2>
      </div>

      <div class="adv-gap">
        <h4>🚫 目前的學習缺口</h4>
        <p>${esc(m.gap)}</p>
      </div>

      <div class="adv-skill">
        <div class="adv-skill-head">
          <span class="adv-skill-title">對齊機構 Skill：${esc(m.skill.name)}</span>
          <span class="adv-skill-plugin">${esc(m.skill.plugin)}</span>
        </div>
        <p>${esc(m.skill.desc)}</p>
      </div>

      <div class="adv-obj">
        <h4>🎯 學習目標</h4>
        <ul>${m.objectives.map(o => `<li>${esc(o)}</li>`).join('')}</ul>
      </div>

      <div class="adv-code">
        <div class="adv-code-head">
          <h4>💻 FinMind 實戰任務（Python）</h4>
          <button class="adv-copy">Copy Code</button>
        </div>
        <pre><code>${esc(m.finmindCode)}</code></pre>
      </div>

      <div class="adv-checklist">
        <div class="adv-checklist-head">
          <h4>✅ 交付物檢核清單</h4>
          <span class="adv-checklist-count" id="advChkCount">${done.length} / ${m.checklist.length}</span>
        </div>
        <p class="adv-checklist-hint">勾選全部交付物即可通關此模組（這是「產出」，不是「答對」）。</p>
        <div class="adv-checklist-items">
          ${m.checklist.map((c, i) => `
            <button class="adv-check-item ${done.includes(i) ? 'checked' : ''}" data-idx="${i}">
              <span class="adv-check-box">${done.includes(i) ? '✓' : ''}</span>
              <span class="adv-check-text">${esc(c)}</span>
            </button>`).join('')}
        </div>
        <div class="adv-complete-banner" id="advCompleteBanner" style="display:${done.length >= m.checklist.length ? 'block' : 'none'}">
          🎉 模組 ${esc(m.num)} 已通關！你已補上這道機構研究門檻。
        </div>
      </div>
    `;

    // copy
    const copyBtn = pane.querySelector('.adv-copy');
    copyBtn.addEventListener('click', () => {
      try { navigator.clipboard.writeText(m.finmindCode); } catch (e) {}
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy Code', 1800);
    });

    // checklist toggles
    pane.querySelectorAll('.adv-check-item').forEach(btn => {
      btn.addEventListener('click', () => toggleCheck(m.id, parseInt(btn.dataset.idx, 10)));
    });
  }

  function toggleCheck(id, idx) {
    const m = moduleById(id);
    if (!adv.checks[id]) adv.checks[id] = [];
    const arr = adv.checks[id];
    const pos = arr.indexOf(idx);
    const wasComplete = arr.length >= m.checklist.length;
    if (pos >= 0) arr.splice(pos, 1); else arr.push(idx);
    saveChecks();
    renderDetail();
    renderGraph();
    updateAdvProgress();
    notifyMain();
    // celebrate transition to complete
    if (!wasComplete && arr.length >= m.checklist.length) {
      const banner = document.getElementById('advCompleteBanner');
      if (banner) { banner.style.display = 'block'; banner.classList.add('pop'); }
    }
  }

  function updateAdvProgress() {
    const total = advancedSyllabus.modules.length;
    const done = completedCount();
    const fill = document.getElementById('advProgressFill');
    const text = document.getElementById('advProgressText');
    const badge = document.getElementById('advBadge');
    if (fill) fill.style.width = `${Math.round((done / total) * 100)}%`;
    if (text) text.textContent = `${done} / ${total}`;
    if (badge) badge.style.display = (done >= total) ? 'inline-block' : 'none';
  }

  // ===========================================================
  // OPEN / CLOSE
  // ===========================================================
  function openModal() {
    const modal = ensureModal();
    renderGraph();
    updateAdvProgress();
    if (!adv.activeId) {
      // default to first incomplete module
      const firstIncomplete = advancedSyllabus.modules.find(m => !isModuleComplete(m));
      adv.activeId = (firstIncomplete || advancedSyllabus.modules[0]).id;
    }
    renderDetail();
    modal.classList.add('active');
    store.set('finmath_advanced_seen', '1');
  }
  function closeModal() {
    const modal = document.getElementById('advancedModal');
    if (modal) modal.classList.remove('active');
  }

  // ===========================================================
  // UNLOCK TRIGGER (called from app.js)
  // ===========================================================
  function refreshUnlock(completedTopics) {
    const need = advancedSyllabus.meta.unlockRequirement;
    const count = Array.isArray(completedTopics) ? completedTopics.length : 0;
    const btn = document.getElementById('btnAdvanced');
    const unlocked = count >= need;

    if (btn) {
      btn.style.display = unlocked ? 'inline-flex' : 'none';
      btn.classList.toggle('adv-unlocked', unlocked);
    }

    // 第一次達標 → 自動彈出新圖譜（符合「跳出進階模式就能看到新圖譜」）
    if (unlocked && !store.get('finmath_advanced_seen')) {
      setTimeout(openModal, 600);
    }
  }

  // ===========================================================
  // INIT
  // ===========================================================
  function init() {
    if (typeof advancedSyllabus === 'undefined') {
      console.warn('advancedData.js 未載入，進階模式停用');
      return;
    }
    const btn = document.getElementById('btnAdvanced');
    if (btn) btn.addEventListener('click', openModal);

    // 初始解鎖檢查（從 localStorage 讀已完成章節數）
    let completed = [];
    try {
      const raw = store.get('finmath_completed_topics');
      if (raw) completed = JSON.parse(raw);
    } catch (e) { /* ignore */ }
    refreshUnlock(completed);
  }

  // 對外接口，供 app.js 在進度更新時呼叫
  window.AdvancedMode = { refreshUnlock, open: openModal, getProgress };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
