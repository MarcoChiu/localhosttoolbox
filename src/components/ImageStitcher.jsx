import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import Sortable from 'sortablejs';

function ImageStitcher({ showStatus, hideStatus }) {
  const [files, setFiles] = useState([]);
  
  // Controls
  const [direction, setDirection] = useState('vertical');
  const [widthMode, setWidthMode] = useState('auto');
  const [gap, setGap] = useState(0);
  const [margin, setMargin] = useState(0);
  const [bgColor, setBgColor] = useState('#0d1527');
  const [cropTop, setCropTop] = useState(0);
  const [cropBottom, setCropBottom] = useState(0);
  const [format, setFormat] = useState('image/png');

  const fileInputRef = useRef(null);
  const listRef = useRef(null);
  const canvasRef = useRef(null);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Initialize Sortable on Stitch list
  useEffect(() => {
    if (files.length > 0 && listRef.current) {
      const sortable = new Sortable(listRef.current, {
        handle: '.drag-handle',
        animation: 150,
        onEnd: () => {
          const itemEls = listRef.current.querySelectorAll('.file-item');
          const reorderedIds = Array.from(itemEls).map(el => el.getAttribute('data-id'));
          setFiles(prev => {
            const reordered = [];
            reorderedIds.forEach(id => {
              const fileObj = prev.find(f => f.id === id);
              if (fileObj) reordered.push(fileObj);
            });
            return reordered;
          });
        }
      });
      return () => sortable.destroy();
    }
  }, [files.length]);

  // Redraw Canvas when settings or files change
  useEffect(() => {
    drawStitchedCanvas();
  }, [files, direction, widthMode, gap, margin, bgColor, cropTop, cropBottom, format]);

  const drawStitchedCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (files.length === 0) {
      return;
    }

    const ctx = canvas.getContext('2d');
    const widths = files.map(item => item.imgElement.naturalWidth);
    const heights = files.map(item => item.imgElement.naturalHeight);

    // Step 1: Calculate Target Base Dimension (Width for vertical, Height for horizontal)
    let targetDimension = 0;
    if (direction === 'vertical') {
      if (widthMode === 'auto') {
        targetDimension = files[0].imgElement.naturalWidth;
      } else if (widthMode === 'maxWidth') {
        targetDimension = Math.max(...widths);
      } else if (widthMode === 'minWidth') {
        targetDimension = Math.min(...widths);
      } else {
        targetDimension = parseInt(widthMode, 10);
      }
    } else {
      if (widthMode === 'auto') {
        targetDimension = files[0].imgElement.naturalHeight;
      } else if (widthMode === 'maxWidth') {
        targetDimension = Math.max(...heights);
      } else if (widthMode === 'minWidth') {
        targetDimension = Math.min(...heights);
      } else {
        targetDimension = parseInt(widthMode, 10) || files[0].imgElement.naturalHeight;
      }
    }

    // Step 2: Compute sizes for each cropped image
    const elementsToDraw = files.map(item => {
      const img = item.imgElement;
      const cropT = cropTop + item.cropTop;
      const cropB = cropBottom + item.cropBottom;
      
      const origW = img.naturalWidth;
      const origH = img.naturalHeight;

      let sourceX = 0, sourceY = 0, sourceW = origW, sourceH = origH;
      let drawW = 0, drawH = 0;

      if (direction === 'vertical') {
        sourceY = cropT;
        sourceH = Math.max(0, origH - cropT - cropB);
        
        const scaleFactor = targetDimension / origW;
        drawW = targetDimension;
        drawH = sourceH * scaleFactor;
      } else {
        sourceX = cropT; // Map crop top to left crop
        sourceW = Math.max(0, origW - cropT - cropB); // Map crop bottom to right crop
        
        const scaleFactor = targetDimension / origH;
        drawH = targetDimension;
        drawW = sourceW * scaleFactor;
      }

      return {
        img,
        sx: sourceX,
        sy: sourceY,
        sw: sourceW,
        sh: sourceH,
        dw: drawW,
        dh: drawH
      };
    });

    // Step 3: Calculate Canvas total dimensions
    let canvasW = 0, canvasH = 0;
    if (direction === 'vertical') {
      canvasW = targetDimension + (2 * margin);
      const totalImagesH = elementsToDraw.reduce((sum, item) => sum + item.dh, 0);
      const totalGaps = (elementsToDraw.length - 1) * gap;
      canvasH = totalImagesH + totalGaps + (2 * margin);
    } else {
      canvasH = targetDimension + (2 * margin);
      const totalImagesW = elementsToDraw.reduce((sum, item) => sum + item.dw, 0);
      const totalGaps = (elementsToDraw.length - 1) * gap;
      canvasW = totalImagesW + totalGaps + (2 * margin);
    }

    // Safety cap
    canvasW = Math.min(canvasW, 25000);
    canvasH = Math.min(canvasH, 25000);

    canvas.width = canvasW;
    canvas.height = canvasH;

    // Step 4: Paint Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Step 5: Draw Images sequentially
    let currentPos = margin;
    elementsToDraw.forEach(item => {
      if (item.sw <= 0 || item.sh <= 0) return;

      if (direction === 'vertical') {
        ctx.drawImage(
          item.img,
          item.sx, item.sy, item.sw, item.sh,
          margin, currentPos, item.dw, item.dh
        );
        currentPos += item.dh + gap;
      } else {
        ctx.drawImage(
          item.img,
          item.sx, item.sy, item.sw, item.sh,
          currentPos, margin, item.dw, item.dh
        );
        currentPos += item.dw + gap;
      }
    });
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
    processFiles(e.dataTransfer.files);
  };

  const selectFiles = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
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
    let loadedCount = 0;
    const newItems = [];

    filtered.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            name: file.name,
            sizeStr: formatBytes(file.size),
            imgElement: img,
            previewSrc: e.target.result,
            cropTop: 0,
            cropBottom: 0
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

  const handleDelete = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleCropChange = (id, field, value) => {
    setFiles(prev => prev.map(item => {
      if (item.id === id) {
        let val = parseInt(value, 10) || 0;
        val = Math.max(0, Math.min(item.imgElement.naturalHeight - 10, val));
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const handleClear = () => {
    setFiles([]);
    showStatus('已清空圖片列表。', 'info');
    setTimeout(hideStatus, 2000);
  };

  const handleDownload = async () => {
    if (files.length === 0) return;
    
    const filename = `screenshot_stitch_${Date.now()}`;
    const canvas = canvasRef.current;

    try {
      showStatus('正在生成檔案...', 'loading');
      
      if (format === 'pdf') {
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        
        const quality = 0.9;
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const imageBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
        
        const embedImage = await pdfDoc.embedJpg(imageBytes);
        const imgDims = embedImage.scale(1.0);
        
        const page = pdfDoc.addPage([imgDims.width, imgDims.height]);
        page.drawImage(embedImage, {
          x: 0,
          y: 0,
          width: imgDims.width,
          height: imgDims.height,
        });
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const quality = format === 'image/jpeg' ? 0.85 : 1.0;
        const dataUrl = canvas.toDataURL(format, quality);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${filename}.${format === 'image/jpeg' ? 'jpg' : 'png'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      showStatus('下載已開始！', 'success');
      setTimeout(hideStatus, 2000);
    } catch (e) {
      console.error(e);
      showStatus(`生成下載失敗: ${e.message}`, 'error');
      setTimeout(hideStatus, 3000);
    }
  };

  const syncBgHex = (value) => {
    let hex = value;
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setBgColor(hex);
    }
  };

  const getWidthText = () => {
    if (widthMode === 'auto') return '自動 (Auto)';
    if (widthMode === 'maxWidth') return '自動 (以最大寬度為準)';
    if (widthMode === 'minWidth') return '自動 (以最小寬度為準)';
    return `${widthMode}px`;
  };

  return (
    <div className="tool-layout">
      {/* Sidebar Controls */}
      <div className="settings-sidebar">
        <div className="settings-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          拼接設定
        </div>

        <div className="settings-group">
          <label>方向</label>
          <select value={direction} onChange={(e) => setDirection(e.target.value)} className="form-control">
            <option value="vertical">垂直拼接 (直式長圖)</option>
            <option value="horizontal">水平拼接 (橫式寬圖)</option>
          </select>
        </div>

        <div className="settings-group">
          <label>裁切寬度限制 <span className="value">{getWidthText()}</span></label>
          <select value={widthMode} onChange={(e) => setWidthMode(e.target.value)} className="form-control">
            <option value="auto">自動 (以第一張圖片為準)</option>
            <option value="maxWidth">自動 (以最大寬度為準)</option>
            <option value="minWidth">自動 (以最小寬度為準)</option>
            <option value="800">固定 800px</option>
            <option value="1200">固定 1200px</option>
            <option value="1920">固定 1920px</option>
          </select>
        </div>

        <div className="settings-group">
          <label>圖片間隔 (Gap) <span className="value">{gap}px</span></label>
          <input type="range" min="0" max="80" value={gap} onChange={(e) => setGap(parseInt(e.target.value))} />
        </div>

        <div className="settings-group">
          <label>外框邊距 (Margin) <span className="value">{margin}px</span></label>
          <input type="range" min="0" max="80" value={margin} onChange={(e) => setMargin(parseInt(e.target.value))} />
        </div>

        <div className="settings-group">
          <label>背景填滿顏色</label>
          <div className="color-picker-wrapper">
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="color-input" />
            <input type="text" value={bgColor} onChange={(e) => syncBgHex(e.target.value)} className="form-control" style={{ flex: 1 }} />
          </div>
        </div>

        <div className="settings-group">
          <label>全局頂部裁切 <span className="value">{cropTop}px</span></label>
          <input type="range" min="0" max="150" value={cropTop} onChange={(e) => setCropTop(parseInt(e.target.value))} />
        </div>

        <div className="settings-group">
          <label>全局底部裁切 <span className="value">{cropBottom}px</span></label>
          <input type="range" min="0" max="150" value={cropBottom} onChange={(e) => setCropBottom(parseInt(e.target.value))} />
        </div>

        <div className="settings-group">
          <label>匯出格式</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="form-control">
            <option value="image/png">PNG 圖片</option>
            <option value="image/jpeg">JPEG 圖片 (小體積)</option>
            <option value="pdf">PDF 文件</option>
          </select>
        </div>
      </div>

      {/* Main Stitching Canvas Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        {/* Upload Drop Zone */}
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p>拖曳多張圖片至此，或點擊選擇</p>
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
          <>
            {/* Image File list with Drag Handle */}
            <div className="file-list-container">
              <ul ref={listRef} className="file-list">
                {files.map((item) => (
                  <li key={item.id} className="file-item" data-id={item.id}>
                    <div className="drag-handle">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="9" y1="12" x2="15" y2="12"></line>
                        <line x1="9" y1="16" x2="15" y2="16"></line>
                        <line x1="9" y1="8" x2="15" y2="8"></line>
                      </svg>
                    </div>
                    <div className="item-thumbnail">
                      <img src={item.previewSrc} alt={item.name} />
                    </div>
                    <div className="file-info">
                      <div className="file-name" title={item.name}>{item.name}</div>
                      <div className="file-meta">
                        {item.sizeStr} ({item.imgElement.naturalWidth}x{item.imgElement.naturalHeight}px)
                      </div>
                    </div>
                    <div className="file-item-controls">
                      <div className="item-crop-row">
                        <span>剪裁頂:</span>
                        <input 
                          type="number" 
                          className="item-crop-top-input" 
                          min="0" 
                          max={item.imgElement.naturalHeight - 10} 
                          value={item.cropTop} 
                          onChange={(e) => handleCropChange(item.id, 'cropTop', e.target.value)}
                        />px
                      </div>
                      <div className="item-crop-row">
                        <span>剪裁底:</span>
                        <input 
                          type="number" 
                          className="item-crop-bottom-input" 
                          min="0" 
                          max={item.imgElement.naturalHeight - 10} 
                          value={item.cropBottom} 
                          onChange={(e) => handleCropChange(item.id, 'cropBottom', e.target.value)}
                        />px
                      </div>
                    </div>
                    <div className="file-actions">
                      <button className="icon-btn delete-btn" aria-label="Delete" onClick={() => handleDelete(item.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Live Stitched Preview */}
            <div className="preview-panel">
              <div className="preview-title">👀 即時拼接預覽</div>
              <div className="preview-canvas-wrapper" style={{ overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                <canvas ref={canvasRef} id="stitch-canvas" style={{ maxWidth: '100%', height: 'auto', display: 'block' }}></canvas>
              </div>
            </div>

            {/* Actions panel */}
            <div className="action-bar">
              <button onClick={handleClear} className="btn secondary-btn">清空列表</button>
              <button 
                onClick={handleDownload} 
                className="btn success-btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                下載拼接檔案
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ImageStitcher;
