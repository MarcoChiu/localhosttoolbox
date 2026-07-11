import React, { useState } from 'react';

const VIEWPORT_PRESETS = [
    { label: '手機 375', value: 375 },
    { label: '平板 768', value: 768 },
    { label: '1280', value: 1280 },
    { label: '1440', value: 1440 },
    { label: '1920', value: 1920 },
];

const WebScreenshot = () => {
    const [url, setUrl] = useState('');
    const [viewportWidth, setViewportWidth] = useState(1440);
    const [loading, setLoading] = useState(false);
    const [imgSrc, setImgSrc] = useState(null);
    const [imgSource, setImgSource] = useState('');       // 'Microlink' | 'Thum.io'
    const [isFullPage, setIsFullPage] = useState(true);  // Thum.io 只截可見區域
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('screenshot.png');

    const normalizeUrl = (raw) => {
        const trimmed = raw.trim();
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        return 'https://' + trimmed;
    };

    const buildFileName = (targetUrl) => {
        try {
            const host = new URL(targetUrl).hostname.replace(/\./g, '_');
            const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
            return `screenshot_${host}_${ts}.png`;
        } catch {
            return `screenshot_${Date.now()}.png`;
        }
    };

    const tryMicrolink = async (targetUrl) => {
        const apiUrl = new URL('https://api.microlink.io');
        apiUrl.searchParams.set('url', targetUrl);
        apiUrl.searchParams.set('screenshot', 'true');
        apiUrl.searchParams.set('meta', 'false');
        apiUrl.searchParams.set('fullPage', 'true');
        apiUrl.searchParams.set('viewport.width', String(viewportWidth));
        apiUrl.searchParams.set('viewport.height', '900');

        const res = await fetch(apiUrl.toString());
        if (!res.ok) throw new Error(`Microlink 回應 ${res.status}`);

        const data = await res.json();
        if (data.status !== 'success' || !data.data?.screenshot?.url) {
            throw new Error(data.message || 'Microlink 無法取得截圖');
        }
        return { url: data.data.screenshot.url, source: 'Microlink', fullPage: true };
    };

    const tryThumio = (targetUrl) => {
        // Thum.io 使用 ?url= 格式來處理編碼後的網址，避免 400 錯誤
        const thumbUrl = `https://image.thum.io/get/width/${viewportWidth}/crop/900/?url=${encodeURIComponent(targetUrl)}`;
        return { url: thumbUrl, source: 'Thum.io', fullPage: false };
    };

    const handleScreenshot = async () => {
        if (!url.trim()) {
            setError('請輸入網址！');
            return;
        }

        const targetUrl = normalizeUrl(url);
        setUrl(targetUrl);
        setError('');
        setImgSrc(null);
        setImgSource('');
        setLoading(true);

        try {
            let result;

            // 1️⃣ 優先使用 Microlink（支援全頁截圖）
            try {
                result = await tryMicrolink(targetUrl);
            } catch (microlinkErr) {
                console.warn('Microlink 失敗，切換至 Thum.io：', microlinkErr.message);
                // 2️⃣ 自動 fallback 至 Thum.io
                result = tryThumio(targetUrl);
            }

            setImgSrc(result.url);
            setImgSource(result.source);
            setIsFullPage(result.fullPage);
            setFileName(buildFileName(targetUrl));
        } catch (err) {
            setError('所有截圖服務均失敗，請確認網址是否正確，或使用本地工具箱。');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!imgSrc) return;
        try {
            // 因為圖片是外部 URL，需先 fetch 再 blob 下載
            const res = await fetch(imgSrc);
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(objectUrl);
        } catch {
            // fallback：直接開啟新分頁
            window.open(imgSrc, '_blank');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleScreenshot();
    };

    return (
        <div className="tab-content active">
            <div className="tool-layout">
                {/* 左側設定 */}
                <div className="settings-sidebar">
                    <div className="settings-title">
                        <span className="icon">⚙️</span>
                        截圖設定
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '15px' }}>
                        {/* 視窗寬度 */}
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                                視窗寬度（px）
                            </label>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {VIEWPORT_PRESETS.map(p => (
                                    <button
                                        key={p.value}
                                        onClick={() => setViewportWidth(p.value)}
                                        style={{
                                            padding: '5px 10px', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer',
                                            background: viewportWidth === p.value ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
                                            color: viewportWidth === p.value ? '#fff' : 'var(--text-secondary)',
                                            border: viewportWidth === p.value ? '1px solid var(--color-primary)' : '1px solid var(--panel-border)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 說明卡片 */}
                        <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '10px', padding: '12px' }}>
                            <h4 style={{ color: 'var(--color-info)', margin: '0 0 6px 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>💡</span> 說明
                            </h4>
                            <ul style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0, paddingLeft: '16px', lineHeight: 1.7 }}>
                                <li>截圖在您的瀏覽器完成，<br />後端伺服器不參與</li>
                                <li>使用 Microlink 免費服務</li>
                                <li>支援截取任意公開網址</li>
                                <li>免費配額：每天 50 次</li>
                            </ul>
                        </div>

                        {/* 需要更多功能 */}
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--panel-border)', borderRadius: '10px', padding: '12px' }}>
                            <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 6px 0', fontSize: '0.82rem' }}>
                                🖥️ 需要完整長截圖？
                            </h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                                使用本地工具箱在您的電腦上直接執行 Chromium，支援完整頁面高度截圖。
                            </p>
                            <a
                                href="https://marcochiu.github.io/localhosttoolbox/"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '0.78rem', color: 'var(--color-primary-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                開啟本地工具箱
                            </a>
                        </div>
                    </div>
                </div>

                {/* 右側主面板 */}
                <div className="main-panel" style={{ flex: 1, padding: '25px', background: 'rgba(0,0,0,0.1)', borderRadius: '16px', border: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            📸 網頁截圖
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                            輸入網址即可截圖，所有處理在瀏覽器完成，不佔用伺服器資源。
                        </p>
                    </div>

                    {/* URL 輸入列 */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            id="screenshot-url-input"
                            type="text"
                            placeholder="輸入網址，例如：www.google.com"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            style={{
                                flex: 1, padding: '12px 16px', borderRadius: '10px', fontSize: '0.95rem',
                                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--panel-border)',
                                color: 'var(--text-primary)', outline: 'none',
                                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.2)'
                            }}
                        />
                        <button
                            id="screenshot-submit-btn"
                            onClick={handleScreenshot}
                            disabled={loading}
                            style={{
                                padding: '12px 24px', borderRadius: '10px', fontWeight: '600', fontSize: '0.9rem',
                                background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #818cf8, #38bdf8)',
                                color: loading ? 'var(--text-muted)' : '#fff', border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                transition: 'all 0.2s', whiteSpace: 'nowrap',
                                boxShadow: loading ? 'none' : '0 4px 15px rgba(129, 140, 248, 0.35)'
                            }}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                                    截圖中...
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                    開始截圖
                                </>
                            )}
                        </button>
                    </div>

                    {/* 載入提示 */}
                    {loading && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            color: 'var(--color-primary-light)', fontSize: '0.9rem',
                            padding: '12px 16px',
                            background: 'rgba(129, 140, 248, 0.08)',
                            borderRadius: '10px', border: '1px solid rgba(129, 140, 248, 0.2)'
                        }}>
                            <div className="spinner" style={{ width: '18px', height: '18px', flexShrink: 0 }}></div>
                            正在截圖，通常需要 5–15 秒...
                        </div>
                    )}

                    {/* 錯誤提示 */}
                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '10px', color: '#fca5a5', fontSize: '0.9rem',
                            display: 'flex', alignItems: 'flex-start', gap: '8px'
                        }}>
                            <span style={{ flexShrink: 0 }}>⚠️</span>
                            {error}
                        </div>
                    )}

                    {/* 截圖結果 */}
                    {imgSrc && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    ✅ 截圖完成
                                    <span style={{
                                        fontSize: '0.72rem', padding: '2px 8px', borderRadius: '20px',
                                        background: imgSource === 'Microlink' ? 'rgba(129,140,248,0.15)' : 'rgba(56,189,248,0.15)',
                                        color: imgSource === 'Microlink' ? '#a5b4fc' : '#7dd3fc',
                                        border: `1px solid ${imgSource === 'Microlink' ? 'rgba(129,140,248,0.3)' : 'rgba(56,189,248,0.3)'}`
                                    }}>
                                        via {imgSource}
                                    </span>
                                </span>
                                {!isFullPage && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        ⚠️ Thum.io 為可見區域截圖（非全頁），需全頁截圖請使用本地工具箱
                                    </span>
                                )}
                            </div>
                            <button
                                id="screenshot-download-btn"
                                onClick={handleDownload}
                                style={{
                                    padding: '8px 20px', borderRadius: '8px', fontWeight: '500', fontSize: '0.85rem',
                                    background: 'var(--color-success)', color: '#fff', border: 'none', cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                下載 PNG
                            </button>

                            </div>

                            {/* 預覽框 */}
                            <div style={{
                                borderRadius: '12px', overflow: 'hidden',
                                border: '1px solid var(--panel-border)',
                                maxHeight: '580px', overflowY: 'auto',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                            }}>
                                <img
                                    src={imgSrc}
                                    alt="網頁截圖預覽"
                                    style={{ width: '100%', display: 'block' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* 空白說明 */}
                    {!imgSrc && !loading && !error && (
                        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '3.5rem', marginBottom: '14px', filter: 'grayscale(0.3)' }}>📸</div>
                            <p style={{ margin: '0 0 6px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                輸入任意網址，即可截圖
                            </p>
                            <p style={{ margin: 0, fontSize: '0.8rem' }}>
                                完全在瀏覽器端執行，不消耗伺服器資源
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WebScreenshot;
