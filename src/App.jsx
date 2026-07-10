import React, { useState, useEffect } from 'react';
import PdfMerger from './components/PdfMerger';
import PdfSplitter from './components/PdfSplitter';
import PdfToImage from './components/PdfToImage';
import ImageToPdf from './components/ImageToPdf';
import PdfWatermark from './components/PdfWatermark';
import ImageCompressor from './components/ImageCompressor';
import ImageStitcher from './components/ImageStitcher';
import HtmlToImage from './components/HtmlToImage';
import TextConverter from './components/TextConverter';

function App() {
  const [activeTab, setActiveTab] = useState('tab-pdf');
  const [status, setStatus] = useState({ text: '', type: '' }); // type: info, success, error, loading
  const [drawerOpen, setDrawerOpen] = useState(false);

  const showStatus = (text, type = 'info') => {
    setStatus({ text, type });
  };

  const hideStatus = () => {
    setStatus({ text: '', type: '' });
  };

  // Build time injection from Vite config
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '';

  const renderActiveTabContent = () => {
    const props = { showStatus, hideStatus };
    switch (activeTab) {
      case 'tab-pdf':
        return <PdfMerger {...props} />;
      case 'tab-pdf-split':
        return <PdfSplitter {...props} />;
      case 'tab-pdf-to-img':
        return <PdfToImage {...props} />;
      case 'tab-img-to-pdf':
        return <ImageToPdf {...props} />;
      case 'tab-pdf-watermark':
        return <PdfWatermark {...props} />;
      case 'tab-compress':
        return <ImageCompressor {...props} />;
      case 'tab-stitch':
        return <ImageStitcher {...props} />;
      case 'tab-html':
        return <HtmlToImage {...props} />;
      case 'tab-text-convert':
        return <TextConverter {...props} />;
      default:
        return <PdfMerger {...props} />;
    }
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    hideStatus();
    setDrawerOpen(false);
  };

  return (
    <>
      <div className="ambient-glow"></div>
      <div className="ambient-glow-2"></div>

      <div className="container app-container">
        {/* Mobile sidebar overlay */}
        <div 
          className={`sidebar-overlay ${drawerOpen ? 'active' : ''}`} 
          onClick={() => setDrawerOpen(false)}
        ></div>

        {/* Mobile Top Bar */}
        <div className="mobile-topbar" id="mobile-topbar">
          <div className="mobile-topbar-brand">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="url(#primary-gradient-mobile)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="primary-gradient-mobile" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <h2>本地工具箱</h2>
          </div>
          <button 
            className={`hamburger-btn ${drawerOpen ? 'open' : ''}`} 
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label="開啟選單" 
            aria-expanded={drawerOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <aside className={`app-sidebar ${drawerOpen ? 'open' : ''}`} id="app-sidebar">
          <div className="sidebar-header">
            <div className="logo-box">
              <svg viewBox="0 0 24 24" width="28" height="28" stroke="url(#primary-gradient)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="primary-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <div className="sidebar-title" style={{ flex: 1 }}>
              <h1>本地工具箱</h1>
              <p>安全快速 • 離線處理</p>
            </div>
            <button className="sidebar-close-btn" onClick={() => setDrawerOpen(false)} aria-label="關閉選單">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="sidebar-nav">
            <div className="nav-section">
              <h3 className="nav-section-title">PDF 工具</h3>
              <button 
                className={`tab-btn ${activeTab === 'tab-pdf' ? 'active' : ''}`} 
                onClick={() => handleTabClick('tab-pdf')}
              >
                <span className="icon">📄</span> PDF合併
              </button>
              <button 
                className={`tab-btn ${activeTab === 'tab-pdf-split' ? 'active' : ''}`} 
                onClick={() => handleTabClick('tab-pdf-split')}
              >
                <span className="icon">✂️</span> PDF拆分
              </button>
              <button 
                className={`tab-btn ${activeTab === 'tab-pdf-to-img' ? 'active' : ''}`} 
                onClick={() => handleTabClick('tab-pdf-to-img')}
              >
                <span className="icon">📷</span> PDF轉圖片
              </button>
              <button 
                className={`tab-btn ${activeTab === 'tab-img-to-pdf' ? 'active' : ''}`} 
                onClick={() => handleTabClick('tab-img-to-pdf')}
              >
                <span className="icon">🖼️</span> 圖片轉PDF
              </button>
              <button 
                className={`tab-btn ${activeTab === 'tab-pdf-watermark' ? 'active' : ''}`} 
                onClick={() => handleTabClick('tab-pdf-watermark')}
              >
                <span className="icon">🏷️</span> 浮水印/頁碼
              </button>
            </div>

            <div className="nav-section">
              <h3 className="nav-section-title">圖片與網頁</h3>
              <button 
                className={`tab-btn ${activeTab === 'tab-compress' ? 'active' : ''}`} 
                onClick={() => handleTabClick('tab-compress')}
              >
                <span className="icon">🗜️</span> 圖片壓縮
              </button>
              <button 
                className={`tab-btn ${activeTab === 'tab-stitch' ? 'active' : ''}`} 
                onClick={() => handleTabClick('tab-stitch')}
              >
                <span className="icon">🖼️</span> 圖片拼接
              </button>
              <button 
                className={`tab-btn ${activeTab === 'tab-html' ? 'active' : ''}`} 
                onClick={() => handleTabClick('tab-html')}
              >
                <span className="icon">📝</span> HTML轉圖
              </button>
            </div>

            <div className="nav-section">
              <h3 className="nav-section-title">文字工具</h3>
              <button 
                className={`tab-btn ${activeTab === 'tab-text-convert' ? 'active' : ''}`} 
                onClick={() => handleTabClick('tab-text-convert')}
              >
                <span className="icon">🔤</span> 簡繁轉換
              </button>
            </div>
          </div>

          {buildTime && (
            <div className="sidebar-footer" style={{ padding: '20px 25px 0', borderTop: '1px solid var(--panel-border)', marginTop: 'auto' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'center' }}>
                Build: {buildTime}
              </p>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="app-main">
          {renderActiveTabContent()}
        </main>

        {/* Status Container */}
        {status.text && (
          <div id="status-bar" className={`status-container active ${status.type}`}>
            {status.type === 'loading' && <div className="spinner" id="status-spinner"></div>}
            <span id="status-text">{status.text}</span>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
