// Image to PDF Conversion Module

function initImgToPdf() {
    const dropZone = document.getElementById('img2pdf-drop-zone');
    const fileInput = document.getElementById('img2pdf-file-input');
    const previewContainer = document.getElementById('img2pdf-preview-container');
    const sortableGrid = document.getElementById('img2pdf-sortable-grid');
    const generateBtn = document.getElementById('img2pdf-generate-btn');
    const orientationSelect = document.getElementById('img2pdf-orientation');
    const pageSizeSelect = document.getElementById('img2pdf-pagesize');
    
    let imageFiles = [];

    // Utility: Format bytes
    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Handle files
    function handleFiles(files) {
        const validFiles = Array.from(files).filter(f => f.type === 'image/jpeg' || f.type === 'image/png');
        if (validFiles.length === 0) return;

        validFiles.forEach(file => {
            // Generate unique ID
            const id = 'img_' + Math.random().toString(36).substr(2, 9);
            imageFiles.push({ id, file });
        });

        renderGrid();
    }

    function renderGrid() {
        sortableGrid.innerHTML = '';
        
        if (imageFiles.length === 0) {
            previewContainer.style.display = 'none';
            generateBtn.disabled = true;
            return;
        }

        previewContainer.style.display = 'block';
        generateBtn.disabled = false;

        imageFiles.forEach((item) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-card';
            wrapper.setAttribute('data-id', item.id);
            wrapper.style.cssText = 'position: relative; border-radius: 8px; overflow: hidden; background: rgba(255,255,255,0.05); border: 1px solid var(--item-border); cursor: grab; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;';
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(item.file);
            img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain; pointer-events: none;';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            deleteBtn.className = 'icon-btn';
            deleteBtn.style.cssText = 'position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; padding: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;';
            
            deleteBtn.addEventListener('mouseover', () => deleteBtn.style.background = 'rgba(239, 68, 68, 0.8)');
            deleteBtn.addEventListener('mouseout', () => deleteBtn.style.background = 'rgba(0,0,0,0.6)');
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                imageFiles = imageFiles.filter(f => f.id !== item.id);
                renderGrid();
            });

            const badge = document.createElement('div');
            badge.innerText = formatBytes(item.file.size);
            badge.style.cssText = 'position: absolute; bottom: 5px; left: 5px; background: rgba(0,0,0,0.6); color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; pointer-events: none;';

            wrapper.appendChild(img);
            wrapper.appendChild(deleteBtn);
            wrapper.appendChild(badge);
            sortableGrid.appendChild(wrapper);
        });

        // Init Sortable
        if (typeof Sortable !== 'undefined') {
            const oldSortable = Sortable.get(sortableGrid);
            if (oldSortable) {
                oldSortable.destroy();
            }
            new Sortable(sortableGrid, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: (evt) => {
                    const reordered = [];
                    sortableGrid.querySelectorAll('.image-card').forEach(el => {
                        const id = el.getAttribute('data-id');
                        const fileObj = imageFiles.find(f => f.id === id);
                        if (fileObj) reordered.push(fileObj);
                    });
                    imageFiles = reordered;
                }
            });
        }
    }

    // Drag and Drop Events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        fileInput.value = ''; // Reset
    });

    // Generate PDF
    generateBtn.addEventListener('click', async () => {
        if (imageFiles.length === 0) return;
        
        try {
            window.showStatus('PDF 生成中，請稍候...', 'loading');
            generateBtn.disabled = true;

            const { PDFDocument } = PDFLib;
            const pdfDoc = await PDFDocument.create();

            const orientation = orientationSelect.value; // auto, portrait, landscape
            const pageSizeMode = pageSizeSelect.value; // fit, a4

            // A4 dimensions in points (72 points per inch) -> 595.28 x 841.89
            const A4_WIDTH = 595.28;
            const A4_HEIGHT = 841.89;

            for (const item of imageFiles) {
                const arrayBuffer = await item.file.arrayBuffer();
                let image;
                if (item.file.type === 'image/jpeg') {
                    image = await pdfDoc.embedJpg(arrayBuffer);
                } else if (item.file.type === 'image/png') {
                    image = await pdfDoc.embedPng(arrayBuffer);
                } else {
                    continue; // Should not happen due to filtering
                }

                const imgDims = image.scale(1);
                let imgWidth = imgDims.width;
                let imgHeight = imgDims.height;

                let pageWidth, pageHeight;

                if (pageSizeMode === 'fit') {
                    // Match image dimensions exactly
                    pageWidth = imgWidth;
                    pageHeight = imgHeight;
                    
                    // Optional: force orientation if not 'auto'
                    if (orientation === 'portrait' && pageWidth > pageHeight) {
                        // Landscape image in Portrait container using 'fit' logic
                        // If they specifically requested portrait but the image is landscape, 
                        // should we rotate? Or just use portrait A4 instead?
                        // Usually 'fit' means ignore orientation. But we can swap if they enforce.
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

                if (pageSizeMode === 'fit') {
                    // Draw full page (need to handle if orientation forced rotation)
                    // If dimensions swapped due to orientation override, we should rotate the image.
                    // For simplicity, let's just scale it to fit if dims were swapped.
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
                    // A4 Mode: Scale image to fit within A4, with some margin
                    const margin = 20; // 20 points margin
                    const availableWidth = pageWidth - margin * 2;
                    const availableHeight = pageHeight - margin * 2;

                    const scaleFactor = Math.min(
                        availableWidth / imgWidth,
                        availableHeight / imgHeight,
                        1 // Do not upscale if image is smaller than A4
                    );

                    const finalWidth = imgWidth * scaleFactor;
                    const finalHeight = imgHeight * scaleFactor;

                    // Center the image
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

            window.showStatus('PDF 生成成功！', 'success');
            setTimeout(window.hideStatus, 3000);

        } catch (error) {
            console.error(error);
            window.showStatus('生成 PDF 時發生錯誤。', 'error');
            setTimeout(window.hideStatus, 3000);
        } finally {
            generateBtn.disabled = false;
        }
    });
}

// Make sure it runs if loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImgToPdf);
} else {
    initImgToPdf();
}
