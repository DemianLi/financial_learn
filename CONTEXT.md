# CONTEXT.md — FinMath Map 平台設計哲學與領域語彙定義

> 本文件供 AI Agent 在每次 loop 迭代時參考，確保所有優化建議均符合平台的原始設計意圖。

---

## 一、平台起源與設計初衷

### 誕生背景

本平台基於兩個來源的交集而生：

1. **Morris 文章**（[Anthropic 56 Skills 全解析](https://morrishare.com/a-comprehensive-analysis-of-skills-in-financial-services-plugins/)）：系統化整理了 Anthropic Financial Services Plugins 的 56 個機構技能，分佈在 7 個 Plugin 中（1 Core + 4 Add-on + 2 Partner）。這些技能代表華爾街最佳實踐的 SOP 結晶。

2. **FinMind API**（[Taiwan Open Data](https://github.com/FinMind/FinMind)）：台灣開源股票數據工具，提供財報、三大法人、月營收、集保分散表、信用交易、個股新聞等資料集，是台灣量化分析的實踐橋樑。

### 設計意圖（一句話版本）

> 把 Anthropic 56 個機構研究技能所對應的「數學底層邏輯」，透過台灣高中考綱數學（坐標系、向量、線性代數、機率論）拆解為可學習的節點，並以 FinMind API 作為實踐軸的驗證工具，最終讓學習者能夠真正產出機構級的研究交付物。

---

## 二、核心設計哲學：雙向驗證學習

### 兩軸定義

| 軸 | 名稱 | 驗證方式 | 實作狀態 |
|----|------|----------|----------|
| 理論軸（Theory Axis） | 選擇題指考模擬 | 答對才解鎖（examPassed） | ✅ 已完成 |
| 實踐軸（Practice Axis） | FinMind 微產出 | 交付物驗證（deliverableDone） | ⚠️ 幾乎未開發 |

### 雙證據通關（Dual-Evidence Mastery）

章節的真正「通關」需要**兩份證據同時存在**：
- `examPassed`：理論題答對（驗證數學概念理解）
- `deliverableDone`：微產出完成（驗證能對真實資料動手）

兩者缺一不可。目前平台僅有理論軸驗證，實踐軸的引導、任務定義、輸出驗證三個環節均待建立。

### 為什麼「理論 + 實踐」缺一不可

Morris 文章中，56 個技能本質上都是**可交付的 SOP**（DCF 九步驟、IC Memo 結構框架、法說會分析技術），而非單純公式。一個只答對選擇題的學習者，依然無法產出機構可接受的研究成果。FinMind 是讓學習者從「理解」跨越到「產出」的唯一實踐工具。

---

## 三、課程架構與 56 Skills 對齊

### 主課程（A–F 共 18 章）對齊的核心技能

| 科目 | 主題 | 對應 Wall Street Skill |
|------|------|----------------------|
| A1 | 三維報表坐標系 | `3-statement-model` |
| A2 | 杜邦幾何分析 | `comps-analysis` |
| A3 | 現金流向量 | `dcf-model` |
| B1 | 可比同業多維投影 | `comps-analysis` |
| B2 | DCF 時間積分與敏感度 | `dcf-model` |
| B3 | 產業估值變換 | `sector-overview` |
| C1 | 三大法人聯立方程 | `morning-note` |
| C2 | 融資融券力學 | `idea-generation` |
| C3 | 集保股權張量 | `initiating-coverage` |
| D1 | 新聞情緒分析 | `morning-note` |
| D2 | 法說會指引機率 | `earnings-analysis` |
| D3 | 催化劑事件脈衝 | `catalyst-calendar` |
| E1 | CAPM 與 Beta | `portfolio-rebalance` |
| E2 | Sharpe Ratio 矩陣 | `portfolio-rebalance` |
| E3 | VaR 與最大回撤 | `idea-generation` |
| F1 | 台股月營收脈衝 | `earnings-preview` |
| F2 | 法說會展望貝氏機率 | `initiating-coverage` |
| F3 | 籌碼集中信貸力學 | `portfolio-rebalance` |

### 進階科目 G（10 個模組）對齊的技能群

G 科目是「從理解到交付」的橋樑，明確對齊了交付物導向的技能：
- G1: `dcf-model` / `initiating-coverage`（SOP 化工作流）
- G2: `comps-analysis` / `audit-xls` / `pitch-deck`（交付物產出）
- G3: `idea-generation` / `thesis-tracker`（數據到投資論點）
- G4: `dcf-model` / `3-statement-model`（端到端估值建模）
- G5–G10: 覆蓋 `earnings-analysis`、`morning-note`、`portfolio-monitoring` 等

### 課程覆蓋範圍評估

**強覆蓋**（Equity Research 垂直）：`earnings-analysis`, `morning-note`, `initiating-coverage`, `idea-generation`, `thesis-tracker`, `catalyst-calendar`, `sector-overview`

**中覆蓋**（Core 分析工具）：`dcf-model`, `comps-analysis`, `3-statement-model`, `audit-xls`

**刻意不覆蓋**（超出台股散戶/機構研究員範圍）：IB 交易技能（`cim-builder`, `merger-model`, `lbo-model`）、PE 盡職調查（`dd-checklist`, `ic-memo`）、財富管理（`tax-loss-harvesting`）

**結論**：課程設計符合「台股量化研究員養成」的設計初衷，核心 Equity Research 垂直覆蓋完整，邊界選擇合理。

---

## 四、領域語彙定義

### 平台核心術語

| 術語 | 定義 |
|------|------|
| **雙向驗證學習** | 同一章節需通過理論軸（選擇題）與實踐軸（FinMind 微產出）雙重驗證才算通關 |
| **理論軸** | 以指考/學測選擇題形式驗證數學概念理解，通過後設 `examPassed = true` |
| **實踐軸** | 以 FinMind API 微任務形式驗證數據處理與交付物產出能力，通過後設 `deliverableDone = true` |
| **微產出（Micro-Deliverable）** | 實踐軸的最小可驗證任務單位，通常是一段 Python 程式碼輸出 + 簡短書面詮釋 |
| **雙證據通關** | `examPassed AND deliverableDone` → `finalizeCompletion()` 的條件 |
| **FinMind 任務** | 以特定 FinMind API 資料集為輸入，要求學習者完成特定數據分析並呈現結果 |
| **Wall Street Skill** | Anthropic Financial Services Plugins 中 56 個 SOP 技能之一，是每個章節的「職業終點站」 |
| **指考節點** | 地圖上的 18 個章節節點（A1–F3），對應高中數學考綱與機構研究技能 |
| **機構研究員 Ready** | 完成 A–F 全部 18 章後解鎖 G 科目的狀態，象徵從「理解金融數學」升級到「能產出研究交付物」 |
| **催化劑窗口** | D3/F1/F2 章節涉及的事件驅動分析概念，指重大消息釋出前後的異常報酬觀察期 |

### FinMind 資料集對應術語

| 資料集名稱 | 對應科目 | 說明 |
|-----------|---------|------|
| `taiwan_stock_financial_statement` | A, B | 財報三表，含損益表、資產負債表、現金流量 |
| `taiwan_stock_pe` | B | 本益比、本淨比、殖利率日資料 |
| `taiwan_stock_institutional_investors` | C | 三大法人每日買賣超 |
| `taiwan_stock_margin_purchase_short_sale` | C, F | 融資融券餘額與資券比 |
| `taiwan_stock_shareholding_class` | C, F | 集保戶股權分散表 |
| `taiwan_stock_news` | D, F | 個股新聞（含標題、日期） |
| `taiwan_stock_month_revenue` | D, F | 月度營收（含 YoY 計算） |

---

## 五、實踐軸的設計目標

### 實踐軸想達到的能力目標

一個完成實踐軸的學習者，應能做到：

1. **資料管線化**：可重複呼叫的 FinMind 取數函式，輸入股票代號 → 輸出標準化 DataFrame
2. **計算正確**：能依本章的數學公式，對真實台股資料計算出正確的指標數值
3. **結果詮釋**：能用一到兩句話將計算結果轉化為具備投資意義的判斷（thesis 雛形）
4. **交付物意識**：理解「答對題目」與「產出機構可接受的成品」的差距

### 實踐軸的三個開發層次（由易到難）

| 層次 | 描述 | 目前狀態 |
|------|------|----------|
| L1. 程式碼可執行 | 每章的 `finmindCode` 能在本機無錯執行，輸出有意義的結果 | 部分可執行，API 呼叫語法未更新 |
| L2. 任務引導 | 每章有明確的「你要計算什麼、用哪個 API、輸出什麼格式」的任務說明 | 幾乎空白 |
| L3. 輸出驗證 | 平台能判斷學習者的輸出是否合格（自評清單或自動比對） | 完全空白 |

---

## 六、未來 Issue 的判斷標準

### 一個 Issue 值得做的條件

優先考慮以下條件**至少滿足一個**的 Issue：

1. **強化實踐軸**：讓學習者在 FinMind 上的動手驗證更明確、更可執行、更有回饋
2. **縮短從資料到交付物的距離**：讓程式碼輸出更接近真實的機構研究成品形式
3. **解決理論軸與實踐軸的脫節**：讓選擇題的數學概念與 FinMind 實際數據計算產生直接對應
4. **降低入門障礙**：讓第一次使用 FinMind API 的學習者能在 10 分鐘內成功執行第一段程式

### 一個 Issue 應該跳過的情況

- 純粹優化 UI 動畫或視覺效果，對學習驗證無影響
- 增加更多選擇題，但不增加實踐環節
- 超出 Equity Research 技能範圍的功能（如 IB 交易、PE 盡調、財富規劃）
- 抽象的架構重構，沒有直接的使用者學習體驗改善

### 判斷問題：一個 Issue 是否有助於「實踐軸想達到的目的」？

> 完成這個 Issue 之後，一個學習者是否更有能力把 FinMind 數據轉化成一份符合 Wall Street Skill 標準的研究交付物？

答「是」的優先做，答「不確定」的需要更多說明，答「否」的跳過。

---

## 七、技術架構摘要（供 Agent 參考）

### 模組責任邊界

| 模組 | 責任 |
|------|------|
| `syllabusData.js` | 18 個章節的內容資料庫（標題、公式、題目、FinMind 程式碼）|
| `advancedData.js` | G 科目 10 個進階模組資料庫（含 checklist 交付物清單）|
| `app.js` | 主應用邏輯，SVG 地圖渲染，Detail Drawer 控制 |
| `answerVerifier.js` | 集中的答案驗證模組（`isCorrect`, `correctIndexOf`, `simpleHash`）|
| `storage.js` (`FinStorage`) | 集中的 localStorage schema，11 個 KEYS 常數 |
| `studyTools.js` | 錯題本 + 起點診斷工具 |
| `advancedMode.js` | G 科目解鎖邏輯，進階圖譜渲染 |
| `aiSandbox.js` | AI 分析師沙盒（實驗性，plug-and-play）|

### 雙證據通關的 localStorage 鍵值

```javascript
FinStorage.KEYS.EXAM_PASSED        // 理論軸：本章選擇題已通過
FinStorage.KEYS.EXAM_SIG           // 理論軸：防篡改簽章
FinStorage.KEYS.DELIVERABLE_DONE   // 實踐軸：本章微產出已完成
FinStorage.KEYS.DELIVERABLE_SIG    // 實踐軸：防篡改簽章
FinStorage.KEYS.COMPLETED_TOPICS   // 最終完成章節列表（雙軸均通過）
```

---

*最後更新：2026-06-06*
*文件目的：供 AI Agent 在每次 loop 中參考，確保優化方向符合平台設計初衷。*
