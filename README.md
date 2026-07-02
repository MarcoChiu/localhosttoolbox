# 🛠️ 本地萬能截圖與 PDF 工具箱 (Localhost Tool Box)

[![Privacy First](https://img.shields.io/badge/Privacy-100%25_Local-brightgreen?style=flat-spec)](https://github.com/MarcoChiu/localhosttoolbox)
[![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JS%20%7C%20Node-blue?style=flat-spec)](https://github.com/MarcoChiu/localhosttoolbox)
[![License](https://img.shields.io/badge/License-ISC-orange?style=flat-spec)](https://github.com/MarcoChiu/localhosttoolbox)
[![Latest Release](https://img.shields.io/github/v/release/MarcoChiu/localhosttoolbox?style=flat-spec)](https://github.com/MarcoChiu/localhosttoolbox/releases/latest)


一個設計精美、功能強大且**完全在本地端運行**的萬能截圖與 PDF 處理工具箱。採用現代暗色毛玻璃（Glassmorphism）風格設計，搭配流暢的微動畫，為您提供極致的視覺美感與流暢的互動體驗。

> [!IMPORTANT]
> **隱私第一（Privacy First）**：除了「網頁長截圖」需要透過 Puppeteer 擷取目標網站外，其餘所有 PDF 處理、圖片拼接、壓縮及簡繁轉換功能皆**在瀏覽器端本地完成**，絕不將您的個人隱私檔案上傳至任何第三方伺服器，安全且快速。

> [!TIP]
> **下載最新版本**：您可以至 [GitHub Releases](https://github.com/MarcoChiu/localhosttoolbox/releases/latest) 下載最新的穩定發布版本（解壓縮後即可使用）。

---

## 🌟 核心功能 (Key Features)

### 📄 PDF 工具箱
- **PDF 合併 (PDF Merger)**：支援拖曳多個 PDF 檔案，自由拖拽調整順序，一鍵合併。
- **PDF 拆分 (PDF Splitter)**：輕鬆匯入 PDF，預覽並選擇指定頁數範圍進行拆分導出。
- **PDF 轉圖片 (PDF to Image)**：將 PDF 的每一頁快速轉化為 PNG 圖片下載。
- **圖片轉 PDF (Image to PDF)**：批次上傳多張圖片（JPG/PNG），調整版面邊距與方向後，打包轉為 PDF。
- **浮水印與頁碼 (Watermark & Pagination)**：為您的 PDF 本地加上自訂文字浮水印或頁碼，可調整字型大小、顏色、旋轉角度與透明度。

### 🖼️ 圖片與網頁工具
- **網頁網址長截圖 (Webpage Full Screenshot)**：
  - 輸入任意網址，後端自動調用 Puppeteer 啟動無頭瀏覽器進行全頁面擷取。
  - **自動滾動（Scroll for lazy load）**：自動向下滾動以觸發網頁延遲載入圖片，確保內容完整。
  - **自訂延遲（Delay）**：可設定截圖前等待秒數，確保非同步載入或動畫渲染完畢。
- **圖片壓縮 (Image Compressor)**：本地調整品質參數，即時預覽壓縮前後的檔案大小對比。
- **圖片長圖拼接 (Image Stitcher)**：
  - 支援垂直（直式長圖）或水平（橫式寬圖）拼接。
  - 可設定圖片間距（Gap）、外框邊距（Margin）、背景顏色與頂部/底部裁剪（Crop）。
  - 支援導出為 PNG、JPEG 圖片或 PDF 文件。
- **HTML 轉圖片 (HTML to Image)**：提供精美的程式碼卡片、好評反饋、極簡個人簡介等預設模板，自訂樣式後一鍵輸出為圖片。

### 🔤 文字工具
- **繁簡轉換 (Chinese Convert)**：採用本地 `opencc-js` 庫，一鍵快速進行簡體字與繁體字互轉，完全離線安全。

---

## 📸 介面美學與設計 (Design Aesthetics)

- **現代暗色毛玻璃 (Glassmorphism)**：使用半透明背景結合背景模糊（backdrop-filter），呈現高端科幻感。
- **氛圍發光 (Ambient Glow)**：動態流暢的色彩光暈背景，提升視覺層次。
- **流暢微動畫 (Micro-animations)**：每個按鈕懸停、標籤切換與上傳區域皆配有精緻的過場動畫。
- **直覺式側邊欄**：清晰的分類導覽，隨時無縫切換所需功能。

---

## 🛠️ 技術棧 (Tech Stack)

### 前端 (Frontend)
- **核心**：HTML5 / Vanilla CSS3 / JavaScript (ES6)
- **第三方函式庫** (皆已本地化，支援 100% 離線使用)：
  - `pdf-lib`：用於 PDF 創建、合併、拆分與浮水印添加。
  - `pdfjs-dist`：用於在前端渲染 PDF 頁面預覽。
  - `html2canvas`：實現將 HTML 模板渲染並導出為圖片。
  - `SortableJS`：提供極致流暢的拖曳重排列表體驗。
  - `opencc-js`：繁簡中文本地端轉換。

### 後端 (Backend)
- **執行環境**：Node.js
- **伺服器框架**：Express
- **截圖引擎**：Puppeteer (Headless Chrome)

---

## 🚀 快速開始 (Getting Started)

本工具箱支援以下兩種使用方式，您可以依需求選擇：

---

### 🟢 方式 A：免安裝，雙擊即用 (極速推薦)
如果您**不需要**使用「網頁網址長截圖」功能，本專案**無需進行任何安裝與環境設定**。

1. **下載專案**：至 [GitHub Releases](https://github.com/MarcoChiu/localhosttoolbox/releases/latest) 下載最新發布的穩定包（`.zip` 或 `.tar.gz`），並解壓縮。
2. **啟動工具**：直接雙擊資料夾內的 `index.html`，即可直接在您的瀏覽器中運行。
3. **支援功能**：
   - PDF 合併、PDF 拆分、PDF 轉圖片、圖片轉 PDF、浮水印/頁碼。
   - 圖片壓縮、圖片拼接、HTML 轉圖、離線簡繁轉換。
   - 所有運算完全在瀏覽器記憶體本地進行，不經過伺服器，安全且流暢。

---

### ⚡ 方式 B：安裝並啟動本地端伺服器 (完整功能)
如果您需要使用 **網頁長截圖 (Puppeteer)** 功能，請依照以下步驟部署本地端後端伺服器：

1. **安裝 Node.js**：確保您的電腦已安裝 [Node.js](https://nodejs.org/) (建議安裝 LTS 版本)。
2. **複製或下載專案**：
   - 前往 [Releases](https://github.com/MarcoChiu/localhosttoolbox/releases/latest) 下載解壓。
   - 或使用 Git 複製倉庫：
     ```bash
     git clone https://github.com/MarcoChiu/localhosttoolbox.git
     cd localhosttoolbox
     ```
3. **安裝 Node.js 依賴套件** (僅需執行一次，這會自動下載無頭瀏覽器 Puppeteer 等套件)：
   ```bash
   npm install
   ```
4. **啟動本地伺服器**：
   ```bash
   npm start
   ```
5. **開啟瀏覽器體驗**：在瀏覽器中開啟以下網址即可開始使用所有功能（包括網頁長截圖）：
   ```text
   http://localhost:3000
   ```

---

## 📁 專案結構 (Project Directory Layout)

```text
├── js/                  # 功能模組腳本 (拆分、浮水印、圖片轉PDF)
├── lib/                 # 本地第三方 JS 庫 (確保離線可用性)
├── app.js               # 前端核心控制與 UI 交互邏輯
├── index.html           # 網頁結構與各功能分頁
├── style.css            # 毛玻璃暗色系樣式表
├── server.js            # Express 後端與 Puppeteer 截圖服務
├── package.json         # 專案依賴與腳本配置
└── README.md            # 本說明文件
```

---

## 📝 授權條款 (License)

本專案採用 **ISC License** 授權開源。
