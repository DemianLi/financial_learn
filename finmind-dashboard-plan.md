# FinMind Dashboard — 實作計劃

> 定位：完成 FinMath Map 學習地圖後，學習者實際使用的專業研究員沙盒。
> 輸入一檔台股代號，一鍵渲染財報、籌碼、營收三維分析面板。

---

## 一、決策摘要

| 維度 | 決策 |
|------|------|
| 定位 | 專業研究員沙盒——「完成學習地圖後你會用的工具」 |
| 執行環境 | 學習者本機自行啟動 |
| Repo | 獨立新 repo：`financial_learn_dashboard` |
| 前端 | Vue 3 + Vite + Tailwind CSS v4 |
| 後端 | FastAPI（Python 3.12） |
| 圖表 | matplotlib → SVG 字串，FastAPI 回傳，Vue 嵌入 DOM |
| 視覺風格 | TradingView 深色風（深灰底 + 綠色強調色） |
| 佈局 | 左側固定 Sidebar + 頂部 TopBar + Vue Router 主畫布 |
| API Token | `.env` 優先；無 `.env` 則首次啟動顯示 modal，存入 localStorage |
| 學習地圖關聯 | 概念對齊（不做直接連結）：儀表板本身即是「專業人士的視角」 |

---

## 二、架構圖

```
┌──────────────────────────────────────────────────────────┐
│  TopBar                                                  │
│  [  股票代號輸入框  ]  [  查詢  ]  [  日期範圍  ]         │
├────────────┬─────────────────────────────────────────────┤
│  Sidebar   │  主畫布（Vue Router <RouterView>）           │
│            │                                             │
│  財報面    │   ┌──────────────┐  ┌──────────────┐        │
│  籌碼面    │   │  ChartCard   │  │  ChartCard   │        │
│  營收面    │   │  (SVG 圖)    │  │  (SVG 圖)    │        │
│            │   └──────────────┘  └──────────────┘        │
│  ──────    │                                             │
│  設定      │   ┌──────────────┐                          │
│            │   │  ChartCard   │                          │
│            │   └──────────────┘                          │
└────────────┴─────────────────────────────────────────────┘
```

**資料流：**
```
Vue TopBar（輸入代號）
  → Pinia store（ticker 狀態）
  → ChartCard（呼叫 FastAPI）
  → FastAPI endpoint（呼叫 FinMind → matplotlib → SVG）
  → Vue v-html 嵌入 SVG
```

---

## 三、Repo 目錄結構

```
financial_learn_dashboard/
├── backend/
│   ├── main.py                  # FastAPI 入口，掛載所有 router，CORS 設定
│   ├── config.py                # 讀取 .env / 環境變數（FINMIND_TOKEN）
│   ├── finmind_client.py        # FinMind DataLoader 封裝（帶 TTL 快取）
│   ├── routers/
│   │   ├── financial.py         # 財報面 3 個 endpoint
│   │   ├── chips.py             # 籌碼面 3 個 endpoint
│   │   └── revenue.py           # 營收面 2 個 endpoint
│   ├── charts/
│   │   ├── base.py              # 公用樣式：深色主題、字型、顏色常數
│   │   ├── financial.py         # 財報 3 張圖的 matplotlib 函式
│   │   ├── chips.py             # 籌碼 3 張圖的 matplotlib 函式
│   │   └── revenue.py           # 營收 2 張圖的 matplotlib 函式
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── main.js
│   │   ├── App.vue              # 全域 layout（Sidebar + TopBar + RouterView）
│   │   ├── router/
│   │   │   └── index.js         # /financial  /chips  /revenue  /settings
│   │   ├── stores/
│   │   │   └── dashboard.js     # Pinia：ticker、token、dateRange、chartData
│   │   ├── views/
│   │   │   ├── FinancialView.vue
│   │   │   ├── ChipsView.vue
│   │   │   ├── RevenueView.vue
│   │   │   └── SettingsView.vue
│   │   └── components/
│   │       ├── Sidebar.vue       # 左側導覽（含 active 狀態）
│   │       ├── TopBar.vue        # 股票代號輸入 + 查詢按鈕
│   │       ├── ChartCard.vue     # SVG 容器（含 loading spinner + 錯誤狀態）
│   │       └── TokenModal.vue    # 首次啟動 token 設定 modal
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .env.example                  # FINMIND_TOKEN=your_token_here
└── README.md                     # 3 步驟啟動說明
```

---

## 四、三個面板 × 8 張圖

### 財報面 `/financial`

| # | 圖名 | FinMind 資料集 | matplotlib 圖型 |
|---|------|--------------|----------------|
| ① | 三大財報趨勢 | `taiwan_stock_financial_statement` | 折線圖（近 8 季，3 條線：營收/淨利/現金流） |
| ② | 杜邦分解 | `taiwan_stock_financial_statement` | 堆疊長條圖（ROE = 淨利率 × 資產周轉 × 財務槓桿） |
| ③ | PE 歷史帶狀圖 | `taiwan_stock_pe` | 折線圖 + ±1σ 填色帶（近 3 年） |

### 籌碼面 `/chips`

| # | 圖名 | FinMind 資料集 | matplotlib 圖型 |
|---|------|--------------|----------------|
| ④ | 三大法人買賣超 | `taiwan_stock_institutional_investors` | 堆疊長條圖（近 60 日，外資/投信/自營商三色） |
| ⑤ | 融資融券消長 | `taiwan_stock_margin_purchase_short_sale` | 雙軸折線圖（融資餘額 vs 融券餘額） |
| ⑥ | 集保分散圓環 | `taiwan_stock_shareholding_class` | 圓環圖（大戶 400 張+ vs 中小散戶持股比例） |

### 營收面 `/revenue`

| # | 圖名 | FinMind 資料集 | matplotlib 圖型 |
|---|------|--------------|----------------|
| ⑦ | 月營收 YoY 瀑布圖 | `taiwan_stock_month_revenue` | 瀑布圖（近 12 個月成長率，正/負分色） |
| ⑧ | 月營收累計對照 | `taiwan_stock_month_revenue` | 面積圖（今年累計 vs 去年同期，填色差異帶） |

---

## 五、FastAPI Endpoint 規格

所有 endpoint 接受 `stock_id`（股票代號）與可選的 `start_date`，回傳 `{ "svg": "<svg>...</svg>" }`。

```
GET /api/financial/statements?stock_id=2330&start_date=2023-01-01
GET /api/financial/dupont?stock_id=2330&start_date=2023-01-01
GET /api/financial/pe?stock_id=2330&start_date=2022-01-01

GET /api/chips/institutional?stock_id=2330
GET /api/chips/margin?stock_id=2330&start_date=2024-01-01
GET /api/chips/shareholding?stock_id=2330

GET /api/revenue/yoy?stock_id=2330
GET /api/revenue/cumulative?stock_id=2330
```

matplotlib 圖一律輸出 SVG 字串：
```python
import io, base64
buf = io.StringIO()
fig.savefig(buf, format='svg', bbox_inches='tight', transparent=True)
svg_str = buf.getvalue()
```

---

## 六、Token 管理流程

```
後端啟動
  → 讀 .env FINMIND_TOKEN
  → 若有：FinMind DataLoader 初始化完成
  → 若無：API 呼叫時回傳 401 { "error": "token_missing" }

前端啟動
  → 檢查 localStorage("finmind_token")
  → 若有：帶入所有 API request header
  → 若無：顯示 TokenModal（輸入後存 localStorage，不需重啟後端）

優先順序：後端 .env token > 前端 localStorage token
```

---

## 七、視覺設計規範

### 色系（TradingView 深色）

```css
--bg-primary:    #131722;   /* 主背景 */
--bg-secondary:  #1e222d;   /* Sidebar / Card 背景 */
--bg-card:       #2a2e39;   /* ChartCard 背景 */
--accent-green:  #26a69a;   /* 強調色（漲/正值） */
--accent-red:    #ef5350;   /* 跌/負值 */
--text-primary:  #d1d4dc;   /* 主文字 */
--text-muted:    #787b86;   /* 次要文字 */
--border:        #363a45;   /* 邊框 */
```

### matplotlib 深色主題設定（`charts/base.py`）

```python
import matplotlib.pyplot as plt
import matplotlib as mpl

def apply_dark_theme(fig, ax):
    fig.patch.set_facecolor('#2a2e39')
    ax.set_facecolor('#2a2e39')
    ax.tick_params(colors='#787b86')
    ax.xaxis.label.set_color('#787b86')
    ax.yaxis.label.set_color('#787b86')
    for spine in ax.spines.values():
        spine.set_edgecolor('#363a45')
    ax.grid(color='#363a45', linewidth=0.5)
```

### ChartCard 元件行為

- 呼叫 API 中：顯示深色 loading spinner（旋轉圓環動畫）
- 成功：fade-in SVG，過渡 0.3s
- 失敗：顯示紅色錯誤訊息 + 重試按鈕

---

## 八、開發 Phase 計劃

### Phase 1：骨架（預計 1–2 天）

- [ ] 初始化 Vue 3 + Vite + Tailwind v4 + Vue Router + Pinia
- [ ] 初始化 FastAPI + uvicorn + CORS middleware
- [ ] 實作 `.env` 讀取 + `config.py`
- [ ] 實作 Sidebar、TopBar、App.vue 整體 layout
- [ ] 實作 TokenModal（localStorage 存取）
- [ ] 空的三個 View 路由可切換
- [ ] 驗收：`npm run dev` + `uvicorn main:app` 同時跑起來，token 流程通

### Phase 2：財報面（預計 2–3 天）

- [ ] `finmind_client.py`：`taiwan_stock_financial_statement` + `taiwan_stock_pe` 封裝
- [ ] `charts/financial.py`：三大財報趨勢折線、杜邦分解長條、PE 帶狀圖
- [ ] `routers/financial.py`：3 個 endpoint
- [ ] `FinancialView.vue`：3 個 ChartCard 格線排版
- [ ] 驗收：輸入 2330，財報面三張圖正確渲染

### Phase 3：籌碼面 + 營收面（預計 2–3 天）

- [ ] `finmind_client.py`：新增三大法人 + 融資融券 + 集保 + 月營收資料集
- [ ] `charts/chips.py`：三大法人堆疊圖、融資融券雙軸折線、集保圓環圖
- [ ] `charts/revenue.py`：月營收 YoY 瀑布圖、累計對照面積圖
- [ ] 對應 routers + Views
- [ ] 驗收：三個面板全部可用

### Phase 4：精修（預計 1–2 天）

- [ ] FinMind 快取：同一股票 + 同一資料集 10 分鐘內不重複呼叫
- [ ] ChartCard fade-in 動畫 + loading spinner
- [ ] 錯誤處理：FinMind 逾時、代號不存在、token 無效
- [ ] 響應式：寬度 < 1024px 時 Sidebar 收合為 icon-only
- [ ] `README.md`：3 步驟啟動說明（`pip install` → `uvicorn` → `npm run dev`）
- [ ] `.env.example`

---

## 九、README 啟動流程（目標：3 步驟）

```bash
# Step 1：後端
cd backend
pip install -r requirements.txt
cp ../.env.example .env   # 填入 FINMIND_TOKEN
uvicorn main:app --reload --port 8000

# Step 2：前端
cd frontend
npm install
npm run dev

# Step 3：開啟瀏覽器
# http://localhost:5173
```

若沒有 `.env`，開啟後在 Token 設定 modal 貼上 token 即可使用。

---

## 十、對應學習地圖章節（概念對齊）

| 面板 | 圖表 | 對應 FinMath Map 章節 | Wall Street Skill |
|------|------|---------------------|------------------|
| 財報面 | ① 三大財報趨勢 | A1、A3 | `3-statement-model` |
| 財報面 | ② 杜邦分解 | A2 | `comps-analysis` |
| 財報面 | ③ PE 帶狀圖 | B2、B3 | `dcf-model` |
| 籌碼面 | ④ 三大法人 | C1 | `morning-note` |
| 籌碼面 | ⑤ 融資融券 | C2 | `idea-generation` |
| 籌碼面 | ⑥ 集保分散 | C3 | `initiating-coverage` |
| 營收面 | ⑦ 月營收 YoY | F1 | `earnings-preview` |
| 營收面 | ⑧ 月營收累計 | D1、F1 | `morning-note` |

> 儀表板不顯示上表內容，此處僅供開發者確認設計意圖對齊。

---

*計劃版本：v1.0 · 2026-06-13*
