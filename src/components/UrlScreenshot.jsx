import React, { useState } from 'react';

function UrlScreenshot({ showStatus, hideStatus, API_BASE, serverConnected }) {
  const [url, setUrl] = useState('');
  const [width, setWidth] = useState('1920');
  const [delay, setDelay] = useState(1000);
  const [format, setFormat] = useState('png');
  const [scroll, setScroll] = useState(true);

  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState('');
  const [placeholderMsg, setPlaceholderMsg] = useState('請輸入網址並點擊開始擷取');

  const handleCapture = async () => {
    let targetUrl = url.trim();
    if (!targetUrl) {
      showStatus('請輸入網址！', 'error');
      setTimeout(hideStatus, 2000);
      return;
    }

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && !targetUrl.startsWith('file:///')) {
      targetUrl = 'https://' + targetUrl;
      setUrl(targetUrl);
    }

    if (!serverConnected) {
      showStatus('本地伺服器尚未連線，請照下方引導啟動後端伺服器！', 'error');
      setTimeout(hideStatus, 3000);
      return;
    }

    try {
      showStatus('正在擷取網頁，請稍候（此操作可能需要 5-15 秒，視網頁大小而定）...', 'loading');
      setLoading(true);
      setResultImage('');
      setPlaceholderMsg('正在與 Puppeteer 連線並載入網頁...');

      const response = await fetch(`${API_BASE}/api/screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: targetUrl,
          width: parseInt(width, 10),
          delay: parseInt(delay, 10),
          format: format,
          scroll: scroll
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `伺服器回應錯誤 (狀態碼: ${response.status})`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setResultImage(objectUrl);
      showStatus('網頁長截圖擷取成功！', 'success');
      setTimeout(hideStatus, 2000);
    } catch (e) {
      console.error(e);
      setPlaceholderMsg('擷取失敗。');
      showStatus(`擷取失敗: ${e.message}`, 'error');
      setTimeout(hideStatus, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `web_screenshot_${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="url-form">
      {/* URL Input Box */}
      <div className="url-input-group">
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          className="form-control" 
          style={{ fontSize: '1.1rem', padding: '12px 18px' }}
          placeholder="輸入網址 (例如 https://google.com 或本地 file:/// 路徑)"
          onKeyDown={(e) => { if (e.key === 'Enter') handleCapture(); }}
        />
        <button 
          onClick={handleCapture} 
          className="btn primary-btn" 
          style={{ padding: '12px 30px', fontSize: '1.1rem' }}
          disabled={loading}
        >
          🚀 開始擷取
        </button>
      </div>

      {/* Server Connection Badge */}
      <div className="server-badge" style={{ marginBottom: '20px' }}>
        <div className={`server-badge-dot ${serverConnected ? 'connected' : ''}`}></div>
        <span>{serverConnected ? '伺服器已連線' : '伺服器未連線'}</span>
      </div>

      <div className="tool-layout">
        {/* Left Panel Settings */}
        <div className="settings-sidebar">
          <div className="settings-title">擷取設定</div>
          <div className="settings-group">
            <label>視窗寬度 (Width)</label>
            <select value={width} onChange={(e) => setWidth(e.target.value)} className="form-control">
              <option value="1920">Desktop 1920px</option>
              <option value="1440">Desktop 1440px</option>
              <option value="1280">Laptop 1280px</option>
              <option value="1024">Tablet 1024px</option>
              <option value="768">Mobile 768px</option>
              <option value="375">Mobile 375px</option>
            </select>
          </div>
          <div className="settings-group">
            <label>渲染延遲等待 (ms) <span className="value">{delay}ms</span></label>
            <input 
              type="range" 
              min="0" 
              max="6000" 
              step="500" 
              value={delay} 
              onChange={(e) => setDelay(parseInt(e.target.value))}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>
              給網頁載入動畫/非同步圖片之緩衝時間
            </span>
          </div>
          <div className="settings-group">
            <label>圖片格式</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="form-control">
              <option value="png">PNG 格式 (清晰不失真)</option>
              <option value="jpeg">JPEG 格式 (體積較小)</option>
            </select>
          </div>
          <div className="settings-group">
            <label style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={scroll} 
                onChange={(e) => setScroll(e.target.checked)} 
                style={{ width: '16px', height: '16px' }} 
              />
              <span>模擬向下滾動 (加載延遲圖片)</span>
            </label>
          </div>
        </div>

        {/* Right Panel: Guide or Preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!serverConnected && (
            <div className="server-guide-panel">
              <h3>⚠️ 偵測到本地伺服器未連線</h3>
              <p>「網頁網址長截圖」功能需要 Puppeteer 後端支援。請按照以下步驟啟動本地伺服器：</p>
              <ol>
                <li>使用終端機開啟此專案目錄：
                  <pre>cd c:\Marco\Developer\localhosttoolbox</pre>
                </li>
                <li>安裝相依性套件 (僅需一次)：
                  <pre>npm install</pre>
                </li>
                <li>啟動本地伺服器：
                  <pre>npm start</pre>
                </li>
                <li>啟動成功後，本頁面將會自動偵測連線 (🟢 伺服器已連線)。</li>
              </ol>
            </div>
          )}

          {serverConnected && (
            <>
              {resultImage ? (
                <div className="preview-panel" style={{ maxHeight: '550px', display: 'flex', flexDirection: 'column' }}>
                  <div className="preview-title">📸 擷取成果預覽</div>
                  <div className="preview-canvas-wrapper" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                    <div className="screenshot-preview-container">
                      <img src={resultImage} alt="Screenshot Result" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div className="action-bar" style={{ width: '100%', marginTop: '15px' }}>
                    <button onClick={handleDownload} className="btn success-btn" style={{ flex: 1 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      儲存長截圖檔案
                    </button>
                  </div>
                </div>
              ) : (
                <div className="preview-panel">
                  <div className="preview-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                    <p>{placeholderMsg}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UrlScreenshot;
