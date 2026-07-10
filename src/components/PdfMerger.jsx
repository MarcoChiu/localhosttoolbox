import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import Sortable from 'sortablejs';

function PdfMerger({ showStatus, hideStatus }) {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const listRef = useRef(null);

  // Initialize Sortable on PDF list
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
    const filtered = Array.from(uploadedFiles).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (filtered.length === 0) {
      showStatus('請上傳有效的 PDF 檔案！', 'error');
      setTimeout(hideStatus, 2000);
      return;
    }

    const newFiles = filtered.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file: file,
      name: file.name,
      size: formatBytes(file.size)
    }));

    setFiles(prev => [...prev, ...newFiles]);
    hideStatus();
  };

  const handleDelete = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClear = () => {
    setFiles([]);
    showStatus('已清空 PDF 列表。', 'info');
    setTimeout(hideStatus, 2000);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    try {
      showStatus('PDF 合併中，請稍候...', 'loading');
      
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfFile = await mergedPdf.save();
      
      const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus('PDF 合併成功！', 'success');
      setTimeout(hideStatus, 3000);
    } catch (error) {
      console.error(error);
      showStatus(`合併失敗: ${error.message || '請確認檔案是否損毀'}`, 'error');
      setTimeout(hideStatus, 3000);
    }
  };

  return (
    <div className="tool-layout full-width">
      {/* Drop Zone */}
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <p>拖曳 PDF 檔案至此，或點擊選擇 <span>(所有檔案皆在瀏覽器端本地處理，安全不外流)</span></p>
          <button className="btn primary-btn" onClick={(e) => { e.stopPropagation(); selectFiles(); }}>選擇 PDF</button>
          <input 
            type="file" 
            ref={fileInputRef} 
            multiple 
            accept=".pdf" 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* PDF File List */}
      {files.length > 0 && (
        <div className="file-list-container" style={{ marginTop: '20px' }}>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <div className="file-info">
                  <div className="file-name" title={item.name}>{item.name}</div>
                  <div className="file-meta">{item.size}</div>
                </div>
                <div className="file-actions">
                  <button className="icon-btn delete-btn" aria-label="Delete" onClick={() => handleDelete(item.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="action-bar">
        <button 
          className="btn secondary-btn" 
          disabled={files.length === 0} 
          onClick={handleClear}
        >
          清空列表
        </button>
        <button 
          className="btn success-btn" 
          disabled={files.length < 2} 
          onClick={handleMerge}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          合併 PDF 檔案
        </button>
      </div>
    </div>
  );
}

export default PdfMerger;
