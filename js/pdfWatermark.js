// PDF Watermark and Page Number Module

function initPdfWatermark() {
    const dropZone = document.getElementById('watermark-drop-zone');
    const fileInput = document.getElementById('watermark-file-input');
    const previewContainer = document.getElementById('watermark-preview-container');
    const fileNameEl = document.getElementById('watermark-pdf-name');
    const closeBtn = document.getElementById('watermark-close-btn');
    
    const generateBtn = document.getElementById('watermark-generate-btn');
    const watermarkText = document.getElementById('watermark-text');
    const watermarkColorHex = document.getElementById('watermark-color-hex');
    const watermarkColorPicker = document.getElementById('watermark-color');
    const watermarkOpacity = document.getElementById('watermark-opacity');
    const addPageNumbers = document.getElementById('add-page-numbers');

    let currentPdfFile = null;
    let currentPdfBytes = null;

    // Color sync
    watermarkColorPicker.addEventListener('input', () => {
        watermarkColorHex.value = watermarkColorPicker.value;
    });
    watermarkColorHex.addEventListener('input', () => {
        let hex = watermarkColorHex.value;
        if (!hex.startsWith('#')) hex = '#' + hex;
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            watermarkColorPicker.value = hex;
        }
    });

    // Handle files
    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFile(e.dataTransfer.files[0]);
    });
    dropZone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') fileInput.click();
    });
    dropZone.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    fileInput.addEventListener('change', e => {
        handleFile(e.target.files[0]);
        fileInput.value = '';
    });

    async function handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            window.showStatus('請上傳有效的 PDF 檔案', 'error');
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

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
    }

    // Generate PDF
    generateBtn.addEventListener('click', async () => {
        if (!currentPdfBytes) return;
        
        const text = watermarkText.value.trim();
        const doPageNums = addPageNumbers.checked;
        
        if (!text && !doPageNums) {
            window.showStatus('請輸入浮水印文字或勾選添加頁碼！', 'error');
            setTimeout(window.hideStatus, 2000);
            return;
        }

        try {
            window.showStatus('處理 PDF 中...', 'loading');
            generateBtn.disabled = true;

            const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;
            const pdfDoc = await PDFDocument.load(currentPdfBytes);

            // Important: StandardFonts does NOT support Chinese characters out of the box in pdf-lib!
            // Wait, this is a local tool for Traditional Chinese users. 
            // If they type Chinese in watermark, Helvetica will crash or show empty boxes.
            // But we don't have a built-in CJK font in pdf-lib. 
            // We have to use @pdf-lib/fontkit if we want to load a custom TTF font.
            // For now, if we don't have a CJK font locally, PDFLib standard fonts will fail for Chinese.
            // As a workaround, we'll try Helvetica. If they use English, it works.
            // BUT wait! I can draw it onto a Canvas and embed the Canvas as an Image!
            // This is a brilliant trick for full CJK support without fontkit!
            
            let watermarkImage = null;
            let watermarkDims = null;
            const opacity = parseFloat(watermarkOpacity.value) || 0.3;

            if (text) {
                // Create a canvas for watermark text to support ANY language natively via browser
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.font = 'bold 80px sans-serif';
                const metrics = ctx.measureText(text);
                
                canvas.width = metrics.width + 40;
                canvas.height = 100;
                
                // Redraw with proper sizing
                ctx.font = 'bold 80px sans-serif';
                ctx.fillStyle = watermarkColorPicker.value;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, canvas.width / 2, canvas.height / 2);
                
                const imgDataUrl = canvas.toDataURL('image/png');
                watermarkImage = await pdfDoc.embedPng(imgDataUrl);
                watermarkDims = watermarkImage.scale(1);
            }

            const pages = pdfDoc.getPages();
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            
            const pagesCount = pages.length;

            for (let i = 0; i < pagesCount; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();

                // Draw Watermark Image
                if (watermarkImage) {
                    // Calculate diagonal angle
                    const angle = Math.atan(height / width);
                    
                    page.drawImage(watermarkImage, {
                        x: width / 2 - (watermarkDims.width / 2),
                        y: height / 2 - (watermarkDims.height / 2),
                        width: watermarkDims.width,
                        height: watermarkDims.height,
                        opacity: opacity,
                        rotate: degrees(angle * (180 / Math.PI))
                    });
                }

                // Draw Page Numbers
                if (doPageNums) {
                    const pageText = `${i + 1} / ${pagesCount}`;
                    const textSize = 12;
                    const textWidth = helveticaFont.widthOfTextAtSize(pageText, textSize);
                    
                    page.drawText(pageText, {
                        x: width / 2 - textWidth / 2,
                        y: 20, // 20 units from bottom
                        size: textSize,
                        font: helveticaFont,
                        color: rgb(0, 0, 0)
                    });
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `watermarked_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            window.showStatus('處理成功！', 'success');
            setTimeout(window.hideStatus, 3000);

        } catch (error) {
            console.error(error);
            window.showStatus('處理 PDF 時發生錯誤。', 'error');
            setTimeout(window.hideStatus, 3000);
        } finally {
            generateBtn.disabled = false;
        }
    });
}

// Make sure it runs if loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPdfWatermark);
} else {
    initPdfWatermark();
}
