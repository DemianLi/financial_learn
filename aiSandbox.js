/* aiSandbox.js - Plug-and-play AI Analyst Sandbox Plugin (Experimental & Reversible) */

(function() {
  document.addEventListener('DOMContentLoaded', () => {
    // 0. 同步注入「關鍵隱藏樣式」：外部 aiSandbox.css 為非同步載入，
    //    若先把 modal 加進 DOM，會在樣式套用前以無樣式狀態整頁閃現一下再消失。
    //    這段同步 <style> 確保 modal 從第一次繪製起就是隱藏的。
    if (!document.getElementById('aiSandboxCritical')) {
      const criticalStyle = document.createElement('style');
      criticalStyle.id = 'aiSandboxCritical';
      criticalStyle.textContent = '.ai-modal-overlay{position:fixed;inset:0;opacity:0;pointer-events:none;}';
      document.head.appendChild(criticalStyle);
    }

    // 1. Proactively inject custom CSS stylesheet to maintain HTML integrity
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = 'aiSandbox.css';
    document.head.appendChild(styleLink);

    // 2. Locate header buttons and inject the launch button
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      const btnAi = document.createElement('button');
      btnAi.id = 'btnAiAnalyst';
      btnAi.className = 'btn';
      btnAi.style.background = 'linear-gradient(135deg, hsl(263, 90%, 65%) 0%, hsl(187, 92%, 45%) 100%)';
      btnAi.style.border = 'none';
      btnAi.style.fontWeight = '700';
      btnAi.style.boxShadow = '0 0 12px rgba(139, 92, 246, 0.4)';
      btnAi.style.marginRight = '0.5rem';
      btnAi.innerHTML = '🤖 台股 AI 分析師';
      
      // Inject as the first action item in header
      headerActions.insertBefore(btnAi, headerActions.firstChild);

      // 3. Inject Modal HTML into body to prevent index.html pollution
      injectModalHtml();

      // 4. Setup interaction listeners and events
      setupSandboxEvents(btnAi);
    }
  });

  // --- DYNAMIC MODAL HTML INJECTION ---
  function injectModalHtml() {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'aiSandboxModal';
    modalDiv.className = 'ai-modal-overlay';
    modalDiv.setAttribute('role', 'dialog');
    modalDiv.setAttribute('aria-modal', 'true');
    modalDiv.setAttribute('aria-labelledby', 'aiModalTitle');

    modalDiv.innerHTML = `
      <div class="ai-modal-box">
        <div class="ai-modal-header">
          <h3 id="aiModalTitle" class="ai-modal-title">🤖 台股 AI 多智能體分析師沙盒</h3>
          <button id="btnCloseAiSandbox" class="ai-modal-close" aria-label="關閉沙盒">&times;</button>
        </div>

        <div style="margin:0 1.5rem; padding:0.5rem 0.8rem; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:6px; font-size:0.72rem; color:#fcd34d; line-height:1.5;">
          ⚠️ 本沙盒為教學模擬：WACC、無風險利率、ERP、基尼係數、稅率等數值為<strong>示例</strong>，非真實或即時資料；實務請以公開資訊觀測站、中央銀行、財政部等官方來源為準。
        </div>

        <div class="ai-modal-body">
          <!-- LEFT COLUMN: Parameter Controls & Agent Topology SVG Map -->
          <div class="ai-col-left">
            <div class="ai-card">
              <h4 style="font-size:0.95rem; margin-bottom:0.8rem; display:flex; justify-content:space-between; align-items:center;">
                <span>⚙️ 參數調校與智能體控制</span>
                <span style="font-size:0.7rem; color:var(--ai-secondary); border:1px solid var(--ai-secondary); padding:0.15rem 0.4rem; border-radius:4px;">學術沙盒</span>
              </h4>
              
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.8rem; margin-bottom:1rem;">
                <div class="ai-form-group">
                  <label for="aiStockSelector">目標台股個股</label>
                  <select id="aiStockSelector" class="ai-select">
                    <option value="2330">2330 台積電 (晶圓代工)</option>
                    <option value="2454">2454 聯發科 (IC設計)</option>
                    <option value="2317">2317 鴻海 (智慧製造)</option>
                    <option value="2002">2002 中鋼 (傳統重工)</option>
                    <option value="2881">2881 富邦金 (金融金控)</option>
                  </select>
                </div>
                
                <div class="ai-form-group">
                  <label for="aiValType">估值基底 (自動適應)</label>
                  <select id="aiValType" class="ai-select" disabled>
                    <option value="dcf">DCF 時間積分 (成長股模式)</option>
                    <option value="pb">P/B-ROE 空間變換 (循環/金融)</option>
                  </select>
                </div>
              </div>

              <!-- Parameter Sliders -->
              <div style="display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1.2rem;">
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <span style="font-size:0.78rem; font-weight:600;">WACC (折現率): <span id="labelAiWacc" style="color:var(--ai-secondary); font-weight:700;">7.5%</span></span>
                  <input type="range" id="slideAiWacc" min="5.0" max="15.0" step="0.5" value="7.5" style="width:55%; cursor:ew-resize;">
                </div>
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <span style="font-size:0.78rem; font-weight:600;">永續成長率 g: <span id="labelAiG" style="color:var(--ai-secondary); font-weight:700;">2.0%</span></span>
                  <input type="range" id="slideAiG" min="0.5" max="5.0" step="0.5" value="2.0" style="width:55%; cursor:ew-resize;">
                </div>
              </div>

              <button id="btnRunAiSimulation" class="btn-ai-run" style="width:100%;">
                🚀 啟動多智能體協同估值分析
              </button>
            </div>

            <!-- Agent Topology Diagram Card -->
            <div class="ai-card" style="flex: 1; display: flex; flex-direction: column;">
              <h4 style="font-size:0.9rem; margin-bottom:0.5rem; color:#f8fafc;">📊 智能體協同拓撲圖 (Multi-Agent Topology)</h4>
              
              <div class="ai-topology-wrapper">
                <svg id="aiTopoMap" class="ai-topo-svg" viewBox="0 0 400 280">
                  <!-- Connection Links -->
                  <path id="link-1-2" class="topo-link" d="M 90 70 L 310 70" />
                  <path id="link-2-3" class="topo-link" d="M 310 70 L 310 210" />
                  <path id="link-3-4" class="topo-link" d="M 310 210 L 90 210" />
                  <path id="link-4-1" class="topo-link" d="M 90 210 L 90 70" />

                  <!-- Node 1: Sourcing -->
                  <g id="node-sourcing" class="topo-node">
                    <circle class="glow" cx="90" cy="70" r="22" fill="none" stroke="hsl(142, 70%, 50%)" stroke-width="2" />
                    <circle class="core" cx="90" cy="70" r="16" fill="var(--bg-secondary)" stroke="var(--border-color)" stroke-width="2.5" />
                    <text cx="90" cy="70" x="90" y="74" text-anchor="middle" font-size="14px">🔎</text>
                    <text x="90" y="103" text-anchor="middle" font-size="10px" font-weight="600" fill="#94a3b8">1.籌碼數據</text>
                  </g>

                  <!-- Node 2: Modeling -->
                  <g id="node-modeling" class="topo-node">
                    <circle class="glow" cx="310" cy="70" r="22" fill="none" stroke="hsl(187, 92%, 45%)" stroke-width="2" />
                    <circle class="core" cx="310" cy="70" r="16" fill="var(--bg-secondary)" stroke="var(--border-color)" stroke-width="2.5" />
                    <text cx="310" cy="70" x="310" y="74" text-anchor="middle" font-size="14px">📊</text>
                    <text x="310" y="103" text-anchor="middle" font-size="10px" font-weight="600" fill="#94a3b8">2.估值建模</text>
                  </g>

                  <!-- Node 3: Compliance -->
                  <g id="node-compliance" class="topo-node">
                    <circle class="glow" cx="310" cy="210" r="22" fill="none" stroke="hsl(24, 95%, 55%)" stroke-width="2" />
                    <circle class="core" cx="310" cy="210" r="16" fill="var(--bg-secondary)" stroke="var(--border-color)" stroke-width="2.5" />
                    <text cx="310" cy="210" x="310" y="214" text-anchor="middle" font-size="14px">⚖️</text>
                    <text x="310" y="243" text-anchor="middle" font-size="10px" font-weight="600" fill="#94a3b8">3.法規稅務</text>
                  </g>

                  <!-- Node 4: Synthesis -->
                  <g id="node-synthesis" class="topo-node">
                    <circle class="glow" cx="90" cy="210" r="22" fill="none" stroke="hsl(263, 90%, 65%)" stroke-width="2" />
                    <circle class="core" cx="90" cy="210" r="16" fill="var(--bg-secondary)" stroke="var(--border-color)" stroke-width="2.5" />
                    <text cx="90" cy="210" x="90" y="214" text-anchor="middle" font-size="14px">✍️</text>
                    <text x="90" y="243" text-anchor="middle" font-size="10px" font-weight="600" fill="#94a3b8">4.首次覆蓋</text>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Real-time Terminal Console & Generated Deliverable Card -->
          <div class="ai-col-right">
            <!-- Console Output Terminal -->
            <div id="aiTerminal" class="ai-terminal">
              <div class="ai-terminal-header">
                <span>🤖 QUANT AGENT SYSTEM CONSOLE</span>
                <span id="terminalStatus">IDLE</span>
              </div>
              <div id="terminalBody" style="display:flex; flex-direction:column; gap:0.4rem;">
                <div class="terminal-line" style="color:#64748b;">[SYSTEM] 智能體沙盒已準備就緒，請在左側設定參數並點擊「啟動」...</div>
              </div>
            </div>

            <!-- Generated Research Report Deliverable Card -->
            <div id="aiDeliverableCard" class="ai-deliverable-card">
              <div class="ai-del-header">
                <span id="aiDelTitle" class="ai-del-title">🎯 台積電 (2330) 首次覆蓋報告</span>
                <span class="ai-del-badge">AI CO-WORKED</span>
              </div>
              <p id="aiDelDesc" class="ai-del-desc">
                本報告由 4 個 Agent 協同生成，基於 DCF 時間積分法與集保股權籌碼張量模型。估值結論已通過與 Excel 數據包公式勾稽的一致性審計。
              </p>
              
              <div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.2); padding:0.6rem 0.8rem; border-radius:6px; margin-bottom:0.8rem; font-size:0.75rem;">
                <div>WACC: <strong id="valWacc" style="color:var(--ai-secondary);">7.5%</strong></div>
                <div>永續 g: <strong id="valG" style="color:var(--ai-secondary);">2.0%</strong></div>
                <div>目標估值: <strong id="valTarget" style="color:var(--ai-success); font-weight:700;">NT$ 1024</strong></div>
              </div>

              <div class="ai-del-actions">
                <button id="btnViewReport" class="btn-ai-action btn-ai-action-primary">📄 閱讀完整報告</button>
                <button id="btnDownloadXls" class="btn-ai-action">📥 下載審計資料包 (XLS)</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalDiv);
  }

  // --- INTERACTION EVENT CONTROLLER ---
  function setupSandboxEvents(btnLaunch) {
    const modal = document.getElementById('aiSandboxModal');
    const btnClose = document.getElementById('btnCloseAiSandbox');
    const btnRun = document.getElementById('btnRunAiSimulation');
    const stockSelector = document.getElementById('aiStockSelector');
    const valTypeSelector = document.getElementById('aiValType');
    
    // Sliders
    const slideWacc = document.getElementById('slideAiWacc');
    const slideG = document.getElementById('slideAiG');
    const labelWacc = document.getElementById('labelAiWacc');
    const labelG = document.getElementById('labelAiG');

    // Synchronize selector based on chosen stock (P/B for Steel/Financial, DCF for Tech)
    function syncValuationSelector() {
      const stock = stockSelector.value;
      if (stock === '2002' || stock === '2881') {
        valTypeSelector.value = 'pb';
        // Adjust labels of sliders for P/B mode
        slideWacc.disabled = true;
        slideG.disabled = true;
        labelWacc.innerHTML = `<span style="color:#64748b;">N/A (中鋼/富邦金)</span>`;
        labelG.innerHTML = `<span style="color:#64748b;">N/A (中鋼/富邦金)</span>`;
      } else {
        valTypeSelector.value = 'dcf';
        slideWacc.disabled = false;
        slideG.disabled = false;
        labelWacc.textContent = `${parseFloat(slideWacc.value).toFixed(1)}%`;
        labelG.textContent = `${parseFloat(slideG.value).toFixed(1)}%`;
      }
    }

    stockSelector.addEventListener('change', syncValuationSelector);

    slideWacc.addEventListener('input', () => {
      labelWacc.textContent = `${parseFloat(slideWacc.value).toFixed(1)}%`;
    });
    slideG.addEventListener('input', () => {
      labelG.textContent = `${parseFloat(slideG.value).toFixed(1)}%`;
    });

    // Launch & Close handlers
    btnLaunch.addEventListener('click', () => {
      modal.classList.add('active');
    });

    btnClose.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });

    // Run Simulation click handler
    btnRun.addEventListener('click', () => {
      runSimulation(btnRun, stockSelector.value, parseFloat(slideWacc.value), parseFloat(slideG.value));
    });
  }

  // --- MULTI-AGENT SIMULATION WORKFLOW ---
  function runSimulation(btnRun, stockId, waccVal, gVal) {
    // Disable inputs
    btnRun.disabled = true;
    document.getElementById('aiStockSelector').disabled = true;
    document.getElementById('slideAiWacc').disabled = true;
    document.getElementById('slideAiG').disabled = true;

    // Reset Terminal & Deliverable Card
    const termBody = document.getElementById('terminalBody');
    const termStatus = document.getElementById('terminalStatus');
    const delCard = document.getElementById('aiDeliverableCard');
    
    termBody.innerHTML = '';
    termStatus.textContent = 'RUNNING';
    termStatus.style.color = 'var(--ai-secondary)';
    delCard.style.display = 'none';

    // Reset SVG Nodes & Links
    resetTopologyUI();

    // Stock Info Dictionary
    const stockInfo = {
      '2330': { name: '台積電', fcf: 490, basePrice: 1024, type: 'dcf' },
      '2454': { name: '聯發科', fcf: 120, basePrice: 1180, type: 'dcf' },
      '2317': { name: '鴻海', fcf: 180, basePrice: 185, type: 'dcf' },
      '2002': { name: '中鋼', fcf: 35, basePrice: 24.5, type: 'pb', pb: 0.8 },
      '2881': { name: '富邦金', fcf: 65, basePrice: 72.8, type: 'pb', pb: 1.1 }
    };
    const s = stockInfo[stockId];

    // Build print queue
    const printQueue = [];

    // Stage 1: Data Sourcing Agent
    printQueue.push({ node: 'sourcing', link: '1-2', color: 'var(--ai-success)', text: `[SYSTEM] 🚀 啟動 ${stockId} ${s.name} 多智能體自動化估值分析排程...`, delay: 100 });
    printQueue.push({ node: 'sourcing', link: '1-2', color: 'var(--ai-success)', text: `🔎 [Sourcing Agent] 正在連接台股高頻籌碼與新聞資料庫... 成功。`, delay: 600 });
    printQueue.push({ node: 'sourcing', link: '1-2', color: 'var(--ai-success)', text: `🔎 [Sourcing Agent] 調用 API 獲取集保股權分散矩陣：發行總股數 ${s.fcf * 20} 萬股。`, delay: 1100 });
    printQueue.push({ node: 'sourcing', link: '1-2', color: 'var(--ai-success)', text: `🔎 [Sourcing Agent] 正在計算千張大戶股權基尼係數 (Gini Coefficient)...`, delay: 1600 });
    
    // Custom chips result based on stock
    const giniVal = stockId === '2330' ? 0.83 : (stockId === '2454' ? 0.79 : 0.65);
    printQueue.push({ node: 'sourcing', link: '1-2', color: 'var(--ai-success)', text: `🔎 [Sourcing Agent] 籌碼張量結果：基尼係數為 ${giniVal}x（千張大戶持股高度集中，主力動能凝聚）。`, delay: 2100 });
    if (stockId === '2330' || stockId === '2454' || stockId === '2317') {
      printQueue.push({ node: 'sourcing', link: '1-2', color: 'var(--ai-success)', text: `🔎 [Sourcing Agent] 抓取昨日美股 ADR/GDR 最新折溢價率... 最新數據為 +2.6%。`, delay: 2600 });
    } else {
      printQueue.push({ node: 'sourcing', link: '1-2', color: 'var(--ai-success)', text: `🔎 [Sourcing Agent] 該個股無主要海外存託憑證 (ADR) 雙重上市，豁免溢價率檢測。`, delay: 2600 });
    }
    printQueue.push({ node: 'sourcing', link: '1-2', color: 'var(--ai-success)', text: `🔎 [Sourcing Agent] 數據打包完畢，成功發送至估值建模智能體。`, delay: 3000 });

    // Stage 2: Valuation Modeling Agent
    if (s.type === 'dcf') {
      const calculatedVal = Math.round(s.basePrice * (7.5 / waccVal) * (1 + (gVal - 2) / 30));
      printQueue.push({ node: 'modeling', link: '2-3', color: 'var(--ai-secondary)', text: `📊 [Modeling Agent] 接收基本面特徵向量，啟動自動化損益/資產連動折現模型...`, delay: 3500 });
      printQueue.push({ node: 'modeling', link: '2-3', color: 'var(--ai-secondary)', text: `📊 [Modeling Agent] 載入用戶自定義參數：WACC = ${waccVal}%, 永續成長率 g = ${gVal}%。`, delay: 4000 });
      printQueue.push({ node: 'modeling', link: '2-3', color: 'var(--ai-secondary)', text: `📊 [Modeling Agent] 折現無風險利率基準：台灣 10 年期政府公債殖利率 (1.55%)，ERP = 6.2%。`, delay: 4500 });
      printQueue.push({ node: 'modeling', link: '2-3', color: 'var(--ai-secondary)', text: `📊 [Modeling Agent] 正在採用 Gordon Growth Model 計算 Terminal Value (TV) 永續增長折現...`, delay: 5000 });
      printQueue.push({ node: 'modeling', link: '2-3', color: 'var(--ai-secondary)', isMath: true, text: `$$PV = \\sum_{t=1}^5 \\frac{FCF_t}{(1+WACC)^t} + \\frac{TV}{(1+WACC)^5}$$`, delay: 5500 });
      printQueue.push({ node: 'modeling', link: '2-3', color: 'var(--ai-secondary)', text: `📊 [Modeling Agent] 估值計算完成：${s.name} 理論合理股價為 NT$ ${calculatedVal} 元/股。`, delay: 6500 });
      printQueue.push({ node: 'modeling', link: '2-3', color: 'var(--ai-secondary)', targetVal: calculatedVal, text: `📊 [Modeling Agent] 模型生成完畢，已發送至合規風控智能體進行稅務與限額核算。`, delay: 7000 });
    } else {
      // P/B Valuation Mode for Steel & Finance
      const calculatedVal = Math.round(s.basePrice * 1.05);
      printQueue.push({ node: 'modeling', link: '2-3', color: 'var(--ai-secondary)', text: `📊 [Modeling Agent] 偵測到傳統景氣循環股，盈餘座標發散，啟動『P/B-ROE 評價模型』...`, delay: 3500 });
      printQueue.push({ node: 'modeling', link: '2-3', color: 'var(--ai-secondary)', text: `📊 [Modeling Agent] 正在依據資產基礎價值，將估值基底切換至淨資產（資產負債）面...`, delay: 4200 });
      printQueue.push({ node: 'modeling', link: '2-3', color: 'var(--ai-secondary)', text: `📊 [Modeling Agent] 調用同業估值投影回歸公式：PB = 8 * ROE + 0.5。`, delay: 4900 });
      printQueue.push({ node: 'modeling', link: '2-3', color: 'var(--ai-secondary)', isMath: true, text: `$$Justified\\ P/B = \\frac{ROE - g}{r_e - g}$$`, delay: 5500 });
      printQueue.push({ node: 'modeling', link: '2-3', color: 'var(--ai-secondary)', text: `📊 [Modeling Agent] 重估估值完成：${s.name} 理論合理股價為 NT$ ${calculatedVal} 元/股。`, delay: 6500 });
      printQueue.push({ node: 'modeling', link: '2-3', color: 'var(--ai-secondary)', targetVal: calculatedVal, text: `📊 [Modeling Agent] 模型生成完畢，發送至合規審查。`, delay: 7000 });
    }

    // Stage 3: Compliance & Tax Agent
    printQueue.push({ node: 'compliance', link: '3-4', color: 'var(--ai-warning)', text: `⚖️ [Compliance Agent] 啟動台股在地化法規與稅務風險檢算機制...`, delay: 7500 });
    printQueue.push({ node: 'compliance', link: '3-4', color: 'var(--ai-warning)', text: `⚖️ [Compliance Agent] 審核投信投顧公會「證券投資諮詢業務管理規則」研究報告揭露規範... 通過。`, delay: 8000 });
    printQueue.push({ node: 'compliance', link: '3-4', color: 'var(--ai-warning)', text: `⚖️ [Compliance Agent] 計算交易摩擦成本：納入台股 0.3% 證券交易稅與 0.1425% 經紀手續費估算... 通過。`, delay: 8500 });
    printQueue.push({ node: 'compliance', link: '3-4', color: 'var(--ai-warning)', text: `⚖️ [Compliance Agent] 核算中華民國證所稅停徵合規性，並試算二代健保補充保費與股利分開計稅 (28%) 最優稅務路徑... 通過。`, delay: 9000 });
    printQueue.push({ node: 'compliance', link: '3-4', color: 'var(--ai-warning)', text: `⚖️ [Compliance Agent] 無任何法規與稅務洗售紅旗警示，簽發本土合規證書。`, delay: 9500 });

    // Stage 4: Synthesis & Peer Audit Agent
    printQueue.push({ node: 'synthesis', link: '4-1', color: 'var(--ai-primary)', text: `✍️ [Synthesis Agent] 進入首次覆蓋研究報告 (Initiating Coverage) 封裝階段...`, delay: 10000 });
    printQueue.push({ node: 'synthesis', link: '4-1', color: 'var(--ai-primary)', text: `✍️ [Synthesis Agent] 調用「試算表審計工具 (audit-xls)」進行交叉一致性比對...`, delay: 10500 });
    printQueue.push({ node: 'synthesis', link: '4-1', color: 'var(--ai-primary)', text: `✍️ [Synthesis Agent] 結果：報告文字 FCF 預估值 (NT$ ${s.fcf} 億) 與 Excel 工作簿公式勾稽 100% 一致。`, delay: 11000 });
    printQueue.push({ node: 'synthesis', link: '4-1', color: 'var(--ai-primary)', text: `✍️ [Synthesis Agent] 正在自動合成並對齊投行級排版樣式...`, delay: 11500 });
    printQueue.push({ node: 'synthesis', link: '4-1', color: 'var(--ai-primary)', text: `🌟 [SYSTEM] 恭喜！台股 AI 多智能體協同估值分析圓滿完成！正式發行報告。`, delay: 12000 });

    // Execute Queue
    let finalTargetVal = s.basePrice;
    printQueue.forEach((q) => {
      setTimeout(() => {
        // Update Terminal
        printTerminalLine(termBody, q.text, q.isMath);
        
        // Update Target value if passed in queue item
        if (q.targetVal) {
          finalTargetVal = q.targetVal;
        }

        // Highlight Topology Node & Links
        updateTopologyUI(q.node, q.link);
      }, q.delay);
    });

    // Post-simulation completions
    const totalDuration = printQueue[printQueue.length - 1].delay + 500;
    setTimeout(() => {
      // Mark final node & links completed
      markAllTopologyCompleted();

      termStatus.textContent = 'COMPLETED';
      termStatus.style.color = 'var(--ai-success)';

      // Re-enable controls
      btnRun.disabled = false;
      document.getElementById('aiStockSelector').disabled = false;
      if (s.type === 'dcf') {
        document.getElementById('slideAiWacc').disabled = false;
        document.getElementById('slideAiG').disabled = false;
      }

      // Slide up the Generated Deliverable Card
      showDeliverableCard(s.name, stockId, waccVal, gVal, finalTargetVal, s.type);
    }, totalDuration);
  }

  // --- TOPOLOGY VISUAL UPDATE UTILITIES ---
  function resetTopologyUI() {
    document.querySelectorAll('.topo-node').forEach(n => {
      n.classList.remove('active', 'completed');
    });
    document.querySelectorAll('.topo-link').forEach(l => {
      l.classList.remove('pulsing', 'completed');
    });
  }

  function updateTopologyUI(activeNodeId, activeLinkId) {
    // Nodes
    document.querySelectorAll('.topo-node').forEach(n => {
      if (n.id === `node-${activeNodeId}`) {
        n.classList.add('active');
      } else if (n.classList.contains('active')) {
        n.classList.remove('active');
        n.classList.add('completed');
      }
    });

    // Links
    document.querySelectorAll('.topo-link').forEach(l => {
      if (l.id === `link-${activeLinkId}`) {
        l.classList.add('pulsing');
      } else if (l.classList.contains('pulsing')) {
        l.classList.remove('pulsing');
        l.classList.add('completed');
      }
    });
  }

  function markAllTopologyCompleted() {
    document.querySelectorAll('.topo-node').forEach(n => {
      n.classList.remove('active');
      n.classList.add('completed');
    });
    document.querySelectorAll('.topo-link').forEach(l => {
      l.classList.remove('pulsing');
      l.classList.add('completed');
    });
  }

  // --- TERMINAL PRINTER HELPER WITH KATEX SUPPORT ---
  function printTerminalLine(parent, text, isMath) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    
    if (isMath) {
      line.style.textAlign = 'center';
      line.style.margin = '0.5rem 0';
      if (window.katex) {
        try {
          window.katex.render(text, line, {
            displayMode: true,
            throwOnError: false
          });
        } catch (e) {
          line.textContent = text;
        }
      } else {
        line.textContent = text;
      }
    } else {
      line.innerHTML = text;
    }

    parent.appendChild(line);

    // Scroll to bottom of terminal container
    const term = document.getElementById('aiTerminal');
    term.scrollTop = term.scrollHeight;
  }

  // --- DELIVERABLE SHOWER ---
  function showDeliverableCard(stockName, stockId, wacc, g, targetVal, type) {
    const card = document.getElementById('aiDeliverableCard');
    const title = document.getElementById('aiDelTitle');
    const valWacc = document.getElementById('valWacc');
    const valG = document.getElementById('valG');
    const valTarget = document.getElementById('valTarget');

    title.innerHTML = `🎯 ${stockName} (${stockId}) 首次覆蓋研究報告`;
    
    if (type === 'dcf') {
      valWacc.textContent = `${wacc.toFixed(1)}%`;
      valG.textContent = `${g.toFixed(1)}%`;
    } else {
      valWacc.textContent = 'N/A';
      valG.textContent = 'N/A';
    }

    valTarget.textContent = `NT$ ${targetVal}`;

    card.style.display = 'block';

    // Download/View PDF mock alerts
    document.getElementById('btnViewReport').onclick = () => {
      alert(`📄 已為您調用首次覆蓋研究報告 (HTML5 預覽)\n標的公司：${stockName} (${stockId})\n折現估值結論：NT$ ${targetVal} 元\n本報告已完成試算表勾稽審計！`);
    };

    document.getElementById('btnDownloadXls').onclick = () => {
      alert(`📥 正在從資料沙盒中導出標準 Excel 財務模型工作簿...\n- 包含 3-Statement 連動模型\n- 包含 WACC 多因子二維敏感度分析表\n- 包含台股合規審計歷史底稿\n導出成功！已模擬下載至您的本機。`);
    };
  }

})();
