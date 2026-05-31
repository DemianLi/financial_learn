// app.js - FinMath Map Application Controller (Security & Professional Quant Upgraded)

document.addEventListener('DOMContentLoaded', () => {
  // Safe LocalStorage Helper
  const safeStorage = {
    getItem(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn("Storage blocked or unavailable:", e);
        return null;
      }
    },
    setItem(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn("Failed to write to storage:", e);
      }
    }
  };

  // --- CRYPTO SECURITY HELPER ---
  // A clean, robust, and synchronous hash function for anti-cheating and integrity validation
  function simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash & 0xFFFFFFFF).toString(36);
  }

  const SECURE_SALT = "FinMathSecureSalt2026";
  function calculateProgressChecksum(completedArray) {
    const sorted = [...completedArray].sort().join(',');
    return simpleHash(sorted + SECURE_SALT);
  }

  // 通用的「帶簽章驗證」陣列讀寫（給雙證據掌握度使用）
  function loadVerifiedArray(valKey, sigKey) {
    try {
      const val = safeStorage.getItem(valKey);
      const sig = safeStorage.getItem(sigKey);
      if (val) {
        const parsed = JSON.parse(val);
        if (calculateProgressChecksum(parsed) === sig) return parsed;
      }
    } catch (e) { /* ignore */ }
    return null;
  }
  function saveVerifiedArray(valKey, sigKey, arr) {
    safeStorage.setItem(valKey, JSON.stringify(arr));
    safeStorage.setItem(sigKey, calculateProgressChecksum(arr));
  }

  // 派發錯題事件（由 studyTools.js 的錯題本接收；未載入時無副作用）
  function dispatchMistake(topicId, qIndex, chosenIdx) {
    try {
      document.dispatchEvent(new CustomEvent('finmath-mistake', {
        detail: { topicId, qIndex, chosenIdx }
      }));
    } catch (e) { /* ignore */ }
  }

  // --- CURRICULUM DEPENDENCIES MAP ---
  const prerequisites = {
    'a2': ['a1'],
    'a3': ['a2'],
    'b1': ['a1'],
    'b2': ['b1', 'a3'], // DCF needs Comps and OCF/FCF
    'b3': ['b2'],
    'c1': ['b1'],      // Weights need Valuation Multipliers
    'c2': ['c1'],
    'c3': ['c2'],
    'd1': ['c1'],
    'd2': ['d1', 'c3'], // Bayesian needs sentimental NLP and Chips
    'd3': ['d2'],
    'e1': ['b3'],      // CAPM Beta needs industry bases
    'e2': ['e1'],      // Sharpe matrix needs CAPM inputs
    'e3': ['e2', 'c2'], // VaR / MDD needs Sharpe portfolio and Credit leverage
    'f1': ['e3'],      // Taiwan Stock Impulse needs VaR risk completed
    'f2': ['f1', 'd3'], // Bayesian Guidance needs F1 impulse and D3 catalysts
    'f3': ['f2', 'c3']  // Leverage feedback needs Bayesian guidance and shareholding concentration
  };

  function isTopicLocked(topicId) {
    const prereqs = prerequisites[topicId];
    if (!prereqs) return false;
    for (const prereq of prereqs) {
      if (!state.completedTopics.includes(prereq)) {
        return true;
      }
    }
    return false;
  }

  // Global Application State
  const state = {
    activeTopic: null,
    completedTopics: (() => {
      try {
        const val = safeStorage.getItem('finmath_completed_topics');
        const checksum = safeStorage.getItem('finmath_completed_checksum');
        if (val) {
          const parsed = JSON.parse(val);
          // Verify hash signature to block F12 Console hacks
          if (calculateProgressChecksum(parsed) === checksum) {
            return parsed;
          } else {
            console.warn("⚠️ 偵測到 LocalStorage 數據篡改！學術誠實防護系統已重置您的學習進度！");
            safeStorage.setItem('finmath_completed_topics', JSON.stringify([]));
            safeStorage.setItem('finmath_completed_checksum', calculateProgressChecksum([]));
            return [];
          }
        }
        return [];
      } catch (e) {
        return [];
      }
    })(),
    mockExam: {
      active: false,
      questions: [],
      currentIndex: 0,
      answers: [],
      score: 0
    },
    topicQuestionIndices: {}
  };

  // 雙證據掌握度（P0 校正）：通關需同時 ① 測驗答對 ② 完成微產出。
  // 既有使用者（已通關章節）自動補種兩種證據，避免進度被重置。
  state.examPassed = loadVerifiedArray('finmath_exam_passed', 'finmath_exam_sig') || [...state.completedTopics];
  state.deliverableDone = loadVerifiedArray('finmath_deliverable_done', 'finmath_deliverable_sig') || [...state.completedTopics];

  // 每章微產出任務（對齊 learn-anything-skill 的專案驅動：每輪都要有產出）
  const MICRO_DELIVERABLES = {
    a1: { task: '用 FinMind 抓台積電(2330)財報，算出最近一期「負債比率」與「流動比率」。', output: '兩個數值 + 一句健康度解讀' },
    a2: { task: '用 FinMind 拆解一檔台股的 ROE 三因子（淨利率 × 資產週轉率 × 權益乘數）。', output: '三因子數值 + 判斷成長由毛利或槓桿驅動' },
    a3: { task: '抓一檔現金流量表，計算近四季自由現金流（營業現金流 − 資本支出）。', output: 'FCF 四季數列 + 趨勢一句話' },
    b1: { task: '取三檔同業的 P/E 或 P/B，做一張可比表。', output: '3 檔比較表 + 一句相對高估/低估判斷' },
    b2: { task: '用台灣公債殖利率設無風險利率，算一檔股票的 WACC 與一個 DCF 估值，並做 WACC±1% 敏感度。', output: 'EV 數值 + 敏感度三點' },
    b3: { task: '把一檔股票放進「成長 vs 估值」二維座標，標出相對同業的位置。', output: '座標位置描述 + 一句結論' },
    c1: { task: '抓一檔近 20 日三大法人買賣超，算淨買超合計。', output: '淨買超數列 + 主力方向判斷' },
    c2: { task: '抓融資融券餘額，算「券資比」近期變化。', output: '券資比趨勢 + 一句多空解讀' },
    c3: { task: '抓集保大戶持股，算千張大戶持股比近期變化。', output: '大戶持股比變化 + 一句籌碼解讀' },
    d1: { task: '抓一檔近一週新聞標題，人工標記正/負面並算情緒比例。', output: '情緒比例 + 一句輿情判斷' },
    d2: { task: '給定一個先驗看法，用一則新事件（法說/財報）做一次貝氏更新。', output: '先驗 → 後驗的更新說明' },
    d3: { task: '列出一檔股票未來一季的潛在催化劑事件並標時間。', output: '至少 3 個催化劑 + 時間' },
    e1: { task: '用報酬率資料估一檔股票對大盤的 Beta，並用 CAPM 算預期報酬。', output: 'Beta 值 + 預期報酬' },
    e2: { task: '算一個簡單投組的年化報酬、波動與 Sharpe Ratio。', output: '三個數值 + 一句評價' },
    e3: { task: '算一檔（或投組）的歷史最大回撤（MDD）與一個簡單 VaR。', output: 'MDD + VaR 數值' },
    f1: { task: '抓月營收算 YoY 與 MoM，判斷營收動能是否轉強。', output: 'YoY/MoM 數值 + 動能判斷' },
    f2: { task: '結合營收與一則法說訊號，更新對下一季的機率看法。', output: '更新後的機率判斷說明' },
    f3: { task: '結合融資餘額與大戶持股，判斷籌碼結構是否健康。', output: '一句籌碼健康度結論 + 依據' }
  };

  // P2：多能力點章節的「能力點拆解」（對齊 Mastery Learning：一次只推進一個能力點）
  // 不改節點結構，只在詳情頁提示分階段學習。
  const CHAPTER_SUBSKILLS = {
    b2: ['① 估算折現率 WACC（無風險利率 + 風險溢酬）', '② 預測自由現金流並計算終值（Terminal Value）', '③ 折現加總後做 WACC × g 敏感度分析'],
    d2: ['① 設定先驗機率（你原本的看法）', '② 評估新事件的似然（法說／財報訊號）', '③ 用貝氏公式更新為後驗機率'],
    e3: ['① 計算歷史最大回撤（MDD）', '② 計算風險值 VaR（如 95% 歷史模擬）']
  };

  // DOM Elements Cache
  const elements = {
    svgMap: document.getElementById('syllabusSvgMap'),
    detailCard: document.getElementById('detailCard'),
    panelRight: document.querySelector('.panel-right'),
    detailEmpty: document.getElementById('detailEmptyState'),
    detailContent: document.getElementById('detailContent'),
    btnCloseDetail: document.getElementById('btnCloseDetail'),
    progressBarFill: document.getElementById('progressBarFill'),
    progressPercentageText: document.getElementById('progressPercentageText'),
    radarCanvas: document.getElementById('radarCanvas'),
    
    // Sandbox Elements
    btnSandbox: document.getElementById('btnSandbox'),
    sandboxModal: document.getElementById('sandboxModal'),
    btnCloseSandbox: document.getElementById('btnCloseSandbox'),
    btnGenerateCode: document.getElementById('btnGenerateCode'),
    sandboxStockId: document.getElementById('sandboxStockId'),
    sandboxDataset: document.getElementById('sandboxDataset'),
    sandboxStartDate: document.getElementById('sandboxStartDate'),
    sandboxOutputCode: document.getElementById('sandboxOutputCode'),
    btnCopySandboxCode: document.getElementById('btnCopySandboxCode'),
    
    // Mock Exam Elements
    btnMockExam: document.getElementById('btnMockExam'),
    examModal: document.getElementById('examModal'),
    btnCloseExam: document.getElementById('btnCloseExam'),
    examContentBox: document.getElementById('examContentBox'),
    btnPrevExam: document.getElementById('btnPrevExam'),
    btnNextExam: document.getElementById('btnNextExam'),
    btnSubmitExam: document.getElementById('btnSubmitExam'),
    btnSwitchQuestion: document.getElementById('btnSwitchQuestion')
  };

  // Define Node Coordinates on SVG Canvas (Width: 600, Height: 630 - Expanded vertically for Subject E)
  const nodeLayout = {
    // Subject Headers
    subjectHeaders: [
      { id: 'subA', text: '科目 A：基本面坐標系', x: 80, y: 55, color: 'var(--subject-a)' },
      { id: 'subB', text: '科目 B：估值向量空間', x: 80, y: 175, color: 'var(--subject-b)' },
      { id: 'subC', text: '科目 C：籌碼線性代數', x: 80, y: 295, color: 'var(--subject-c)' },
      { id: 'subD', text: '科目 D：消息隨機機率', x: 80, y: 415, color: 'var(--subject-d)' },
      { id: 'subE', text: '科目 E：風險與組合幾何學', x: 80, y: 535, color: 'var(--subject-e)' },
      { id: 'subF', text: '科目 F：台股價值與情緒力學', x: 80, y: 655, color: 'var(--subject-f)' }
    ],
    
    // Topics Coordinate List
    nodes: [
      { id: 'a1', label: 'A1.三維報表', x: 150, y: 90, color: 'var(--subject-a)', subject: 'A' },
      { id: 'a2', label: 'A2.杜邦幾何', x: 300, y: 90, color: 'var(--subject-a)', subject: 'A' },
      { id: 'a3', label: 'A3.現金流向', x: 450, y: 90, color: 'var(--subject-a)', subject: 'A' },
      
      { id: 'b1', label: 'B1.同業投影', x: 150, y: 210, color: 'var(--subject-b)', subject: 'B' },
      { id: 'b2', label: 'B2.DCF時間積分', x: 300, y: 210, color: 'var(--subject-b)', subject: 'B' },
      { id: 'b3', label: 'B3.估值坐標軸', x: 450, y: 210, color: 'var(--subject-b)', subject: 'B' },
      
      { id: 'c1', label: 'C1.三大法人方程', x: 150, y: 330, color: 'var(--subject-c)', subject: 'C' },
      { id: 'c2', label: 'C2.信用交易力學', x: 300, y: 330, color: 'var(--subject-c)', subject: 'C' },
      { id: 'c3', label: 'C3.集保股權張量', x: 450, y: 330, color: 'var(--subject-c)', subject: 'C' },
      
      { id: 'd1', label: 'D1.輿情特徵BERT', x: 150, y: 450, color: 'var(--subject-d)', subject: 'D' },
      { id: 'd2', label: 'D2.法說會貝氏修正', x: 300, y: 450, color: 'var(--subject-d)', subject: 'D' },
      { id: 'd3', label: 'D3.事件催化劑隨機', x: 450, y: 450, color: 'var(--subject-d)', subject: 'D' },

      { id: 'e1', label: 'E1.CAPM與Beta幾何', x: 150, y: 570, color: 'var(--subject-e)', subject: 'E' },
      { id: 'e2', label: 'E2.Sharpe多維矩陣', x: 300, y: 570, color: 'var(--subject-e)', subject: 'E' },
      { id: 'e3', label: 'E3.回撤與VaR風控', x: 450, y: 570, color: 'var(--subject-e)', subject: 'E' },

      { id: 'f1', label: 'F1.營收脈衝估值', x: 150, y: 690, color: 'var(--subject-f)', subject: 'F' },
      { id: 'f2', label: 'F2.法說貝氏機率', x: 300, y: 690, color: 'var(--subject-f)', subject: 'F' },
      { id: 'f3', label: 'F3.籌碼槓桿反饋', x: 450, y: 690, color: 'var(--subject-f)', subject: 'F' }
    ],
    
    // Connection Matrix (From -> To)
    connections: [
      { from: 'a1', to: 'a2' },
      { from: 'a2', to: 'a3' },
      { from: 'b1', to: 'b2' },
      { from: 'b2', to: 'b3' },
      { from: 'c1', to: 'c2' },
      { from: 'c2', to: 'c3' },
      { from: 'd1', to: 'd2' },
      { from: 'd2', to: 'd3' },
      { from: 'e1', to: 'e2' },
      { from: 'e2', to: 'e3' },
      { from: 'f1', to: 'f2' },
      { from: 'f2', to: 'f3' },
      
      // Cross subject dependencies (Curriculum flow)
      { from: 'a3', to: 'b2', type: 'cross' }, // FCF feeds into DCF
      { from: 'b1', to: 'c1', type: 'cross' }, // Multipliers feed into Weights
      { from: 'c3', to: 'd2', type: 'cross' }, // Chips feed into expected Bayesian forecasts
      { from: 'b3', to: 'e1', type: 'cross' }, // Valuation Base feeds into CAPM
      { from: 'c2', to: 'e3', type: 'cross' }, // Credit leverage feeds into VaR risk testing
      { from: 'e3', to: 'f1', type: 'cross' }, // Portfolio VaR risk feeds into Taiwan Stock impulse valuation
      { from: 'd3', to: 'f2', type: 'cross' }, // Event catalysts feed into Bayesian guidance calls
      { from: 'c3', to: 'f3', type: 'cross' }  // Gini Shareholding tensor feeds into credit leverage feedback
    ]
  };

  // --- INITIALIZATION ---
  function init() {
    renderSvgMap();
    updateProgressUI();
    renderRadarChart();
    setupEventListeners();
  }

  // --- RENDER SVG MAP ---
  function renderSvgMap() {
    const svg = elements.svgMap;
    svg.setAttribute('viewBox', '0 0 600 750'); // Update height dynamically to 750 for Subject F
    svg.innerHTML = ''; // Reset SVG Map
    
    // 1. Draw connections lines first so they sit below nodes
    nodeLayout.connections.forEach(conn => {
      const fromNode = nodeLayout.nodes.find(n => n.id === conn.from);
      const toNode = nodeLayout.nodes.find(n => n.id === conn.to);
      if (fromNode && toNode) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromNode.x);
        line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x);
        line.setAttribute('y2', toNode.y);
        line.setAttribute('id', `line-${conn.from}-${conn.to}`);
        
        // Define classes
        let lineClass = 'map-link-line';
        if (conn.type === 'cross') {
          lineClass += ' cross-dep';
        }
        
        // Check if both nodes are completed
        const isFromCompleted = state.completedTopics.includes(conn.from);
        const isToCompleted = state.completedTopics.includes(conn.to);
        if (isFromCompleted && isToCompleted) {
          lineClass += ' completed';
        }
        
        line.setAttribute('class', lineClass);
        svg.appendChild(line);
      }
    });

    // 2. Draw Subject Headers
    nodeLayout.subjectHeaders.forEach(header => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // Horizontal subject separator line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', header.x - 30);
      line.setAttribute('y1', header.y + 4);
      line.setAttribute('x2', 550);
      line.setAttribute('y2', header.y + 4);
      line.setAttribute('stroke', 'rgba(255, 255, 255, 0.04)');
      line.setAttribute('stroke-width', '1.5');
      g.appendChild(line);

      // Subject Text Label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', header.x);
      text.setAttribute('y', header.y);
      text.setAttribute('class', 'map-subject-label');
      text.setAttribute('fill', header.color);
      text.textContent = header.text;
      g.appendChild(text);
      
      svg.appendChild(g);
    });

    // 3. Draw Nodes
    nodeLayout.nodes.forEach(node => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `map-node-group node-${node.id}`);
      g.setAttribute('id', `node-${node.id}`);
      g.style.color = node.color;
      
      // Check status & dependencies
      const isCompleted = state.completedTopics.includes(node.id);
      const isLocked = isTopicLocked(node.id);
      const isActive = state.activeTopic && state.activeTopic.id === node.id;
      
      if (isCompleted) g.classList.add('completed');
      if (isLocked) g.classList.add('locked');
      if (isActive) g.classList.add('active');

      // Invisible Click Area Overlay
      const clickTarget = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      clickTarget.setAttribute('cx', node.x);
      clickTarget.setAttribute('cy', node.y);
      clickTarget.setAttribute('r', 28);
      clickTarget.setAttribute('fill', 'rgba(0, 0, 0, 0)');
      clickTarget.setAttribute('cursor', isLocked ? 'not-allowed' : 'pointer');
      g.appendChild(clickTarget);

      // Outer Glow Circle (on active/completed)
      const glowCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glowCircle.setAttribute('cx', node.x);
      glowCircle.setAttribute('cy', node.y);
      glowCircle.setAttribute('r', 25);
      glowCircle.setAttribute('fill', 'none');
      glowCircle.setAttribute('stroke', node.color);
      glowCircle.setAttribute('stroke-width', '2');
      glowCircle.setAttribute('stroke-opacity', isActive && !isLocked ? '0.6' : '0');
      glowCircle.setAttribute('style', isActive && !isLocked ? 'animation: floatNode 2s ease-in-out infinite;' : '');
      g.appendChild(glowCircle);

      // Core Node Circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      circle.setAttribute('r', 18);
      circle.setAttribute('class', 'map-node-circle');
      circle.setAttribute('stroke', isLocked ? '#334155' : node.color);
      circle.setAttribute('fill', isActive && !isLocked ? node.color : 'var(--bg-secondary)');
      g.appendChild(circle);

      // Text label inside node (Topic Number / Locked Lock icon)
      const insideText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      insideText.setAttribute('x', node.x);
      insideText.setAttribute('y', node.y + 4);
      insideText.setAttribute('fill', isLocked ? '#475569' : (isActive ? '#fff' : node.color));
      insideText.setAttribute('font-size', '11px');
      insideText.setAttribute('font-weight', '700');
      insideText.setAttribute('text-anchor', 'middle');
      
      if (isLocked) {
        insideText.textContent = '🔒';
        insideText.setAttribute('font-size', '12px');
        insideText.setAttribute('y', node.y + 3);
      } else {
        insideText.textContent = node.id.toUpperCase();
      }
      g.appendChild(insideText);

      // Label Text below node
      const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelText.setAttribute('x', node.x);
      labelText.setAttribute('y', node.y + 35);
      labelText.setAttribute('class', 'map-node-text');
      labelText.textContent = node.label.substring(3); // Remove prefix
      g.appendChild(labelText);

      // Completion Check icon overlay
      if (isCompleted && !isLocked) {
        const check = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        check.setAttribute('cx', node.x + 13);
        check.setAttribute('cy', node.y - 13);
        check.setAttribute('r', 6);
        check.setAttribute('fill', 'var(--subject-a)');
        check.setAttribute('stroke', 'var(--bg-primary)');
        check.setAttribute('stroke-width', '1.5');
        g.appendChild(check);
      }

      // Add click handler (lock warning vs select topic)
      g.addEventListener('click', () => {
        if (isLocked) {
          showLockWarning(node.id);
        } else {
          selectTopic(node.id);
        }
      });

      svg.appendChild(g);
    });
  }

  // --- LOCKED NODE DETAILS PANEL RENDERER ---
  function showLockWarning(topicId) {
    const topicData = syllabusData.topics.find(t => t.id === topicId);
    if (!topicData) return;

    state.activeTopic = topicData;
    document.querySelectorAll('.map-node-group').forEach(el => el.classList.remove('active'));
    const nodeGroup = document.getElementById(`node-${topicId}`);
    if (nodeGroup) nodeGroup.classList.add('active');

    if (elements.detailEmpty) elements.detailEmpty.style.display = 'none';
    elements.detailContent.style.display = 'flex';
    if (elements.panelRight) elements.panelRight.classList.add('active');

    const badge = elements.detailContent.querySelector('.detail-subject-badge');
    badge.style.backgroundColor = 'var(--text-muted)';
    badge.textContent = '🔒 節點鎖定中';

    elements.detailContent.querySelector('.detail-title').textContent = topicData.title;
    
    // Custom analog rendering for locks
    elements.detailContent.querySelector('.analogy-text').innerHTML = `
      <div style="background:rgba(239, 68, 68, 0.06); border:1px solid rgba(239, 68, 68, 0.2); padding:1.2rem; border-radius:8px; margin: 1rem 0;">
        <h4 style="color:#f87171; margin-top:0; font-size: 0.95rem;">🚫 您目前無法挑戰此科目章節！</h4>
        <p style="font-size:0.88rem; line-height:1.6; color:var(--text-secondary); margin-bottom: 1rem;">
          本學習地圖採用**循序漸進的量化分析考綱架構**。在您進入「${topicData.title}」的知識空間前，您必須先學完並通關以下前置任務科目以建立扎實的代數與財務直覺：
        </p>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          ${prerequisites[topicId].map(pId => {
            const pTopic = syllabusData.topics.find(t => t.id === pId);
            const isDone = state.completedTopics.includes(pId);
            return `
              <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.02); padding:0.6rem 0.8rem; border-radius:6px; font-size:0.82rem; border:1px solid ${isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)'}">
                <span style="color:${isDone ? 'var(--text-primary)' : 'var(--text-muted)'}">${pTopic ? pTopic.title : pId.toUpperCase()}</span>
                <span style="font-weight:700; color:${isDone ? 'var(--subject-a)' : '#f87171'}">${isDone ? '✓ 已通關' : '✗ 尚未解鎖'}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Hide formula, objectives, alignment card, code, exam panels
    elements.detailContent.querySelector('.formula-container').style.display = 'none';
    elements.detailContent.querySelector('.objectives-section').style.display = 'none';
    elements.detailContent.querySelector('.skill-align-card').style.display = 'none';
    elements.detailContent.querySelector('.code-section').style.display = 'none';
    elements.detailContent.querySelector('.exam-section').style.display = 'none';
    
    // Hide sensitivity panel if active
    const sensitivityPanel = document.getElementById('dcfSensitivityPanel');
    if (sensitivityPanel) sensitivityPanel.style.display = 'none';

    // 鎖定時隱藏掌握度面板
    const masteryPanel = document.getElementById('masteryPanel');
    if (masteryPanel) masteryPanel.style.display = 'none';

    // 鎖定時隱藏能力點拆解面板
    const subskillPanel = document.getElementById('subskillPanel');
    if (subskillPanel) subskillPanel.style.display = 'none';
  }

  // --- TOPIC SELECTION CONTROLLER ---
  function selectTopic(topicId) {
    const topicData = syllabusData.topics.find(t => t.id === topicId);
    if (!topicData) return;

    state.activeTopic = topicData;
    
    // Save active state visually in the SVG map
    document.querySelectorAll('.map-node-group').forEach(el => el.classList.remove('active'));
    const activeGroup = document.getElementById(`node-${topicId}`);
    if (activeGroup) activeGroup.classList.add('active');

    // Redraw map connections and highlights
    renderSvgMap();

    // Populate Right Drawer content
    populateDetailDrawer(topicData);
  }

  function populateDetailDrawer(topic) {
    if (elements.detailEmpty) elements.detailEmpty.style.display = 'none';
    elements.detailContent.style.display = 'flex';
    if (elements.panelRight) elements.panelRight.classList.add('active');

    // Restore visibility of panels
    elements.detailContent.querySelector('.formula-container').style.display = 'block';
    elements.detailContent.querySelector('.objectives-section').style.display = 'block';
    elements.detailContent.querySelector('.skill-align-card').style.display = 'block';
    elements.detailContent.querySelector('.code-section').style.display = 'block';
    elements.detailContent.querySelector('.exam-section').style.display = 'block';
    
    const subjectInfo = syllabusData.subjects[topic.subject];
    
    // Set colors & Badges
    const badge = elements.detailContent.querySelector('.detail-subject-badge');
    badge.style.backgroundColor = subjectInfo.color;
    badge.textContent = subjectInfo.title;
    
    elements.detailContent.querySelector('.detail-title').textContent = topic.title;
    
    // Render Math Analogy using formatMathText (KaTeX)
    elements.detailContent.querySelector('.analogy-text').innerHTML = formatMathText(topic.mathAnalogy);
    
    // Render Key Formula using KaTeX block mode
    const formulaContainer = elements.detailContent.querySelector('.formula-container');
    if (window.katex) {
      try {
        window.katex.render(topic.keyFormula, formulaContainer, {
          displayMode: true,
          throwOnError: false
        });
      } catch (e) {
        console.error("KaTeX keyFormula rendering error:", e);
        formulaContainer.innerHTML = `<code>${topic.keyFormula}</code>`;
      }
    } else {
      formulaContainer.innerHTML = `<code>${topic.keyFormula}</code>`;
    }
    
    // Draw Objectives
    const objList = elements.detailContent.querySelector('.objectives-list');
    objList.innerHTML = '';
    topic.learningObjectives.forEach(obj => {
      const li = document.createElement('li');
      li.textContent = obj;
      objList.appendChild(li);
    });

    // Wall Street Alignment
    elements.detailContent.querySelector('.skill-align-title').textContent = `WALL STREET Skill: ${topic.wallStreetSkill.name}`;
    elements.detailContent.querySelector('.skill-align-desc').textContent = topic.wallStreetSkill.description;

    // FinMind Python Code Block
    const codePre = elements.detailContent.querySelector('.code-wrapper pre code');
    codePre.textContent = topic.finmindCode;
    
    // Add dynamic copying
    const btnCopy = elements.detailContent.querySelector('.btn-copy');
    btnCopy.onclick = () => {
      navigator.clipboard.writeText(topic.finmindCode);
      btnCopy.textContent = 'Copied!';
      setTimeout(() => btnCopy.textContent = 'Copy Code', 2000);
    };

    // --- INTERACTIVE DCF SENSITIVITY MODULE (B2) ---
    let sensitivityPanel = document.getElementById('dcfSensitivityPanel');
    if (topic.id === 'b2') {
      if (!sensitivityPanel) {
        sensitivityPanel = document.createElement('div');
        sensitivityPanel.id = 'dcfSensitivityPanel';
        sensitivityPanel.className = 'sensitivity-container';
        // Injected right after formula container
        const formulaContainer = elements.detailContent.querySelector('.formula-container');
        formulaContainer.parentNode.insertBefore(sensitivityPanel, formulaContainer.nextSibling);
      }
      sensitivityPanel.style.display = 'block';
      renderDcfSensitivity(sensitivityPanel);
    } else {
      if (sensitivityPanel) sensitivityPanel.style.display = 'none';
    }

    // P2：能力點拆解（多能力點章節）
    renderSubskillPanel(topic);

    // Setup Interactive Mock Exam Problem
    renderExamQuestion(topic);

    // 雙證據掌握度面板（微產出 + 通關狀態）
    renderMasteryPanel(topic);
  }

  // --- SENSITIVITY CALCULATION & GRID (B2) ---
  let currentWacc = 0.08;
  let currentG = 0.02;
  const baseFcfVector = [100, 115, 132, 152, 175]; // Year 1 to 5 FCF vector in millions

  function calculateDcfValue(waccVal, gVal) {
    let totalPvForecast = 0;
    for (let t = 1; t <= 5; t++) {
      totalPvForecast += baseFcfVector[t - 1] / Math.pow(1 + waccVal, t);
    }
    const terminalValue = (baseFcfVector[4] * (1 + gVal)) / (waccVal - gVal);
    const pvTerminalValue = terminalValue / Math.pow(1 + waccVal, 5);
    return totalPvForecast + pvTerminalValue;
  }

  function renderDcfSensitivity(container) {
    container.innerHTML = `
      <div class="sensitivity-card" style="background:rgba(6, 182, 212, 0.05); border:1px solid var(--subject-b); border-radius:8px; padding:1.2rem; margin:1.2rem 0;">
        <h4 style="color:var(--subject-b); margin-top:0; display:flex; justify-content:space-between; align-items:center;">
          <span>📊 WACC - g 估值敏感度分析矩陣</span>
          <span style="font-size:0.72rem; background:var(--subject-b); color:var(--bg-primary); padding:0.2rem 0.5rem; border-radius:4px; font-weight:700;">動態模擬</span>
        </h4>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem; line-height:1.45;">
          調整滑桿模擬折現率（WACC）與永續成長率（g）的邊邊際微調。二維儲存格自動計算企業合理現值，並以色溫展示不確定性風險。
        </p>
        
        <div style="display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1rem;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:0.8rem; font-weight:600;">WACC: <span id="labelWacc" style="color:var(--subject-b); font-weight:700;">8.0%</span></span>
            <input type="range" id="slideWacc" min="5" max="15" step="0.5" value="8.0" style="width:60%; cursor:ew-resize;">
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:0.8rem; font-weight:600;">永續 g: <span id="labelG" style="color:var(--subject-b); font-weight:700;">2.0%</span></span>
            <input type="range" id="slideG" min="5" max="45" step="0.5" value="20" style="width:60%; cursor:ew-resize;">
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table class="sensitivity-table" style="width:100%; border-collapse:collapse; font-size:0.75rem; text-align:center;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-color);">
                <th style="padding:0.4rem; color:var(--text-muted);">WACC \\ g</th>
                <th style="padding:0.4rem; font-weight:700; color:var(--subject-d);">1.0%</th>
                <th style="padding:0.4rem; font-weight:700; color:var(--subject-d);">1.5%</th>
                <th style="padding:0.4rem; font-weight:700; color:var(--subject-d);">2.0%</th>
                <th style="padding:0.4rem; font-weight:700; color:var(--subject-d);">2.5%</th>
                <th style="padding:0.4rem; font-weight:700; color:var(--subject-d);">3.0%</th>
              </tr>
            </thead>
            <tbody id="sensitivityTableBody">
              <!-- Dynamically rendered -->
            </tbody>
          </table>
        </div>
        <div style="font-size:0.7rem; color:var(--text-muted); text-align:right; margin-top:0.4rem;">
          ※ 表格內數值單位為「億元」，當前基準交會處以亮框示之。
        </div>
      </div>
    `;

    const slideWacc = document.getElementById('slideWacc');
    const slideG = document.getElementById('slideG');
    const labelWacc = document.getElementById('labelWacc');
    const labelG = document.getElementById('labelG');

    function updateTable() {
      const wVal = parseFloat(slideWacc.value) / 100.0;
      const gVal = parseFloat(slideG.value) / 1000.0;

      labelWacc.textContent = `${(wVal * 100).toFixed(1)}%`;
      labelG.textContent = `${(gVal * 100).toFixed(1)}%`;

      currentWacc = wVal;
      currentG = gVal;

      const tbody = document.getElementById('sensitivityTableBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      const waccCandidates = [wVal - 0.02, wVal - 0.01, wVal, wVal + 0.01, wVal + 0.02];
      const gCandidates = [0.010, 0.015, 0.020, 0.025, 0.030];

      waccCandidates.forEach(wCand => {
        if (wCand <= 0.03) return; // WACC limit

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.02)';

        // Left Wacc Cell
        const th = document.createElement('td');
        th.style.padding = '0.4rem';
        th.style.fontWeight = '700';
        th.style.color = 'var(--subject-b)';
        th.textContent = `${(wCand * 100).toFixed(1)}%`;
        tr.appendChild(th);

        gCandidates.forEach(gCand => {
          const td = document.createElement('td');
          td.style.padding = '0.4rem';

          if (wCand <= gCand) {
            td.textContent = '發散';
            td.style.color = '#f87171';
            td.style.background = 'rgba(239, 68, 68, 0.08)';
          } else {
            const cellVal = calculateDcfValue(wCand, gCand);
            td.textContent = `${Math.round(cellVal)}`;

            // Value heat color scaling: cold (cyan) to hot (rose/amber)
            const ratio = Math.min(1.0, Math.max(0.0, (cellVal - 1000) / 7000));
            const hue = Math.round(187 - ratio * 163); // Cyan (187) to Crimson (24)
            const opacity = 0.06 + ratio * 0.16;
            td.style.backgroundColor = `hsla(${hue}, 92%, 50%, ${opacity})`;
            td.style.color = `hsl(${hue}, 92%, 80%)`;
          }

          // Center coordinate highlight
          const isCenterWacc = Math.abs(wCand - wVal) < 0.001;
          const closestIndex = gCandidates.map((g, i) => ({ diff: Math.abs(g - gVal), index: i })).sort((a,b) => a.diff - b.diff)[0].index;
          if (gCand === gCandidates[closestIndex] && isCenterWacc) {
            td.style.border = '2.5px solid var(--subject-b)';
            td.style.fontWeight = '900';
            td.style.fontSize = '0.8rem';
            td.style.boxShadow = '0 0 6px var(--subject-b)';
          }

          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });
    }

    slideWacc.addEventListener('input', updateTable);
    slideG.addEventListener('input', updateTable);
    updateTable(); // Initial trigger
  }

  // --- RENDER EXAM QUESTION WITH ANTI-CHEAT ---
  function renderExamQuestion(topic) {
    const examBox = document.getElementById('examQuestionBox');
    
    // Ensure active index is initialized
    if (state.topicQuestionIndices[topic.id] === undefined) {
      state.topicQuestionIndices[topic.id] = 0;
    }
    const qIndex = state.topicQuestionIndices[topic.id];
    const q = topic.examQuestions[qIndex];
    
    // Show/hide btnSwitchQuestion based on question pool availability
    const btnSwitch = document.getElementById('btnSwitchQuestion');
    if (btnSwitch) {
      if (topic.examQuestions && topic.examQuestions.length > 1) {
        btnSwitch.style.display = 'inline-flex';
      } else {
        btnSwitch.style.display = 'none';
      }
    }
    
    examBox.querySelector('.exam-question').innerHTML = formatMathText(q.question);
    
    const optionsGrid = examBox.querySelector('.exam-options-grid');
    optionsGrid.innerHTML = '';
    
    const explanationBox = examBox.querySelector('.exam-explanation-box');
    explanationBox.style.display = 'none';
    explanationBox.querySelector('.exam-explanation-text').innerHTML = formatMathText(q.explanation);

    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'exam-option-btn';
      btn.innerHTML = `
        <span class="exam-option-letter">${letters[idx]}</span>
        <span class="exam-option-text">${formatMathText(opt)}</span>
      `;
      
      const optionHash = simpleHash(topic.id + "-" + qIndex + "-" + idx);
      const isCorrect = optionHash === q.answerHash;

      // Select handler
      btn.onclick = () => {
        const optionButtons = optionsGrid.querySelectorAll('.exam-option-btn');
        optionButtons.forEach(b => b.setAttribute('disabled', 'true'));
        
        if (isCorrect) {
          btn.classList.add('correct');
          explanationBox.style.display = 'block';
          explanationBox.style.borderTopColor = 'var(--subject-a)';

          // 證據一：測驗答對（通關仍需完成微產出）
          recordExamPassed(topic.id);
          renderMasteryPanel(topic);
        } else {
          btn.classList.add('wrong');

          // 記錄錯題（供錯題本使用）
          dispatchMistake(topic.id, qIndex, idx);

          // Reveal correct button
          q.options.forEach((_, oIdx) => {
            if (simpleHash(topic.id + "-" + qIndex + "-" + oIdx) === q.answerHash) {
              optionButtons[oIdx].classList.add('correct');
            }
          });

          explanationBox.style.display = 'block';
          explanationBox.style.borderTopColor = '#ef4444';
        }
      };

      // 若該章測驗已答對過，預先揭示答案並鎖定（通關仍需微產出）
      if (state.examPassed.includes(topic.id)) {
        if (isCorrect) {
          btn.classList.add('correct');
          explanationBox.style.display = 'block';
        }
        btn.setAttribute('disabled', 'true');
      }
      
      optionsGrid.appendChild(btn);
    });
  }

  // --- PROGRESS STATE TRACKING ---
  // 證據一：測驗答對
  function recordExamPassed(topicId) {
    if (!state.examPassed.includes(topicId)) {
      state.examPassed.push(topicId);
      saveVerifiedArray('finmath_exam_passed', 'finmath_exam_sig', state.examPassed);
    }
    finalizeCompletion();
  }

  // 證據二：完成微產出
  function recordDeliverableDone(topicId) {
    if (!state.deliverableDone.includes(topicId)) {
      state.deliverableDone.push(topicId);
      saveVerifiedArray('finmath_deliverable_done', 'finmath_deliverable_sig', state.deliverableDone);
    }
    finalizeCompletion();
  }

  // 通關 = 兩種證據齊備（重新推導 completedTopics，並刷新 UI）
  function finalizeCompletion() {
    state.completedTopics = syllabusData.topics
      .filter(t => state.examPassed.includes(t.id) && state.deliverableDone.includes(t.id))
      .map(t => t.id);
    safeStorage.setItem('finmath_completed_topics', JSON.stringify(state.completedTopics));
    safeStorage.setItem('finmath_completed_checksum', calculateProgressChecksum(state.completedTopics));

    updateProgressUI();
    renderRadarChart();
    renderSvgMap();
  }

  // P2：能力點拆解面板（僅多能力點章節顯示）
  function renderSubskillPanel(topic) {
    let panel = document.getElementById('subskillPanel');
    const steps = CHAPTER_SUBSKILLS[topic.id];
    if (!steps) { if (panel) panel.style.display = 'none'; return; }
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'subskillPanel';
      const obj = elements.detailContent.querySelector('.objectives-section');
      obj.parentNode.insertBefore(panel, obj.nextSibling);
    }
    panel.style.display = 'block';
    panel.innerHTML = `
      <div style="background:rgba(139,92,246,0.06); border:1px solid var(--subject-c); border-radius:8px; padding:0.9rem 1rem; margin:0.8rem 0;">
        <h4 style="color:var(--subject-c); margin-top:0; font-size:0.92rem;">🧩 本章能力點拆解（建議分階段）</h4>
        <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.5; margin:0 0 0.6rem;">
          本章包含多個能力點。依 Mastery Learning「一次只推進一個能力點」，建議照下列順序分階段完成，不要一次硬塞：
        </p>
        <ol style="margin:0; padding-left:1.2rem; font-size:0.84rem; line-height:1.7; color:var(--text-primary);">
          ${steps.map(s => `<li>${s}</li>`).join('')}
        </ol>
      </div>`;
  }

  // 雙證據掌握度面板：顯示微產出任務 + 兩種證據狀態
  function renderMasteryPanel(topic) {
    let panel = document.getElementById('masteryPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'masteryPanel';
      const examSection = elements.detailContent.querySelector('.exam-section');
      examSection.parentNode.insertBefore(panel, examSection);
    }
    panel.style.display = 'block';

    const md = MICRO_DELIVERABLES[topic.id] || { task: '完成一個與本章相關的小產出。', output: '一段可檢視的結果' };
    const examOK = state.examPassed.includes(topic.id);
    const delivOK = state.deliverableDone.includes(topic.id);
    const done = examOK && delivOK;

    panel.innerHTML = `
      <div style="background:rgba(168,138,21,0.06); border:1px solid hsl(48,96%,60%); border-radius:8px; padding:1.1rem; margin:1.2rem 0;">
        <h4 style="color:hsl(48,96%,60%); margin-top:0; display:flex; justify-content:space-between; align-items:center;">
          <span>🎓 通關需要兩種證據（Mastery）</span>
          <span style="font-size:0.7rem; background:hsl(48,96%,60%); color:var(--bg-primary); padding:0.15rem 0.5rem; border-radius:4px; font-weight:700;">不只是看懂</span>
        </h4>
        <p style="font-size:0.82rem; color:var(--text-secondary); line-height:1.55; margin:0 0 0.9rem;">
          單選題只能證明「知道」。本章要算通關，需同時完成下列兩項：
        </p>
        <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.02); border:1px solid ${examOK ? 'rgba(16,185,129,0.4)' : 'var(--border-color)'}; border-radius:6px; padding:0.55rem 0.8rem; font-size:0.84rem;">
            <span>① 測驗答對</span>
            <span style="font-weight:700; color:${examOK ? 'var(--subject-a)' : '#f87171'}">${examOK ? '✓ 已完成' : '✗ 尚未完成'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.02); border:1px solid ${delivOK ? 'rgba(16,185,129,0.4)' : 'var(--border-color)'}; border-radius:6px; padding:0.55rem 0.8rem; font-size:0.84rem;">
            <span>② 完成微產出</span>
            <span style="font-weight:700; color:${delivOK ? 'var(--subject-a)' : '#f87171'}">${delivOK ? '✓ 已完成' : '✗ 尚未完成'}</span>
          </div>
        </div>

        <div style="background:rgba(0,0,0,0.18); border-radius:6px; padding:0.8rem;">
          <div style="font-size:0.82rem; font-weight:700; margin-bottom:0.3rem;">💻 本章微產出任務</div>
          <p style="font-size:0.82rem; color:var(--text-secondary); line-height:1.55; margin:0 0 0.4rem;">${md.task}</p>
          <p style="font-size:0.76rem; color:var(--text-muted); margin:0 0 0.7rem;">預期產出：${md.output}</p>
          <button id="btnDeliverableDone" class="btn" style="width:100%; ${delivOK ? 'opacity:0.6;' : ''}" ${delivOK ? 'disabled' : ''}>
            ${delivOK ? '✓ 已標記完成微產出' : '我已完成此微產出（標記為產出證據）'}
          </button>
        </div>

        ${done ? '<div style="margin-top:0.8rem; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.4); border-radius:6px; padding:0.6rem 0.8rem; font-size:0.84rem; font-weight:600; color:var(--subject-a);">🎉 本章已通關（兩種證據齊備）。</div>' : ''}
      </div>
    `;

    const btn = panel.querySelector('#btnDeliverableDone');
    if (btn && !delivOK) {
      btn.onclick = () => { recordDeliverableDone(topic.id); renderMasteryPanel(topic); };
    }
  }

  function updateProgressUI() {
    const totalTopics = syllabusData.topics.length;
    const completedCount = state.completedTopics.length;
    const percentage = Math.round((completedCount / totalTopics) * 100);
    
    elements.progressBarFill.style.width = `${percentage}%`;
    elements.progressPercentageText.textContent = `${percentage}%`;

    // Update subject-wise score text
    const subjects = ['A', 'B', 'C', 'D', 'E', 'F'];
    const subjectMax = { A: 3, B: 3, C: 3, D: 3, E: 3, F: 3 };
    const subjectCurrent = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    
    state.completedTopics.forEach(topicId => {
      const topic = syllabusData.topics.find(t => t.id === topicId);
      if (topic) {
        subjectCurrent[topic.subject]++;
      }
    });

    subjects.forEach(sub => {
      const el = document.getElementById(`scoreText${sub}`);
      if (el) {
        const count = subjectCurrent[sub];
        const max = subjectMax[sub];
        if (count === max) {
          el.innerHTML = `<span style="color:var(--subject-a); font-weight:700;">★ 已通關 (${count}/${max})</span>`;
        } else if (count > 0) {
          el.innerHTML = `<span style="color:var(--subject-b); font-weight:600;">已解鎖 ${count}/${max}</span>`;
        } else {
          el.innerHTML = `<span style="color:var(--text-muted);">未解鎖 (0/${max})</span>`;
        }
      }
    });

    // 進階模式解鎖檢查：完成 A–F 全部章節後，彈出進階圖譜
    if (window.AdvancedMode && typeof window.AdvancedMode.refreshUnlock === 'function') {
      window.AdvancedMode.refreshUnlock(state.completedTopics);
    }
    updateAdvancedProgressUI();
  }

  // --- 進階科目 G 進度（接進左側進度卡） ---
  function updateAdvancedProgressUI() {
    const row = document.getElementById('advancedProgressRow');
    if (!row) return;
    const prog = (window.AdvancedMode && window.AdvancedMode.getProgress)
      ? window.AdvancedMode.getProgress()
      : { done: 0, total: 10, unlocked: false };

    // 解鎖後才顯示 G 軌道
    row.style.display = prog.unlocked ? 'block' : 'none';
    if (!prog.unlocked) return;

    const scoreG = document.getElementById('scoreTextG');
    const fillG = document.getElementById('advancedBarFill');
    const pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;
    if (fillG) fillG.style.width = `${pct}%`;
    if (scoreG) {
      if (prog.done >= prog.total) {
        scoreG.innerHTML = `<span style="color:hsl(48,96%,60%); font-weight:800;">🏅 已養成 (${prog.done}/${prog.total})</span>`;
      } else {
        scoreG.textContent = `${prog.done}/${prog.total}`;
      }
    }
  }

  // --- RENDER CANVAS RADAR CHART (A–F + 進階 G) ---
  function renderRadarChart() {
    const canvas = elements.radarCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // headless / unsupported

    // Reset canvas resolution
    canvas.width = 160;
    canvas.height = 160;

    const width = canvas.width;
    const height = canvas.height;
    const center = { x: width / 2, y: height / 2 };
    const radius = 54;

    ctx.clearRect(0, 0, width, height);

    // 1. Base subject scores (A–F)
    const subjects = ['A', 'B', 'C', 'D', 'E', 'F'];
    const subjectMax = { A: 3, B: 3, C: 3, D: 3, E: 3, F: 3 };
    const subjectCurrent = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

    state.completedTopics.forEach(topicId => {
      const topic = syllabusData.topics.find(t => t.id === topicId);
      if (topic) subjectCurrent[topic.subject]++;
    });

    // 2. Build axes array — 6 base + 1 advanced (G)
    const axes = subjects.map(s => ({
      label: s,
      value: subjectCurrent[s] / subjectMax[s],
      color: syllabusData.subjects[s].color
    }));

    const advProg = (window.AdvancedMode && window.AdvancedMode.getProgress)
      ? window.AdvancedMode.getProgress()
      : { done: 0, total: 10 };
    axes.push({
      label: 'G',
      value: advProg.total ? advProg.done / advProg.total : 0,
      color: 'hsl(48, 96%, 60%)'
    });

    const N = axes.length; // 7
    const angleAt = i => (Math.PI * 2 / N) * i - Math.PI / 2;

    // 3. Polygon grid (3 layers)
    for (let layer = 1; layer <= 3; layer++) {
      ctx.beginPath();
      const layerRadius = (radius / 3) * layer;
      for (let i = 0; i < N; i++) {
        const a = angleAt(i);
        const x = center.x + Math.cos(a) * layerRadius;
        const y = center.y + Math.sin(a) * layerRadius;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 4. Cross lines from center
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = angleAt(i);
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(center.x + Math.cos(a) * radius, center.y + Math.sin(a) * radius);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // 5. Score filled polygon
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = angleAt(i);
      const score = Math.max(0.08, axes[i].value);
      const x = center.x + Math.cos(a) * (score * radius);
      const y = center.y + Math.sin(a) * (score * radius);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'var(--subject-e)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 6. Axis labels (center-anchored, generalised for N axes)
    ctx.font = 'bold 10px var(--font-sans)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < N; i++) {
      const a = angleAt(i);
      const x = center.x + Math.cos(a) * (radius + 12);
      const y = center.y + Math.sin(a) * (radius + 12);
      ctx.fillStyle = axes[i].color;
      ctx.fillText(axes[i].label, x, y);
    }
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  // --- MOCK EXAM SYSTEM ---
  function openMockExam() {
    state.mockExam.active = true;
    state.mockExam.currentIndex = 0;
    state.mockExam.answers = [];
    state.mockExam.score = 0;
    
    // Choose 5 random topics out of all syllabus topics, then pick 1 random question out of 3 for each
    const shuffled = [...syllabusData.topics].sort(() => 0.5 - Math.random());
    state.mockExam.questions = shuffled.slice(0, 5).map(topic => {
      const qIndex = Math.floor(Math.random() * topic.examQuestions.length);
      return {
        id: topic.id,
        subject: topic.subject,
        title: topic.title,
        qIndex: qIndex,
        examQuestion: topic.examQuestions[qIndex]
      };
    });

    renderMockExamScreen();
    elements.examModal.classList.add('active');
  }

  function renderMockExamScreen() {
    const modalBody = elements.examContentBox;
    modalBody.innerHTML = '';
    
    const idx = state.mockExam.currentIndex;
    const isIntro = idx === -1;
    const isFinished = idx === 5;
    
    // Control footer action buttons display
    elements.btnPrevExam.style.display = isFinished || isIntro ? 'none' : 'inline-flex';
    elements.btnNextExam.style.display = isFinished || isIntro || idx === 4 ? 'none' : 'inline-flex';
    elements.btnSubmitExam.style.display = idx === 4 ? 'inline-flex' : 'none';

    if (isFinished) {
      renderExamResults();
      return;
    }

    const mockQ = state.mockExam.questions[idx];
    const q = mockQ.examQuestion;
    
    const examCard = document.createElement('div');
    examCard.className = 'exam-question-card';
    examCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <span class="exam-badge" style="background:var(--subject-d)">Question ${idx + 1} of 5</span>
        <span style="font-size:0.8rem; color:var(--text-muted)">Subject: ${syllabusData.subjects[mockQ.subject].title}</span>
      </div>
      <p class="exam-question" style="font-size:1.05rem; line-height:1.6; margin-bottom:1.5rem;">${formatMathText(q.question)}</p>
      <div class="exam-options-grid" id="examMockOptions"></div>
    `;

    modalBody.appendChild(examCard);
    
    const optionsGrid = document.getElementById('examMockOptions');
    const letters = ['A', 'B', 'C', 'D'];
    
    q.options.forEach((opt, oIdx) => {
      const btn = document.createElement('button');
      btn.className = 'exam-option-btn';
      
      const optionHash = simpleHash(mockQ.id + "-" + mockQ.qIndex + "-" + oIdx);
      const isCorrect = optionHash === q.answerHash;

      const previouslyAnswered = state.mockExam.answers[idx];
      if (previouslyAnswered !== undefined) {
        if (oIdx === previouslyAnswered) {
          btn.classList.add(isCorrect ? 'correct' : 'wrong');
        } else if (isCorrect) {
          btn.classList.add('correct');
        }
        btn.setAttribute('disabled', 'true');
      }

      btn.innerHTML = `
        <span class="exam-option-letter">${letters[oIdx]}</span>
        <span class="exam-option-text">${formatMathText(opt)}</span>
      `;

      btn.onclick = () => {
        state.mockExam.answers[idx] = oIdx;
        if (isCorrect) {
          state.mockExam.score++;
          btn.classList.add('correct');
        } else {
          btn.classList.add('wrong');
          // 記錄錯題（模擬考）
          dispatchMistake(mockQ.id, mockQ.qIndex, oIdx);
          // Highlight correct one
          q.options.forEach((_, correctOptIdx) => {
            if (simpleHash(mockQ.id + "-" + mockQ.qIndex + "-" + correctOptIdx) === q.answerHash) {
              optionsGrid.querySelectorAll('.exam-option-btn')[correctOptIdx].classList.add('correct');
            }
          });
        }
        
        // Disable all options immediately
        optionsGrid.querySelectorAll('.exam-option-btn').forEach(b => b.setAttribute('disabled', 'true'));
        
        // Auto advance after short delay
        setTimeout(() => {
          if (state.mockExam.currentIndex < 4) {
            state.mockExam.currentIndex++;
            renderMockExamScreen();
          } else {
            elements.btnSubmitExam.style.display = 'inline-flex';
          }
        }, 1200);
      };

      optionsGrid.appendChild(btn);
    });
  }

  function renderExamResults() {
    const modalBody = elements.examContentBox;
    const score = state.mockExam.score;
    
    // Determine high-school mock exam rank
    let rank = 'F';
    let comment = '再接再厲！你需要精研基本面坐標與籌碼矩陣，多學多考！';
    if (score === 5) {
      rank = 'A+';
      comment = '神乎其技！你已完美掌握量化金融、風險幾何與籌碼力學的真諦，堪稱頂標！';
    } else if (score === 4) {
      rank = 'A';
      comment = '傲視同群！對估值微積分與法權張量有極高理解，前標水準！';
    } else if (score === 3) {
      rank = 'B';
      comment = '表現優良！基礎理論穩固，多練習 FinMind 代碼以求突破，均標水準。';
    } else if (score === 2) {
      rank = 'C';
      comment = '實力中等。需再細讀杜邦幾何分析與風險投資組合邊緣。';
    }
    
    modalBody.innerHTML = `
      <div class="result-sheet">
        <h2>🎉 量化金融與風險幾何學測成績單</h2>
        <div class="result-rank-ring glow-text">${rank}</div>
        <p class="result-score">總得分：<strong>${score} / 5</strong> 題</p>
        <p style="font-size:0.95rem; color:var(--text-secondary); max-width:80%; margin: 0 auto; line-height:1.6;">${comment}</p>
        
        <div style="width:100%; border-top:1px solid var(--border-color); padding-top:1.5rem; margin-top:1rem; text-align:left;">
          <h4 style="margin-bottom:0.8rem;">題目回顧：</h4>
          <div style="display:flex; flex-direction:column; gap:0.6rem;">
            ${state.mockExam.questions.map((q, i) => {
              const selectedIdx = state.mockExam.answers[i];
              const isCorrect = selectedIdx !== undefined && (simpleHash(q.id + "-" + q.qIndex + "-" + selectedIdx) === q.examQuestion.answerHash);
              return `
                <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.02); padding:0.8rem; border-radius:6px; border:1px solid ${isCorrect ? 'var(--subject-a)' : 'rgba(239, 68, 68, 0.4)'}">
                  <span style="font-size:0.85rem; font-weight:500;">${i+1}. ${q.title}</span>
                  <span style="font-size:0.8rem; font-weight:700; color:${isCorrect ? 'var(--subject-a)' : '#ef4444'}">${isCorrect ? '答對 (+1)' : '答錯 (0)'}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
    
    // Automatically complete corresponding mock-exam challenges
    state.mockExam.questions.forEach((q, i) => {
      const selectedIdx = state.mockExam.answers[i];
      if (selectedIdx !== undefined && (simpleHash(q.id + "-" + q.qIndex + "-" + selectedIdx) === q.examQuestion.answerHash)) {
        // 模擬考只給「測驗答對」這一種證據；通關仍需在章節內完成微產出
        recordExamPassed(q.id);
      }
    });
  }

  // --- FINMIND DATA SANDBOX ---
  function openSandbox() {
    generateSandboxCode();
    elements.sandboxModal.classList.add('active');
  }

  function generateSandboxCode() {
    const stockId = elements.sandboxStockId.value || '2330';
    const dataset = elements.sandboxDataset.value;
    const startDate = elements.sandboxStartDate.value || '2025-01-01';

    let code = `import pandas as pd
from FinMind.data import DataLoader

# 1. 初始化 FinMind API 資料載入器
dl = DataLoader()

# 2. 以動態參數拉取數據 (股票: ${stockId}, 開始日期: ${startDate})
`;

    if (dataset === 'fundamental') {
      code += `# 載入台灣股市三大財務報表: 綜合損益表、資產負債表、現金流量表
df = dl.taiwan_stock_financial_statement(
    stock_id='${stockId}',
    start_date='${startDate}'
)

# 3. 三維報表寬矩陣轉換 (長格式 -> 寬格式)
df_pivot = df.pivot_table(index='date', columns='type', values='value', aggfunc='first').reset_index()
print(f"✅ 台股 ${stockId} 財務矩陣重構完成！最新資料樣本:")
print(df_pivot.tail(5))
`;
    } else if (dataset === 'chips') {
      code += `# 載入三大法人買賣超 (外資、投信、自營商聯立權重向量)
df = dl.taiwan_stock_institutional_investors(
    stock_id='${stockId}',
    start_date='${startDate}'
)

# 3. 特徵提取與清洗
df_grouped = df.groupby(['date', 'name'])['buy'].sum().unstack().reset_index()
print(f"✅ 台股 ${stockId} 三大法人買進特徵向量空間:")
print(df_grouped.tail(5))
`;
    } else if (dataset === 'margin') {
      code += `# 載入信用交易力學數據 (融資融券維持率餘額分析)
df = dl.taiwan_stock_margin_purchase_short_sale(
    stock_id='${stockId}',
    start_date='${startDate}'
)

# 3. 計算多空維持率分量與券資比
df['券資比'] = df['ShortSaleRemaining'] / df['MarginPurchaseRemaining']
print(f"✅ 台股 ${stockId} 信用交易維持率動態力學:")
print(df[['date', 'MarginPurchaseRemaining', 'ShortSaleRemaining', '券資比']].tail(5))
`;
    } else if (dataset === 'concentration') {
      code += `# 載入集保戶股權分散表 (籌碼張量與熵分析)
df = dl.taiwan_stock_shareholding_class(
    stock_id='${stockId}',
    start_date='${startDate}'
)

# 3. 抓出千張大戶 (Class 15) 持股變動數據
df_1000 = df[df['Stage'] == '1000,000以上'] # 部分集保版本以此篩選
if df_1000.empty:
    max_stage = df['Stage'].max()
    df_1000 = df[df['Stage'] == max_stage]

print(f"✅ 台股 ${stockId} 千張大戶籌碼流向變動:")
print(df_1000.tail(5))
`;
    } else if (dataset === 'news') {
      code += `# 載入個股每日新聞標題數據 (NLP情緒輿論空間投影)
df = dl.taiwan_stock_news(
    stock_id='${stockId}',
    start_date='${startDate}'
)

print(f"✅ 台股 ${stockId} 最新輿論新聞特徵向量數: {len(df)} 條新聞")
print(df[['date', 'title']].tail(5))
`;
    }

    elements.sandboxOutputCode.textContent = code;
  }

  // --- MATH FORMULA TEXT REPLACEMENT HELPER ---
  function formatMathText(text) {
    if (!text) return '';
    
    if (window.katex) {
      // 1. Parse Block Math $$...$$
      let processed = text.replace(/\$\$(.*?)\$\$/gs, (match, formula) => {
        try {
          return `<div class="formula-block">${window.katex.renderToString(formula, { displayMode: true, throwOnError: false })}</div>`;
        } catch (e) {
          console.error("KaTeX block rendering error:", e);
          return `<div class="formula-block">${formula}</div>`;
        }
      });
      
      // 2. Parse Inline Math $...$
      processed = processed.replace(/\$(.*?)\$/gs, (match, formula) => {
        try {
          return window.katex.renderToString(formula, { displayMode: false, throwOnError: false });
        } catch (e) {
          console.error("KaTeX inline rendering error:", e);
          return `<code class="formula-inline">${formula}</code>`;
        }
      });
      
      return processed;
    } else {
      // Offline fallback: Use the regex replacement compiler
      return text
        .replace(/\$\$(.*?)\$\$/g, '<div class="formula-block">$1</div>')
        .replace(/\$(.*?)\$/g, '<code class="formula-inline">$1</code>')
        .replace(/\\mathbf\{([a-zA-Z])\}/g, '<strong>$1</strong>')
        .replace(/\\vec\{([a-zA-Z])\}/g, '<strong>$1</strong>')
        .replace(/\\quad/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
        .replace(/\\text\{([^{}]+)\}/g, '$1')
        .replace(/\\Delta/g, 'Δ')
        .replace(/\\Sigma/g, 'Σ')
        .replace(/\\beta/g, 'β')
        .replace(/\\alpha/g, 'α')
        .replace(/\\sigma/g, 'σ')
        .replace(/\\tau/g, 'τ')
        .replace(/\\sum_\{([^{}]+)\}\^([^{}]+)/g, 'Σ<sub>$1</sub><sup>$2</sup>')
        .replace(/\\sum/g, 'Σ')
        .replace(/\\le/g, '≤')
        .replace(/\\neg/g, '¬')
        .replace(/\\approx/g, '≈')
        .replace(/\\times/g, '×')
        .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)')
        .replace(/\^([0-9a-zA-Z+\-^]+)/g, '<sup>$1</sup>')
        .replace(/_([0-9a-zA-Z+\-^]+)/g, '<sub>$1</sub>');
    }
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Sandbox Listeners
    elements.btnSandbox.addEventListener('click', openSandbox);
    elements.btnCloseSandbox.addEventListener('click', () => {
      elements.sandboxModal.classList.remove('active');
    });
    
    // Auto trigger updates on input change inside sandbox
    elements.btnGenerateCode.addEventListener('click', generateSandboxCode);
    elements.sandboxStockId.addEventListener('input', generateSandboxCode);
    elements.sandboxDataset.addEventListener('change', generateSandboxCode);
    elements.sandboxStartDate.addEventListener('change', generateSandboxCode);

    elements.btnCopySandboxCode.addEventListener('click', () => {
      navigator.clipboard.writeText(elements.sandboxOutputCode.textContent);
      elements.btnCopySandboxCode.textContent = 'Copied!';
      setTimeout(() => {
        elements.btnCopySandboxCode.textContent = 'Copy Sandbox Code';
      }, 2000);
    });

    // Switch Question Listener
    elements.btnSwitchQuestion.addEventListener('click', () => {
      if (state.activeTopic && state.activeTopic.examQuestions) {
        const topic = state.activeTopic;
        const currentIdx = state.topicQuestionIndices[topic.id] || 0;
        const nextIdx = (currentIdx + 1) % topic.examQuestions.length;
        state.topicQuestionIndices[topic.id] = nextIdx;
        
        // Add dynamic visual fade animation
        const examBox = document.getElementById('examQuestionBox');
        if (examBox) {
          examBox.style.opacity = '0.3';
          examBox.style.transform = 'translateY(2px)';
          examBox.style.transition = 'all 0.15s ease';
          setTimeout(() => {
            renderExamQuestion(topic);
            examBox.style.opacity = '1';
            examBox.style.transform = 'translateY(0)';
          }, 150);
        } else {
          renderExamQuestion(topic);
        }
      }
    });

    // 進階模組進度變動 → 即時刷新雷達圖與進度卡
    document.addEventListener('finmath-advanced-changed', () => {
      updateAdvancedProgressUI();
      renderRadarChart();
    });

    // Mock Exam Listeners
    elements.btnMockExam.addEventListener('click', openMockExam);
    elements.btnCloseExam.addEventListener('click', () => {
      elements.examModal.classList.remove('active');
    });

    elements.btnPrevExam.addEventListener('click', () => {
      if (state.mockExam.currentIndex > 0) {
        state.mockExam.currentIndex--;
        renderMockExamScreen();
      }
    });

    elements.btnNextExam.addEventListener('click', () => {
      if (state.mockExam.currentIndex < 4) {
        state.mockExam.currentIndex++;
        renderMockExamScreen();
      }
    });

    elements.btnSubmitExam.addEventListener('click', () => {
      state.mockExam.currentIndex = 5; // Finish mark
      renderMockExamScreen();
    });

    // Close Detail Drawer Listener
    if (elements.btnCloseDetail) {
      elements.btnCloseDetail.addEventListener('click', () => {
        if (elements.panelRight) {
          elements.panelRight.classList.remove('active');
        }
        state.activeTopic = null;
        renderSvgMap(); // Clear active glow state
      });
    }

    // Close Modals & Detail Drawer on Outer Overlay click
    window.addEventListener('click', (e) => {
      if (e.target === elements.sandboxModal) {
        elements.sandboxModal.classList.remove('active');
      }
      if (e.target === elements.examModal) {
        elements.examModal.classList.remove('active');
      }
      
      // Backdrop click to dismiss floating details drawer
      if (elements.panelRight && elements.panelRight.classList.contains('active')) {
        const clickedInsideDrawer = elements.panelRight.contains(e.target);
        const clickedOnNode = e.target.closest('.map-node-group');
        const clickedOnSandboxBtn = e.target === elements.btnSandbox;
        const clickedOnExamBtn = e.target === elements.btnMockExam;
        
        if (!clickedInsideDrawer && !clickedOnNode && !clickedOnSandboxBtn && !clickedOnExamBtn) {
          elements.panelRight.classList.remove('active');
          state.activeTopic = null;
          renderSvgMap();
        }
      }
    });
  }

  // Boot
  init();
});
