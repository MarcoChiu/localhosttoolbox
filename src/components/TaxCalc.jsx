import React, { useState, useEffect } from 'react';

const TaxCalc = () => {
    const [amount, setAmount] = useState('');
    const [taxType, setTaxType] = useState('excluded');
    const [result, setResult] = useState({ preTax: 0, tax: 0, total: 0 });
    const [chineseTotal, setChineseTotal] = useState('');

    const toChineseNum = (num) => {
        if (!num) return '';
        const n = Math.floor(num);
        const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
        const units = ['', '拾', '佰', '仟'];
        const bigUnits = ['', '萬', '億', '兆'];

        let str = n.toString();
        let len = str.length;
        let chinese = '';
        let zeroCount = 0;

        for (let i = 0; i < len; i++) {
            let digit = parseInt(str[i]);
            let pos = len - i - 1;
            let unitPos = pos % 4;
            let bigUnitPos = Math.floor(pos / 4);

            if (digit === 0) {
                zeroCount++;
            } else {
                if (zeroCount > 0) {
                    chinese += digits[0];
                    zeroCount = 0;
                }
                chinese += digits[digit] + units[unitPos];
            }

            if (unitPos === 0 && zeroCount < 4) {
                if (pos > 0 || digit !== 0) {
                    chinese += bigUnits[bigUnitPos];
                }
                zeroCount = 0;
            }
        }
        chinese = chinese.replace(/零+$/, '');
        if (chinese === '') return '';
        return chinese + '元整';
    };

    useEffect(() => {
        const val = parseFloat(amount);
        if (isNaN(val)) {
            setResult({ preTax: 0, tax: 0, total: 0 });
            setChineseTotal('');
            return;
        }

        let pretax, tax, total;
        if (taxType === 'excluded') {
            tax = Math.round(val * 0.05);
            total = val + tax;
            pretax = val;
        } else {
            pretax = Math.round(val / 1.05);
            tax = val - pretax;
            total = val;
        }

        setResult({ preTax: pretax, tax: tax, total: total });
        setChineseTotal(toChineseNum(total));
    }, [amount, taxType]);

    return (
        <div className="tab-content active">
            <div className="tool-layout">
                {/* Setup panel */}
                <div className="settings-sidebar">
                    <div className="settings-title">
                        <span className="icon">💰</span>
                        營業稅額試算工具
                    </div>

                    <div className="settings-group">
                        <label>銷售金額 (NTD)</label>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="請輸入金額"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="settings-group" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <label className={`radio-label ${taxType === 'excluded' ? 'active' : ''}`} style={{ flex: 1 }}>
                            <input
                                type="radio"
                                name="tax-type"
                                value="excluded"
                                checked={taxType === 'excluded'}
                                onChange={() => setTaxType('excluded')}
                            /> 未稅
                        </label>
                        <label className={`radio-label ${taxType === 'included' ? 'active' : ''}`} style={{ flex: 1 }}>
                            <input
                                type="radio"
                                name="tax-type"
                                value="included"
                                checked={taxType === 'included'}
                                onChange={() => setTaxType('included')}
                            /> 含稅
                        </label>
                    </div>
                </div>

                {/* Main Output Area */}
                <div className="main-preview-area">
                    <div className="drop-zone" style={{ cursor: 'default' }}>
                        <div className="drop-zone-content">
                            <div className="tax-result-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>銷售額 (未稅)：</span>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{result.preTax.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>營業稅額 (5%)：</span>
                                    <span style={{ color: 'var(--color-primary-light)', fontWeight: 'bold' }}>{result.tax.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderTop: '1px dashed var(--item-border)', paddingTop: '15px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>總計金額 (含稅)：</span>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.4rem' }}>{result.total.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '1rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>總計大寫：</span>
                                    <span style={{ color: '#10b981', fontWeight: '500' }}>{chineseTotal}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxCalc;
