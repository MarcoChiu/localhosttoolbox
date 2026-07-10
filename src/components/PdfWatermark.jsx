import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

function PdfWatermark({ showStatus, hideStatus }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);

  const [mode, setMode] = useState('watermark'); // watermark, page-number
  
  // Watermark state
  const [watermarkText, setWatermarkText] = useState('Confidential');
  const [watermarkSize, setWatermarkSize] = useState(48);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [watermarkRotation, setWatermarkRotation] = useState(-30);
  const [placement, setPlacement] = useState('center'); // center, tile, corners, header, footer
  
  // Tile settings
  const [tileRows, setTileRows] = useState(3);
  const [tileCols, setTileCols] = useState(3);
  
  // Corners settings
  const [corners, setCorners] = useState({
    tl: true,
    tr: true,
    bl: true,
    br: true
  });
  const [watermarkColor, setWatermarkColor] = useState('#888888');

  // Page number state
  const [pageNumFormat, setPageNumFormat] = useState('Page X / N');
  const [pageNumPosition, setPageNumPosition] = useState('bottom-center'); // bottom-center, bottom-right, top-center, top-right
  const [pageNumStart, setPageNumStart] = useState(1);
  const [pageNumFontSize, setPageNumFontSize] = useState(14);
  const [pageNumColor, setPageNumColor] = useState('#333333');

  const fileInputRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Sync color helper
  const handleColorChange = (value, type) => {
    let hex = value.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      if (type === 'watermark') {
        setWatermarkColor(hex);
      } else {
        setPageNumColor(hex);
      }
    }
  };

  // Render mock preview canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Draw PDF page base mockup
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    // Draw mock lines
    ctx.fillStyle = '#e8ecf0';
    const lineStyles = [0.7, 0.95, 0.6, 0.85, 0.5, 0.8, 0.65, 0.75, 0.45, 0.7];
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(18, 24 + i * 28, (W - 36) * lineStyles[i], 6);
    }

    // Draw header line
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(18, 12, W - 36, 3);

    const previewFontPx = Math.max(8, watermarkSize * W / 500);

    const drawTextOnPreview = (cx, cy, rot, size) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((rot * Math.PI) / 180);
      const sz = size || previewFontPx;
      ctx.font = `bold ${sz}px Arial, sans-serif`;
      ctx.fillStyle = watermarkColor;
      ctx.globalAlpha = watermarkOpacity;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(watermarkText, 0, 0);
      ctx.restore();
    };

    if (mode === 'watermark') {
      if (watermarkText.trim()) {
        if (placement === 'center') {
          drawTextOnPreview(W / 2, H / 2, watermarkRotation);
        } else if (placement === 'tile') {
          const tSz = Math.max(7, previewFontPx * 0.55);
          for (let r = 0; r < tileRows; r++) {
            for (let c = 0; c < tileCols; c++) {
              drawTextOnPreview(
                (W / (tileCols + 1)) * (c + 1),
                (H / (tileRows + 1)) * (r + 1),
                watermarkRotation,
                tSz
              );
            }
          }
        } else if (placement === 'corners') {
          const cSz = Math.max(7, previewFontPx * 0.5);
          ctx.font = `bold ${cSz}px Arial, sans-serif`;
          const tw = ctx.measureText(watermarkText).width;
          const mg = 14;
          if (corners.tl) drawTextOnPreview(mg + tw / 2, mg + cSz / 2, 0, cSz);
          if (corners.tr) drawTextOnPreview(W - mg - tw / 2, mg + cSz / 2, 0, cSz);
          if (corners.bl) drawTextOnPreview(mg + tw / 2, H - mg - cSz / 2, 0, cSz);
          if (corners.br) drawTextOnPreview(W - mg - tw / 2, H - mg - cSz / 2, 0, cSz);
        } else if (placement === 'header') {
          const hSz = Math.max(7, previewFontPx * 0.6);
          drawTextOnPreview(W / 2, hSz + 6, 0, hSz);
        } else if (placement === 'footer') {
          const fSz = Math.max(7, previewFontPx * 0.6);
          drawTextOnPreview(W / 2, H - 8 - fSz / 2, 0, fSz);
        }
      }
    } else {
      // Page numbers mode
      ctx.globalAlpha = 1;
      const pnSz = Math.max(8, pageNumFontSize * W / 300);
      ctx.font = `${pnSz}px Arial, sans-serif`;
      ctx.fillStyle = pageNumColor;
      const sampleText = pageNumFormat.replace('X', pageNumStart.toString()).replace('N', '12');
      const tw = ctx.measureText(sampleText).width;
      const mg = 14;
      let px, py;
      switch (pageNumPosition) {
        case 'bottom-center': px = W / 2 - tw / 2; py = H - mg; break;
        case 'bottom-right': px = W - tw - mg; py = H - mg; break;
        case 'top-center': px = W / 2 - tw / 2; py = pnSz + mg; break;
        case 'top-right': px = W - tw - mg; py = pnSz + mg; break;
        default: px = W / 2 - tw / 2; py = H - mg;
      }
      ctx.fillText(sampleText, px, py);
    }
    ctx.globalAlpha = 1;
  }, [
    mode, watermarkText, watermarkSize, watermarkOpacity, watermarkRotation, 
    placement, tileRows, tileCols, corners, watermarkColor,
    pageNumFormat, pageNumPosition, pageNumStart, pageNumFontSize, pageNumColor
  ]);

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
    showStatus('讀取 PDF 中...', 'loading');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setPdfBytes(e.target.result);
        hideStatus();
      } catch (err) {
        console.error(err);
        showStatus('讀取失敗', 'error');
        setTimeout(hideStatus, 2000);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleClose = () => {
    setPdfFile(null);
    setPdfBytes(null);
    hideStatus();
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

  const handleApply = async () => {
    if (!pdfBytes) return;

    if (mode === 'watermark' && !watermarkText.trim()) {
      showStatus('請輸入浮水印文字！', 'error');
      setTimeout(hideStatus, 2000);
      return;
    }

    try {
      showStatus('處理 PDF 中...', 'loading');

      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const pagesCount = pages.length;

      if (mode === 'watermark') {
        // CJK text watermark rendering via canvas rasterization
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 80px sans-serif';
        const metrics = ctx.measureText(watermarkText);

        canvas.width = metrics.width + 40;
        canvas.height = 100;

        ctx.font = 'bold 80px sans-serif';
        ctx.fillStyle = watermarkColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(watermarkText, canvas.width / 2, canvas.height / 2);

        const imgDataUrl = canvas.toDataURL('image/png');
        const watermarkImage = await pdfDoc.embedPng(imgDataUrl);

        const baseScale = watermarkSize / 80;
        const drawW = watermarkImage.width * baseScale;
        const drawH = watermarkImage.height * baseScale;

        for (let i = 0; i < pagesCount; i++) {
          const page = pages[i];
          const { width, height } = page.getSize();

          const drawImg = (x, y, rot, scaleMultiplier = 1) => {
            const w = drawW * scaleMultiplier;
            const h = drawH * scaleMultiplier;
            page.drawImage(watermarkImage, {
              x: x - w / 2,
              y: y - h / 2,
              width: w,
              height: h,
              opacity: watermarkOpacity,
              rotate: degrees(rot)
            });
          };

          if (placement === 'center') {
            drawImg(width / 2, height / 2, watermarkRotation);
          } else if (placement === 'tile') {
            const tScale = Math.min(watermarkSize, 40) / watermarkSize;
            for (let r = 0; r < tileRows; r++) {
              for (let c = 0; c < tileCols; c++) {
                drawImg(
                  (width / (tileCols + 1)) * (c + 1),
                  (height / (tileRows + 1)) * (r + 1),
                  watermarkRotation,
                  tScale
                );
              }
            }
          } else if (placement === 'corners') {
            const cScale = Math.min(watermarkSize, 24) / watermarkSize;
            const w = drawW * cScale;
            const h = drawH * cScale;
            const mg = 20;
            if (corners.tl) drawImg(mg + w / 2, height - mg - h / 2, 0, cScale);
            if (corners.tr) drawImg(width - mg - w / 2, height - mg - h / 2, 0, cScale);
            if (corners.bl) drawImg(mg + w / 2, mg + h / 2, 0, cScale);
            if (corners.br) drawImg(width - mg - w / 2, mg + h / 2, 0, cScale);
          } else if (placement === 'header') {
            const hScale = Math.min(watermarkSize, 20) / watermarkSize;
            drawImg(width / 2, height - 25, 0, hScale);
          } else if (placement === 'footer') {
            const fScale = Math.min(watermarkSize, 20) / watermarkSize;
            const h = drawH * fScale;
            drawImg(width / 2, 12 + h / 2, 0, fScale);
          }
        }
      } else {
        // Page numbers mode
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const tc = hexToRgb(pageNumColor);

        for (let idx = 0; idx < pagesCount; idx++) {
          const page = pages[idx];
          const { width, height } = page.getSize();
          const cur = idx + pageNumStart;
          const textStr = pageNumFormat.replace('X', cur).replace('N', pagesCount);
          
          let textWidth = 0;
          try {
            textWidth = font.widthOfTextAtSize(textStr, pageNumFontSize);
          } catch (e) {
            textWidth = textStr.length * (pageNumFontSize * 0.6);
          }
          
          const mg = 18;
          let x, y;
          switch (pageNumPosition) {
            case 'bottom-center': x = width / 2 - textWidth / 2; y = mg; break;
            case 'bottom-right': x = width - textWidth - mg; y = mg; break;
            case 'top-center': x = width / 2 - textWidth / 2; y = height - mg; break;
            case 'top-right': x = width - textWidth - mg; y = height - mg; break;
            default: x = width / 2 - textWidth / 2; y = mg;
          }

          page.drawText(textStr, {
            x,
            y,
            size: pageNumFontSize,
            font: font,
            color: rgb(tc.r, tc.g, tc.b),
            opacity: 1
          });
        }
      }

      const pdfBytesOut = await pdfDoc.save();
      const blob = new Blob([pdfBytesOut], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mode === 'watermark' ? 'watermarked' : 'numbered'}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus('處理成功！已開始下載。', 'success');
      setTimeout(hideStatus, 2500);
    } catch (error) {
      console.error(error);
      showStatus('處理 PDF 時發生錯誤。請確認 PDF 未受加密保護。', 'error');
      setTimeout(hideStatus, 3000);
    }
  };

  return (
    <div className="tool-layout">
      {/* Left Settings Sidebar */}
      <div className="settings-sidebar" style={{ minWidth: '290px' }}>
        <div className="settings-title">🏷️ 浮水印與頁碼設定</div>
        
        {/* Mode Switcher */}
        <div className="editor-mode-toggle" style={{ marginBottom: '20px' }}>
          <button 
            className={`mode-toggle-btn ${mode === 'watermark' ? 'active' : ''}`} 
            style={{ flex: 1 }} 
            onClick={() => setMode('watermark')}
            type="button"
          >
            🏷️ 浮水印
          </button>
          <button 
            className={`mode-toggle-btn ${mode === 'page-number' ? 'active' : ''}`} 
            style={{ flex: 1 }} 
            onClick={() => setMode('page-number')}
            type="button"
          >
            🔢 頁碼
          </button>
        </div>

        {/* ══ WATERMARK MODE PANE ══ */}
        {mode === 'watermark' && (
          <div>
            <div className="settings-group">
              <label>浮水印文字</label>
              <input 
                type="text" 
                value={watermarkText} 
                onChange={(e) => setWatermarkText(e.target.value)} 
                className="form-control" 
                placeholder="例如: 機密文件 Confidential"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="settings-group" style={{ flex: 1 }}>
                <label>字體大小 <span className="value">{watermarkSize}pt</span></label>
                <input 
                  type="range" 
                  min="16" 
                  max="120" 
                  step="4" 
                  value={watermarkSize} 
                  onChange={(e) => setWatermarkSize(parseInt(e.target.value))}
                />
              </div>
              <div className="settings-group" style={{ flex: 1 }}>
                <label>透明度 <span className="value">{Math.round(watermarkOpacity * 100)}%</span></label>
                <input 
                  type="range" 
                  min="0.05" 
                  max="1" 
                  step="0.05" 
                  value={watermarkOpacity} 
                  onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="settings-group">
              <label>旋轉角度 <span className="value">{watermarkRotation}°</span></label>
              <input 
                type="range" 
                min="-90" 
                max="90" 
                step="5" 
                value={watermarkRotation} 
                onChange={(e) => setWatermarkRotation(parseInt(e.target.value))}
              />
            </div>
            
            <div className="settings-group">
              <label>浮水印位置</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '5px' }}>
                {['center', 'tile', 'corners', 'header', 'footer'].map((place) => {
                  const labelMap = { center: '🎯 置中', tile: '⊞ 鋪滿', corners: '📐 四角', header: '⬆️ 頁首', footer: '⬇️ 頁尾' };
                  const isActive = placement === place;
                  return (
                    <button 
                      key={place} 
                      type="button" 
                      onClick={() => setPlacement(place)}
                      style={{ 
                        flex: '1 0 30%', 
                        padding: '8px 4px', 
                        background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)', 
                        border: isActive ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.07)', 
                        borderRadius: '8px', 
                        color: isActive ? '#a5b4fc' : 'var(--text-muted)', 
                        fontSize: '0.78rem', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '4px' 
                      }}
                    >
                      {labelMap[place]}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Tile density Options */}
            {placement === 'tile' && (
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '12px', marginTop: '10px', marginBottom: '15px' }}>
                <label style={{ marginBottom: '8px', display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>🔲 鋪滿密度</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>列數 <span>{tileRows}</span></label>
                    <input type="range" min="1" max="6" step="1" value={tileRows} onChange={(e) => setTileRows(parseInt(e.target.value))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>欄數 <span>{tileCols}</span></label>
                    <input type="range" min="1" max="6" step="1" value={tileCols} onChange={(e) => setTileCols(parseInt(e.target.value))} />
                  </div>
                </div>
              </div>
            )}

            {/* Corner Options */}
            {placement === 'corners' && (
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '12px', marginTop: '10px', marginBottom: '15px' }}>
                <label style={{ marginBottom: '8px', display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>📐 選擇角落</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)', margin: 0 }}>
                    <input type="checkbox" checked={corners.tl} onChange={(e) => setCorners(prev => ({ ...prev, tl: e.target.checked }))} style={{ width: '14px', height: '14px' }} />↖ 左上
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)', margin: 0 }}>
                    <input type="checkbox" checked={corners.tr} onChange={(e) => setCorners(prev => ({ ...prev, tr: e.target.checked }))} style={{ width: '14px', height: '14px' }} />↗ 右上
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)', margin: 0 }}>
                    <input type="checkbox" checked={corners.bl} onChange={(e) => setCorners(prev => ({ ...prev, bl: e.target.checked }))} style={{ width: '14px', height: '14px' }} />↙ 左下
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)', margin: 0 }}>
                    <input type="checkbox" checked={corners.br} onChange={(e) => setCorners(prev => ({ ...prev, br: e.target.checked }))} style={{ width: '14px', height: '14px' }} />↘ 右下
                  </label>
                </div>
              </div>
            )}

            <div className="settings-group">
              <label>浮水印顏色</label>
              <div className="color-picker-wrapper">
                <input 
                  type="color" 
                  value={watermarkColor} 
                  onChange={(e) => handleColorChange(e.target.value, 'watermark')} 
                  className="color-input"
                />
                <input 
                  type="text" 
                  value={watermarkColor} 
                  onChange={(e) => handleColorChange(e.target.value, 'watermark')} 
                  className="form-control" 
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══ PAGENUM MODE PANE ══ */}
        {mode === 'page-number' && (
          <div>
            <div className="settings-group">
              <label>格式</label>
              <select value={pageNumFormat} onChange={(e) => setPageNumFormat(e.target.value)} className="form-control">
                <option value="Page X">Page X</option>
                <option value="Page X / N">Page X / N</option>
                <option value="X">X（純數字）</option>
                <option value="X / N">X / N</option>
                <option value="- X -">- X -</option>
                <option value="第 X 頁">第 X 頁</option>
                <option value="第 X / N 頁">第 X / N 頁</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                X = 當前頁碼，N = 總頁數
              </p>
            </div>
            
            <div className="settings-group">
              <label>位置</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '5px' }}>
                {[
                  { pos: 'bottom-center', label: '⬇️ 底部置中' },
                  { pos: 'bottom-right', label: '↘ 底部右側' },
                  { pos: 'top-center', label: '⬆️ 頂部置中' },
                  { pos: 'top-right', label: '↗ 頂部右側' }
                ].map((item) => {
                  const isActive = pageNumPosition === item.pos;
                  return (
                    <button 
                      key={item.pos} 
                      type="button" 
                      onClick={() => setPageNumPosition(item.pos)}
                      style={{ 
                        padding: '8px 4px', 
                        background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)', 
                        border: isActive ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.07)', 
                        borderRadius: '8px', 
                        color: isActive ? '#a5b4fc' : 'var(--text-muted)', 
                        fontSize: '0.78rem', 
                        cursor: 'pointer', 
                        borderStyle: 'solid', 
                        fontFamily: 'var(--font-sans)' 
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="settings-group" style={{ flex: 1 }}>
                <label>起始頁碼</label>
                <input 
                  type="number" 
                  value={pageNumStart} 
                  min="1" 
                  max="999" 
                  onChange={(e) => setPageNumStart(parseInt(e.target.value) || 1)} 
                  className="form-control"
                />
              </div>
              <div className="settings-group" style={{ flex: 1 }}>
                <label>字體大小</label>
                <input 
                  type="number" 
                  value={pageNumFontSize} 
                  min="8" 
                  max="36" 
                  onChange={(e) => setPageNumFontSize(parseInt(e.target.value) || 14)} 
                  className="form-control"
                />
              </div>
            </div>

            <div className="settings-group">
              <label>字體顏色</label>
              <div className="color-picker-wrapper">
                <input 
                  type="color" 
                  value={pageNumColor} 
                  onChange={(e) => handleColorChange(e.target.value, 'pagenum')} 
                  className="color-input"
                />
                <input 
                  type="text" 
                  value={pageNumColor} 
                  onChange={(e) => handleColorChange(e.target.value, 'pagenum')} 
                  className="form-control" 
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Apply Button */}
        <div className="settings-group" style={{ marginTop: '20px', marginBottom: 0 }}>
          <button 
            className="btn success-btn" 
            style={{ width: '100%' }} 
            onClick={handleApply} 
            disabled={!pdfFile}
          >
            {mode === 'watermark' ? '🏷️ 套用浮水印並下載' : '🔢 套用頁碼並下載'}
          </button>
        </div>
      </div>

      {/* Right Main Preview Area */}
      <div className="main-preview-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '5px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>📄 即時預覽（示意圖）</p>
        </div>
        
        <div style={{ position: 'relative' }}>
          <canvas 
            ref={previewCanvasRef} 
            width="280" 
            height="396" 
            style={{ display: 'block', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', borderRadius: '4px' }}
          ></canvas>
        </div>
        
        {!pdfBytes ? (
          <div 
            className="drop-zone" 
            style={{ width: '100%', maxWidth: '450px', marginTop: '10px' }}
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
              <p>拖曳 PDF 檔案至此，或點擊選擇 <span>(本機離線處理，安全不外流)</span></p>
              <button className="btn primary-btn" type="button" onClick={(e) => { e.stopPropagation(); selectFile(); }}>選擇 PDF</button>
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
          <div style={{ width: '100%', maxWidth: '450px', marginTop: '10px' }}>
            <div className="pdf-meta-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--item-border)', padding: '15px', borderRadius: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>{pdfFile.name}</h3>
              <button className="btn secondary-btn" onClick={handleClose}>重新選擇檔案</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfWatermark;
