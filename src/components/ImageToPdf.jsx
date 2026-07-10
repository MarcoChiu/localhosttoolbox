import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import Sortable from 'sortablejs';

function ImageToPdf({ showStatus, hideStatus }) {
  const [images, setImages] = useState([]);
  const [orientation, setOrientation] = useState('auto');
  const [pageSize, setPageSize] = useState('fit');

  const fileInputRef = useRef(null);
  const gridRef = useRef(null);

  // Initialize Sortable on Image Grid
  useEffect(() => {
    if (images.length > 0 && gridRef.current) {
      const sortable = new Sortable(gridRef.current, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: () => {
          const cardEls = gridRef.current.querySelectorAll('.image-card');
          const reorderedIds = Array.from(cardEls).map(el => el.getAttribute('data-id'));
          setImages(prev => {
            const reordered = [];
            reorderedIds.forEach(id => {
              const imgObj = prev.find(img => img.id === id);
              if (imgObj) reordered.push(imgObj);
            });
            return reordered;
          });
        }
      });
      return () => sortable.destroy();
    }
  }, [images.length]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    const validFiles = Array.from(uploadedFiles).filter(f => f.type === 'image/jpeg' || f.type === 'image/png');
    if (validFiles.length === 0) {
      showStatus('請上傳有效的 JPG 或 PNG 圖片檔案！', 'error');
      setTimeout(hideStatus, 2000);
      return;
    }

    showStatus('載入圖片中...', 'loading');
    let loadedCount = 0;
    const newImages = [];

    validFiles.forEach(file => {
      const id = 'img_' + Math.random().toString(36).substr(2, 9);
      const url = URL.createObjectURL(file);
      
      newImages.push({
        id,
        file,
        name: file.name,
        sizeStr: formatBytes(file.size),
        previewUrl: url
      });
    });

    setImages(prev => [...prev, ...newImages]);
    hideStatus();
  };

  const handleDelete = (id, previewUrl) => {
    URL.revokeObjectURL(previewUrl);
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;

    try {
      showStatus('PDF 生成中，請稍候...', 'loading');

      const pdfDoc = await PDFDocument.create();

      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;

      for (const item of images) {
        const arrayBuffer = await item.file.arrayBuffer();
        let image;
        if (item.file.type === 'image/jpeg') {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else if (item.file.type === 'image/png') {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else {
          continue;
        }

        const imgDims = image.scale(1);
        let imgWidth = imgDims.width;
        let imgHeight = imgDims.height;

        let pageWidth, pageHeight;

        if (pageSize === 'fit') {
          pageWidth = imgWidth;
          pageHeight = imgHeight;
          
          if (orientation === 'portrait' && pageWidth > pageHeight) {
            pageWidth = imgHeight;
            pageHeight = imgWidth;
          } else if (orientation === 'landscape' && pageHeight > pageWidth) {
            pageWidth = imgHeight;
            pageHeight = imgWidth;
          }
        } else {
          // A4 Mode
          pageWidth = A4_WIDTH;
          pageHeight = A4_HEIGHT;

          let isLandscape = false;
          if (orientation === 'auto') {
            isLandscape = imgWidth > imgHeight;
          } else if (orientation === 'landscape') {
            isLandscape = true;
          }

          if (isLandscape) {
            pageWidth = A4_HEIGHT;
            pageHeight = A4_WIDTH;
          }
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        if (pageSize === 'fit') {
          const scaleFactor = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
          const finalWidth = imgWidth * scaleFactor;
          const finalHeight = imgHeight * scaleFactor;
          const x = (pageWidth - finalWidth) / 2;
          const y = (pageHeight - finalHeight) / 2;

          page.drawImage(image, {
            x: x,
            y: y,
            width: finalWidth,
            height: finalHeight,
          });
        } else {
          // A4 Margin
          const margin = 20; 
          const availableWidth = pageWidth - margin * 2;
          const availableHeight = pageHeight - margin * 2;

          const scaleFactor = Math.min(
            availableWidth / imgWidth,
            availableHeight / imgHeight,
            1 
          );

          const finalWidth = imgWidth * scaleFactor;
          const finalHeight = imgHeight * scaleFactor;

          const x = (pageWidth - finalWidth) / 2;
          const y = (pageHeight - finalHeight) / 2;

          page.drawImage(image, {
            x: x,
            y: y,
            width: finalWidth,
            height: finalHeight,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `images_to_pdf_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus('PDF 生成成功！', 'success');
      setTimeout(hideStatus, 3000);
    } catch (error) {
      console.error(error);
      showStatus('生成 PDF 時發生錯誤。', 'error');
      setTimeout(hideStatus, 3000);
    }
  };

  return (
    <div className="tool-layout">
      {/* Left Sidebar Settings */}
      <div className="settings-sidebar">
        <div className="settings-title">🖼️ 轉換設定</div>
        <div className="settings-group">
          <label>頁面方向</label>
          <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className="form-control">
            <option value="auto">自動 (依圖片比例)</option>
            <option value="portrait">直式 (Portrait)</option>
            <option value="landscape">橫式 (Landscape)</option>
          </select>
        </div>
        <div className="settings-group">
          <label>頁面大小</label>
          <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="form-control">
            <option value="fit">適應圖片大小</option>
            <option value="a4">A4 (預設邊距)</option>
          </select>
        </div>
        <div className="settings-group">
          <button 
            className="btn success-btn" 
            style={{ width: '100%', marginTop: '20px' }} 
            onClick={handleGeneratePdf}
            disabled={images.length === 0}
          >
            產生 PDF 檔案
          </button>
        </div>
      </div>

      {/* Right Content panel */}
      <div className="main-panel" style={{ flex: 1 }}>
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
            <p>拖曳多張圖片至此，或點擊選擇 <span>(支援 JPG, PNG)</span></p>
            <button className="btn primary-btn" onClick={(e) => { e.stopPropagation(); selectFiles(); }}>選擇圖片檔案</button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/png, image/jpeg" 
              multiple 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Preview Grid */}
        {images.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '10px' }}>已加入的圖片 (可拖曳排序)</h3>
            <div 
              ref={gridRef}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}
            >
              {images.map((item) => (
                <div 
                  key={item.id} 
                  className="image-card" 
                  data-id={item.id}
                  style={{ 
                    position: 'relative', 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid var(--item-border)', 
                    cursor: 'grab', 
                    aspectRatio: '1', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  <img 
                    src={item.previewUrl} 
                    alt={item.name} 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', pointerEvents: 'none' }} 
                  />
                  <button 
                    className="icon-btn" 
                    style={{ 
                      position: 'absolute', 
                      top: '5px', 
                      right: '5px', 
                      background: 'rgba(0,0,0,0.6)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '50%', 
                      padding: '4px', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      transition: 'background 0.2s' 
                    }}
                    onClick={() => handleDelete(item.id, item.previewUrl)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  <div style={{ position: 'absolute', bottom: '5px', left: '5px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', pointerEvents: 'none' }}>
                    {item.sizeStr}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageToPdf;
