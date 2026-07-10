# 🛠️ 本地萬能 PDF 與圖片工具箱 (React + Vite 版)

🚀 **線上直接使用連結：[https://MarcoChiu.github.io/localhosttoolbox/](https://MarcoChiu.github.io/localhosttoolbox/)**

[![Privacy First](https://img.shields.io/badge/Privacy-100%25_Local-brightgreen?style=flat-spec)](https://github.com/MarcoChiu/localhosttoolbox)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite-blue?style=flat-spec)](https://github.com/MarcoChiu/localhosttoolbox)
[![License](https://img.shields.io/badge/License-ISC-orange?style=flat-spec)](https://github.com/MarcoChiu/localhosttoolbox)
[![Latest Release](https://img.shields.io/github/v/release/MarcoChiu/localhosttoolbox?style=flat-spec)](https://github.com/MarcoChiu/localhosttoolbox/releases/latest)


一個設計精美、功能強大且**100% 在瀏覽器本地端運行**的萬能 PDF 與圖片處理工具箱。本專案採用 **React + Vite** 重構，介面融入了精緻的 **磨砂玻璃質感 (Glassmorphism)** 與響應式深色模式設計，提供流暢、高品質的單頁應用程式 (SPA) 處理體驗。

> [!IMPORTANT]
> **隱私第一（Privacy First）**：本工具箱的所有功能皆**在瀏覽器端本地完成**，絕不將您的個人隱私檔案上傳至任何第三方伺服器，安全、快速且支援完全離線使用！

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

### 🖼️ 圖片工具
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
- **核心**：React 19 / Vite 6 / Vanilla CSS3
- **主要依賴** (皆於瀏覽器本地執行，支援 100% 離線使用)：
  - `pdf-lib`：用於 PDF 創建、合併、拆分與浮水印添加。
  - `pdfjs-dist`：用於在前端渲染 PDF 頁面預覽。
  - `html2canvas`：實現將 HTML 模板渲染並導出為圖片。
  - `sortablejs`：提供極致流暢的拖曳重排列表體驗。
  - `opencc-js`：繁簡中文本地端轉換。

---

## 🚀 快速開始 (Getting Started)

### 1. 本地開發環境設置
確保系統已安裝 [Node.js](https://nodejs.org/)。

```bash
# 下載/複製儲存庫
git clone https://github.com/MarcoChiu/localhosttoolbox.git
cd localhosttoolbox

# 安裝依賴
npm install

# 啟動前端開發伺服器 (Vite)
npm run dev
```
啟動後在瀏覽器開啟 `http://localhost:5173` 即可開始體驗！

---

## 🚀 部署至 GitHub Pages

本專案支援**本地一鍵部署**與 **GitHub Actions 自動化部署**雙重模式：

### 方式一：本地一鍵部署 (推薦，最快速)
直接在終端機執行：
```bash
npm run deploy
```
系統會自動在本地完成 `build` 打包，並使用 `gh-pages` 工具將產出推送到 `gh-pages` 分支完成發佈。

> [!IMPORTANT]
> **GitHub 設定調整**：
> 當您使用此部署方式時，請確認您 GitHub 專案倉庫的 **Settings** -> **Pages** 中，**Source** 設為 **`Deploy from a branch`**，並將分支選取為 **`gh-pages`**，目錄選取為 **`/ (root)`**。

### 方式二：GitHub Actions 自動化部署
我們已配置了 `.github/workflows/deploy.yml`。只要您將程式碼推送至 `main` 分支，GitHub 將在雲端自動進行建置並發佈。

---

## 📁 專案結構 (Project Directory Layout)

```text
localhosttoolbox/
├── src/                        # React 原始碼目錄
│   ├── components/             # 功能拆分 React 元件 (PDF合併, 拼接等)
│   ├── App.jsx                 # 全域 layout
│   ├── index.css               # 整合 Glassmorphism 美學的樣式表
│   └── main.jsx                # React 啟動點
├── .github/workflows/          # 自動化工作流
│   └── deploy.yml              # GitHub Actions 自動部署腳本
├── vite.config.js              # Vite 設定檔 (包含 base 相對路徑設定)
├── index.html                  # 首頁 HTML 模板
└── package.json                # npm 設定檔與相依套件
```

---

## 📝 授權條款 (License)

本專案採用 **ISC License** 授權開源。
