// advancedData.js - 進階圖譜資料庫
// 機構市場研究員養成路徑：以「十個學習缺口建議」為開發需求，
// 將每一個缺口轉化為一個可通關的實戰模組（缺口說明 + 對齊機構 Skill + 學習目標 + FinMind 實戰任務 + 交付物檢核清單）。
// 解鎖條件：完成 A–F 全部 18 章。

const advancedSyllabus = {
  meta: {
    title: "進階科目 G：機構市場研究員實戰養成",
    subtitle: "從『理解金融』升級到『產出研究』——補上比喻地圖之外的六道門檻",
    color: "hsl(48, 96%, 60%)", // Gold
    unlockRequirement: 18, // 需完成的基礎章節數
    badge: "機構研究員 Ready"
  },

  // 10 個模組，對應十個學習建議。節點以序列方式構成「從數據到研究交付」的進程。
  modules: [
    {
      id: "g1",
      num: "G1",
      title: "流程化工作流：把比喻變成 SOP",
      icon: "🧭",
      x: 150, y: 80,
      gap: "網站教的是『數學比喻』（坐標系、向量、線性代數），幫助建立直覺；但機構研究員真正交付的是可重複執行的工作流——DCF 的九步驟、首次覆蓋報告的五階段流程。比喻能入門，卻無法替代 SOP。",
      skill: {
        name: "dcf-model / initiating-coverage",
        plugin: "Core / equity-research Add-on",
        desc: "把估值與覆蓋拆成可逐步執行、可交接、可審計的步驟流程，而非單一公式。"
      },
      objectives: [
        "能寫出 DCF 估值的九步驟流程（取數 → WACC → 預測 → 終值 → 折現 → 敏感度 → 交叉驗證 → 執行摘要 → 輸出）。",
        "理解 initiating-coverage 五階段：公司研究 → 財務建模 → 估值分析 → 圖表生成 → 報告組裝。",
        "把『一個比喻』改寫成『一份下次自己能重現的步驟清單』——每步標明輸入資料、執行動作、輸出格式，六個月後不看原始代碼也能重跑。"
      ],
      finmindCode: "import pandas as pd\nfrom FinMind.data import DataLoader\n\ndl = DataLoader()\n\n# 步驟 1：取數 ── 輸入：stock_id, start_date ／ 執行：呼叫 FinMind API ／ 輸出：財報 pivot DataFrame\ndef load_fundamentals(stock_id, start='2022-01-01'):\n    df = dl.taiwan_stock_financial_statement(stock_id=stock_id, start_date=start)\n    return df.pivot_table(index='date', columns='type', values='value', aggfunc='first')\n\n# 步驟 2：WACC 計算 ── 輸入：risk_free, beta, erp ／ 執行：加權平均資本成本 ／ 輸出：wacc（float）\ndef calc_wacc(risk_free=0.015, beta=1.1, erp=0.06):\n    return risk_free + beta * erp  # 簡化全權益版；實務需加稅後負債成本\n\n# 步驟 3：FCF 預測 ── 輸入：fundamentals DataFrame ／ 執行：OCF - Capex + 趨勢外推 ／ 輸出：fcf_list（list）\ndef forecast_fcf(fundamentals, years=5):\n    pass  # 骨架：取 OperatingCashFlow、CapitalExpenditure，計算歷史 FCF 再線性外推\n\n# 步驟 4：終值 ── 輸入：fcf_last, wacc, g ／ 執行：Gordon Growth Model ／ 輸出：terminal_value（float）\ndef calc_terminal_value(fcf_last, wacc, g=0.02):\n    return fcf_last * (1 + g) / (wacc - g)\n\n# 步驟 5：折現加總 ── 輸入：fcf_list, terminal_value, wacc ／ 執行：逐年折現加總 ／ 輸出：enterprise_value（float）\ndef discount_to_pv(fcf_list, terminal_value, wacc):\n    pv_fcf = sum(cf / (1 + wacc) ** (t + 1) for t, cf in enumerate(fcf_list))\n    pv_tv  = terminal_value / (1 + wacc) ** len(fcf_list)\n    return pv_fcf + pv_tv\n\n# 步驟 6：敏感度 ── 輸入：fcf_list, wacc_range, g_range ／ 執行：二維矩陣掃描 ／ 輸出：sensitivity DataFrame\ndef sensitivity_matrix(fcf_list, wacc_range, g_range):\n    pass  # 骨架：雙迴圈掃描 wacc × g，輸出 EV 矩陣\n\n# 步驟 7：交叉驗證 ── 輸入：dcf_ev, comps_ev_range ／ 執行：比對估值區間 ／ 輸出：驗證結論（string）\ndef cross_validate(dcf_ev, comps_ev_range):\n    pass  # 骨架：檢查 DCF 是否落在 comps 倍數估值區間內\n\n# 步驟 8：執行摘要 ── 輸入：前步各輸出 ／ 執行：組裝 key metrics ／ 輸出：summary dict\ndef build_summary(stock_id, wacc, ev, upside_pct):\n    return {'stock': stock_id, 'wacc': wacc, 'ev': ev, 'upside': upside_pct}\n\n# 步驟 9：輸出 ── 輸入：summary dict ／ 執行：寫出 CSV ／ 輸出：dcf_output.csv\ndef export_output(summary):\n    pd.DataFrame([summary]).to_csv('dcf_output.csv', index=False)\n    print('✅ DCF 九步驟骨架完整，輸出已存至 dcf_output.csv')\n\n# 示範執行步驟 1 + 2，其餘骨架待填\nfin = load_fundamentals('2330')\nwacc = calc_wacc()\nprint(f'步驟 1：已取數 {len(fin)} 筆｜步驟 2：WACC = {wacc:.2%}')\nprint('步驟 3–9 骨架已就位，依序填入後可重現完整 DCF 流程')",
      checklist: [
        "寫出某一檔台股的 DCF 九步驟流程文件（一頁即可）",
        "把『取數』封裝成可重複呼叫的函式 load_fundamentals()",
        "標記每步驟的輸入資料、執行動作、輸出格式（例：WACC 步驟輸入 risk_free/beta → 執行加權計算 → 輸出 wacc 數值）",
        "用 initiating-coverage 五階段檢視自己的流程缺哪一段"
      ]
    },
    {
      id: "g2",
      num: "G2",
      title: "交付物導向：產出而非答對",
      icon: "📦",
      x: 420, y: 80,
      gap: "你的能力在原網站用選擇題衡量，但研究員的能力是用機構級 Excel 模型、Pitch PPT、財報報告、晨會筆記來衡量的。沒有任何 deliverable，能力就無法被機構檢驗。",
      skill: {
        name: "comps-analysis / audit-xls / pitch-deck",
        plugin: "Core / investment-banking Add-on",
        desc: "輸出可比公司分析 Excel、做簡報的工具、並對 Excel 模型做公式正確性與勾稽審計。"
      },
      objectives: [
        "把一次分析輸出成可交付的成品（Excel / PPT / 一頁報告），而不是選擇題答案。",
        "用 audit-xls 的邏輯自我檢查：BS 是否平衡、現金是否勾稽、公式是否一致。",
        "理解『答對題目』與『交付一份能上會的成品』之間的差距。"
      ],
      finmindCode: "import pandas as pd\nfrom FinMind.data import DataLoader\n\ndl = DataLoader()\n# 交付物：一張同業可比（comps）表，輸出成 Excel\npeers = ['2330', '2303', '2454']  # 台積電、聯電、聯發科\nrows = []\nfor sid in peers:\n    fin = dl.taiwan_stock_financial_statement(stock_id=sid, start_date='2024-01-01')\n    piv = fin.pivot_table(index='date', columns='type', values='value', aggfunc='first')\n    last = piv.tail(1)\n    rows.append({'stock_id': sid,\n                 'Revenue': last.get('Revenue', pd.Series([None])).values[-1],\n                 'NetIncome': last.get('NetIncome', pd.Series([None])).values[-1]})\ncomps = pd.DataFrame(rows)\ncomps['NetMargin'] = comps['NetIncome'] / comps['Revenue']\n# 交付：輸出成機構可閱讀的 Excel 工作簿\ncomps.to_excel('comps_semiconductor.xlsx', index=False)\nprint('✅ 已產出可交付的 comps Excel：', comps.shape)\n\n# audit_comps：自我檢查——公式一致性 + 單位一致性\ndef audit_comps(df):\n    results = []\n    # 公式審計：NetMargin 是否等於 NetIncome / Revenue\n    calc = df['NetIncome'] / df['Revenue']\n    diff = (calc - df['NetMargin']).abs()\n    if diff.dropna().lt(1e-6).all():\n        results.append('✅ NetMargin 公式一致')\n    else:\n        results.append('❌ NetMargin 計算與欄位不符，請確認')\n    # 單位審計：Revenue 與 NetIncome 數量級是否相符（避免億元 vs 元混用）\n    ratio = (df['Revenue'].abs() / df['NetIncome'].abs()).replace([float('inf')], None).dropna()\n    if ratio.gt(1000).any() or ratio.lt(0.001).any():\n        results.append('⚠️  Revenue 與 NetIncome 數量級差異過大，請確認單位')\n    else:\n        results.append('✅ 單位量級一致')\n    return results\n\nfor r in audit_comps(comps):\n    print(r)",
      checklist: [
        "產出一份至少 3 檔同業的 comps Excel 表",
        "對 Excel 做一次 audit：檢查公式、單位、勾稽一致性",
        "把同一份分析做成一頁 PPT 摘要（pitch 化）",
        "請一位同學/同事在不看你解說下能讀懂這份交付物"
      ]
    },
    {
      id: "g3",
      num: "G3",
      title: "從數據到投資論點",
      icon: "🎯",
      x: 150, y: 230,
      gap: "FinMind 只給原始數據（股價、三大法人、月營收、新聞），它不做估值、不做敘事、不下結論。原網站止步於『抓資料 + pandas 清洗』，缺的正是從數據走到投資論點的那一段——而那才是研究的價值。",
      skill: {
        name: "idea-generation / thesis-tracker",
        plugin: "equity-research Add-on",
        desc: "量化篩選 + 主題研究產出多空標的清單，並維護每個標的的投資假說與催化劑。"
      },
      objectives: [
        "把原始數據轉成一句可被證偽的投資論點（thesis），含目標價與時間。",
        "建立一套量化篩選條件，從台股池子篩出候選標的。",
        "區分『數據觀察』與『投資判斷』——後者要承擔對錯。"
      ],
      finmindCode: "import pandas as pd\nimport datetime\nfrom FinMind.data import DataLoader\n\ndl = DataLoader()\n\n# 擴展至股票池（5 檔），計算每檔最新 YoY 動能指標\npool = ['2330', '2303', '2454', '2317', '2382']  # 台積電、聯電、聯發科、鴻海、廣達\nrows = []\nfor sid in pool:\n    rev = dl.taiwan_stock_month_revenue(stock_id=sid, start_date='2023-01-01').sort_values('date')\n    rev['yoy'] = rev['revenue'].pct_change(12) * 100\n    latest = rev.tail(1).iloc[0]\n    rows.append({'stock_id': sid, 'date': latest['date'], 'yoy': round(latest['yoy'], 1)})\n\nmomentum_df = pd.DataFrame(rows)\nprint('── 全池 YoY 動能 ──')\nprint(momentum_df.to_string(index=False))\n\n# 篩選條件：YoY > 15% 為動能轉強候選\nTHRESHOLD = 15\ncandidates = momentum_df[momentum_df['yoy'] > THRESHOLD]\nprint(f'\\n── 候選清單（YoY > {THRESHOLD}%）──')\nprint(candidates.to_string(index=False) if not candidates.empty else '（無符合標的）')\n\n# Thesis Tracker：把論點登錄至 CSV（方向 / 理由 / 證偽條件 / 登錄日期）\ntoday = datetime.date.today().isoformat()\ntracker_rows = []\nfor _, row in candidates.iterrows():\n    tracker_rows.append({\n        '標的': row['stock_id'],\n        '方向': '看多',\n        '理由': f\"月營收 YoY = {row['yoy']}%，動能轉強\",\n        '證偽條件': '連續兩個月 YoY 跌破 0% 則失效',\n        '登錄日期': today\n    })\ntracker = pd.DataFrame(tracker_rows)\ntracker.to_csv('thesis_tracker.csv', index=False, encoding='utf-8-sig')\nprint(f'\\n✅ 已把 {len(tracker)} 筆論點寫入 thesis_tracker.csv')",
      checklist: [
        "為一檔台股寫出一句含『方向 + 理由 + 證偽條件』的投資論點",
        "建立一組量化篩選條件並跑出候選清單",
        "把論點登錄到一張 thesis tracker（可持續追蹤）",
        "明確標示：哪些是數據事實、哪些是你的判斷"
      ]
    },
    {
      id: "g4",
      num: "G4",
      title: "端到端估值建模",
      icon: "📐",
      x: 420, y: 230,
      gap: "B2 章節已教 WACC 公式推導、台灣公債無風險利率與 DCF 敏感度的數學邏輯；G4 的角色是把這些數學跑進一個端到端的工作流：從 FinMind 取真實財報數據、建立三大報表連動的預測模型、計算 FCF、輸出可審計的敏感度矩陣。B2 教你「算得出來」，G4 教你「建得出一個可重現、可交付的完整模型」。",
      skill: {
        name: "dcf-model / 3-statement-model",
        plugin: "Core",
        desc: "從財報取數、WACC 計算、三表連動、現金流預測到敏感度分析的完整 Excel 模型。"
      },
      objectives: [
        "用台灣公債殖利率當無風險利率、估算台股 ERP，算出一個合理 WACC。",
        "建立三大報表連動（損益→資產負債→現金流）的預測模型。",
        "做出 WACC × 永續成長率的二維敏感度矩陣並解讀。"
      ],
      finmindCode: "import numpy as np\nimport pandas as pd\nfrom FinMind.data import DataLoader\n\ndl = DataLoader()\n\n# 步驟 1：從 FinMind 取真實財報數據，計算歷史 FCF（OCF - Capex）\nfin = dl.taiwan_stock_financial_statement(stock_id='2330', start_date='2022-01-01')\npiv = fin.pivot_table(index='date', columns='type', values='value', aggfunc='first')\n\nocf   = piv.get('OperatingCashFlow',  pd.Series(dtype=float)).dropna().tail(5)\ncapex = piv.get('CapitalExpenditure', pd.Series(dtype=float)).dropna().abs().tail(5)\nfcf_hist = ocf.values[:len(capex)] - capex.values[:len(ocf)]\n\n# 步驟 2：以線性趨勢外推預測未來 5 年 FCF（假設：歷史平均斜率延伸）\nif len(fcf_hist) >= 2:\n    slope = (fcf_hist[-1] - fcf_hist[0]) / max(len(fcf_hist) - 1, 1)\n    fcf = [float(fcf_hist[-1]) + slope * (i + 1) for i in range(5)]\nelse:\n    fcf = [100, 115, 132, 152, 175]  # 資料不足時的後備值\nprint(f'FCF 預測（5 年，百萬）：{[round(v) for v in fcf]}  ← 線性趨勢外推')\n\n# 步驟 3：WACC（台灣在地參數）\nrisk_free = 0.015    # 台灣 10 年期公債殖利率\nerp = 0.06           # 台股市場風險溢酬\nbeta = 1.1\nwacc = risk_free + beta * erp  # 簡化全權益版\n\ng = 0.02\npv    = sum(cf / (1 + wacc) ** (t + 1) for t, cf in enumerate(fcf))\ntv    = fcf[-1] * (1 + g) / (wacc - g)\npv_tv = tv / (1 + wacc) ** len(fcf)\nev    = pv + pv_tv\nprint(f'WACC={wacc:.2%}  企業價值 EV ≈ {ev:,.0f} 百萬')\n\n# 步驟 4：敏感度矩陣\nfor w in [wacc - 0.01, wacc, wacc + 0.01]:\n    tv_w  = fcf[-1] * (1 + g) / (w - g)\n    ev_w  = sum(cf/(1+w)**(t+1) for t,cf in enumerate(fcf)) + tv_w/(1+w)**len(fcf)\n    print(f'  WACC={w:.2%} → EV={ev_w:,.0f}')",
      checklist: [
        "用台灣公債殖利率與台股 ERP 算出一個 WACC（寫下假設來源）",
        "建立五年 FCF 預測並計算 EV",
        "做出 WACC × g 的二維敏感度表",
        "用 audit 邏輯確認模型沒有循環參照與單位錯誤",
        "完成 FinMind 取數 → FCF 計算 → 敏感度分析 → 估值摘要的完整流程，並記錄每步的輸入來源與輸出用途"
      ]
    },
    {
      id: "g5",
      num: "G5",
      title: "研究寫作與敘事",
      icon: "✍️",
      x: 150, y: 380,
      gap: "賣方研究的核心產出是『報告』：首次覆蓋、財報點評、產業總覽、晨會筆記。其中大半是說服性寫作與投資論點建構，原網站對此零訓練——但研究的本質就是寫作。",
      skill: {
        name: "initiating-coverage / earnings-analysis / morning-note",
        plugin: "equity-research Add-on",
        desc: "8–12 頁財報研究報告、首次覆蓋報告、與 7:00 晨會用的簡潔筆記格式。"
      },
      objectives: [
        "寫出一份結構完整的財報點評（摘要 → 數據 → 投資論點 → 風險）。",
        "用晨會筆記格式，在 150 字內講清楚一個交易想法。",
        "練習『先講結論、再給證據』的賣方研究寫作邏輯。"
      ],
      finmindCode: "from FinMind.data import DataLoader\n\ndl = DataLoader()\n# 用數據自動生成一份『晨會筆記』骨架，再由人補上判斷與敘事\nprice = dl.taiwan_stock_daily(stock_id='2330', start_date='2025-01-01').tail(2)\nclose_today = price['close'].values[-1]\nclose_prev = price['close'].values[-2]\nchg = (close_today / close_prev - 1) * 100\n\nmorning_note = f'''\n【晨會筆記｜2330 台積電】\n• 結論：{'維持買進' if chg >= 0 else '留意拉回'}（先講結論）\n• 昨收 {close_today}，漲跌 {chg:+.2f}%\n• 觀察點：外資期貨未平倉、台幣匯率、次日 ADR\n• 風險：______（人工補上）\n'''\nprint(morning_note)\n# 注意：程式只給骨架，敘事與判斷必須由研究員親手寫",
      checklist: [
        "寫一份 1 頁財報點評（含結論先行的摘要段）",
        "用晨會筆記格式 150 字寫清楚一個交易想法",
        "寫一份首次覆蓋報告的大綱（對照 initiating-coverage 五段）",
        "請人讀後，能在 30 秒內複述你的投資論點"
      ]
    },
    {
      id: "g6",
      num: "G6",
      title: "法說會與一手資訊解讀",
      icon: "🎙️",
      x: 420, y: 380,
      gap: "earnings-analysis / earnings-preview 需要讀逐字稿、判讀管理層語氣、Q&A、beat/miss。FinMind 沒有逐字稿，原網站也沒教如何解讀法說會——這在台股研究是每季必做的核心動作。",
      skill: {
        name: "earnings-analysis / earnings-preview",
        plugin: "equity-research Add-on",
        desc: "財報前佈局、財報後 beat/miss 分析、結合法說會逐字稿與管理層語氣判讀。"
      },
      objectives: [
        "對齊台灣季報公告時程（3/5/8/11 月）與法說會排程做財報前準備。",
        "比對實際數字與市場預估，判斷 beat / miss 與幅度。",
        "讀法說會逐字稿，標記管理層語氣轉變與 Q&A 重點。"
      ],
      finmindCode: "from FinMind.data import DataLoader\n\ndl = DataLoader()\n# FinMind 提供新聞，但『逐字稿』需另尋來源（公開資訊觀測站／券商）\n# 這裡示範：用新聞流做財報季的事件對齊\nnews = dl.taiwan_stock_news(stock_id='2330', start_date='2025-01-01')\nkw = ['法說', '財報', '展望', '毛利', '財測', '指引']\nnews['hit'] = news['title'].fillna('').apply(lambda t: any(k in t for k in kw))\nevents = news[news['hit']][['date', 'title']].tail(10)\nprint('📅 財報/法說相關事件流：')\nprint(events.to_string(index=False))\nprint('\\n⚠️ 提醒：beat/miss 與語氣判讀需取得「逐字稿 + 市場預估」，FinMind 不含此資料')",
      checklist: [
        "列出一檔台股未來一季的財報與法說日程",
        "找出該公司上一季的市場預估並標記 beat/miss（市場預估來源：CMONEY 個股預估、各大券商研報 EPS 共識）",
        "讀一份法說逐字稿，摘出 3 個管理層語氣訊號（逐字稿來源：公開資訊觀測站 MOPS 重大訊息、公司 IR 官網、券商法說摘要）",
        "寫一段財報前的多空情境（earnings-preview）"
      ]
    },
    {
      id: "g7",
      num: "G7",
      title: "在地監理與合規素養",
      icon: "⚖️",
      x: 150, y: 530,
      gap: "本模組主要適用於準備進入賣方研究機構的學習者；個人投資者亦可參考，重點在建立研究立場的透明度習慣。機構研究員受金管會規範、研究獨立性與利益衝突管理約束。原網站把台灣 IFRS 科目、月營收公告時程（每月 10 日前）、除權息這些在地化只當成程式碼註解，沒有當成必修的制度知識。",
      skill: {
        name: "client-review（合規檢核）+ 在地化參數層",
        plugin: "wealth-management Add-on（概念）",
        desc: "把利益衝突揭露、研究獨立性、適合度與在地法規參數納入工作流。"
      },
      objectives: [
        "理解研究報告的利益衝突揭露要求（機構）；養成在個人研究中聲明立場的透明度習慣（個人）。",
        "掌握台灣在地時間節點：月營收（每月 10 日前）、除權息季、季報公告。",
        "把美規數據源（SEC/EDGAR）對應替換為公開資訊觀測站／TEJ。"
      ],
      finmindCode: "from FinMind.data import DataLoader\nimport datetime as dt\n\ndl = DataLoader()\n\n# 一、月營收時程（原有）── 輸入：stock_id ／ 輸出：最新月份提示\nrev = dl.taiwan_stock_month_revenue(stock_id='2330', start_date='2025-01-01').sort_values('date')\nlast = rev.tail(1).iloc[0]\nprint(f\"月營收最新資料：{last['date']}（提醒：次月 10 日前公告）\")\n\n# 二、除權息時程（新增）── 輸入：stock_id ／ 執行：取除息事件 ／ 輸出：除息日 + 金額\ndiv = dl.taiwan_stock_dividend(stock_id='2330', start_date='2024-01-01')\nif not div.empty:\n    cols = [c for c in ['date', 'CashDividend', 'StockDividend'] if c in div.columns]\n    print(div[cols].tail(5).to_string(index=False))\nprint('提醒：觀察除息日後填息速度，是判斷市場信心的訊號')\n\n# 三、季報公告月份提示（新增）\nQUARTERLY_MONTHS = [3, 5, 8, 11]  # 台灣季報：Q4/Q1/Q2/Q3 分別於 3/5/8/11 月公告\nprint(f'台灣季報公告月份：{QUARTERLY_MONTHS}（佈局應提前 2–3 週）')\n\n# 四、美規 → 台規欄位對照（新增）── 輸入：美規欄位名稱 ／ 輸出：FinMind type 欄位值\nus_to_tw = {\n    'EPS':           'EPS',\n    'Net Income':    'NetIncome',\n    'Revenue':       'Revenue',\n    'Total Assets':  'TotalAssets',\n    'Gross Profit':  'GrossProfit',\n    'Operating CF':  'OperatingCashFlow',\n}\nprint('\\n美規 → FinMind 欄位對照：')\nfor us, tw in us_to_tw.items():\n    print(f'  {us:20s} → {tw}')\n\n# 五、合規揭露模板（原有）\ndisclosure = '【揭露】本研究僅供參考，作者及所屬機構與標的之持股/利益關係：______。'\nprint(f'\\n{disclosure}')",
      checklist: [
        "在你的報告模板加入利益衝突揭露段落",
        "列出一檔台股本年度的月營收/除權息/季報時程表",
        "把一段美規數據源替換成公開資訊觀測站/TEJ 對應項",
        "說明研究獨立性為何重要（一段話）"
      ]
    },
    {
      id: "g8",
      num: "G8",
      title: "持續覆蓋而非一次性闖關",
      icon: "🔄",
      x: 420, y: 530,
      gap: "thesis-tracker、catalyst-calendar、model-update 反映的是研究員每天/每季維護一檔股票的紀律。原網站是玩完就結束，沒有『長期追蹤一檔標的、更新模型、追催化劑』的循環。",
      skill: {
        name: "thesis-tracker / catalyst-calendar / model-update",
        plugin: "equity-research Add-on",
        desc: "維護投資假說、追蹤催化劑里程碑、季報後更新模型並標記重大變動。"
      },
      objectives: [
        "建立一份催化劑行事曆（財報、法說、產品、法規、總經事件）。",
        "設計一個『新季報進來就更新模型』的更新流程。",
        "持續追蹤論點是否仍成立，並記錄修正理由。"
      ],
      finmindCode: "from FinMind.data import DataLoader\nimport pandas as pd\n\ndl = DataLoader()\n# 持續覆蓋：每次新數據進來，自動比對與上次的差異並標記\nrev = dl.taiwan_stock_month_revenue(stock_id='2330', start_date='2024-01-01').sort_values('date')\nrev['mom'] = rev['revenue'].pct_change() * 100\nrev['yoy'] = rev['revenue'].pct_change(12) * 100\n\n# model-update 邏輯：標記需要重新檢視論點的『重大變動』\nalert = rev.tail(1).iloc[0]\nif abs(alert['yoy']) > 20:\n    print(f\"🚨 重大變動：YoY={alert['yoy']:.1f}%，需更新模型與重檢論點\")\nelse:\n    print(f\"✅ 變動在常態內：YoY={alert['yoy']:.1f}%，論點維持\")\n# 把這支腳本排程成每月執行 → 這就是『持續覆蓋』",
      checklist: [
        "為一檔台股建立催化劑行事曆（至少 5 個事件）",
        "寫一個『季報更新模型』的標準流程",
        "設定一個重大變動的警示門檻並說明理由",
        "用程式碼比較同一標的最近 6 個月的月營收數據，標記至少 3 個重大變動時間點（YoY 變化 > ±15%），並為每個時間點寫一句更新理由"
      ]
    },
    {
      id: "g9",
      num: "G9",
      title: "機構級資料與工具現實",
      icon: "🛠️",
      x: 150, y: 680,
      gap: "FinMind 是教育/非商業用途，限速 300/600 次/小時，資料僅供參考；機構用的是 FactSet、S&P、TEJ、Bloomberg 終端與買方資料庫。靠 FinMind 練成的流程，需要理解如何對接機構級環境與規模。",
      skill: {
        name: "datapack-builder / MCP Connectors",
        plugin: "investment-banking Add-on / Partner（LSEG, S&P）",
        desc: "從多個數據商標準化產出 IC 級資料包，並透過 MCP 串接 FactSet/S&P/Morningstar。"
      },
      objectives: [
        "認識 FinMind 與機構級數據商（FactSet/S&P/TEJ/Bloomberg）的差異與限制。",
        "用快取/批次設計繞過 API 限速，建立可規模化的資料管線。",
        "列出 FinMind 缺少的關鍵資料類別，並對應台灣可用的低成本替代來源（TEJ、CMONEY、公開資訊觀測站、台灣證交所開放資料）。"
      ],
      finmindCode: "import time\nimport pandas as pd\nfrom FinMind.data import DataLoader\n\ndl = DataLoader()\n# 面對 FinMind 限速（300/600 次/hr），用快取 + 批次設計模擬機構級管線\nclass CachedLoader:\n    def __init__(self):\n        self.cache = {}\n    def revenue(self, sid):\n        if sid in self.cache:\n            return self.cache[sid]            # 命中快取，不浪費 API 額度\n        df = dl.taiwan_stock_month_revenue(stock_id=sid, start_date='2024-01-01')\n        self.cache[sid] = df\n        time.sleep(0.2)                       # 節流，避免觸發限速\n        return df\n\nloader = CachedLoader()\nfor sid in ['2330', '2303', '2454']:\n    df = loader.revenue(sid)\n    print(sid, '→', len(df), '筆（已快取，可規模化）')\nprint('💡 機構級差異：FactSet/Bloomberg 無此限速，且含估值共識與逐字稿')\nprint('💡 台灣替代選項：TEJ 含估值共識與財務預測；CMONEY 含法說摘要；MOPS 含重大訊息；台灣證交所 OpenAPI 含交易統計')",
      checklist: [
        "寫一個帶快取的 FinMind 載入器，避免重複呼叫",
        "列出 FinMind 缺、但機構數據商有的 3 類資料",
        "設計一個批次拉取多檔標的的節流流程",
        "為你的分析工作流建立一張『數據來源地圖』：列出每類所需資料、FinMind 是否提供、若不提供則用哪個台灣來源補足（TEJ/CMONEY/MOPS/證交所 OpenAPI）"
      ]
    },
    {
      id: "g10",
      num: "G10",
      title: "團隊協作與真實情境",
      icon: "🤝",
      x: 420, y: 680,
      gap: "機構研究是團隊分工（對接 IC、sales、trading），有 pitch、IC memo 答辯、客戶溝通，以及 ib-check-deck 這類同儕 QC。原網站是單機自學遊戲，沒有真實情境、導師回饋或同儕審核。",
      skill: {
        name: "ic-memo / ib-check-deck / pitch-deck",
        plugin: "private-equity / investment-banking Add-on",
        desc: "把分析組成投資委員會備忘錄、做投行簡報品質檢查（數字一致性、敘述對齊）。"
      },
      objectives: [
        "把前面模組的產出組裝成一份 IC memo（綜合 DD、財務、條件）。",
        "用 ib-check-deck 邏輯做同儕 QC：數字一致、敘述對齊、格式規範。",
        "練習在 IC/答辯情境下，用 60 秒講清楚並回應質疑。"
      ],
      finmindCode: "# 協作收尾：把 G1–G9 的產出組裝成一份 IC Memo 骨架（Markdown）\nic_memo = '''\n# 投資委員會備忘錄（IC Memo）｜2330 台積電\n\n## 1. 投資建議\n- 結論：______（買進/持有/賣出）｜目標價：______｜時間：______\n\n## 2. 投資論點（來自 G3）\n- ______\n\n## 3. 估值（來自 G4）\n- DCF：EV ≈ ______｜WACC：______｜敏感度區間：______\n\n## 4. 催化劑與時程（來自 G8）\n- ______\n\n## 5. 風險與反方觀點\n- ______\n\n## 6. 合規揭露（來自 G7）\n- ______\n'''\nwith open('ic_memo_2330.md', 'w', encoding='utf-8') as f:\n    f.write(ic_memo)\nprint('✅ 已產出 IC Memo 骨架，等待團隊 QC 與答辯')",
      checklist: [
        "把 G1–G9 的產出整合成一份 IC Memo",
        "找一位同儕對你的成品做 QC（數字一致性、敘述對齊）（若無同儕，可將成品貼入 AI 工具並提示『請以機構審查者角色挑出數字不一致與敘述矛盾之處』）",
        "用 60 秒口頭 pitch 你的結論並接受一輪提問（可對著錄音設備錄下 60 秒說明，回放後自評：論點是否清楚、數字是否說出口）",
        "根據回饋修訂成品至少一次（基於 AI QC 或自我錄音回饋，至少修改一個數字或一句結論措辭）"
      ]
    }
  ],

  // 節點連線（呈現「從數據到研究交付」的進程）
  connections: [
    { from: "g1", to: "g2" },
    { from: "g2", to: "g3" },
    { from: "g3", to: "g4" },
    { from: "g4", to: "g5" },
    { from: "g5", to: "g6" },
    { from: "g6", to: "g7" },
    { from: "g7", to: "g8" },
    { from: "g8", to: "g9" },
    { from: "g9", to: "g10" }
  ]
};
