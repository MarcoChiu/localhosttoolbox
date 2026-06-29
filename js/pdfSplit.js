// PDF Split and Reorder Module

function initPdfSplit() {
    const dropZone = document.getElementById('pdf-split-drop-zone');
    const fileInput = document.getElementById('pdf-split-file-input');
    const gridWrapper = document.getElementById('pdf-split-grid-wrapper');
    const pagesGrid = document.getElementById('pdf-split-pages-grid');
    const sidebar = document.getElementById('pdf-split-sidebar');
    const selectedList = document.getElementById('pdf-split-selected-list');
    
    const fileNameEl = document.getElementById('pdf-split-name');
    const fileInfoEl = document.getElementById('pdf-split-info');
    const selectedCountEl = document.getElementById('pdf-split-selected-count');
    
    const selectAllBtn = document.getElementById('pdf-split-select-all-btn');
    const deselectAllBtn = document.getElementById('pdf-split-deselect-all-btn');
    const mergeBtn = document.getElementById('pdf-split-merge-btn');

    let currentPdfFile = null;
    let currentPdfBytes = null;
    let totalPages = 0;
    
    // Array of objects: { id, pageIndex (0-based), rotation (0, 90, 180, 270), imgSrc }
    let selectedPages = [];

    // Utility: Generate unique ID
    function uuid() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Drag & Drop
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
        
        window.showStatus('解析 PDF 中...', 'loading');
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            currentPdfBytes = arrayBuffer;
            
            // Load with PDF.js for rendering thumbnails
            const pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            totalPages = pdfjsDoc.numPages;
            fileInfoEl.textContent = `頁數: ${totalPages} 頁`;

            dropZone.style.display = 'none';
            gridWrapper.style.display = 'block';
            sidebar.style.display = 'block';
            
            // Fix layout container classes (toggle right sidebar layout)
            const parentLayout = gridWrapper.closest('.tool-layout, .tool-layout-reversed');
            if (parentLayout) {
                parentLayout.className = 'tool-layout-reversed';
            }

            pagesGrid.innerHTML = '';
            selectedPages = [];
            updateSidebar();

            // Render all pages as thumbnails
            for (let i = 1; i <= totalPages; i++) {
                const page = await pdfjsDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.5 }); // Low res for thumbnails
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                const imgSrc = canvas.toDataURL('image/jpeg', 0.8);

                const card = document.createElement('div');
                card.className = 'pdf-page-card';
                card.style.cssText = 'position: relative; border: 1px solid var(--item-border); border-radius: 8px; overflow: hidden; cursor: pointer; background: white;';
                card.innerHTML = `
                    <div class="page-number" style="position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.6); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; z-index: 2;">${i}</div>
                    <img src="${imgSrc}" style="width: 100%; display: block;">
                    <div class="selection-overlay" style="position: absolute; inset: 0; background: rgba(99, 102, 241, 0.3); border: 3px solid var(--color-primary-light); display: none; z-index: 1;"></div>
                `;

                // Single click to add to selection list
                card.addEventListener('click', () => {
                    addPageToSelection(i - 1, imgSrc);
                    
                    // Visual feedback
                    const overlay = card.querySelector('.selection-overlay');
                    overlay.style.display = 'block';
                    setTimeout(() => overlay.style.display = 'none', 150);
                });

                pagesGrid.appendChild(card);
            }
            window.hideStatus();

        } catch (err) {
            console.error(err);
            window.showStatus('讀取 PDF 失敗', 'error');
            setTimeout(window.hideStatus, 2000);
        }
    }

    function addPageToSelection(pageIndex, imgSrc) {
        selectedPages.push({
            id: uuid(),
            pageIndex: pageIndex,
            rotation: 0,
            imgSrc: imgSrc
        });
        updateSidebar();
    }

    function updateSidebar() {
        selectedList.innerHTML = '';
        selectedCountEl.textContent = `已選取: ${selectedPages.length} 頁`;
        mergeBtn.disabled = selectedPages.length === 0;

        selectedPages.forEach((item) => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.setAttribute('data-id', item.id);
            li.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2);';
            
            li.innerHTML = `
                <div class="drag-handle" style="cursor: grab; color: var(--text-secondary);">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="12" x2="15" y2="12"></line><line x1="9" y1="16" x2="15" y2="16"></line><line x1="9" y1="8" x2="15" y2="8"></line></svg>
                </div>
                <div style="width: 40px; height: 50px; background: white; border-radius: 4px; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                    <img src="${item.imgSrc}" class="item-thumb-img" style="max-width: 100%; max-height: 100%; object-fit: contain; transform: rotate(${item.rotation}deg); transition: transform 0.2s;">
                </div>
                <div style="flex: 1; font-size: 0.9rem;">
                    第 ${item.pageIndex + 1} 頁
                </div>
                <div style="display: flex; gap: 5px;">
                    <button class="icon-btn rotate-btn" title="旋轉 90度" style="background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 4px; padding: 5px; cursor: pointer;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path></svg>
                    </button>
                    <button class="icon-btn delete-btn" title="刪除" style="background: rgba(239, 68, 68, 0.2); border: none; color: #ef4444; border-radius: 4px; padding: 5px; cursor: pointer;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `;

            // Delete
            li.querySelector('.delete-btn').addEventListener('click', () => {
                selectedPages = selectedPages.filter(p => p.id !== item.id);
                updateSidebar();
            });

            // Rotate
            li.querySelector('.rotate-btn').addEventListener('click', () => {
                item.rotation = (item.rotation + 90) % 360;
                li.querySelector('.item-thumb-img').style.transform = `rotate(${item.rotation}deg)`;
            });

            selectedList.appendChild(li);
        });

        // Initialize Sortable
        if (typeof Sortable !== 'undefined') {
            const oldSortable = Sortable.get(selectedList);
            if (oldSortable) oldSortable.destroy();
            
            new Sortable(selectedList, {
                handle: '.drag-handle',
                animation: 150,
                onEnd: () => {
                    const reordered = [];
                    selectedList.querySelectorAll('.file-item').forEach(el => {
                        const id = el.getAttribute('data-id');
                        const obj = selectedPages.find(p => p.id === id);
                        if (obj) reordered.push(obj);
                    });
                    selectedPages = reordered;
                }
            });
        }
    }

    selectAllBtn.addEventListener('click', () => {
        const cards = pagesGrid.querySelectorAll('.pdf-page-card img');
        cards.forEach((img, i) => addPageToSelection(i, img.src));
    });

    deselectAllBtn.addEventListener('click', () => {
        selectedPages = [];
        updateSidebar();
    });

    // Merge & Export
    mergeBtn.addEventListener('click', async () => {
        if (selectedPages.length === 0 || !currentPdfBytes) return;

        try {
            window.showStatus('匯出 PDF 中...', 'loading');
            mergeBtn.disabled = true;

            const { PDFDocument, degrees } = PDFLib;
            const srcDoc = await PDFDocument.load(currentPdfBytes);
            const newDoc = await PDFDocument.create();

            for (const item of selectedPages) {
                // copyPages takes an array of 0-based indices
                const [copiedPage] = await newDoc.copyPages(srcDoc, [item.pageIndex]);
                
                // Apply rotation
                if (item.rotation !== 0) {
                    const currentRotation = copiedPage.getRotation().angle;
                    copiedPage.setRotation(degrees(currentRotation + item.rotation));
                }
                
                newDoc.addPage(copiedPage);
            }

            const pdfBytes = await newDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `exported_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            window.showStatus('匯出成功！', 'success');
            setTimeout(window.hideStatus, 3000);
        } catch (err) {
            console.error(err);
            window.showStatus('匯出失敗', 'error');
            setTimeout(window.hideStatus, 3000);
        } finally {
            mergeBtn.disabled = false;
        }
    });
}

// Make sure it runs if loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPdfSplit);
} else {
    initPdfSplit();
}
