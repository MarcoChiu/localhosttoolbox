import React, { useState, useEffect } from 'react';
import * as OpenCC from 'opencc-js';

function TextConverter({ showStatus, hideStatus }) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');

  const [converterS2T, setConverterS2T] = useState(null);
  const [converterT2S, setConverterT2S] = useState(null);

  useEffect(() => {
    try {
      const s2t = OpenCC.Converter({ from: 'cn', to: 'tw' });
      const t2s = OpenCC.Converter({ from: 'tw', to: 'cn' });
      setConverterS2T(() => s2t);
      setConverterT2S(() => t2s);
    } catch (e) {
      console.error('Failed to initialize OpenCC:', e);
    }
  }, []);

  const handleS2T = () => {
    if (!converterS2T) {
      showStatus('OpenCC 轉換器尚未載入', 'error');
      setTimeout(hideStatus, 2000);
      return;
    }
    if (!inputText.trim()) return;
    try {
      const converted = converterS2T(inputText);
      setOutputText(converted);
      showStatus('已轉換為繁體', 'success');
      setTimeout(hideStatus, 2000);
    } catch (e) {
      console.error(e);
      showStatus('轉換失敗', 'error');
      setTimeout(hideStatus, 2000);
    }
  };

  const handleT2S = () => {
    if (!converterT2S) {
      showStatus('OpenCC 轉換器尚未載入', 'error');
      setTimeout(hideStatus, 2000);
      return;
    }
    if (!inputText.trim()) return;
    try {
      const converted = converterT2S(inputText);
      setOutputText(converted);
      showStatus('已轉換為簡體', 'success');
      setTimeout(hideStatus, 2000);
    } catch (e) {
      console.error(e);
      showStatus('轉換失敗', 'error');
      setTimeout(hideStatus, 2000);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText)
      .then(() => {
        showStatus('已複製到剪貼簿', 'success');
        setTimeout(hideStatus, 2000);
      })
      .catch(err => {
        showStatus('複製失敗', 'error');
        console.error(err);
        setTimeout(hideStatus, 2000);
      });
  };

  return (
    <div className="text-convert-container">
      <div className="text-convert-pane">
        <h3>輸入文字</h3>
        <textarea 
          value={inputText} 
          onChange={(e) => setInputText(e.target.value)} 
          placeholder="請在此貼上需要轉換的文字..."
        />
      </div>
      <div className="text-convert-controls">
        <button onClick={handleS2T} className="btn-primary" style={{ marginBottom: '10px' }}>
          簡 ➔ 繁
        </button>
        <button onClick={handleT2S} className="btn-primary">
          繁 ➔ 簡
        </button>
      </div>
      <div className="text-convert-pane">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>輸出結果</h3>
          <button 
            onClick={handleCopy} 
            className="btn-secondary" 
            style={{ padding: '4px 8px', fontSize: '0.9em' }}
            disabled={!outputText}
          >
            複製結果
          </button>
        </div>
        <textarea 
          value={outputText} 
          placeholder="轉換結果將顯示於此..." 
          readOnly 
        />
      </div>
    </div>
  );
}

export default TextConverter;
