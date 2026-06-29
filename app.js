document.addEventListener('DOMContentLoaded', () => {
    // Setup local PDF.js worker path
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
    }

    // ----------------------------------------------------------------
    // 1. 全域變數 & UI 元素初始化
    // ----------------------------------------------------------------
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    const statusBar = document.getElementById('status-bar');
    const statusSpinner = document.getElementById('status-spinner');
    const statusText = document.getElementById('status-text');

    const serverStatusDot = document.getElementById('server-status-dot');
    const serverStatusText = document.getElementById('server-status-text');
    const urlServerGuide = document.getElementById('url-server-guide');

    let serverConnected = false;
    const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? window.location.origin
        : 'http://localhost:3000';

    // ----------------------------------------------------------------
    // 2. Tab 切換邏輯
    // ----------------------------------------------------------------
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetContent = document.getElementById(tab.dataset.tab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Clear general status when switching tabs
            hideStatus();
        });
    });

    // ----------------------------------------------------------------
    // 3. 通用狀態提示
    // ----------------------------------------------------------------
    function showStatus(text, type = 'info') {
        statusBar.className = 'status-container active';
        statusBar.classList.add(type);
        statusText.textContent = text;
        if (type === 'loading') {
            statusSpinner.style.display = 'block';
        } else {
            statusSpinner.style.display = 'none';
        }
    }

    function hideStatus() {
        statusBar.className = 'status-container';
    }

    // Expose for modules
    window.showStatus = showStatus;
    window.hideStatus = hideStatus;

    // ----------------------------------------------------------------
    // 4. 後端伺服器連線狀態偵測
    // ----------------------------------------------------------------
    async function checkServerHealth() {
        try {
            const response = await fetch(`${API_BASE}/api/health`);
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'ok') {
                    serverConnected = true;
                    serverStatusDot.className = 'server-badge-dot connected';
                    serverStatusText.textContent = '伺服器已連線';
                    if (urlServerGuide) {
                        urlServerGuide.className = 'server-guide-panel connected';
                        urlServerGuide.innerHTML = `<h3>🟢 本地伺服器已連線</h3><p>Puppeteer 後端服務正在運行。您現在可以輸入任何網址或本地 file:/// 路徑進行完整網頁長截圖。</p>`;
                    }
                    return;
                }
            }
        } catch (e) {
            // Ignore connection errors
        }
        serverConnected = false;
        serverStatusDot.className = 'server-badge-dot';
        serverStatusText.textContent = '伺服器未連線';
    }

    // Initial check and set interval
    checkServerHealth();
    setInterval(checkServerHealth, 5000);

    // ----------------------------------------------------------------
    // 5. PDF 合併功能 (Tab 2)
    // ----------------------------------------------------------------
    const pdfDropZone = document.getElementById('pdf-drop-zone');
    const pdfFileInput = document.getElementById('pdf-file-input');
    const pdfFileList = document.getElementById('pdf-file-list');
    const pdfClearBtn = document.getElementById('pdf-clear-btn');
    const pdfMergeBtn = document.getElementById('pdf-merge-btn');

    let pdfFiles = [];

    // Drag-and-drop for PDF
    pdfDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        pdfDropZone.classList.add('dragover');
    });
    pdfDropZone.addEventListener('dragleave', () => {
        pdfDropZone.classList.remove('dragover');
    });
    pdfDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        pdfDropZone.classList.remove('dragover');
        handlePDFFiles(e.dataTransfer.files);
    });

    // Click selector for PDF
    pdfDropZone.addEventListener('click', (e) => {
        if (!e.target.classList.contains('primary-btn') && e.target.tagName !== 'BUTTON') {
            pdfFileInput.click();
        }
    });
    pdfDropZone.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        pdfFileInput.click();
    });
    pdfFileInput.addEventListener('change', (e) => {
        handlePDFFiles(e.target.files);
        pdfFileInput.value = '';
    });

    function handlePDFFiles(files) {
        const filtered = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
        if (filtered.length === 0) {
            showStatus('請上傳有效的 PDF 檔案！', 'error');
            return;
        }

        filtered.forEach(file => {
            pdfFiles.push({
                id: Math.random().toString(36).substr(2, 9),
                file: file,
                name: file.name,
                size: formatBytes(file.size)
            });
        });

        renderPDFList();
        hideStatus();
    }

    function renderPDFList() {
        pdfFileList.innerHTML = '';
        pdfFiles.forEach((item) => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.setAttribute('data-id', item.id);
            li.innerHTML = `
                <div class="drag-handle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="12" x2="15" y2="12"></line><line x1="9" y1="16" x2="15" y2="16"></line><line x1="9" y1="8" x2="15" y2="8"></line></svg>
                </div>
                <div class="item-thumbnail">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                </div>
                <div class="file-info">
                    <div class="file-name" title="${item.name}">${item.name}</div>
                    <div class="file-meta">${item.size}</div>
                </div>
                <div class="file-actions">
                    <button class="icon-btn delete-btn" aria-label="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `;

            // Delete event using ID matching
            li.querySelector('.delete-btn').addEventListener('click', () => {
                pdfFiles = pdfFiles.filter(f => f.id !== item.id);
                renderPDFList();
            });

            pdfFileList.appendChild(li);
        });

        // Initialize Sortable on PDF list
        if (pdfFiles.length > 0 && typeof Sortable !== 'undefined') {
            const oldSortable = Sortable.get(pdfFileList);
            if (oldSortable) {
                oldSortable.destroy();
            }
            new Sortable(pdfFileList, {
                handle: '.drag-handle',
                animation: 150,
                onEnd: (evt) => {
                    // Reorder the array
                    const reordered = [];
                    pdfFileList.querySelectorAll('.file-item').forEach(el => {
                        const id = el.getAttribute('data-id');
                        const fileObj = pdfFiles.find(f => f.id === id);
                        if (fileObj) reordered.push(fileObj);
                    });
                    pdfFiles = reordered;
                    renderPDFList();
                }
            });
        }

        // Button states
        pdfClearBtn.disabled = pdfFiles.length === 0;
        pdfMergeBtn.disabled = pdfFiles.length < 2;
    }

    pdfClearBtn.addEventListener('click', () => {
        pdfFiles = [];
        renderPDFList();
        showStatus('已清空 PDF 列表。', 'info');
        setTimeout(hideStatus, 2000);
    });

    pdfMergeBtn.addEventListener('click', async () => {
        if (pdfFiles.length < 2) return;
        try {
            showStatus('PDF 合併中，請稍候...', 'loading');
            
            if (typeof PDFLib === 'undefined') {
                throw new Error('PDF 處理庫未正確載入。');
            }

            const { PDFDocument } = PDFLib;
            const mergedPdf = await PDFDocument.create();

            for (const item of pdfFiles) {
                const arrayBuffer = await item.file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const mergedPdfFile = await mergedPdf.save();
            
            // Trigger download
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
        } catch (error) {
            console.error(error);
            showStatus(`合併失敗: ${error.message || '請確認檔案是否損毀'}`, 'error');
        }
    });


    // ----------------------------------------------------------------
    // 6. 圖片長圖拼接功能 (Tab 1)
    // ----------------------------------------------------------------
    const stitchDropZone = document.getElementById('stitch-drop-zone');
    const stitchFileInput = document.getElementById('stitch-file-input');
    const stitchFileList = document.getElementById('stitch-file-list');
    const stitchClearBtn = document.getElementById('stitch-clear-btn');
    const stitchDownloadBtn = document.getElementById('stitch-download-btn');
    const stitchCanvas = document.getElementById('stitch-canvas');
    const stitchPreviewPlaceholder = document.getElementById('stitch-preview-placeholder');

    // Controls
    const controlDirection = document.getElementById('stitch-direction');
    const controlWidthSelect = document.getElementById('stitch-width-select');
    const controlGap = document.getElementById('stitch-gap');
    const controlMargin = document.getElementById('stitch-margin');
    const controlBgColor = document.getElementById('stitch-bg-color');
    const controlBgHex = document.getElementById('stitch-bg-hex');
    const controlCropTop = document.getElementById('stitch-crop-top');
    const controlCropBottom = document.getElementById('stitch-crop-bottom');
    const controlFormat = document.getElementById('stitch-format');

    // Labels for value output
    const valStitchWidth = document.getElementById('val-stitch-width');
    const valStitchGap = document.getElementById('val-stitch-gap');
    const valStitchMargin = document.getElementById('val-stitch-margin');
    const valStitchCropTop = document.getElementById('val-stitch-crop-top');
    const valStitchCropBottom = document.getElementById('val-stitch-crop-bottom');

    let stitchFiles = [];

    // Sync input sliders with text indicators and redraw
    function registerSlider(inputEl, labelEl, suffix = 'px') {
        inputEl.addEventListener('input', () => {
            labelEl.textContent = `${inputEl.value}${suffix}`;
            drawStitchedCanvas();
        });
    }
    registerSlider(controlGap, valStitchGap);
    registerSlider(controlMargin, valStitchMargin);
    registerSlider(controlCropTop, valStitchCropTop);
    registerSlider(controlCropBottom, valStitchCropBottom);

    controlDirection.addEventListener('change', drawStitchedCanvas);
    controlWidthSelect.addEventListener('change', () => {
        valStitchWidth.textContent = controlWidthSelect.options[controlWidthSelect.selectedIndex].text;
        drawStitchedCanvas();
    });
    controlFormat.addEventListener('change', drawStitchedCanvas);

    // BG Color Sync
    controlBgColor.addEventListener('input', () => {
        controlBgHex.value = controlBgColor.value.toUpperCase();
        drawStitchedCanvas();
    });
    controlBgHex.addEventListener('input', () => {
        let hex = controlBgHex.value;
        if (!hex.startsWith('#')) hex = '#' + hex;
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            controlBgColor.value = hex;
            drawStitchedCanvas();
        }
    });

    // Drag-and-drop for Images
    stitchDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        stitchDropZone.classList.add('dragover');
    });
    stitchDropZone.addEventListener('dragleave', () => {
        stitchDropZone.classList.remove('dragover');
    });
    stitchDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        stitchDropZone.classList.remove('dragover');
        handleImageFiles(e.dataTransfer.files);
    });

    // Click selector for images
    stitchDropZone.addEventListener('click', (e) => {
        if (!e.target.classList.contains('primary-btn') && e.target.tagName !== 'BUTTON') {
            stitchFileInput.click();
        }
    });
    stitchDropZone.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        stitchFileInput.click();
    });
    stitchFileInput.addEventListener('change', (e) => {
        handleImageFiles(e.target.files);
        stitchFileInput.value = '';
    });

    function handleImageFiles(files) {
        const filtered = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (filtered.length === 0) {
            showStatus('請上傳有效的圖片檔案！', 'error');
            return;
        }

        let loadedCount = 0;
        showStatus('載入圖片中...', 'loading');

        filtered.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    stitchFiles.push({
                        id: Math.random().toString(36).substr(2, 9),
                        file: file,
                        name: file.name,
                        size: formatBytes(file.size),
                        imgElement: img,
                        cropTop: 0,
                        cropBottom: 0
                    });

                    loadedCount++;
                    if (loadedCount === filtered.length) {
                        hideStatus();
                        renderStitchList();
                        drawStitchedCanvas();
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function renderStitchList() {
        stitchFileList.innerHTML = '';
        stitchFiles.forEach((item) => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.setAttribute('data-id', item.id);
            li.innerHTML = `
                <div class="drag-handle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="12" x2="15" y2="12"></line><line x1="9" y1="16" x2="15" y2="16"></line><line x1="9" y1="8" x2="15" y2="8"></line></svg>
                </div>
                <div class="item-thumbnail">
                    <img src="${item.imgElement.src}" alt="${item.name}">
                </div>
                <div class="file-info">
                    <div class="file-name" title="${item.name}">${item.name}</div>
                    <div class="file-meta">${item.size} (${item.imgElement.naturalWidth}x${item.imgElement.naturalHeight}px)</div>
                </div>
                <div class="file-item-controls">
                    <div class="item-crop-row">
                        <span>剪裁頂:</span>
                        <input type="number" class="item-crop-top-input" min="0" max="${item.imgElement.naturalHeight - 10}" value="${item.cropTop}">px
                    </div>
                    <div class="item-crop-row">
                        <span>剪裁底:</span>
                        <input type="number" class="item-crop-bottom-input" min="0" max="${item.imgElement.naturalHeight - 10}" value="${item.cropBottom}">px
                    </div>
                </div>
                <div class="file-actions">
                    <button class="icon-btn delete-btn" aria-label="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `;

            // Delete event using ID matching
            li.querySelector('.delete-btn').addEventListener('click', () => {
                stitchFiles = stitchFiles.filter(f => f.id !== item.id);
                renderStitchList();
                drawStitchedCanvas();
            });

            // Crop settings event
            const cropTopInput = li.querySelector('.item-crop-top-input');
            const cropBottomInput = li.querySelector('.item-crop-bottom-input');

            cropTopInput.addEventListener('change', () => {
                let val = parseInt(cropTopInput.value, 10) || 0;
                val = Math.max(0, Math.min(item.imgElement.naturalHeight - 10, val));
                cropTopInput.value = val;
                item.cropTop = val;
                drawStitchedCanvas();
            });

            cropBottomInput.addEventListener('change', () => {
                let val = parseInt(cropBottomInput.value, 10) || 0;
                val = Math.max(0, Math.min(item.imgElement.naturalHeight - 10, val));
                cropBottomInput.value = val;
                item.cropBottom = val;
                drawStitchedCanvas();
            });

            stitchFileList.appendChild(li);
        });

        // Initialize Sortable on Image stitch list
        if (stitchFiles.length > 0 && typeof Sortable !== 'undefined') {
            const oldSortable = Sortable.get(stitchFileList);
            if (oldSortable) {
                oldSortable.destroy();
            }
            new Sortable(stitchFileList, {
                handle: '.drag-handle',
                animation: 150,
                onEnd: () => {
                    const reordered = [];
                    stitchFileList.querySelectorAll('.file-item').forEach(el => {
                        const id = el.getAttribute('data-id');
                        const fileObj = stitchFiles.find(f => f.id === id);
                        if (fileObj) reordered.push(fileObj);
                    });
                    stitchFiles = reordered;
                    renderStitchList();
                    drawStitchedCanvas();
                }
            });
        }

        // Update button status
        stitchClearBtn.disabled = stitchFiles.length === 0;
        stitchDownloadBtn.disabled = stitchFiles.length === 0;
    }

    stitchClearBtn.addEventListener('click', () => {
        stitchFiles = [];
        renderStitchList();
        drawStitchedCanvas();
        showStatus('已清空圖片列表。', 'info');
        setTimeout(hideStatus, 2000);
    });

    // Core Drawing Logic
    function drawStitchedCanvas() {
        if (stitchFiles.length === 0) {
            stitchCanvas.style.display = 'none';
            stitchPreviewPlaceholder.style.display = 'flex';
            stitchDownloadBtn.disabled = true;
            stitchClearBtn.disabled = true;
            return;
        }

        stitchCanvas.style.display = 'block';
        stitchPreviewPlaceholder.style.display = 'none';
        stitchDownloadBtn.disabled = false;
        stitchClearBtn.disabled = false;

        const ctx = stitchCanvas.getContext('2d');
        const direction = controlDirection.value; // vertical or horizontal
        const widthMode = controlWidthSelect.value; // auto, maxWidth, minWidth, 800, 1200, 1920
        const gap = parseInt(controlGap.value, 10) || 0;
        const margin = parseInt(controlMargin.value, 10) || 0;
        const bgColor = controlBgColor.value;
        const globalCropTop = parseInt(controlCropTop.value, 10) || 0;
        const globalCropBottom = parseInt(controlCropBottom.value, 10) || 0;

        // Step 1: Calculate Target Base Dimension (Width for vertical, Height for horizontal)
        let targetDimension = 0;
        const widths = stitchFiles.map(item => item.imgElement.naturalWidth);
        const heights = stitchFiles.map(item => item.imgElement.naturalHeight);

        if (direction === 'vertical') {
            // We target a specific width
            if (widthMode === 'auto') {
                targetDimension = stitchFiles[0].imgElement.naturalWidth;
            } else if (widthMode === 'maxWidth') {
                targetDimension = Math.max(...widths);
            } else if (widthMode === 'minWidth') {
                targetDimension = Math.min(...widths);
            } else {
                targetDimension = parseInt(widthMode, 10);
            }
        } else {
            // Horizontal layout: we target a specific height
            // For simplicity, horizontal mode matches first image height, or min/max height
            if (widthMode === 'auto') {
                targetDimension = stitchFiles[0].imgElement.naturalHeight;
            } else if (widthMode === 'maxWidth') {
                targetDimension = Math.max(...heights);
            } else if (widthMode === 'minWidth') {
                targetDimension = Math.min(...heights);
            } else {
                // If they set a fixed number, we use that for target height
                targetDimension = parseInt(widthMode, 10) || stitchFiles[0].imgElement.naturalHeight;
            }
        }

        // Step 2: Compute sizes for each cropped image
        const elementsToDraw = stitchFiles.map(item => {
            const img = item.imgElement;
            const cropT = globalCropTop + item.cropTop;
            const cropB = globalCropBottom + item.cropBottom;
            
            const origW = img.naturalWidth;
            const origH = img.naturalHeight;

            let sourceX = 0, sourceY = 0, sourceW = origW, sourceH = origH;
            let drawW = 0, drawH = 0;

            if (direction === 'vertical') {
                // Vertical stitching: crop top and bottom
                sourceY = cropT;
                sourceH = Math.max(0, origH - cropT - cropB);
                
                // Scale factor to match target width
                const scale = targetDimension / origW;
                drawW = targetDimension;
                drawH = sourceH * scale;
            } else {
                // Horizontal stitching: crop left and right (represented by cropTop and cropBottom for UI simplicity)
                sourceX = cropT; // Map crop top to left crop
                sourceW = Math.max(0, origW - cropT - cropB); // Map crop bottom to right crop
                
                // Scale factor to match target height
                const scale = targetDimension / origH;
                drawH = targetDimension;
                drawW = sourceW * scale;
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

        // Safety cap for extremely large canvases to avoid browser crash (max 32k pixels in any direction)
        canvasW = Math.min(canvasW, 25000);
        canvasH = Math.min(canvasH, 25000);

        stitchCanvas.width = canvasW;
        stitchCanvas.height = canvasH;

        // Step 4: Paint Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Step 5: Draw Images sequentially
        let currentPos = margin;
        elementsToDraw.forEach(item => {
            if (item.sw <= 0 || item.sh <= 0) return; // Skip zero sized

            if (direction === 'vertical') {
                ctx.drawImage(
                    item.img,
                    item.sx, item.sy, item.sw, item.sh,  // Source crop
                    margin, currentPos, item.dw, item.dh // Canvas target
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
    }

    // Trigger Stitch Download
    stitchDownloadBtn.addEventListener('click', async () => {
        if (stitchFiles.length === 0) return;
        
        const format = controlFormat.value; // image/png, image/jpeg, pdf
        const filename = `screenshot_stitch_${Date.now()}`;

        try {
            showStatus('正在生成檔案...', 'loading');
            
            if (format === 'pdf') {
                // Export as PDF document containing this image
                if (typeof PDFLib === 'undefined') {
                    throw new Error('PDF 處理庫未正確載入。');
                }
                const { PDFDocument } = PDFLib;
                const pdfDoc = await PDFDocument.create();
                
                // Get image bytes
                const quality = 0.9;
                const dataUrl = stitchCanvas.toDataURL('image/jpeg', quality);
                const imageBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
                
                const embedImage = await pdfDoc.embedJpg(imageBytes);
                const imgDims = embedImage.scale(1.0);
                
                // Add page matching image dimensions exactly
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
                // Export as PNG or JPEG image
                const quality = format === 'image/jpeg' ? 0.85 : 1.0;
                const dataUrl = stitchCanvas.toDataURL(format, quality);
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
        }
    });

    // ----------------------------------------------------------------
    // 7. HTML 轉圖片功能 (Tab 3)
    // ----------------------------------------------------------------
    const htmlPreset = document.getElementById('html-preset');
    const htmlCodeInput = document.getElementById('html-code-input');
    const htmlRenderTarget = document.getElementById('html-render-target');
    const htmlDownloadBtn = document.getElementById('html-download-btn');
    
    // HTML Design Settings
    const htmlWidth = document.getElementById('html-width');
    const htmlPadding = document.getElementById('html-padding');
    const htmlRadius = document.getElementById('html-radius');
    const htmlBgSelect = document.getElementById('html-bg-select');

    const valHtmlWidth = document.getElementById('val-html-width');
    const valHtmlPadding = document.getElementById('val-html-padding');
    const valHtmlRadius = document.getElementById('val-html-radius');

    // Preset HTML templates
    const presets = {
        'code-card': `<!-- HTML Structure -->
<div class="mock-window">
    <div class="window-header">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="window-title">server.js</span>
    </div>
    <div class="code-wrapper">
        <pre><code class="language-js"><span class="keyword">const</span> express = <span class="string">require</span>(<span class="value">'express'</span>);
<span class="keyword">const</span> app = <span class="string">express</span>();
<span class="keyword">const</span> PORT = 3000;

<span class="comment">// 簡單的本地伺服器監聽</span>
app.<span class="string">listen</span>(PORT, () => {
    console.<span class="string">log</span>(\`Server runs on port \${PORT}\`);
});</code></pre>
    </div>
</div>

<!-- Styles Specific to this Preset -->
<style>
#html-render-target {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}
.mock-window {
    background: rgba(30, 41, 59, 0.7);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
    font-family: 'Consolas', 'Fira Code', monospace;
}
.window-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: rgba(15, 23, 42, 0.6);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 8px;
}
.red { background-color: #ef4444; }
.yellow { background-color: #f59e0b; }
.green { background-color: #10b981; }
.window-title {
    color: #94a3b8;
    font-size: 0.85rem;
    margin-left: 10px;
}
.code-wrapper {
    padding: 24px;
    color: #e2e8f0;
    font-size: 0.95rem;
}
.keyword { color: #f472b6; }
.string { color: #38bdf8; }
.value { color: #fbbf24; }
.comment { color: #64748b; font-style: italic; }
</style>`,

        'review-card': `<!-- Testimonial card -->
<div class="testimonial-card">
    <div class="stars">⭐⭐⭐⭐⭐</div>
    <p class="quote">"這個長截圖與 PDF 工具箱真的太方便了！所有檔案合併和圖片拼接都在本機秒速完成，隱私安全無虞，介面設計得非常有質感，工作效率倍增！"</p>
    <div class="user-profile">
        <div class="avatar">M</div>
        <div class="details">
            <h4 class="name">Marco Chen</h4>
            <p class="role">軟體開發工程師</p>
        </div>
    </div>
</div>

<style>
#html-render-target {
    background: linear-gradient(135deg, #1e3a8a 0%, #0d1b3e 100%);
}
.testimonial-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 30px;
    color: #ffffff;
}
.stars {
    font-size: 1.2rem;
    margin-bottom: 15px;
}
.quote {
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 24px;
    color: #e2e8f0;
    font-weight: 400;
}
.user-profile {
    display: flex;
    align-items: center;
    gap: 15px;
}
.avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.2rem;
}
.details h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}
.details p {
    margin: 2px 0 0 0;
    font-size: 0.85rem;
    color: #94a3b8;
}
</style>`,

        'profile-card': `<!-- Profile card -->
<div class="profile-card">
    <div class="profile-avatar">✨</div>
    <h2 class="profile-name">Antigravity AI</h2>
    <p class="profile-title">您的 AI 結對編程夥伴</p>
    <p class="profile-bio">致力於打造精美、高效且功能完善的網頁與桌面應用程式。結合現代設計美學與極致的使用者體驗。</p>
    <div class="tags">
        <span class="tag">#WebDev</span>
        <span class="tag">#UX/UI</span>
        <span class="tag">#Productivity</span>
    </div>
</div>

<style>
#html-render-target {
    background: linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%);
}
.profile-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 35px 25px;
    text-align: center;
    box-shadow: 0 15px 30px rgba(0,0,0,0.15);
    color: #1e293b;
}
.profile-avatar {
    font-size: 3rem;
    width: 80px;
    height: 80px;
    margin: 0 auto 20px auto;
    background: #f1f5f9;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}
.profile-name {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 5px;
}
.profile-title {
    font-size: 0.95rem;
    color: #4f46e5;
    font-weight: 600;
    margin-bottom: 20px;
}
.profile-bio {
    font-size: 0.9rem;
    line-height: 1.6;
    color: #64748b;
    margin-bottom: 25px;
}
.tags {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
}
.tag {
    background: #f1f5f9;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 500;
}
</style>`,

        'markdown-doc': `<!-- Minimal markdown document -->
<div class="doc-container">
    <h1>📝 本地處理隱私承諾</h1>
    <div class="divider"></div>
    <p>我們理解您的資料隱私性至關重要，因此我們設計的工具具備以下特性：</p>
    <ul>
        <li><strong>100% 瀏覽器本機端執行：</strong> 所有的 PDF 合併、圖片拼接及 HTML 轉圖皆在您的瀏覽器記憶體中完成，不會上傳至任何雲端伺服器。</li>
        <li><strong>無頭瀏覽器隔離：</strong> 網址長截圖雖使用本地伺服器，但亦完全在您個人的電腦上運作，不會將任何網頁資料傳送給第三方。</li>
        <li><strong>極速無感：</strong> 由於無需經過網路傳輸上載下載，大檔案合併通常能在 1 秒內極速完成。</li>
    </ul>
    <p>希望這個工具箱能為您的日常工作與學習帶來便利！</p>
</div>

<style>
#html-render-target {
    background: #ffffff;
}
.doc-container {
    font-family: system-ui, -apple-system, sans-serif;
    color: #334155;
    text-align: left;
}
.doc-container h1 {
    font-size: 1.6rem;
    color: #0f172a;
    margin-bottom: 12px;
}
.divider {
    height: 2px;
    background: #f1f5f9;
    margin-bottom: 20px;
}
.doc-container p {
    font-size: 1rem;
    line-height: 1.7;
    margin-bottom: 16px;
}
.doc-container ul {
    margin-left: 20px;
    margin-bottom: 20px;
}
.doc-container li {
    font-size: 0.95rem;
    line-height: 1.7;
    margin-bottom: 8px;
}
</style>`,
        'custom': `<div class="custom-card">
    <h2>自訂您的卡片</h2>
    <p>在此編寫 HTML 並在 style 區塊編寫 CSS。所有樣式將在右側及時渲染。</p>
</div>

<style>
#html-render-target {
    background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
}
.custom-card {
    padding: 20px;
    color: #f3f4f6;
    text-align: center;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
}
.custom-card h2 {
    color: #6366f1;
    margin-bottom: 10px;
}
</style>`
    };

    // ----------------------------------------------------------------
    // 7.1. 視覺化卡片/圖文編輯器系統 (Visual Card Editor)
    // ----------------------------------------------------------------
    const htmlModeVisualBtn = document.getElementById('html-mode-visual-btn');
    const htmlModeCodeBtn = document.getElementById('html-mode-code-btn');
    const htmlVisualEditor = document.getElementById('html-visual-editor');

    let currentEditorMode = 'visual'; // visual or code

    const visualSchemas = {
        'code-card': [
            { id: 'filename', label: '💻 檔案名稱 (File Name)', type: 'text', default: 'server.js' },
            { id: 'codeText', label: '📝 程式碼內容 (Code Content)', type: 'textarea', default: `const express = require('express');
const app = express();
const PORT = 3000;

// 簡單的本地伺服器監聽
app.listen(PORT, () => {
    console.log(\`Server runs on port \${PORT}\`);
});` }
        ],
        'review-card': [
            { id: 'stars', label: '⭐ 星星評分 (Star Rating)', type: 'select', options: ['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐', '⭐⭐', '⭐'], default: '⭐⭐⭐⭐⭐' },
            { id: 'quote', label: '💬 評價內容 (Review Quote)', type: 'textarea', default: '這個長截圖與 PDF 工具箱真的太方便了！所有檔案合併和圖片拼接都在本機秒速完成，隱私安全無虞，介面設計得非常有質感，工作效率倍增！' },
            { id: 'avatar', label: '👤 頭像縮寫文字 (Avatar text)', type: 'text', default: 'M' },
            { id: 'name', label: '👤 客戶姓名 (Client Name)', type: 'text', default: 'Marco Chen' },
            { id: 'role', label: '💼 副標題 / 職稱 (Sub-title / Role)', type: 'text', default: '軟體開發工程師' }
        ],
        'profile-card': [
            { id: 'emoji', label: '✨ 個人頭像 Emoji (Avatar Emoji)', type: 'text', default: '✨' },
            { id: 'name', label: '📛 顯示名稱 (Display Name)', type: 'text', default: 'Antigravity AI' },
            { id: 'role', label: '💼 個人副標題 (Sub-title)', type: 'text', default: '您的 AI 結對編程夥伴' },
            { id: 'bio', label: '📝 個人自介 (Bio)', type: 'textarea', default: '致力於打造精美、高效且功能完善的網頁與桌面應用程式。結合現代設計美學與極致的使用者體驗。' },
            { id: 'tags', label: '🏷️ 個人標籤 (用半形逗號隔開)', type: 'text', default: '#WebDev, #UX/UI, #Productivity' }
        ],
        'markdown-doc': [
            { id: 'title', label: '✏️ 文件大標題 (Document Title)', type: 'text', default: '📝 本地處理隱私承諾' },
            { id: 'bodyText', label: '引言內容 (Introduction Body)', type: 'textarea', default: '我們理解您的資料隱私性至關重要，因此我們設計的工具具備以下特性：' },
            { id: 'li1', label: '📌 特色項目 1 (Feature 1)', type: 'text', default: '100% 瀏覽器本機端執行：所有的 PDF 合併、圖片拼接及 HTML 轉圖皆在您的瀏覽器記憶體中完成，不會上傳至任何雲端伺服器。' },
            { id: 'li2', label: '📌 特色項目 2 (Feature 2)', type: 'text', default: '無頭瀏覽器隔離：網址長截圖雖使用本地伺服器，但亦完全在您個人的電腦上運作，不會將任何網頁資料傳送給第三方。' },
            { id: 'li3', label: '📌 特色項目 3 (Feature 3)', type: 'text', default: '極速無感：由於無需經過網路傳輸上載下載，大檔案合併通常能在 1 秒內極速完成。' }
        ],
        'custom': []
    };

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function highlightJS(code) {
        const escaped = escapeHtml(code);
        return escaped
            .replace(/(\/\/.*)/g, '<span class="comment">$1</span>')
            .replace(/(const|let|var|function|return|import|export|require|new|await|async|class|if|else|for|while)/g, '<span class="keyword">$1</span>')
            .replace(/('(.*?)'|"(.*?)"|`(.*?)`)/g, '<span class="string">$1</span>');
    }

    const visualCompilers = {
        'code-card': (fields) => {
            const highlighted = highlightJS(fields.codeText);
            return `<div class="mock-window">
    <div class="window-header">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="window-title">${escapeHtml(fields.filename)}</span>
    </div>
    <div class="code-wrapper">
        <pre><code class="language-js">${highlighted}</code></pre>
    </div>
</div>
<style>
#html-render-target {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}
.mock-window {
    background: rgba(30, 41, 59, 0.7);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
    font-family: 'Consolas', 'Fira Code', monospace;
}
.window-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: rgba(15, 23, 42, 0.6);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 8px;
}
.red { background-color: #ef4444; }
.yellow { background-color: #f59e0b; }
.green { background-color: #10b981; }
.window-title {
    color: #94a3b8;
    font-size: 0.85rem;
    margin-left: 10px;
}
.code-wrapper {
    padding: 24px;
    color: #e2e8f0;
    font-size: 0.95rem;
}
.keyword { color: #f472b6; }
.string { color: #38bdf8; }
.value { color: #fbbf24; }
.comment { color: #64748b; font-style: italic; }
</style>`;
        },
        'review-card': (fields) => {
            return `<div class="testimonial-card">
    <div class="stars">${escapeHtml(fields.stars)}</div>
    <p class="quote">"${escapeHtml(fields.quote)}"</p>
    <div class="user-profile">
        <div class="avatar">${escapeHtml(fields.avatar)}</div>
        <div class="details">
            <h4 class="name">${escapeHtml(fields.name)}</h4>
            <p class="role">${escapeHtml(fields.role)}</p>
        </div>
    </div>
</div>
<style>
#html-render-target {
    background: linear-gradient(135deg, #1e3a8a 0%, #0d1b3e 100%);
}
.testimonial-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 30px;
    color: #ffffff;
}
.stars {
    font-size: 1.2rem;
    margin-bottom: 15px;
}
.quote {
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 24px;
    color: #e2e8f0;
    font-weight: 400;
}
.user-profile {
    display: flex;
    align-items: center;
    gap: 15px;
}
.avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.2rem;
}
.details h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}
.details p {
    margin: 2px 0 0 0;
    font-size: 0.85rem;
    color: #94a3b8;
}
</style>`;
        },
        'profile-card': (fields) => {
            const tagHTML = fields.tags.split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0)
                .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
                .join('\n');
            return `<div class="profile-card">
    <div class="profile-avatar">${escapeHtml(fields.emoji)}</div>
    <h2 class="profile-name">${escapeHtml(fields.name)}</h2>
    <p class="profile-title">${escapeHtml(fields.role)}</p>
    <p class="profile-bio">${escapeHtml(fields.bio)}</p>
    <div class="tags">
        ${tagHTML}
    </div>
</div>
<style>
#html-render-target {
    background: linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%);
}
.profile-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 35px 25px;
    text-align: center;
    box-shadow: 0 15px 30px rgba(0,0,0,0.15);
    color: #1e293b;
}
.profile-avatar {
    font-size: 3rem;
    width: 80px;
    height: 80px;
    margin: 0 auto 20px auto;
    background: #f1f5f9;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}
.profile-name {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 5px;
}
.profile-title {
    font-size: 0.95rem;
    color: #4f46e5;
    font-weight: 600;
    margin-bottom: 20px;
}
.profile-bio {
    font-size: 0.9rem;
    line-height: 1.6;
    color: #64748b;
    margin-bottom: 25px;
}
.tags {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
}
.tag {
    background: #f1f5f9;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 500;
}
</style>`;
        },
        'markdown-doc': (fields) => {
            return `<div class="doc-container">
    <h1>${escapeHtml(fields.title)}</h1>
    <div class="divider"></div>
    <p>${escapeHtml(fields.bodyText)}</p>
    <ul>
        <li>${escapeHtml(fields.li1)}</li>
        <li>${escapeHtml(fields.li2)}</li>
        <li>${escapeHtml(fields.li3)}</li>
    </ul>
</div>
<style>
#html-render-target {
    background: #ffffff;
}
.doc-container {
    font-family: system-ui, -apple-system, sans-serif;
    color: #334155;
    text-align: left;
}
.doc-container h1 {
    font-size: 1.6rem;
    color: #0f172a;
    margin-bottom: 12px;
}
.divider {
    height: 2px;
    background: #f1f5f9;
    margin-bottom: 20px;
}
.doc-container p {
    font-size: 1rem;
    line-height: 1.7;
    margin-bottom: 16px;
}
.doc-container ul {
    margin-left: 20px;
    margin-bottom: 20px;
}
.doc-container li {
    font-size: 0.95rem;
    line-height: 1.7;
    margin-bottom: 8px;
}
</style>`;
        }
    };

    // Toggle editor UI tabs
    htmlModeVisualBtn.addEventListener('click', () => {
        htmlModeVisualBtn.classList.add('active');
        htmlModeCodeBtn.classList.remove('active');
        htmlVisualEditor.style.display = 'flex';
        htmlCodeInput.style.display = 'none';
        currentEditorMode = 'visual';
        syncVisualToHTML();
    });

    htmlModeCodeBtn.addEventListener('click', () => {
        htmlModeCodeBtn.classList.add('active');
        htmlModeVisualBtn.classList.remove('active');
        htmlVisualEditor.style.display = 'none';
        htmlCodeInput.style.display = 'block';
        currentEditorMode = 'code';
    });

    function renderVisualForm(presetKey) {
        htmlVisualEditor.innerHTML = '';
        const fields = visualSchemas[presetKey];

        if (presetKey === 'custom') {
            htmlVisualEditor.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 40px 10px;">
                    <p style="font-size:1rem; margin-bottom:10px;">✏️ 自訂 HTML 模式</p>
                    <p style="font-size:0.85rem; color: var(--text-muted);">請點擊上方「💻 原始碼編輯」來直接撰寫 HTML 與 CSS 代碼。</p>
                </div>
            `;
            return;
        }

        if (!fields) return;

        fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'visual-field';

            let inputEl;
            if (field.type === 'textarea') {
                inputEl = document.createElement('textarea');
                inputEl.value = field.default;
            } else if (field.type === 'select') {
                inputEl = document.createElement('select');
                field.options.forEach(opt => {
                    const optEl = document.createElement('option');
                    optEl.value = opt;
                    optEl.textContent = opt;
                    if (opt === field.default) optEl.selected = true;
                    inputEl.appendChild(optEl);
                });
            } else {
                inputEl = document.createElement('input');
                inputEl.type = 'text';
                inputEl.value = field.default;
            }

            inputEl.id = `vis-field-${field.id}`;
            inputEl.addEventListener('input', syncVisualToHTML);
            inputEl.addEventListener('change', syncVisualToHTML);

            const labelEl = document.createElement('label');
            labelEl.setAttribute('for', inputEl.id);
            labelEl.textContent = field.label;

            fieldDiv.appendChild(labelEl);
            fieldDiv.appendChild(inputEl);
            htmlVisualEditor.appendChild(fieldDiv);
        });
    }

    function syncVisualToHTML() {
        const presetKey = htmlPreset.value;
        if (presetKey === 'custom') return;

        const fields = visualSchemas[presetKey];
        if (!fields) return;

        const values = {};
        fields.forEach(field => {
            const el = document.getElementById(`vis-field-${field.id}`);
            values[field.id] = el ? el.value : field.default;
        });

        const compiler = visualCompilers[presetKey];
        if (compiler) {
            const compiledHTML = compiler(values);
            htmlCodeInput.value = compiledHTML;
            updateHTMLRender();
        }
    }

    // Update HTML editor size controls
    htmlWidth.addEventListener('input', () => {
        valHtmlWidth.textContent = `${htmlWidth.value}px`;
        htmlRenderTarget.style.width = `${htmlWidth.value}px`;
    });

    htmlPadding.addEventListener('input', () => {
        valHtmlPadding.textContent = `${htmlPadding.value}px`;
        htmlRenderTarget.style.padding = `${htmlPadding.value}px`;
    });

    htmlRadius.addEventListener('input', () => {
        valHtmlRadius.textContent = `${htmlRadius.value}px`;
        htmlRenderTarget.style.borderRadius = `${htmlRadius.value}px`;
    });

    htmlBgSelect.addEventListener('change', () => {
        htmlRenderTarget.style.background = htmlBgSelect.value;
    });

    // Preset selection change
    htmlPreset.addEventListener('change', () => {
        const val = htmlPreset.value;
        if (val === 'custom') {
            htmlModeCodeBtn.click(); // auto switch to code view in custom
            htmlCodeInput.value = presets['custom'].trim();
            updateHTMLRender();
        } else {
            // Build visual form & render
            renderVisualForm(val);
            syncVisualToHTML();
            
            // Switch back to visual mode if not already
            if (currentEditorMode !== 'visual') {
                htmlModeVisualBtn.click();
            }
        }
    });

    htmlCodeInput.addEventListener('input', updateHTMLRender);

    function updateHTMLRender() {
        const code = htmlCodeInput.value;
        // Injecting safely inside our sandbox
        
        // Split code and style (if any)
        htmlRenderTarget.innerHTML = code;
        
        // Also apply basic target outer style based on sliders
        htmlRenderTarget.style.width = `${htmlWidth.value}px`;
        htmlRenderTarget.style.padding = `${htmlPadding.value}px`;
        htmlRenderTarget.style.borderRadius = `${htmlRadius.value}px`;
        
        // Unless color preset changes style inside preset, apply select value
        if (htmlBgSelect.value && !code.includes('#html-render-target {') && !code.includes('#html-render-target{')) {
            htmlRenderTarget.style.background = htmlBgSelect.value;
        }
    }

    // Capture HTML node to Image
    htmlDownloadBtn.addEventListener('click', async () => {
        if (typeof html2canvas === 'undefined') {
            showStatus('擷取程式庫未載入，請確認網路連線。', 'error');
            return;
        }

        try {
            showStatus('影像產生中...', 'loading');
            
            // Render card
            const canvas = await html2canvas(htmlRenderTarget, {
                useCORS: true,
                scale: 2, // Double quality
                backgroundColor: null,
                logging: false
            });

            const dataUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `html_card_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            showStatus('已成功下載卡片圖片！', 'success');
            setTimeout(hideStatus, 2000);
        } catch (e) {
            console.error(e);
            showStatus(`擷取失敗: ${e.message}`, 'error');
        }
    });

    // Load initial code card preset
    htmlPreset.dispatchEvent(new Event('change'));


    // ----------------------------------------------------------------
    // 8. 網頁網址長截圖功能 (Tab 4)
    // ----------------------------------------------------------------
    const urlAddress = document.getElementById('url-address');
    const urlCaptureBtn = document.getElementById('url-capture-btn');
    const urlWidth = document.getElementById('url-width');
    const urlDelay = document.getElementById('url-delay');
    const urlFormat = document.getElementById('url-format');
    const urlScroll = document.getElementById('url-scroll');
    
    const valUrlDelay = document.getElementById('val-url-delay');
    const urlResultPanel = document.getElementById('url-result-panel');
    const urlResultImg = document.getElementById('url-result-img');
    const urlDownloadBtn = document.getElementById('url-download-btn');
    const urlPreviewPlaceholder = document.getElementById('url-preview-placeholder');
    const urlPlaceholderMsg = document.getElementById('url-placeholder-msg');

    urlDelay.addEventListener('input', () => {
        valUrlDelay.textContent = `${urlDelay.value}ms`;
    });

    urlCaptureBtn.addEventListener('click', async () => {
        let url = urlAddress.value.trim();
        if (!url) {
            showStatus('請輸入網址！', 'error');
            return;
        }

        // Auto prepending protocol if normal URL
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file:///')) {
            url = 'https://' + url;
            urlAddress.value = url;
        }

        if (!serverConnected) {
            showStatus('本地伺服器尚未連線，請照下方引導啟動後端伺服器！', 'error');
            return;
        }

        try {
            showStatus('正在擷取網頁，請稍候（此操作可能需要 5-15 秒，視網頁大小而定）...', 'loading');
            urlCaptureBtn.disabled = true;
            urlResultPanel.style.display = 'none';
            urlPreviewPlaceholder.style.display = 'flex';
            urlPlaceholderMsg.textContent = '正在與 Puppeteer 連線並載入網頁...';

            const response = await fetch(`${API_BASE}/api/screenshot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    width: parseInt(urlWidth.value, 10),
                    delay: parseInt(urlDelay.value, 10),
                    format: urlFormat.value,
                    scroll: urlScroll.checked
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `伺服器回應錯誤 (狀態碼: ${response.status})`);
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            
            // Set preview image
            urlResultImg.src = objectUrl;
            
            // Show preview pane, hide placeholder
            urlPreviewPlaceholder.style.display = 'none';
            urlResultPanel.style.display = 'flex';
            
            // Download configuration
            urlDownloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = objectUrl;
                a.download = `web_screenshot_${Date.now()}.${urlFormat.value === 'jpeg' ? 'jpg' : 'png'}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };

            showStatus('網頁長截圖擷取成功！', 'success');
        } catch (e) {
            console.error(e);
            urlPlaceholderMsg.textContent = '擷取失敗。';
            showStatus(`擷取失敗: ${e.message}`, 'error');
        } finally {
            urlCaptureBtn.disabled = false;
        }
    });

    // ----------------------------------------------------------------
    // 8. PDF 拆分與重組功能 (PDF Split & Reorder)
    // ----------------------------------------------------------------
    const pdfSplitDropZone = document.getElementById('pdf-split-drop-zone');
    const pdfSplitFileInput = document.getElementById('pdf-split-file-input');
    const pdfSplitGridWrapper = document.getElementById('pdf-split-grid-wrapper');
    const pdfSplitName = document.getElementById('pdf-split-name');
    const pdfSplitInfo = document.getElementById('pdf-split-info');
    const pdfSplitSelectAllBtn = document.getElementById('pdf-split-select-all-btn');
    const pdfSplitDeselectAllBtn = document.getElementById('pdf-split-deselect-all-btn');
    const pdfSplitPagesGrid = document.getElementById('pdf-split-pages-grid');
    const pdfSplitSidebar = document.getElementById('pdf-split-sidebar');
    const pdfSplitSelectedCount = document.getElementById('pdf-split-selected-count');
    const pdfSplitSelectedList = document.getElementById('pdf-split-selected-list');
    const pdfSplitMergeBtn = document.getElementById('pdf-split-merge-btn');
    const pdfSplitCloseBtn = document.getElementById('pdf-split-close-btn');

    let splitPdfDoc = null;
    let splitPdfFileName = '';
    let splitPdfFileBytes = null;
    let selectedPagesList = []; // Array of { id: string, pageNum: number, dataUrl: string }

    // Drag-and-drop
    pdfSplitDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        pdfSplitDropZone.classList.add('dragover');
    });
    pdfSplitDropZone.addEventListener('dragleave', () => {
        pdfSplitDropZone.classList.remove('dragover');
    });
    pdfSplitDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        pdfSplitDropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handlePDFSplitFile(e.dataTransfer.files[0]);
        }
    });

    // File selection
    pdfSplitDropZone.addEventListener('click', (e) => {
        if (!e.target.classList.contains('primary-btn') && e.target.tagName !== 'BUTTON') {
            pdfSplitFileInput.click();
        }
    });
    pdfSplitDropZone.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        pdfSplitFileInput.click();
    });
    pdfSplitFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handlePDFSplitFile(e.target.files[0]);
        }
        pdfSplitFileInput.value = '';
    });

    function handlePDFSplitFile(file) {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showStatus('請上傳有效的 PDF 檔案！', 'error');
            return;
        }

        splitPdfFileName = file.name;
        const sizeStr = formatBytes(file.size);
        
        showStatus('正在載入 PDF 檔案...', 'loading');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                splitPdfFileBytes = e.target.result;
                if (typeof pdfjsLib === 'undefined') {
                    throw new Error('PDF 渲染程式庫 (pdf.js) 未正確載入。');
                }

                const loadingTask = pdfjsLib.getDocument({ data: splitPdfFileBytes });
                splitPdfDoc = await loadingTask.promise;

                // Update UI metadata
                pdfSplitName.textContent = splitPdfFileName;
                pdfSplitInfo.textContent = `檔案大小: ${sizeStr} | 總頁數: ${splitPdfDoc.numPages} 頁`;

                // Adjust UI panels
                pdfSplitDropZone.style.display = 'none';
                pdfSplitGridWrapper.style.display = 'block';
                pdfSplitSidebar.style.display = 'block';

                selectedPagesList = [];
                updateSelectedPagesTray();
                hideStatus();

                // Render all pages
                renderPDFSplitPages();
            } catch (err) {
                console.error(err);
                showStatus(`載入 PDF 失敗: ${err.message}`, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    async function renderPDFSplitPages() {
        if (!splitPdfDoc) return;

        pdfSplitPagesGrid.innerHTML = '';
        const numPages = splitPdfDoc.numPages;
        const scale = 1.2; // 1.2 is good size for select thumbnail

        showStatus('正在渲染頁面預覽...', 'loading');

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const cardId = `split-card-${pageNum}`;

            // Create UI Card
            const card = document.createElement('div');
            card.className = 'pdf-page-card selectable';
            card.id = cardId;
            card.setAttribute('data-page-num', pageNum);
            
            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'pdf-page-canvas-wrapper';
            
            const canvas = document.createElement('canvas');
            canvas.id = `pdf-split-canvas-${pageNum}`;
            canvasWrapper.appendChild(canvas);
            
            const footer = document.createElement('div');
            footer.className = 'pdf-page-footer';
            
            const pageNumText = document.createElement('span');
            pageNumText.className = 'pdf-page-number';
            pageNumText.textContent = `頁面 ${pageNum}`;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'pdf-page-checkbox';
            checkbox.id = `chk-split-page-${pageNum}`;

            footer.appendChild(pageNumText);
            footer.appendChild(checkbox);
            
            card.appendChild(canvasWrapper);
            card.appendChild(footer);
            pdfSplitPagesGrid.appendChild(card);

            try {
                // Render pdf page to canvas
                const page = await splitPdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: scale });
                
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                const ctx = canvas.getContext('2d');
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;

                // Capture thumbnail dataurl for sortable list
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                card.setAttribute('data-thumbnail', dataUrl);

                // Event: Click on card toggles selection
                card.addEventListener('click', (e) => {
                    // Prevent double triggering if clicked checkbox directly
                    if (e.target === checkbox) {
                        togglePageSelection(pageNum, checkbox.checked, dataUrl);
                        return;
                    }
                    checkbox.checked = !checkbox.checked;
                    togglePageSelection(pageNum, checkbox.checked, dataUrl);
                });
            } catch (e) {
                console.error(`Split Page ${pageNum} render error:`, e);
            }
        }
        
        hideStatus();
    }

    function togglePageSelection(pageNum, isSelected, dataUrl) {
        const card = document.getElementById(`split-card-${pageNum}`);
        const checkbox = document.getElementById(`chk-split-page-${pageNum}`);
        
        if (isSelected) {
            if (card) card.classList.add('selected');
            if (checkbox) checkbox.checked = true;
            // Add to selected array if not already present
            if (!selectedPagesList.some(item => item.pageNum === pageNum)) {
                selectedPagesList.push({
                    id: `sel-page-${Math.random().toString(36).substr(2, 9)}`,
                    pageNum: pageNum,
                    dataUrl: dataUrl || (card ? card.getAttribute('data-thumbnail') : '')
                });
            }
        } else {
            if (card) card.classList.remove('selected');
            if (checkbox) checkbox.checked = false;
            // Remove from selected array
            selectedPagesList = selectedPagesList.filter(item => item.pageNum !== pageNum);
        }
        
        updateSelectedPagesTray();
    }

    function updateSelectedPagesTray() {
        pdfSplitSelectedList.innerHTML = '';

        selectedPagesList.forEach((item) => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.setAttribute('data-id', item.id);
            li.setAttribute('data-page-num', item.pageNum);
            li.innerHTML = `
                <div class="drag-handle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="12" x2="15" y2="12"></line><line x1="9" y1="16" x2="15" y2="16"></line><line x1="9" y1="8" x2="15" y2="8"></line></svg>
                </div>
                <div class="item-thumbnail">
                    <img src="${item.dataUrl}" alt="頁面 ${item.pageNum}">
                </div>
                <div class="file-info">
                    <div class="file-name">頁面 ${item.pageNum}</div>
                    <div class="file-meta">原始順序: 第 ${item.pageNum} 頁</div>
                </div>
                <div class="file-actions">
                    <button class="icon-btn delete-btn" aria-label="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `;

            // Delete event: Deselect
            li.querySelector('.delete-btn').addEventListener('click', () => {
                togglePageSelection(item.pageNum, false);
            });

            pdfSplitSelectedList.appendChild(li);
        });

        // Initialize Sortable on Selected List
        if (selectedPagesList.length > 0 && typeof Sortable !== 'undefined') {
            const oldSortable = Sortable.get(pdfSplitSelectedList);
            if (oldSortable) {
                oldSortable.destroy();
            }
            new Sortable(pdfSplitSelectedList, {
                handle: '.drag-handle',
                animation: 150,
                onEnd: () => {
                    const reordered = [];
                    pdfSplitSelectedList.querySelectorAll('.file-item').forEach(el => {
                        const id = el.getAttribute('data-id');
                        const item = selectedPagesList.find(f => f.id === id);
                        if (item) reordered.push(item);
                    });
                    selectedPagesList = reordered;
                }
            });
        }

        // Update count & button states
        pdfSplitSelectedCount.textContent = `已選取: ${selectedPagesList.length} 頁`;
        pdfSplitMergeBtn.disabled = selectedPagesList.length === 0;
    }

    // Select All
    pdfSplitSelectAllBtn.addEventListener('click', () => {
        if (!splitPdfDoc) return;
        const numPages = splitPdfDoc.numPages;
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const card = document.getElementById(`split-card-${pageNum}`);
            const dataUrl = card ? card.getAttribute('data-thumbnail') : '';
            togglePageSelection(pageNum, true, dataUrl);
        }
    });

    // Deselect All
    pdfSplitDeselectAllBtn.addEventListener('click', () => {
        if (!splitPdfDoc) return;
        const numPages = splitPdfDoc.numPages;
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            togglePageSelection(pageNum, false);
        }
    });

    // Merge & Download Click
    pdfSplitMergeBtn.addEventListener('click', async () => {
        if (selectedPagesList.length === 0) return;
        try {
            showStatus('PDF 合併中，請稍候...', 'loading');
            
            if (typeof PDFLib === 'undefined') {
                throw new Error('PDF 處理庫未正確載入。');
            }

            const { PDFDocument } = PDFLib;
            const mergedPdf = await PDFDocument.create();
            const srcPdf = await PDFDocument.load(splitPdfFileBytes);

            // Copy selected pages in the sorted order
            const pageIndices = selectedPagesList.map(item => item.pageNum - 1);
            const copiedPages = await mergedPdf.copyPages(srcPdf, pageIndices);
            copiedPages.forEach((page) => mergedPdf.addPage(page));

            const mergedPdfFile = await mergedPdf.save();
            
            // Trigger download
            const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const originalNameWithoutExt = splitPdfFileName.replace(/\.[^/.]+$/, "");
            a.download = `${originalNameWithoutExt}_reorganized_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showStatus('PDF 重組成功！', 'success');
            setTimeout(hideStatus, 2000);
        } catch (error) {
            console.error(error);
            showStatus(`合併失敗: ${error.message || '請確認檔案是否正常'}`, 'error');
        }
    });

    // Close File
    pdfSplitCloseBtn.addEventListener('click', () => {
        splitPdfDoc = null;
        splitPdfFileName = '';
        splitPdfFileBytes = null;
        selectedPagesList = [];
        pdfSplitPagesGrid.innerHTML = '';
        pdfSplitSelectedList.innerHTML = '';
        
        pdfSplitDropZone.style.display = 'block';
        pdfSplitGridWrapper.style.display = 'none';
        pdfSplitSidebar.style.display = 'none';
        hideStatus();
    });

    // ----------------------------------------------------------------
    // 8.5. PDF 轉圖片功能 (PDF to Image)
    // ----------------------------------------------------------------
    const pdf2imgDropZone = document.getElementById('pdf-2img-drop-zone');
    const pdf2imgFileInput = document.getElementById('pdf-2img-file-input');
    const pdf2imgMetaBar = document.getElementById('pdf-2img-meta-bar');
    const pdf2imgName = document.getElementById('pdf-2img-name');
    const pdf2imgInfo = document.getElementById('pdf-2img-info');
    const pdf2imgFormat = document.getElementById('pdf-2img-format');
    const pdf2imgScale = document.getElementById('pdf-2img-scale');
    const pdf2imgDownloadAllBtn = document.getElementById('pdf-2img-download-all-btn');
    const pdf2imgCloseBtn = document.getElementById('pdf-2img-close-btn');
    const pdf2imgGridWrapper = document.getElementById('pdf-2img-grid-wrapper');
    const pdf2imgPagesGrid = document.getElementById('pdf-2img-pages-grid');

    let loadedPdfDoc = null;
    let pdfFileName = '';

    // Drag-and-drop
    pdf2imgDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        pdf2imgDropZone.classList.add('dragover');
    });
    pdf2imgDropZone.addEventListener('dragleave', () => {
        pdf2imgDropZone.classList.remove('dragover');
    });
    pdf2imgDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        pdf2imgDropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handlePDF2ImgFile(e.dataTransfer.files[0]);
        }
    });

    // File selection
    pdf2imgDropZone.addEventListener('click', (e) => {
        if (!e.target.classList.contains('primary-btn') && e.target.tagName !== 'BUTTON') {
            pdf2imgFileInput.click();
        }
    });
    pdf2imgDropZone.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        pdf2imgFileInput.click();
    });
    pdf2imgFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handlePDF2ImgFile(e.target.files[0]);
        }
        pdf2imgFileInput.value = '';
    });

    function handlePDF2ImgFile(file) {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showStatus('請上傳有效的 PDF 檔案！', 'error');
            return;
        }

        pdfFileName = file.name;
        const sizeStr = formatBytes(file.size);
        
        showStatus('正在載入 PDF 檔案...', 'loading');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                if (typeof pdfjsLib === 'undefined') {
                    throw new Error('PDF 渲染程式庫 (pdf.js) 未正確載入。');
                }

                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                loadedPdfDoc = await loadingTask.promise;

                // Update UI metadata
                pdf2imgName.textContent = pdfFileName;
                pdf2imgInfo.textContent = `檔案大小: ${sizeStr} | 總頁數: ${loadedPdfDoc.numPages} 頁`;

                // Adjust UI panels
                pdf2imgDropZone.style.display = 'none';
                pdf2imgMetaBar.style.display = 'flex';
                pdf2imgGridWrapper.style.display = 'block';

                hideStatus();
                // Render all pages
                renderPDFPages();
            } catch (err) {
                console.error(err);
                showStatus(`載入 PDF 失敗: ${err.message}`, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    async function renderPDFPages() {
        if (!loadedPdfDoc) return;

        pdf2imgPagesGrid.innerHTML = '';
        const numPages = loadedPdfDoc.numPages;
        const scale = parseFloat(pdf2imgScale.value) || 1.5;

        showStatus('正在渲染頁面預覽...', 'loading');

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            // Create UI Card
            const card = document.createElement('div');
            card.className = 'pdf-page-card';
            
            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'pdf-page-canvas-wrapper';
            
            const canvas = document.createElement('canvas');
            canvas.id = `pdf-canvas-${pageNum}`;
            canvasWrapper.appendChild(canvas);
            
            const footer = document.createElement('div');
            footer.className = 'pdf-page-footer';
            
            const pageNumText = document.createElement('span');
            pageNumText.className = 'pdf-page-number';
            pageNumText.textContent = `頁面 ${pageNum} / ${numPages}`;
            
            const dlBtn = document.createElement('button');
            dlBtn.className = 'btn success-btn';
            dlBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                下載
            `;

            footer.appendChild(pageNumText);
            footer.appendChild(dlBtn);
            
            card.appendChild(canvasWrapper);
            card.appendChild(footer);
            pdf2imgPagesGrid.appendChild(card);

            try {
                // Render pdf page to canvas
                const page = await loadedPdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: scale });
                
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                const ctx = canvas.getContext('2d');
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;

                // Bind single page download
                dlBtn.addEventListener('click', () => {
                    const format = pdf2imgFormat.value;
                    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
                    const dataUrl = canvas.toDataURL(format, 0.9);
                    
                    const a = document.createElement('a');
                    a.href = dataUrl;
                    a.download = `${pdfFileName.replace(/\.[^/.]+$/, "")}_page_${pageNum}.${ext}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                });
            } catch (e) {
                console.error(`Page ${pageNum} render error:`, e);
            }
        }
        
        hideStatus();
    }

    // Event listeners
    pdf2imgScale.addEventListener('change', renderPDFPages);
    
    pdf2imgDownloadAllBtn.addEventListener('click', async () => {
        if (!loadedPdfDoc) return;
        
        const numPages = loadedPdfDoc.numPages;
        const format = pdf2imgFormat.value;
        const ext = format === 'image/jpeg' ? 'jpg' : 'png';
        
        showStatus('正在批量下載頁面圖片...', 'loading');
        pdf2imgDownloadAllBtn.disabled = true;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const canvas = document.getElementById(`pdf-canvas-${pageNum}`);
            if (canvas) {
                const dataUrl = canvas.toDataURL(format, 0.9);
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = `${pdfFileName.replace(/\.[^/.]+$/, "")}_page_${pageNum}.${ext}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // 350ms delay to prevent browser block or download collision
                await new Promise(resolve => setTimeout(resolve, 350));
            }
        }

        pdf2imgDownloadAllBtn.disabled = false;
        showStatus('全部頁面圖片已開始下載！', 'success');
    });

    pdf2imgCloseBtn.addEventListener('click', () => {
        loadedPdfDoc = null;
        pdfFileName = '';
        pdf2imgPagesGrid.innerHTML = '';
        
        pdf2imgDropZone.style.display = 'block';
        pdf2imgMetaBar.style.display = 'none';
        pdf2imgGridWrapper.style.display = 'none';
        hideStatus();
    });

    // ----------------------------------------------------------------
    // 8.6. 圖片指定大小壓縮功能 (Image Compressor to Specified Size)
    // ----------------------------------------------------------------
    const compressDropZone = document.getElementById('compress-drop-zone');
    const compressFileInput = document.getElementById('compress-file-input');
    const compressSize = document.getElementById('compress-size');
    const compressFormat = document.getElementById('compress-format');
    const compressStartBtn = document.getElementById('compress-start-btn');
    const compressListContainer = document.getElementById('compress-list-container');
    const compressFileList = document.getElementById('compress-file-list');
    const compressClearBtn = document.getElementById('compress-clear-btn');
    const compressDownloadAllBtn = document.getElementById('compress-download-all-btn');

    let compressFiles = [];

    // Drag and Drop
    compressDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        compressDropZone.classList.add('dragover');
    });
    compressDropZone.addEventListener('dragleave', () => {
        compressDropZone.classList.remove('dragover');
    });
    compressDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        compressDropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleCompressFiles(e.dataTransfer.files);
        }
    });

    // File Selector
    compressDropZone.addEventListener('click', (e) => {
        if (!e.target.classList.contains('primary-btn') && e.target.tagName !== 'BUTTON') {
            compressFileInput.click();
        }
    });
    compressDropZone.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        compressFileInput.click();
    });
    compressFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleCompressFiles(e.target.files);
        }
        compressFileInput.value = '';
    });

    function handleCompressFiles(files) {
        const filtered = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (filtered.length === 0) {
            showStatus('請上傳有效的圖片檔案！', 'error');
            return;
        }

        showStatus('載入圖片中...', 'loading');
        let loadedCount = 0;

        filtered.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    compressFiles.push({
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
                        compressedSize: 0,
                        quality: 1.0,
                        scale: 1.0,
                        compressedURL: ''
                    });

                    loadedCount++;
                    if (loadedCount === filtered.length) {
                        hideStatus();
                        compressDropZone.style.display = 'none';
                        compressListContainer.style.display = 'block';
                        renderCompressList();
                        updateStartBtnState();
                        updateDownloadAllBtnState();
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function renderCompressList() {
        compressFileList.innerHTML = '';
        compressFiles.forEach(item => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.setAttribute('data-id', item.id);
            
            let sizeMetaText = '';
            if (item.compressedBlob) {
                const reductionPercent = Math.round((1 - (item.compressedBlob.size / item.origSize)) * 100);
                sizeMetaText = ` ➔ <span style="color:var(--color-success); font-weight:600;">${formatBytes(item.compressedBlob.size)}</span> (-${reductionPercent}%)`;
            }

            let badgeStyle = 'color: var(--text-secondary);';
            if (item.status === 'success') {
                badgeStyle = 'color: #34d399;';
            } else if (item.status === 'best_effort') {
                badgeStyle = 'color: #fbbf24;';
            } else if (item.status === 'compressing') {
                badgeStyle = 'color: #60a5fa;';
            } else if (item.status === 'failed') {
                badgeStyle = 'color: #f87171;';
            }

            li.innerHTML = `
                <div class="item-thumbnail">
                    <img src="${item.previewSrc}" alt="${item.name}">
                </div>
                <div class="file-info">
                    <div class="file-name" title="${item.name}">${item.name}</div>
                    <div class="file-meta">
                        原始: ${item.origSizeStr}${sizeMetaText}
                        <div class="compress-details" style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                            ${item.compressedBlob ? `品質: ${Math.round(item.quality * 100)}% | 尺寸: ${Math.round(item.imgElement.naturalWidth * item.scale)}x${Math.round(item.imgElement.naturalHeight * item.scale)} (${Math.round(item.scale * 100)}%)` : ''}
                        </div>
                    </div>
                </div>
                <div class="file-actions" style="align-items: center; gap: 10px;">
                    <span class="status-badge" style="font-size:0.85rem; font-weight:600; ${badgeStyle}">${item.statusText}</span>
                    <button class="btn success-btn download-single-btn" ${item.compressedBlob ? '' : 'disabled'} style="padding: 6px 12px; font-size: 0.85rem; height: 34px;">
                        下載
                    </button>
                    <button class="icon-btn delete-btn" aria-label="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `;

            // Individual Download Button
            const dlBtn = li.querySelector('.download-single-btn');
            if (item.compressedBlob) {
                dlBtn.addEventListener('click', () => {
                    const a = document.createElement('a');
                    a.href = item.compressedURL;
                    a.download = `${item.name.replace(/\.[^/.]+$/, "")}_compressed.${item.ext}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                });
            }

            // Delete Button
            li.querySelector('.delete-btn').addEventListener('click', () => {
                if (item.compressedURL) {
                    URL.revokeObjectURL(item.compressedURL);
                }
                compressFiles = compressFiles.filter(f => f.id !== item.id);
                if (compressFiles.length === 0) {
                    resetCompressUI();
                } else {
                    renderCompressList();
                    updateStartBtnState();
                    updateDownloadAllBtnState();
                }
            });

            compressFileList.appendChild(li);
        });
    }

    function resetCompressUI() {
        compressFiles.forEach(item => {
            if (item.compressedURL) {
                URL.revokeObjectURL(item.compressedURL);
            }
        });
        compressFiles = [];
        compressDropZone.style.display = 'block';
        compressListContainer.style.display = 'none';
        compressStartBtn.disabled = true;
        compressDownloadAllBtn.disabled = true;
        hideStatus();
    }

    function updateStartBtnState() {
        compressStartBtn.disabled = compressFiles.length === 0;
    }

    function updateDownloadAllBtnState() {
        const hasCompressed = compressFiles.some(f => f.compressedBlob !== null);
        compressDownloadAllBtn.disabled = !hasCompressed;
    }

    function canvasToBlob(canvas, format, quality) {
        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), format, quality);
        });
    }

    async function compressSingleFile(item, targetLimitBytes, format, ext) {
        item.status = 'compressing';
        item.statusText = '壓縮中...';
        renderCompressList();

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

            for (let iter = 0; iter < 7; iter++) {
                const midQ = (lowQ + highQ) / 2;
                const blob = await canvasToBlob(canvas, format, midQ);

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
            bestBlob = await canvasToBlob(canvas, format, 0.05);
            bestQuality = 0.05;
        }

        if (item.compressedURL) {
            URL.revokeObjectURL(item.compressedURL);
        }

        item.compressedBlob = bestBlob;
        item.quality = bestQuality;
        item.scale = bestScale;
        item.ext = ext;
        item.compressedURL = URL.createObjectURL(bestBlob);

        if (bestBlob.size <= targetLimitBytes) {
            item.status = 'success';
            item.statusText = '成功';
        } else {
            item.status = 'best_effort';
            item.statusText = '已盡力';
        }
    }

    compressStartBtn.addEventListener('click', async () => {
        if (compressFiles.length === 0) return;

        const targetLimitKB = parseFloat(compressSize.value);
        if (isNaN(targetLimitKB) || targetLimitKB <= 0) {
            showStatus('請輸入有效的目標檔案大小！', 'error');
            return;
        }

        const targetLimitBytes = targetLimitKB * 1024;
        const format = compressFormat.value;
        const ext = format === 'image/jpeg' ? 'jpg' : 'webp';

        showStatus('正在批量壓縮圖片...', 'loading');
        compressStartBtn.disabled = true;

        for (const item of compressFiles) {
            try {
                await compressSingleFile(item, targetLimitBytes, format, ext);
            } catch (err) {
                console.error(err);
                item.status = 'failed';
                item.statusText = '失敗';
            }
            renderCompressList();
        }

        compressStartBtn.disabled = false;
        updateDownloadAllBtnState();
        showStatus('圖片批量壓縮完成！', 'success');
        setTimeout(hideStatus, 2000);
    });

    const disableDownloadOnSettingsChange = () => {
        if (compressFiles.length > 0) {
            compressFiles.forEach(item => {
                if (item.compressedURL) {
                    URL.revokeObjectURL(item.compressedURL);
                }
                item.compressedBlob = null;
                item.status = 'pending';
                item.statusText = '設定已變更，請重新壓縮';
            });
            renderCompressList();
            updateDownloadAllBtnState();
        }
    };
    compressSize.addEventListener('input', disableDownloadOnSettingsChange);
    compressFormat.addEventListener('change', disableDownloadOnSettingsChange);

    compressClearBtn.addEventListener('click', () => {
        resetCompressUI();
        showStatus('已清空圖片列表。', 'info');
        setTimeout(hideStatus, 2000);
    });

    compressDownloadAllBtn.addEventListener('click', async () => {
        const filesToDownload = compressFiles.filter(f => f.compressedBlob !== null);
        if (filesToDownload.length === 0) return;

        showStatus('正在批量下載圖片...', 'loading');
        compressDownloadAllBtn.disabled = true;

        for (const item of filesToDownload) {
            const a = document.createElement('a');
            a.href = item.compressedURL;
            a.download = `${item.name.replace(/\.[^/.]+$/, "")}_compressed.${item.ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            await new Promise(resolve => setTimeout(resolve, 350));
        }

        compressDownloadAllBtn.disabled = false;
        showStatus('全部圖片已開始下載！', 'success');
        setTimeout(hideStatus, 2000);
    });

    // ----------------------------------------------------------------
    // 9. 輔助函式
    // ----------------------------------------------------------------
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // ----------------------------------------------------------------
    // 10. 文字轉換工具 (OpenCC)
    // ----------------------------------------------------------------
    const textConvertInput = document.getElementById('text-convert-input');
    const textConvertOutput = document.getElementById('text-convert-output');
    const btnS2T = document.getElementById('btn-s2t');
    const btnT2S = document.getElementById('btn-t2s');
    const btnCopyText = document.getElementById('btn-copy-text');

    let converterS2T = null;
    let converterT2S = null;

    if (typeof OpenCC !== 'undefined') {
        converterS2T = OpenCC.Converter({ from: 'cn', to: 'tw' });
        converterT2S = OpenCC.Converter({ from: 'tw', to: 'cn' });
    } else {
        console.warn("OpenCC library not found. Text conversion will not work.");
    }

    if (btnS2T) {
        btnS2T.addEventListener('click', () => {
            if (!converterS2T) {
                showStatus('OpenCC 尚未載入，請重新整理頁面', 'error');
                return;
            }
            const text = textConvertInput.value;
            if (!text.trim()) return;
            textConvertOutput.value = converterS2T(text);
            showStatus('已轉換為繁體', 'success');
            setTimeout(hideStatus, 2000);
        });
    }

    if (btnT2S) {
        btnT2S.addEventListener('click', () => {
            if (!converterT2S) {
                showStatus('OpenCC 尚未載入，請重新整理頁面', 'error');
                return;
            }
            const text = textConvertInput.value;
            if (!text.trim()) return;
            textConvertOutput.value = converterT2S(text);
            showStatus('已轉換為簡體', 'success');
            setTimeout(hideStatus, 2000);
        });
    }

    if (btnCopyText) {
        btnCopyText.addEventListener('click', () => {
            if (!textConvertOutput.value) return;
            navigator.clipboard.writeText(textConvertOutput.value).then(() => {
                showStatus('已複製到剪貼簿', 'success');
                setTimeout(hideStatus, 2000);
            }).catch(err => {
                showStatus('複製失敗', 'error');
                console.error(err);
            });
        });
    }
});
