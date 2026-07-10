import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

function PdfToImage({ showStatus, hideStatus }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [fileSizeStr, setFileSizeStr] = useState('');
  
  const [format, setFormat] = useState('image/png');
  const [scale, setScale] = useState(1.5);
  
  // List of rendered pages: [{ pageNum: number, dataUrl: string }]
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const selectFile = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const processFile = (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showStatus('請上傳有效的 PDF 檔案！', 'error');
      setTimeout(hideStatus, 2000);
      return;
    }

    setPdfFile(file);
    setFileSizeStr(formatBytes(file.size));
    showStatus('正在載入 PDF 檔案...', 'loading');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const bytes = e.target.result;
        setPdfBytes(bytes);

        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;
        setTotalPages(pdf.numPages);
        hideStatus();

        // Render pages with default format and scale
        renderPages(pdf, scale);
      } catch (err) {
        console.error(err);
        showStatus(`載入 PDF 失敗: ${err.message}`, 'error');
        setTimeout(hideStatus, 3000);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Re-render pages if scale changes
  useEffect(() => {
    if (pdfBytes) {
      const reloadAndRender = async () => {
        try {
          showStatus('重新渲染預覽中...', 'loading');
          const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
          const pdf = await loadingTask.promise;
          await renderPages(pdf, scale);
        } catch (e) {
          console.error(e);
        }
      };
      reloadAndRender();
    }
  }, [scale]);

  const renderPages = async (pdf, renderScale) => {
    setLoading(true);
    showStatus('正在渲染頁面預覽...', 'loading');
    const tempPages = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: renderScale });
        
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const ctx = canvas.getContext('2d');
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        const dataUrl = canvas.toDataURL(format, 0.9);
        tempPages.push({ pageNum, dataUrl });
      } catch (e) {
        console.error(`Page ${pageNum} render error:`, e);
      }
    }

    setPages(tempPages);
    setLoading(false);
    hideStatus();
  };

  const handleDownloadSingle = (pageNum, dataUrl) => {
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${pdfFile.name.replace(/\.[^/.]+$/, "")}_page_${pageNum}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAll = async () => {
    if (pages.length === 0) return;
    
    showStatus('正在批量下載頁面圖片...', 'loading');
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    
    for (const page of pages) {
      const a = document.createElement('a');
      a.href = page.dataUrl;
      a.download = `${pdfFile.name.replace(/\.[^/.]+$/, "")}_page_${page.pageNum}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Delay to prevent browser block or download collision
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    showStatus('全部頁面圖片已開始下載！', 'success');
    setTimeout(hideStatus, 2000);
  };

  const handleClose = () => {
    setPdfFile(null);
    setPdfBytes(null);
    setTotalPages(0);
    setFileSizeStr('');
    setPages([]);
    hideStatus();
  };

  return (
    <div className="tool-layout full-width">
      {!pdfFile ? (
        <div 
          className="drop-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(e) => {
            if (e.target.tagName !== 'BUTTON' && !e.target.classList.contains('primary-btn')) {
              selectFile();
            }
          }}
        >
          <div className="drop-zone-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="21" y1="15" x2="16" y2="10"></line>
              <line x1="5" y1="21" x2="16" y2="10"></line>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" style={{ opacity: 0.5 }}></path>
            </svg>
            <p>拖曳要轉換的 PDF 檔案至此，或點擊選擇 <span>(解析 PDF 為多張高清圖片，完全在本地執行)</span></p>
            <button className="btn primary-btn" onClick={(e) => { e.stopPropagation(); selectFile(); }}>選擇 PDF 檔案</button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".pdf" 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
          </div>
        </div>
      ) : (
        <>
          {/* PDF Metadata & Image Export Controls */}
          <div className="settings-sidebar" style={{ display: 'flex', width: '100%', marginTop: '20px', flexDirection: 'row', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{pdfFile.name}</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                大小: {fileSizeStr} | 頁數: {totalPages} 頁
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>格式:</span>
                <select 
                  value={format} 
                  onChange={(e) => setFormat(e.target.value)} 
                  className="form-control" 
                  style={{ width: '110px', padding: '6px 10px' }}
                >
                  <option value="image/png">PNG 格式</option>
                  <option value="image/jpeg">JPEG 格式</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>解析度:</span>
                <select 
                  value={scale} 
                  onChange={(e) => setScale(parseFloat(e.target.value))} 
                  className="form-control" 
                  style={{ width: '110px', padding: '6px 10px' }}
                >
                  <option value="1.0">1.0x (標準)</option>
                  <option value="1.5">1.5x (清晰)</option>
                  <option value="2.0">2.0x (超高清)</option>
                </select>
              </div>
              <button className="btn success-btn" style={{ padding: '8px 16px' }} onClick={handleDownloadAll} disabled={pages.length === 0}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                下載全部圖片
              </button>
              <button className="btn secondary-btn" style={{ padding: '8px 16px' }} onClick={handleClose}>
                關閉檔案
              </button>
            </div>
          </div>

          {/* PDF Render Pages Grid */}
          <div style={{ marginTop: '25px', width: '100%' }}>
            <div className="preview-title" style={{ marginBottom: '15px' }}>📄 頁面解析預覽 (點擊下載單頁)</div>
            <div className="pdf-pages-grid">
              {pages.map((page) => (
                <div key={page.pageNum} className="pdf-page-card">
                  <div className="pdf-page-canvas-wrapper">
                    <img src={page.dataUrl} alt={`頁面 ${page.pageNum}`} style={{ width: '100%', display: 'block' }} />
                  </div>
                  <div className="pdf-page-footer">
                    <span className="pdf-page-number">頁面 {page.pageNum} / {totalPages}</span>
                    <button className="btn success-btn" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleDownloadSingle(page.pageNum, page.dataUrl)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      下載
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PdfToImage;
