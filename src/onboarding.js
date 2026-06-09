// onboarding.js - Issue #8: First-visit onboarding tour (3 steps)
// Runs once for new users (no localStorage data); stores completion flag.

(function () {
  'use strict';

  if (FinStorage.safeGet(FinStorage.KEYS.ONBOARDING_DONE) === '1') return;

  // Skip for returning users who already have progress data
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

  // All three targets must be visible at tour start.
  // #detailCard lives inside .panel-right which is translateX(100%) / visibility:hidden
  // at page load — never use it as a spotlight target.
  const STEPS = [
    {
      selector: '.map-card',
      title: '互動學習地圖',
      body: '點擊任一章節節點（A–F），右側面板會展開知識大綱、考題與實戰程式碼。',
      position: 'right'
    },
    {
      selector: '#progressCard',
      title: '學習進度儀表板',
      body: '答對題目即完成章節，進度即時更新。提交微產出作業可取得雙證據，解鎖下一章節。',
      position: 'right'
    },
    {
      selector: '.header-actions',
      title: '更多工具',
      body: '可隨時進入學力模擬考，完成 A–F 全部章節後還會解鎖機構研究員進階模式。',
      position: 'below'
    }
  ];

  let current = 0;

  // ── DOM ──────────────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'onboardingOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;pointer-events:none';

  const spotlight = document.createElement('div');
  spotlight.id = 'onboardingSpotlight';
  spotlight.style.cssText = [
    'position:fixed', 'border-radius:10px',
    'box-shadow:0 0 0 9999px rgba(0,0,0,0.65)',
    'transition:top .3s ease,left .3s ease,width .3s ease,height .3s ease',
    'pointer-events:none', 'z-index:9001'
  ].join(';');

  const tooltip = document.createElement('div');
  tooltip.id = 'onboardingTooltip';
  tooltip.style.cssText = [
    'position:fixed', 'z-index:9002', 'pointer-events:auto',
    'background:#1a1a2e', 'border:1px solid #00ff88',
    'border-radius:10px', 'padding:1.1rem 1.25rem',
    'width:290px',
    'box-shadow:0 8px 32px rgba(0,255,136,0.15)',
    'font-family:sans-serif', 'color:#e0e0e0',
    'transition:top .3s ease,left .3s ease'
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

  // PAD around the highlighted element
  const PAD = 8;

  function getRect(el) {
    const r = el.getBoundingClientRect();
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

  // Estimate tooltip height at 290px width (title + body + buttons)
  const TW = 290;
  const TH = 210;
  const M  = 12; // margin from element / viewport edge

  function positionTooltip(rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const canRight = rect.right  + TW + M <= vw;
    const canLeft  = rect.left   - TW - M >= 0;
    const canBelow = rect.bottom + TH + M <= vh;
    const canAbove = rect.top    - TH - M >= 0;

    let top, left;

    if (canRight) {
      left = rect.right + M;
      top  = clamp(rect.top, M, vh - TH - M);
    } else if (canLeft) {
      left = rect.left - TW - M;
      top  = clamp(rect.top, M, vh - TH - M);
    } else if (canBelow) {
      top  = rect.bottom + M;
      left = clamp(rect.cx - TW / 2, M, vw - TW - M);
    } else if (canAbove) {
      top  = rect.top - TH - M;
      left = clamp(rect.cx - TW / 2, M, vw - TW - M);
    } else {
      // Last resort: centre in viewport
      top  = clamp((vh - TH) / 2, M, vh - TH - M);
      left = clamp((vw - TW) / 2, M, vw - TW - M);
    }

    tooltip.style.top  = top  + 'px';
    tooltip.style.left = left + 'px';
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(v, hi)); }

  function render(idx) {
    const step = STEPS[idx];
    const el = document.querySelector(step.selector);
    if (!el) { finish(); return; }

    // Scroll element into view (matters on mobile/tablet where page scrolls).
    // On desktop the page is overflow:hidden so this is a no-op.
    el.scrollIntoView({ block: 'nearest', behavior: 'instant' });

    // Wait one frame so layout reflects the scroll before we read coords.
    requestAnimationFrame(function () {
      const rect = getRect(el);

      spotlight.style.top    = rect.top    + 'px';
      spotlight.style.left   = rect.left   + 'px';
      spotlight.style.width  = rect.width  + 'px';
      spotlight.style.height = rect.height + 'px';

      positionTooltip(rect);
      tooltip.innerHTML = buildTooltipHTML(step, idx, STEPS.length);

      document.getElementById('ob-next').onclick = function () {
        if (idx + 1 < STEPS.length) { current = idx + 1; render(current); }
        else finish();
      };
      document.getElementById('ob-skip').onclick = finish;
    });
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

  window.addEventListener('load', function () {
    setTimeout(start, 800);
  });
})();
