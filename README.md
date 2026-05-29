# 📐 FinMath Map｜量化金融與籌碼力學學習地圖

把公司估值、消息判斷與籌碼分析，系統化拆解為高中數學考綱科目（坐標系、向量、線性代數、機率論）的互動式量化投資學習地圖。完成基礎科目 A–F 後，會解鎖「進階模式」——以機構市場研究員的實戰能力為主軸的 G 系列圖譜。

## 如何在本機開啟（重要）

請**不要**直接雙擊 `index.html`。用 `file://` 開啟時，Chrome 會把每個檔案視為獨立的安全來源（unique origin），導致 console 出現：

```
Unsafe attempt to load URL file:///.../index.html ...
'file:' URLs are treated as unique security origins.
```

而且進度用的 `localStorage` 可能被瀏覽器擋下。改用本機 HTTP 伺服器即可解決：

```bash
cd financial_learn
./serve.sh            # 預設 http://localhost:8000，會自動開瀏覽器
./serve.sh 8080       # 也可指定其他 port
```

沒有 Python 的話，也可以用 VS Code 的「Live Server」擴充功能，效果相同。

> 正式部署在 GitHub Pages（見 `.github/workflows/deploy.yml`）是以 `https://` 提供，因此線上版本不會出現上述警告。

## 功能總覽

- **學習地圖（科目 A–F）**：18 個章節節點，含數學比喻、KaTeX 公式、學習目標、對齊的機構 Skill、FinMind 實戰程式碼，以及附防作弊雜湊的選擇題。
- **進階模式（科目 G）**：完成 A–F 全部 18 章後自動彈出的新圖譜，把「成為機構市場研究員」的十道門檻做成 10 個可通關的實戰模組（流程化建模、交付物、估值、研究寫作、法說會解讀、在地合規、持續覆蓋、機構級工具、團隊協作等），每個模組以「交付物檢核清單」通關。
- **進度視覺化**：左側雷達圖（A–F + 進階 G 共 7 軸）與進度卡 G 軌道即時連動。
- **FinMind 沙盒**：動態產生標準 Python 爬取程式碼。
- **台股 AI 多智能體分析師沙盒**：示範多 Agent 協同估值工作流（plug-and-play）。

## 檔案結構

| 檔案 | 說明 |
| --- | --- |
| `index.html` | 主頁面 |
| `styles.css` | 主樣式 |
| `app.js` | 應用主控制器（地圖、考試、進度、雷達圖） |
| `syllabusData.js` | 科目 A–F 課程資料 |
| `advancedData.js` | 進階科目 G 的 10 個模組資料 |
| `advancedMode.js` / `advancedMode.css` | 進階圖譜邏輯與樣式（可移除） |
| `aiSandbox.js` / `aiSandbox.css` | AI 多智能體沙盒（plug-and-play，可移除） |
| `serve.sh` | 本機 HTTP 伺服器啟動腳本 |

## 資料來源

- [FinMind](https://github.com/FinMind/FinMind)：台股開源資料工具
- [Anthropic Financial Services Plugins 56 Skills 解析 — Morris 聊金融](https://morrishare.com/a-comprehensive-analysis-of-skills-in-financial-services-plugins/)
