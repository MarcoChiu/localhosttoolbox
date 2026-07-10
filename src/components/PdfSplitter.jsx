import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import Sortable from 'sortablejs';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function PdfSplitter({ showStatus, hideStatus }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [fileSizeStr, setFileSizeStr] = useState('');
  
  // Loaded thumbnails for preview: [{ pageNum: number, dataUrl: string }]
  const [thumbnails, setThumbnails] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Selected pages: [{ id: string, pageNum: number, rotation: number, dataUrl: string }]
  const [selectedPages, setSelectedPages] = useState([]);

  const fileInputRef = useRef(null);
  const listRef = useRef(null);

  // Initialize Sortable on selected list tray
  useEffect(() => {
    if (selectedPages.length > 0 && listRef.current) {
      const sortable = new Sortable(listRef.current, {
        handle: '.drag-handle',
        animation: 150,
        onEnd: () => {
          const itemEls = listRef.current.querySelectorAll('.file-item');
          const reorderedIds = Array.from(itemEls).map(el => el.getAttribute('data-id'));
          setSelectedPages(prev => {
            const reordered = [];
            reorderedIds.forEach(id => {
              const item = prev.find(p => p.id === id);
              if (item) reordered.push(item);
            });
            return reordered;
          });
        }
      });
      return () => sortable.destroy();
    }
  }, [selectedPages.length]);

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

        // Render thumbnails
        generateThumbnails(pdf);
      } catch (err) {
        console.error(err);
        showStatus(`載入 PDF 失敗: ${err.message}`, 'error');
        setTimeout(hideStatus, 3000);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const generateThumbnails = async (pdf) => {
    setLoadingPreview(true);
    showStatus('正在渲染頁面預覽...', 'loading');
    const tempThumbnails = [];
    const scale = 1.0; // standard thumbnail scale

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const ctx = canvas.getContext('2d');
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        tempThumbnails.push({ pageNum, dataUrl });
      } catch (e) {
        console.error(`Page ${pageNum} render error:`, e);
      }
    }

    setThumbnails(tempThumbnails);
    setLoadingPreview(false);
    hideStatus();
  };

  const togglePageSelection = (pageNum, dataUrl) => {
    setSelectedPages(prev => {
      const isAlreadySelected = prev.some(item => item.pageNum === pageNum);
      if (isAlreadySelected) {
        // Remove from selection
        return prev.filter(item => item.pageNum !== pageNum);
      } else {
        // Add to selection
        return [...prev, {
          id: `sel-page-${Math.random().toString(36).substr(2, 9)}`,
          pageNum,
          rotation: 0,
          dataUrl
        }];
      }
    });
  };

  const handleSelectAll = () => {
    const all = thumbnails.map(t => ({
      id: `sel-page-${Math.random().toString(36).substr(2, 9)}`,
      pageNum: t.pageNum,
      rotation: 0,
      dataUrl: t.dataUrl
    }));
    setSelectedPages(all);
  };

  const handleDeselectAll = () => {
    setSelectedPages([]);
  };

  const handleRotatePage = (id) => {
    setSelectedPages(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, rotation: (p.rotation + 90) % 360 };
      }
      return p;
    }));
  };

  const handleDeleteSelected = (id) => {
    setSelectedPages(prev => prev.filter(p => p.id !== id));
  };

  const handleMergeAndDownload = async () => {
    if (selectedPages.length === 0 || !pdfBytes) return;

    try {
      showStatus('PDF 合併中，請稍候...', 'loading');
      
      const srcDoc = await PDFDocument.load(pdfBytes);
      const mergedPdf = await PDFDocument.create();

      for (const item of selectedPages) {
        const [copiedPage] = await mergedPdf.copyPages(srcDoc, [item.pageNum - 1]);
        
        // Apply rotation if needed
        if (item.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRotation + item.rotation));
        }

        mergedPdf.addPage(copiedPage);
      }

      const mergedPdfFile = await mergedPdf.save();
      
      const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const originalNameWithoutExt = pdfFile.name.replace(/\.[^/.]+$/, "");
      a.download = `${originalNameWithoutExt}_reorganized_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus('PDF 重組成功！', 'success');
      setTimeout(hideStatus, 2000);
    } catch (error) {
      console.error(error);
      showStatus(`合併重組失敗: ${error.message || '請確認檔案是否損毀'}`, 'error');
      setTimeout(hideStatus, 3000);
    }
  };

  const handleClose = () => {
    setPdfFile(null);
    setPdfBytes(null);
    setTotalPages(0);
    setFileSizeStr('');
    setThumbnails([]);
    setSelectedPages([]);
    hideStatus();
  };

  return (
    <div className={pdfFile ? "tool-layout-reversed" : "tool-layout full-width"}>
      {/* Left Column: Dropzone or Grid */}
      <div className="source-panel" style={{ flex: 1, minWidth: 0 }}>
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="8" y1="13" x2="16" y2="13"></line>
                <line x1="8" y1="17" x2="16" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <p>拖曳 PDF 檔案至此，或點擊選擇 <span>(解析 PDF 頁面以進行拆分、選取與重新排列)</span></p>
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
          <div style={{ width: '100%' }}>
            <div className="pdf-meta-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{pdfFile.name}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  檔案大小: {fileSizeStr} | 總頁數: {totalPages} 頁
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn secondary-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={handleSelectAll}>全選</button>
                <button className="btn secondary-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={handleDeselectAll}>取消全選</button>
              </div>
            </div>

            <div className="preview-title" style={{ marginBottom: '15px' }}>📄 頁面點擊選取</div>
            <div className="pdf-pages-grid">
              {thumbnails.map((thumb) => {
                const isSelected = selectedPages.some(p => p.pageNum === thumb.pageNum);
                return (
                  <div 
                    key={thumb.pageNum} 
                    className={`pdf-page-card selectable ${isSelected ? 'selected' : ''}`}
                    onClick={() => togglePageSelection(thumb.pageNum, thumb.dataUrl)}
                  >
                    <div className="pdf-page-canvas-wrapper" style={{ position: 'relative' }}>
                      <img src={thumb.dataUrl} alt={`頁面 ${thumb.pageNum}`} style={{ width: '100%', display: 'block' }} />
                    </div>
                    <div className="pdf-page-footer">
                      <span className="pdf-page-number">頁面 {thumb.pageNum}</span>
                      <input 
                        type="checkbox" 
                        className="pdf-page-checkbox" 
                        checked={isSelected}
                        onChange={() => {}} // Controlled by card click handler
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Settings Sidebar for Reordering */}
      {pdfFile && (
        <div className="settings-sidebar" style={{ width: '320px', flexShrink: 0 }}>
          <div className="settings-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="13" x2="15" y2="13"></line>
              <line x1="9" y1="17" x2="15" y2="17"></line>
            </svg>
            已選頁面排序
          </div>

          <div className="settings-group" style={{ marginBottom: '15px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              已選取: {selectedPages.length} 頁
            </span>
          </div>

          {/* Sortable Tray List */}
          <div className="file-list-container" style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)' }}>
            {selectedPages.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 10px' }}>
                請點擊左側頁面加入選取
              </p>
            ) : (
              <ul ref={listRef} className="file-list">
                {selectedPages.map((item) => (
                  <li 
                    key={item.id} 
                    className="file-item" 
                    data-id={item.id}
                    style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="drag-handle" style={{ cursor: 'grab', marginRight: '10px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="9" y1="12" x2="15" y2="12"></line>
                        <line x1="9" y1="16" x2="15" y2="16"></line>
                        <line x1="9" y1="8" x2="15" y2="8"></line>
                      </svg>
                    </div>
                    <div style={{ width: '40px', height: '50px', background: 'white', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px' }}>
                      <img 
                        src={item.dataUrl} 
                        alt={`Thumb ${item.pageNum}`}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: `rotate(${item.rotation}deg)`, transition: 'transform 0.2s' }} 
                      />
                    </div>
                    <div style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      第 {item.pageNum} 頁
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button 
                        className="icon-btn" 
                        title="旋轉 90度" 
                        onClick={() => handleRotatePage(item.id)}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', padding: '5px', cursor: 'pointer' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 2v6h-6"></path>
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        </svg>
                      </button>
                      <button 
                        className="icon-btn delete-btn" 
                        title="刪除" 
                        onClick={() => handleDeleteSelected(item.id)}
                        style={{ background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#ef4444', borderRadius: '4px', padding: '5px', cursor: 'pointer' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="action-bar" style={{ flexDirection: 'column', gap: '10px', padding: 0 }}>
            <button 
              className="btn success-btn" 
              style={{ width: '100%' }} 
              disabled={selectedPages.length === 0}
              onClick={handleMergeAndDownload}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              合併並下載
            </button>
            <button 
              className="btn secondary-btn" 
              style={{ width: '100%' }}
              onClick={handleClose}
            >
              關閉檔案
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PdfSplitter;
