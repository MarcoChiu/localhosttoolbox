import React, { useState, useRef, useEffect } from 'react';

function ImageCompressor({ showStatus, hideStatus }) {
  const [files, setFiles] = useState([]);
  const [targetSizeKB, setTargetSizeKB] = useState(200);
  const [format, setFormat] = useState('image/jpeg');

  const fileInputRef = useRef(null);

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
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
      processFiles(e.dataTransfer.files);
    }
  };

  const selectFiles = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const processFiles = (uploadedFiles) => {
    const filtered = Array.from(uploadedFiles).filter(f => f.type.startsWith('image/'));
    if (filtered.length === 0) {
      showStatus('請上傳有效的圖片檔案！', 'error');
      setTimeout(hideStatus, 2000);
      return;
    }

    showStatus('載入圖片中...', 'loading');
    const newItems = [];
    let loadedCount = 0;

    filtered.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            name: file.name,
            origSizeStr: formatBytes(file.size),
            origSize: file.size,
            imgElement: img,
            previewSrc: e.target.result,
            status: 'pending',
            statusText: '等待壓縮',
            compressedBlob: null,
            compressedURL: '',
            compressedSize: 0,
            quality: 1.0,
            scale: 1.0,
            ext: format === 'image/jpeg' ? 'jpg' : 'webp'
          });

          loadedCount++;
          if (loadedCount === filtered.length) {
            setFiles(prev => [...prev, ...newItems]);
            hideStatus();
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Reset compressed files status if configuration changes
  useEffect(() => {
    if (files.length > 0) {
      setFiles(prev => prev.map(item => {
        if (item.compressedURL) {
          URL.revokeObjectURL(item.compressedURL);
        }
        return {
          ...item,
          compressedBlob: null,
          compressedURL: '',
          status: 'pending',
          statusText: '設定已變更，請重新壓縮',
          quality: 1.0,
          scale: 1.0
        };
      }));
    }
  }, [targetSizeKB, format]);

  const handleDelete = (id, compressedURL) => {
    if (compressedURL) {
      URL.revokeObjectURL(compressedURL);
    }
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClear = () => {
    files.forEach(item => {
      if (item.compressedURL) {
        URL.revokeObjectURL(item.compressedURL);
      }
    });
    setFiles([]);
    showStatus('已清空圖片列表。', 'info');
    setTimeout(hideStatus, 2000);
  };

  const canvasToBlob = (canvas, formatType, q) => {
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), formatType, q);
    });
  };

  const compressSingleFile = async (item, targetLimitBytes, targetFormat, ext) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const originalWidth = item.imgElement.naturalWidth;
    const originalHeight = item.imgElement.naturalHeight;

    let bestBlob = null;
    let bestQuality = 0.8;
    let bestScale = 1.0;
    let scaleFound = false;

    for (let scale = 1.0; scale >= 0.1; scale -= 0.1) {
      bestScale = scale;
      canvas.width = Math.round(originalWidth * scale);
      canvas.height = Math.round(originalHeight * scale);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(item.imgElement, 0, 0, canvas.width, canvas.height);

      let lowQ = 0.05;
      let highQ = 1.0;
      let currentBestBlob = null;
      let currentBestQ = 0.8;

      // Binary search for quality
      for (let iter = 0; iter < 7; iter++) {
        const midQ = (lowQ + highQ) / 2;
        const blob = await canvasToBlob(canvas, targetFormat, midQ);

        if (blob.size <= targetLimitBytes) {
          currentBestBlob = blob;
          currentBestQ = midQ;
          lowQ = midQ;
        } else {
          highQ = midQ;
        }
      }

      if (currentBestBlob) {
        bestBlob = currentBestBlob;
        bestQuality = currentBestQ;
        scaleFound = true;
        break;
      }
    }

    if (!scaleFound) {
      bestScale = 0.1;
      canvas.width = Math.round(originalWidth * 0.1);
      canvas.height = Math.round(originalHeight * 0.1);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(item.imgElement, 0, 0, canvas.width, canvas.height);
      bestBlob = await canvasToBlob(canvas, targetFormat, 0.05);
      bestQuality = 0.05;
    }

    const compressedURL = URL.createObjectURL(bestBlob);

    const isSuccess = bestBlob.size <= targetLimitBytes;
    
    return {
      compressedBlob: bestBlob,
      quality: bestQuality,
      scale: bestScale,
      ext: ext,
      compressedURL: compressedURL,
      status: isSuccess ? 'success' : 'best_effort',
      statusText: isSuccess ? '成功' : '已盡力'
    };
  };

  const handleStartCompress = async () => {
    if (files.length === 0) return;

    const targetLimitBytes = targetSizeKB * 1024;
    const ext = format === 'image/jpeg' ? 'jpg' : 'webp';

    showStatus('正在批量壓縮圖片...', 'loading');
    
    // Create copy of files to work with
    const filesToCompress = [...files];

    for (let i = 0; i < filesToCompress.length; i++) {
      const item = filesToCompress[i];
      // Set state to compressing
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'compressing', statusText: '壓縮中...' } : f));
      
      try {
        const results = await compressSingleFile(item, targetLimitBytes, format, ext);
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, ...results } : f));
      } catch (err) {
        console.error(err);
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'failed', statusText: '失敗' } : f));
      }
    }

    showStatus('圖片批量壓縮完成！', 'success');
    setTimeout(hideStatus, 2000);
  };

  const handleDownloadSingle = (item) => {
    if (!item.compressedURL) return;
    const a = document.createElement('a');
    a.href = item.compressedURL;
    a.download = `${item.name.replace(/\.[^/.]+$/, "")}_compressed.${item.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAll = async () => {
    const filesToDownload = files.filter(f => f.compressedBlob !== null);
    if (filesToDownload.length === 0) return;

    showStatus('正在批量下載圖片...', 'loading');

    for (const item of filesToDownload) {
      const a = document.createElement('a');
      a.href = item.compressedURL;
      a.download = `${item.name.replace(/\.[^/.]+$/, "")}_compressed.${item.ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      await new Promise(resolve => setTimeout(resolve, 350));
    }

    showStatus('全部圖片已開始下載！', 'success');
    setTimeout(hideStatus, 2000);
  };

  const hasCompressed = files.some(f => f.compressedBlob !== null);

  return (
    <div className="tool-layout">
      {/* Left Sidebar Settings */}
      <div className="settings-sidebar">
        <div className="settings-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
            <rect x="9" y="9" width="6" height="6"></rect>
            <line x1="9" y1="1" x2="9" y2="4"></line>
            <line x1="15" y1="1" x2="15" y2="4"></line>
            <line x1="9" y1="20" x2="9" y2="23"></line>
            <line x1="15" y1="20" x2="15" y2="23"></line>
            <line x1="20" y1="9" x2="23" y2="9"></line>
            <line x1="20" y1="15" x2="23" y2="15"></line>
            <line x1="1" y1="9" x2="4" y2="9"></line>
            <line x1="1" y1="15" x2="4" y2="15"></line>
          </svg>
          壓縮設定
        </div>
        <div className="settings-group">
          <label>目標檔案大小 (Target Size)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="number" 
              value={targetSizeKB} 
              min="5" 
              max="10000"
              onChange={(e) => setTargetSizeKB(Math.max(5, parseInt(e.target.value) || 5))} 
              className="form-control" 
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>KB</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>
            設定您期望圖片壓縮後的檔案大小上限。
          </span>
        </div>
        <div className="settings-group">
          <label>目標格式</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="form-control">
            <option value="image/jpeg">JPEG 格式 (支援高壓縮)</option>
            <option value="image/webp">WebP 格式 (新世代高壓縮)</option>
          </select>
        </div>
        <button 
          onClick={handleStartCompress} 
          className="btn success-btn" 
          style={{ width: '100%', marginTop: '10px' }}
          disabled={files.length === 0}
        >
          ⚡ 開始壓縮
        </button>
      </div>

      {/* Right Main Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        {files.length === 0 ? (
          <div 
            className="drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={(e) => {
              if (e.target.tagName !== 'BUTTON' && !e.target.classList.contains('primary-btn')) {
                selectFiles();
              }
            }}
          >
            <div className="drop-zone-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                <path d="M12 12v9"></path>
                <path d="m8 16 4-4 4 4"></path>
              </svg>
              <p>拖曳要壓縮的圖片至此，或點擊選擇 <span>(將圖片壓縮至指定的大小以下，完全在本地執行)</span></p>
              <button className="btn primary-btn" onClick={(e) => { e.stopPropagation(); selectFiles(); }}>選擇圖片</button>
              <input 
                type="file" 
                ref={fileInputRef} 
                multiple 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
            </div>
          </div>
        ) : (
          <div className="file-list-container" style={{ marginTop: 0 }}>
            <ul className="file-list">
              {files.map((item) => {
                let sizeMetaText = '';
                if (item.compressedBlob) {
                  const reductionPercent = Math.round((1 - (item.compressedBlob.size / item.origSize)) * 100);
                  sizeMetaText = ` ➔ ${formatBytes(item.compressedBlob.size)} (-${reductionPercent}%)`;
                }

                let badgeStyle = { color: 'var(--text-secondary)' };
                if (item.status === 'success') {
                  badgeStyle = { color: '#34d399' };
                } else if (item.status === 'best_effort') {
                  badgeStyle = { color: '#fbbf24' };
                } else if (item.status === 'compressing') {
                  badgeStyle = { color: '#60a5fa' };
                } else if (item.status === 'failed') {
                  badgeStyle = { color: '#f87171' };
                }

                return (
                  <li key={item.id} className="file-item">
                    <div className="item-thumbnail">
                      <img src={item.previewSrc} alt={item.name} />
                    </div>
                    <div className="file-info">
                      <div className="file-name" title={item.name}>{item.name}</div>
                      <div className="file-meta">
                        原始: {item.origSizeStr}
                        {item.compressedBlob && (
                          <>
                            {sizeMetaText}
                            <div className="compress-details" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              品質: {Math.round(item.quality * 100)}% | 尺寸: {Math.round(item.imgElement.naturalWidth * item.scale)}x{Math.round(item.imgElement.naturalHeight * item.scale)} ({Math.round(item.scale * 100)}%)
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="file-actions" style={{ alignItems: 'center', gap: '10px' }}>
                      <span className="status-badge" style={{ fontSize: '0.85rem', fontWeight: 600, ...badgeStyle }}>
                        {item.statusText}
                      </span>
                      <button 
                        className="btn success-btn download-single-btn" 
                        disabled={!item.compressedBlob} 
                        style={{ padding: '6px 12px', fontSize: '0.85rem', height: '34px' }}
                        onClick={() => handleDownloadSingle(item)}
                      >
                        下載
                      </button>
                      <button 
                        className="icon-btn delete-btn" 
                        aria-label="Delete" 
                        onClick={() => handleDelete(item.id, item.compressedURL)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="action-bar">
              <button onClick={handleClear} className="btn secondary-btn">清空列表</button>
              <button 
                onClick={handleDownloadAll} 
                className="btn success-btn" 
                disabled={!hasCompressed}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                下載全部壓縮圖
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageCompressor;
