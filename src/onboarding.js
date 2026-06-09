// onboarding.js - Issue #8: First-visit onboarding tour (3 steps)
// Runs once for new users (no localStorage data); stores completion flag.

(function () {
  'use strict';

  // Don't run if user has already seen the tour
  if (FinStorage.safeGet(FinStorage.KEYS.ONBOARDING_DONE) === '1') return;

  // Don't run if the user already has existing progress (returning user with old data)
  const hasProgress = (function () {
    const completed = FinStorage.getCompletedTopics();
    if (completed && completed.length > 0) return true;
    if (FinStorage.safeGet(FinStorage.KEYS.MISTAKES)) return true;
    return false;
  })();
  if (hasProgress) {
    FinStorage.safeSet(FinStorage.KEYS.ONBOARDING_DONE, '1');
    return;
  }

  const STEPS = [
    {
      selector: '.map-card',
      title: '互動學習地圖',
      body: '點擊任一章節節點（A–F），展開該章節的知識大綱與題目。',
      position: 'right'
    },
    {
      selector: '#detailCard',
      title: '答題闖關',
      body: '答對題目即可完成章節。每章都有比喻直覺、考點與實戰程式碼供學習。',
      position: 'left'
    },
    {
      selector: '#progressCard',
      title: '雙證據解鎖制',
      body: '提交微產出作業後，連同答題通關可取得雙證據，解鎖下一章節。',
      position: 'left'
    }
  ];

  let current = 0;

  // ── DOM ──────────────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'onboardingOverlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9000',
    'pointer-events:none'
  ].join(';');

  const spotlight = document.createElement('div');
  spotlight.id = 'onboardingSpotlight';
  spotlight.style.cssText = [
    'position:fixed', 'border-radius:10px',
    'box-shadow:0 0 0 9999px rgba(0,0,0,0.65)',
    'transition:top .35s ease,left .35s ease,width .35s ease,height .35s ease',
    'pointer-events:none', 'z-index:9001'
  ].join(';');

  const tooltip = document.createElement('div');
  tooltip.id = 'onboardingTooltip';
  tooltip.style.cssText = [
    'position:fixed', 'z-index:9002', 'pointer-events:auto',
    'background:#1a1a2e', 'border:1px solid #00ff88',
    'border-radius:10px', 'padding:1.1rem 1.25rem',
    'max-width:300px', 'min-width:220px',
    'box-shadow:0 8px 32px rgba(0,255,136,0.15)',
    'font-family:sans-serif', 'color:#e0e0e0',
    'transition:top .35s ease,left .35s ease'
  ].join(';');

  function buildTooltipHTML(step, idx, total) {
    const isLast = idx === total - 1;
    return `
      <div style="font-size:.7rem;color:#00ff88;letter-spacing:.08em;margin-bottom:.4rem;">
        步驟 ${idx + 1} / ${total}
      </div>
      <div style="font-weight:700;font-size:1rem;margin-bottom:.5rem;color:#fff;">
        ${step.title}
      </div>
      <div style="font-size:.88rem;line-height:1.55;margin-bottom:1rem;">
        ${step.body}
      </div>
      <div style="display:flex;gap:.6rem;justify-content:flex-end;">
        <button id="ob-skip" style="
          background:transparent;border:1px solid #555;color:#aaa;
          border-radius:6px;padding:.35rem .8rem;cursor:pointer;font-size:.82rem;
        ">跳過引導</button>
        <button id="ob-next" style="
          background:#00ff88;border:none;color:#0a0a0f;
          border-radius:6px;padding:.35rem .9rem;cursor:pointer;
          font-weight:700;font-size:.88rem;
        ">${isLast ? '開始學習' : '下一步 →'}</button>
      </div>`;
  }

  function getRect(selector) {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const PAD = 8;
    return {
      top:    r.top    - PAD,
      left:   r.left   - PAD,
      width:  r.width  + PAD * 2,
      height: r.height + PAD * 2,
      right:  r.right  + PAD,
      bottom: r.bottom + PAD,
      cx:     r.left   + r.width  / 2,
      cy:     r.top    + r.height / 2
    };
  }

  function positionTooltip(rect, position) {
    const TW = 310, TH = 180;
    const vw = window.innerWidth, vh = window.innerHeight;
    let top, left;

    if (position === 'right' && rect.right + TW + 16 <= vw) {
      left = rect.right + 12;
      top  = Math.max(12, Math.min(rect.top, vh - TH - 12));
    } else if (position === 'left' && rect.left - TW - 12 >= 0) {
      left = rect.left - TW - 12;
      top  = Math.max(12, Math.min(rect.top, vh - TH - 12));
    } else {
      // Fallback: below the element, centred
      top  = Math.min(rect.bottom + 12, vh - TH - 12);
      left = Math.max(12, Math.min(rect.cx - TW / 2, vw - TW - 12));
    }

    tooltip.style.top  = top  + 'px';
    tooltip.style.left = left + 'px';
  }

  function render(idx) {
    const step = STEPS[idx];
    const rect = getRect(step.selector);
    if (!rect) { finish(); return; }

    spotlight.style.top    = rect.top    + 'px';
    spotlight.style.left   = rect.left   + 'px';
    spotlight.style.width  = rect.width  + 'px';
    spotlight.style.height = rect.height + 'px';

    positionTooltip(rect, step.position);
    tooltip.innerHTML = buildTooltipHTML(step, idx, STEPS.length);

    document.getElementById('ob-next').onclick = function () {
      if (idx + 1 < STEPS.length) { current = idx + 1; render(current); }
      else finish();
    };
    document.getElementById('ob-skip').onclick = finish;
  }

  function finish() {
    FinStorage.safeSet(FinStorage.KEYS.ONBOARDING_DONE, '1');
    overlay.remove();
    spotlight.remove();
    tooltip.remove();
  }

  function start() {
    document.body.appendChild(overlay);
    document.body.appendChild(spotlight);
    document.body.appendChild(tooltip);
    render(0);
  }

  // Wait for the page to fully render before starting
  window.addEventListener('load', function () {
    setTimeout(start, 800);
  });
})();
