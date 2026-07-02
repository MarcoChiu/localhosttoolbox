// PDF Watermark and Page Number Module

function initPdfWatermark() {
    const dropZone = document.getElementById('watermark-drop-zone');
    const fileInput = document.getElementById('watermark-file-input');
    const previewContainer = document.getElementById('watermark-preview-container');
    const fileNameEl = document.getElementById('watermark-pdf-name');
    const closeBtn = document.getElementById('watermark-close-btn');
    const generateBtn = document.getElementById('watermark-generate-btn');

    // Mode switch elements
    const watermarkModeBtn = document.getElementById('watermark-mode-btn');
    const pagenumModeBtn = document.getElementById('pagenum-mode-btn');
    const watermarkPane = document.getElementById('watermark-settings-pane');
    const pagenumPane = document.getElementById('pagenum-settings-pane');

    // Watermark settings
    const watermarkTextInput = document.getElementById('watermark-text');
    const watermarkSize = document.getElementById('watermark-size');
    const valWatermarkSize = document.getElementById('val-watermark-size');
    const watermarkOpacitySlider = document.getElementById('watermark-opacity-slider');
    const valWatermarkOpacity = document.getElementById('val-watermark-opacity');
    const watermarkRotation = document.getElementById('watermark-rotation');
    const valWatermarkRotation = document.getElementById('val-watermark-rotation');
    const tileRowsInput = document.getElementById('tile-rows');
    const valTileRows = document.getElementById('val-tile-rows');
    const tileColsInput = document.getElementById('tile-cols');
    const valTileCols = document.getElementById('val-tile-cols');

    // Corners checkboxes
    const cornerTl = document.getElementById('corner-tl');
    const cornerTr = document.getElementById('corner-tr');
    const cornerBl = document.getElementById('corner-bl');
    const cornerBr = document.getElementById('corner-br');

    // Colors
    const watermarkColorPicker = document.getElementById('watermark-color');
    const watermarkColorHex = document.getElementById('watermark-color-hex');

    // Page number settings
    const pageNumFormat = document.getElementById('pagenum-format');
    const pageNumStart = document.getElementById('pagenum-start');
    const pageNumFontSize = document.getElementById('pagenum-fontsize');
    const pageNumColor = document.getElementById('pagenum-color');
    const pageNumColorHex = document.getElementById('pagenum-color-hex');

    let currentPdfFile = null;
    let currentPdfBytes = null;

    let mode = 'watermark'; // 'watermark' | 'page-number'
    let placement = 'center'; // 'center' | 'tile' | 'corners' | 'header' | 'footer'
    let pageNumPosition = 'bottom-center'; // 'bottom-center' | 'bottom-right' | 'top-center' | 'top-right'

    // Mode Switching
    watermarkModeBtn.addEventListener('click', () => {
        watermarkModeBtn.classList.add('active');
        pagenumModeBtn.classList.remove('active');
        watermarkPane.style.display = 'block';
        pagenumPane.style.display = 'none';
        mode = 'watermark';
        generateBtn.innerText = '🏷️ 套用浮水印並下載';
        updatePreview();
    });

    pagenumModeBtn.addEventListener('click', () => {
        pagenumModeBtn.classList.add('active');
        watermarkModeBtn.classList.remove('active');
        watermarkPane.style.display = 'none';
        pagenumPane.style.display = 'block';
        mode = 'page-number';
        generateBtn.innerText = '🔢 套用頁碼並下載';
        updatePreview();
    });

    // Color sync helpers
    function syncColor(picker, hexInput) {
        picker.addEventListener('input', () => {
            hexInput.value = picker.value.toUpperCase();
            updatePreview();
        });
        hexInput.addEventListener('input', () => {
            let val = hexInput.value.trim();
            if (!val.startsWith('#')) val = '#' + val;
            if (/^#[0-9A-F]{6}$/i.test(val)) {
                picker.value = val;
                updatePreview();
            }
        });
    }

    syncColor(watermarkColorPicker, watermarkColorHex);
    syncColor(pageNumColor, pageNumColorHex);

    // Dynamic slider label updates
    watermarkSize.addEventListener('input', () => {
        valWatermarkSize.textContent = `${watermarkSize.value}pt`;
        updatePreview();
    });
    watermarkOpacitySlider.addEventListener('input', () => {
        valWatermarkOpacity.textContent = `${Math.round(parseFloat(watermarkOpacitySlider.value) * 100)}%`;
        updatePreview();
    });
    watermarkRotation.addEventListener('input', () => {
        valWatermarkRotation.textContent = `${watermarkRotation.value}°`;
        updatePreview();
    });
    tileRowsInput.addEventListener('input', () => {
        valTileRows.textContent = tileRowsInput.value;
        updatePreview();
    });
    tileColsInput.addEventListener('input', () => {
        valTileCols.textContent = tileColsInput.value;
        updatePreview();
    });

    // Placement button toggle
    const placementBtns = document.querySelectorAll('.placement-btn');
    placementBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            placementBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'rgba(255, 255, 255, 0.03)';
                b.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                b.style.color = 'var(--text-muted)';
            });
            btn.classList.add('active');
            btn.style.background = 'rgba(99, 102, 241, 0.2)';
            btn.style.borderColor = 'rgba(99, 102, 241, 0.6)';
            btn.style.color = '#a5b4fc';

            placement = btn.dataset.place;

            document.getElementById('tile-options').style.display = placement === 'tile' ? 'block' : 'none';
            document.getElementById('corner-options').style.display = placement === 'corners' ? 'block' : 'none';

            updatePreview();
        });
    });

    // Position button toggle
    const positionBtns = document.querySelectorAll('.position-btn');
    positionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            positionBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'rgba(255, 255, 255, 0.03)';
                b.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                b.style.color = 'var(--text-muted)';
            });
            btn.classList.add('active');
            btn.style.background = 'rgba(99, 102, 241, 0.2)';
            btn.style.borderColor = 'rgba(99, 102, 241, 0.5)';
            btn.style.color = '#a5b4fc';

            pageNumPosition = btn.dataset.pos;
            updatePreview();
        });
    });

    // Listeners for updates
    watermarkTextInput.addEventListener('input', updatePreview);
    cornerTl.addEventListener('change', updatePreview);
    cornerTr.addEventListener('change', updatePreview);
    cornerBl.addEventListener('change', updatePreview);
    cornerBr.addEventListener('change', updatePreview);
    pageNumFormat.addEventListener('change', updatePreview);
    pageNumStart.addEventListener('input', updatePreview);
    pageNumFontSize.addEventListener('input', updatePreview);

    // Live Preview Drawing Logic
    function updatePreview() {
        const canvas = document.getElementById('watermark-preview-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        ctx.clearRect(0, 0, W, H);

        // Draw PDF page base
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

        // Draw mock document layout lines
        ctx.fillStyle = '#e8ecf0';
        const lineStyles = [0.7, 0.95, 0.6, 0.85, 0.5, 0.8, 0.65, 0.75, 0.45, 0.7];
        for (let i = 0; i < 10; i++) {
            ctx.fillRect(18, 24 + i * 28, (W - 36) * lineStyles[i], 6);
        }

        // Draw header line
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(18, 12, W - 36, 3);

        const text = watermarkTextInput.value;
        const fontSizeVal = parseInt(watermarkSize.value) || 48;
        const opacityVal = parseFloat(watermarkOpacitySlider.value) || 0.25;
        const rotationVal = parseInt(watermarkRotation.value) || -30;
        const colorVal = watermarkColorPicker.value;

        const previewFontPx = Math.max(8, fontSizeVal * W / 500);

        const drawWatermarkText = (cx, cy, rot, size) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((rot * Math.PI) / 180);
            const sz = size || previewFontPx;
            ctx.font = `bold ${sz}px Arial, sans-serif`;
            ctx.fillStyle = colorVal;
            ctx.globalAlpha = opacityVal;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 0, 0);
            ctx.restore();
        };

        if (mode === 'watermark') {
            if (!text.trim()) return;

            if (placement === 'center') {
                drawWatermarkText(W / 2, H / 2, rotationVal);
            } else if (placement === 'tile') {
                const rows = parseInt(tileRowsInput.value) || 3;
                const cols = parseInt(tileColsInput.value) || 3;
                const tSz = Math.max(7, previewFontPx * 0.55);
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        drawWatermarkText(
                            (W / (cols + 1)) * (c + 1),
                            (H / (rows + 1)) * (r + 1),
                            rotationVal,
                            tSz
                        );
                    }
                }
            } else if (placement === 'corners') {
                const cSz = Math.max(7, previewFontPx * 0.5);
                ctx.font = `bold ${cSz}px Arial, sans-serif`;
                const tw = ctx.measureText(text).width;
                const mg = 14;
                if (cornerTl.checked) drawWatermarkText(mg + tw / 2, mg + cSz / 2, 0, cSz);
                if (cornerTr.checked) drawWatermarkText(W - mg - tw / 2, mg + cSz / 2, 0, cSz);
                if (cornerBl.checked) drawWatermarkText(mg + tw / 2, H - mg - cSz / 2, 0, cSz);
                if (cornerBr.checked) drawWatermarkText(W - mg - tw / 2, H - mg - cSz / 2, 0, cSz);
            } else if (placement === 'header') {
                const hSz = Math.max(7, previewFontPx * 0.6);
                drawWatermarkText(W / 2, hSz + 6, 0, hSz);
            } else if (placement === 'footer') {
                const fSz = Math.max(7, previewFontPx * 0.6);
                drawWatermarkText(W / 2, H - 8 - fSz / 2, 0, fSz);
            }
        } else {
            // Page numbers preview mode
            ctx.globalAlpha = 1;
            const pnFormatVal = pageNumFormat.value;
            const pnStartVal = parseInt(pageNumStart.value) || 1;
            const pnFontSizeVal = parseInt(pageNumFontSize.value) || 14;
            const pnColorVal = pageNumColor.value;

            const pnSz = Math.max(8, pnFontSizeVal * W / 300);
            ctx.font = `${pnSz}px Arial, sans-serif`;
            ctx.fillStyle = pnColorVal;
            const sampleText = pnFormatVal.replace('X', pnStartVal.toString()).replace('N', '12');
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
    }

    // Drag-and-drop & File Selection
    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    dropZone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' && !e.target.classList.contains('primary-btn')) fileInput.click();
    });
    dropZone.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    fileInput.addEventListener('change', e => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
        fileInput.value = '';
    });

    async function handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            window.showStatus('請上傳有效的 PDF 檔案！', 'error');
            setTimeout(window.hideStatus, 2000);
            return;
        }

        currentPdfFile = file;
        fileNameEl.textContent = file.name;
        
        window.showStatus('讀取 PDF 中...', 'loading');
        
        try {
            currentPdfBytes = await file.arrayBuffer();
            dropZone.style.display = 'none';
            previewContainer.style.display = 'block';
            generateBtn.disabled = false;
            window.hideStatus();
        } catch (err) {
            console.error(err);
            window.showStatus('讀取失敗', 'error');
            setTimeout(window.hideStatus, 2000);
        }
    }

    closeBtn.addEventListener('click', () => {
        currentPdfFile = null;
        currentPdfBytes = null;
        dropZone.style.display = 'block';
        previewContainer.style.display = 'none';
        generateBtn.disabled = true;
    });

    // Helper: HEX to RGB for pdf-lib
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
    }

    // PDF Apply & Download
    generateBtn.addEventListener('click', async () => {
        if (!currentPdfBytes) return;

        const text = watermarkTextInput.value.trim();
        const fontSizeVal = parseInt(watermarkSize.value) || 48;
        const opacityVal = parseFloat(watermarkOpacitySlider.value) || 0.25;
        const rotationVal = parseInt(watermarkRotation.value) || -30;
        const colorHex = watermarkColorPicker.value;

        if (mode === 'watermark' && !text) {
            window.showStatus('請輸入浮水印文字！', 'error');
            setTimeout(window.hideStatus, 2000);
            return;
        }

        try {
            window.showStatus('處理 PDF 中...', 'loading');
            generateBtn.disabled = true;

            const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;
            const pdfDoc = await PDFDocument.load(currentPdfBytes);
            const pages = pdfDoc.getPages();
            const pagesCount = pages.length;

            if (mode === 'watermark') {
                // CANVAS RASTERIZATION TRICK:
                // Renders the CJK text on a browser canvas to support Chinese/Emoji.
                // Embeds it into pdf-lib as a PNG image, drawing it at specified locations.
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.font = 'bold 80px sans-serif';
                const metrics = ctx.measureText(text);

                canvas.width = metrics.width + 40;
                canvas.height = 100;

                ctx.font = 'bold 80px sans-serif';
                ctx.fillStyle = colorHex;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, canvas.width / 2, canvas.height / 2);

                const imgDataUrl = canvas.toDataURL('image/png');
                const watermarkImage = await pdfDoc.embedPng(imgDataUrl);

                const baseScale = fontSizeVal / 80;
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
                            opacity: opacityVal,
                            rotate: degrees(rot)
                        });
                    };

                    if (placement === 'center') {
                        drawImg(width / 2, height / 2, rotationVal);
                    } else if (placement === 'tile') {
                        const rows = parseInt(tileRowsInput.value) || 3;
                        const cols = parseInt(tileColsInput.value) || 3;
                        const tScale = Math.min(fontSizeVal, 40) / fontSizeVal;
                        for (let r = 0; r < rows; r++) {
                            for (let c = 0; c < cols; c++) {
                                drawImg(
                                    (width / (cols + 1)) * (c + 1),
                                    (height / (rows + 1)) * (r + 1),
                                    rotationVal,
                                    tScale
                                );
                            }
                        }
                    } else if (placement === 'corners') {
                        const cScale = Math.min(fontSizeVal, 24) / fontSizeVal;
                        const w = drawW * cScale;
                        const h = drawH * cScale;
                        const mg = 20;
                        if (cornerTl.checked) drawImg(mg + w / 2, height - mg - h / 2, 0, cScale);
                        if (cornerTr.checked) drawImg(width - mg - w / 2, height - mg - h / 2, 0, cScale);
                        if (cornerBl.checked) drawImg(mg + w / 2, mg + h / 2, 0, cScale);
                        if (cornerBr.checked) drawImg(width - mg - w / 2, mg + h / 2, 0, cScale);
                    } else if (placement === 'header') {
                        const hScale = Math.min(fontSizeVal, 20) / fontSizeVal;
                        drawImg(width / 2, height - 25, 0, hScale);
                    } else if (placement === 'footer') {
                        const fScale = Math.min(fontSizeVal, 20) / fontSizeVal;
                        const h = drawH * fScale;
                        drawImg(width / 2, 12 + h / 2, 0, fScale);
                    }
                }
            } else {
                // PAGE NUMBERS MODE
                const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                const tc = hexToRgb(pageNumColor.value);
                const pSz = parseInt(pageNumFontSize.value) || 14;
                const pStartVal = parseInt(pageNumStart.value) || 1;
                const pnFormatVal = pageNumFormat.value;

                for (let idx = 0; idx < pagesCount; idx++) {
                    const page = pages[idx];
                    const { width, height } = page.getSize();
                    const cur = idx + pStartVal;
                    const textStr = pnFormatVal.replace('X', cur).replace('N', pagesCount);
                    
                    // Helvetica text width calculation (safely using fallback width)
                    let textWidth = 0;
                    try {
                        textWidth = font.widthOfTextAtSize(textStr, pSz);
                    } catch (e) {
                        textWidth = textStr.length * (pSz * 0.6);
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
                        size: pSz,
                        font: font,
                        color: rgb(tc.r, tc.g, tc.b),
                        opacity: 1
                    });
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${mode === 'watermark' ? 'watermarked' : 'numbered'}_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            window.showStatus('處理成功！已開始下載。', 'success');
            setTimeout(window.hideStatus, 2500);

        } catch (error) {
            console.error(error);
            window.showStatus('處理 PDF 時發生錯誤。請確認 PDF 未受加密保護。', 'error');
            setTimeout(window.hideStatus, 3000);
        } finally {
            generateBtn.disabled = false;
        }
    });

    // Initialize mock preview card
    updatePreview();
}

// Attach lifecycle events
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPdfWatermark);
} else {
    initPdfWatermark();
}
