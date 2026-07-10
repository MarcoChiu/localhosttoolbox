import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

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
    <p>我們 understand 您的資料隱私性至關重要，因此我們設計的工具具備以下特性：</p>
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
    const highlighted = highlightJS(fields.codeText || '');
    return `<div class="mock-window">
    <div class="window-header">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="window-title">${escapeHtml(fields.filename || '')}</span>
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
    <div class="stars">${escapeHtml(fields.stars || '')}</div>
    <p class="quote">"${escapeHtml(fields.quote || '')}"</p>
    <div class="user-profile">
        <div class="avatar">${escapeHtml(fields.avatar || '')}</div>
        <div class="details">
            <h4 class="name">${escapeHtml(fields.name || '')}</h4>
            <p class="role">${escapeHtml(fields.role || '')}</p>
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
    const tagHTML = (fields.tags || '')
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
      .join('\n');
    return `<div class="profile-card">
    <div class="profile-avatar">${escapeHtml(fields.emoji || '')}</div>
    <h2 class="profile-name">${escapeHtml(fields.name || '')}</h2>
    <p class="profile-title">${escapeHtml(fields.role || '')}</p>
    <p class="profile-bio">${escapeHtml(fields.bio || '')}</p>
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
    <h1>${escapeHtml(fields.title || '')}</h1>
    <div class="divider"></div>
    <p>${escapeHtml(fields.bodyText || '')}</p>
    <ul>
        <li>${escapeHtml(fields.li1 || '')}</li>
        <li>${escapeHtml(fields.li2 || '')}</li>
        <li>${escapeHtml(fields.li3 || '')}</li>
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

function HtmlToImage({ showStatus, hideStatus }) {
  const [preset, setPreset] = useState('code-card');
  const [editorMode, setEditorMode] = useState('visual'); // visual, code
  const [htmlCode, setHtmlCode] = useState('');
  
  // Custom Visual Fields Values
  const [fieldValues, setFieldValues] = useState({});

  // Design Settings
  const [width, setWidth] = useState(600);
  const [padding, setPadding] = useState(40);
  const [radius, setRadius] = useState(16);
  const [bgSelect, setBgSelect] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');

  const renderTargetRef = useRef(null);

  // Initialize fields on preset change
  useEffect(() => {
    if (preset === 'custom') {
      setEditorMode('code');
      setHtmlCode(presets['custom']);
    } else {
      const schema = visualSchemas[preset] || [];
      const initVals = {};
      schema.forEach(field => {
        initVals[field.id] = field.default;
      });
      setFieldValues(initVals);
      setEditorMode('visual');
    }
  }, [preset]);

  // Recompile visual form values to HTML code
  useEffect(() => {
    if (preset !== 'custom') {
      const compiler = visualCompilers[preset];
      if (compiler) {
        setHtmlCode(compiler(fieldValues));
      }
    }
  }, [fieldValues, preset]);

  const handleFieldChange = (id, value) => {
    setFieldValues(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleDownload = async () => {
    if (!renderTargetRef.current) return;

    try {
      showStatus('影像產生中...', 'loading');
      
      const canvas = await html2canvas(renderTargetRef.current, {
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
      setTimeout(hideStatus, 3000);
    }
  };

  const renderVisualForm = () => {
    const fields = visualSchemas[preset] || [];
    if (preset === 'custom') {
      return (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 10px' }}>
          <p style={{ fontSize: '1rem', marginBottom: '10px' }}>✏️ 自訂 HTML 模式</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            請點擊上方「💻 原始碼編輯」來直接撰寫 HTML 與 CSS 代碼。
          </p>
        </div>
      );
    }

    return (
      <div className="visual-editor">
        {fields.map(field => (
          <div key={field.id} className="visual-field">
            <label htmlFor={`vis-field-${field.id}`}>{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea 
                id={`vis-field-${field.id}`}
                value={fieldValues[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
              />
            ) : field.type === 'select' ? (
              <select 
                id={`vis-field-${field.id}`}
                value={fieldValues[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                className="form-control"
              >
                {field.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                id={`vis-field-${field.id}`}
                value={fieldValues[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const getFinalStyle = () => {
    const style = {
      width: `${width}px`,
      padding: `${padding}px`,
      borderRadius: `${radius}px`
    };

    const hasCustomBg = htmlCode.includes('#html-render-target {') || htmlCode.includes('#html-render-target{');
    if (!hasCustomBg) {
      style.background = bgSelect;
    }
    return style;
  };

  return (
    <div className="html-editor-container">
      {/* Left: Code input & presets */}
      <div className="editor-left">
        <div className="preset-selector">
          <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>樣式模板：</span>
          <select value={preset} onChange={(e) => setPreset(e.target.value)} className="form-control" style={{ flex: 1 }}>
            <option value="code-card">💻 精美程式碼卡片 Presets</option>
            <option value="review-card">⭐ 顧客好評反饋卡片</option>
            <option value="profile-card">👤 個人社交簡介卡片</option>
            <option value="markdown-doc">📄 簡約 Markdown 渲染文件</option>
            <option value="custom">✏️ 自訂 HTML / CSS</option>
          </select>
        </div>

        {/* Toggle visual or raw code editing */}
        <div className="editor-mode-toggle">
          <button 
            className={`mode-toggle-btn ${editorMode === 'visual' ? 'active' : ''}`} 
            onClick={() => setEditorMode('visual')}
            disabled={preset === 'custom'}
            type="button"
          >
            📝 簡易填表編輯
          </button>
          <button 
            className={`mode-toggle-btn ${editorMode === 'code' ? 'active' : ''}`} 
            onClick={() => setEditorMode('code')}
            type="button"
          >
            💻 原始碼編輯
          </button>
        </div>

        {/* Form View / Code View */}
        {editorMode === 'visual' ? renderVisualForm() : (
          <textarea 
            value={htmlCode} 
            onChange={(e) => setHtmlCode(e.target.value)} 
            className="editor-textarea" 
            placeholder="在此輸入 HTML / CSS 代碼..."
          />
        )}
      </div>

      {/* Right: Live view & Style settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minWidth: 0 }}>
        <div className="settings-sidebar" style={{ width: '100%' }}>
          <div className="settings-title">樣式設定</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="settings-group" style={{ marginBottom: 0 }}>
              <label>卡片寬度 (Width) <span className="value">{width}px</span></label>
              <input type="range" min="350" max="950" value={width} onChange={(e) => setWidth(parseInt(e.target.value))} />
            </div>
            <div className="settings-group" style={{ marginBottom: 0 }}>
              <label>內邊距 (Padding) <span className="value">{padding}px</span></label>
              <input type="range" min="10" max="100" value={padding} onChange={(e) => setPadding(parseInt(e.target.value))} />
            </div>
            <div className="settings-group" style={{ marginBottom: 0 }}>
              <label>圓角 (Radius) <span className="value">{radius}px</span></label>
              <input type="range" min="0" max="40" value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} />
            </div>
            <div className="settings-group" style={{ marginBottom: 0 }}>
              <label>背景漸層預設</label>
              <select value={bgSelect} onChange={(e) => setBgSelect(e.target.value)} className="form-control">
                <option value="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">紫羅蘭幻境</option>
                <option value="linear-gradient(135deg, #15365d 0%, #1e293b 100%)">經典科技藍</option>
                <option value="linear-gradient(135deg, #f6d365 0%, #fda085 100%)">溫暖晨曦橘</option>
                <option value="linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)">清爽薄荷綠</option>
                <option value="linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)">夢幻櫻花粉</option>
                <option value="#ffffff">純白背景</option>
              </select>
            </div>
          </div>
        </div>

        {/* Render pane */}
        <div className="render-pane-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
          <div 
            id="html-render-target" 
            ref={renderTargetRef}
            style={getFinalStyle()}
            dangerouslySetInnerHTML={{ __html: htmlCode }}
          />
        </div>

        {/* Download Actions */}
        <div className="action-bar">
          <button onClick={handleDownload} className="btn success-btn" style={{ flex: 1 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            轉圖片並下載 (PNG)
          </button>
        </div>
      </div>
    </div>
  );
}

export default HtmlToImage;
