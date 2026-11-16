import { useMemo, useState } from 'react';
import './VariantEditor.css';
import { readImageAsDataUrl, summarizeVariants } from '../services/ProductVariants';

const money = value => Number(value || 0).toLocaleString('vi-VN') + ' đ';
const MAX_VARIANTS = 20;
const keyOf = value => String(value ?? '').trim().toLocaleLowerCase('vi');

// Đếm tần suất rồi trả về danh sách giá trị, nhiều nhất lên đầu
const rankByFrequency = values => {
    const counts = new Map();
    values.forEach(value => {
        const text = String(value ?? '').trim();
        if (!text) return;
        const key = keyOf(text);
        const entry = counts.get(key) || { text, count: 0 };
        entry.count += 1;
        counts.set(key, entry);
    });
    return [...counts.values()].sort((a, b) => b.count - a.count).map(entry => entry.text);
};

// Khung thêm / sửa / xóa biến thể trong form sản phẩm của Admin.
// variants: [{ id?, name, unit, price, quantity, image, isDefault, isVisible }]
// products + currentProductId: dùng để gợi ý tên và sao chép biến thể từ sản phẩm khác.
export default function VariantEditor({
    variants,
    onChange,
    defaultUnit = '',
    disabled = false,
    products = [],
    currentProductId = null
}) {
    const list = variants || [];
    const summary = summarizeVariants(list);
    const [imageError, setImageError] = useState('');
    const [showCopy, setShowCopy] = useState(false);
    const [sourceId, setSourceId] = useState('');
    const [withPrice, setWithPrice] = useState(false);
    const [copyMessage, setCopyMessage] = useState('');

    // Các sản phẩm KHÁC đã có biến thể
    const sourceProducts = useMemo(
        () => products.filter(p =>
            p.id !== currentProductId && Array.isArray(p.variants) && p.variants.length > 0),
        [products, currentProductId]
    );

    // Cách 1: gợi ý tên / đơn vị từ các biến thể đã dùng ở sản phẩm khác
    const suggestions = useMemo(() => {
        const all = sourceProducts.flatMap(p => p.variants);
        const unitByName = new Map();
        rankByFrequency(all.map(v => v.name)).forEach(name => {
            const units = all.filter(v => keyOf(v.name) === keyOf(name)).map(v => v.unit);
            unitByName.set(keyOf(name), rankByFrequency(units)[0] || '');
        });
        return {
            names: rankByFrequency(all.map(v => v.name)),
            units: rankByFrequency(all.map(v => v.unit)),
            unitByName
        };
    }, [sourceProducts]);

    const usedNames = new Set(list.map(v => keyOf(v.name)));
    const nameOptions = suggestions.names.filter(name => !usedNames.has(keyOf(name)));

    const update = (index, patch) =>
        onChange(list.map((item, i) => (i === index ? { ...item, ...patch } : item)));

    // Gõ / chọn tên có sẵn thì tự điền đơn vị nếu đơn vị chưa bị sửa tay
    const changeName = (index, name) => {
        const item = list[index];
        const patch = { name };
        const suggestedUnit = suggestions.unitByName.get(keyOf(name));
        const unitUntouched = !String(item.unit ?? '').trim() || item.unit === defaultUnit;
        if (suggestedUnit && unitUntouched) patch.unit = suggestedUnit;
        update(index, patch);
    };

    const add = () =>
        onChange([
            ...list,
            {
                name: '',
                unit: defaultUnit,
                price: '',
                quantity: '',
                image: '',
                isDefault: list.length === 0, // biến thể đầu tiên là mặc định
                isVisible: true
            }
        ]);

    const makeDefault = index =>
        onChange(list.map((item, i) => ({ ...item, isDefault: i === index })));

    const remove = index => {
        const item = list[index];
        const label = item.name?.trim() ? `“${item.name.trim()}”` : 'biến thể này';
        if (item.id && !window.confirm(`Xóa ${label}? Thay đổi có hiệu lực khi bạn bấm Lưu sản phẩm.`)) return;

        const next = list.filter((_, i) => i !== index);
        // Xóa biến thể mặc định thì chuyển mặc định sang biến thể đầu tiên còn lại
        if (next.length > 0 && !next.some(v => v.isDefault)) {
            next[0] = { ...next[0], isDefault: true };
        }
        onChange(next);
    };

    async function chooseImage(index, event) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setImageError('');
        try {
            const dataUrl = await readImageAsDataUrl(file);
            update(index, { image: dataUrl });
        } catch (error) {
            setImageError(error.message);
        }
    }

    // Cách 2: sao chép biến thể từ sản phẩm khác (tồn kho và ảnh để trống cho bạn nhập)
    function copyFromProduct() {
        const source = sourceProducts.find(p => String(p.id) === sourceId);
        if (!source) {
            setCopyMessage('Vui lòng chọn sản phẩm cần sao chép.');
            return;
        }

        const room = MAX_VARIANTS - list.length;
        if (room <= 0) {
            setCopyMessage(`Đã đạt tối đa ${MAX_VARIANTS} biến thể.`);
            return;
        }

        const candidates = source.variants.filter(v => !usedNames.has(keyOf(v.name)));
        const skipped = source.variants.length - candidates.length;
        const picked = candidates.slice(0, room);

        if (picked.length === 0) {
            setCopyMessage('Sản phẩm này không có loại nào mới (tất cả tên đã tồn tại).');
            return;
        }

        const copied = picked.map(v => ({
            name: v.name,
            unit: v.unit || defaultUnit,
            price: withPrice ? String(v.price) : '',
            quantity: '',
            image: '',
            isDefault: false,
            isVisible: true,
            _wasDefault: Boolean(v.isDefault)
        }));

        // Nếu chưa có biến thể mặc định thì lấy loại mặc định của sản phẩm nguồn (hoặc loại đầu tiên)
        if (!list.some(v => v.isDefault)) {
            const defaultIndex = Math.max(0, copied.findIndex(v => v._wasDefault));
            copied[defaultIndex].isDefault = true;
        }

        onChange([...list, ...copied.map(({ _wasDefault, ...rest }) => rest)]);

        const parts = [`Đã chép ${copied.length} biến thể từ “${source.name}”.`];
        if (skipped > 0) parts.push(`Bỏ qua ${skipped} loại trùng tên.`);
        if (picked.length < candidates.length) parts.push(`Chỉ chép được ${room} loại vì tối đa ${MAX_VARIANTS}.`);
        parts.push(withPrice ? 'Hãy nhập tồn kho cho từng loại.' : 'Hãy nhập giá và tồn kho cho từng loại.');
        setCopyMessage(parts.join(' '));
    }

    return (
        <fieldset className="ve-box" disabled={disabled}>
            <legend>Biến thể sản phẩm <span>(không bắt buộc)</span></legend>
            <p className="ve-hint">
                Dùng khi một sản phẩm có nhiều loại, ví dụ <b>500g</b>, <b>1kg</b>, <b>Khay 3kg</b>.
                Mỗi loại có giá, tồn kho, đơn vị và ảnh riêng. Khi có biến thể, giá bán và tồn kho ở trên
                sẽ tự tính từ các loại <b>đang bán</b>.
            </p>

            {/* Danh sách gợi ý (cách 1) */}
            <datalist id="ve-name-suggestions">
                {nameOptions.map(name => <option key={name} value={name} />)}
            </datalist>
            <datalist id="ve-unit-suggestions">
                {suggestions.units.map(unit => <option key={unit} value={unit} />)}
            </datalist>

            {/* Sao chép từ sản phẩm khác (cách 2) */}
            {sourceProducts.length > 0 && (
                <div className="ve-copy">
                    <button
                        type="button"
                        className="ve-copy-toggle"
                        aria-expanded={showCopy}
                        onClick={() => { setShowCopy(open => !open); setCopyMessage(''); }}
                    >
                        {showCopy ? '▾' : '▸'} Sao chép biến thể từ sản phẩm khác
                    </button>

                    {showCopy && (
                        <div className="ve-copy-panel">
                            <select value={sourceId} onChange={event => { setSourceId(event.target.value); setCopyMessage(''); }}>
                                <option value="">— Chọn sản phẩm —</option>
                                {sourceProducts.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.variants.map(v => v.name).join(', ')})
                                    </option>
                                ))}
                            </select>

                            <label className="ve-check">
                                <input
                                    type="checkbox"
                                    checked={withPrice}
                                    onChange={event => setWithPrice(event.target.checked)}
                                />
                                Chép cả giá bán
                            </label>

                            <button type="button" className="ve-add" onClick={copyFromProduct} disabled={!sourceId}>
                                Sao chép
                            </button>

                            {copyMessage && <p className="ve-copy-message" role="status">{copyMessage}</p>}
                        </div>
                    )}
                </div>
            )}

            {list.map((item, index) => (
                <div className={`ve-card${item.isVisible === false ? ' is-hidden' : ''}`} key={item.id ?? `new-${index}`}>
                    <div className="ve-card-head">
                        <strong>Biến thể {index + 1}</strong>

                        <label className="ve-check">
                            <input
                                type="radio"
                                name="ve-default"
                                checked={Boolean(item.isDefault)}
                                onChange={() => makeDefault(index)}
                            />
                            Mặc định
                        </label>

                        <label className="ve-check">
                            <input
                                type="checkbox"
                                checked={item.isVisible !== false}
                                onChange={event => update(index, { isVisible: event.target.checked })}
                            />
                            Đang bán
                        </label>

                        <button
                            type="button"
                            className="ve-delete"
                            onClick={() => remove(index)}
                            aria-label={`Xóa biến thể ${index + 1}`}
                            title="Xóa biến thể"
                        >
                            Xóa
                        </button>
                    </div>

                    <div className="ve-grid">
                        <label>
                            Tên loại
                            <input
                                type="text"
                                maxLength={100}
                                list="ve-name-suggestions"
                                autoComplete="off"
                                placeholder="Ví dụ: 500g"
                                value={item.name ?? ''}
                                onChange={event => changeName(index, event.target.value)}
                            />
                        </label>

                        <label>
                            Đơn vị
                            <input
                                type="text"
                                maxLength={30}
                                list="ve-unit-suggestions"
                                autoComplete="off"
                                placeholder={defaultUnit || 'kg, hộp, khay…'}
                                value={item.unit ?? ''}
                                onChange={event => update(index, { unit: event.target.value })}
                            />
                        </label>

                        <label>
                            Giá bán (VNĐ)
                            <input
                                type="number"
                                min="0"
                                step="100"
                                placeholder="0"
                                value={item.price ?? ''}
                                onChange={event => update(index, { price: event.target.value })}
                            />
                        </label>

                        <label>
                            Tồn kho
                            <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                value={item.quantity ?? ''}
                                onChange={event => update(index, { quantity: event.target.value })}
                            />
                        </label>

                        <div className="ve-image">
                            <span>Ảnh riêng (không bắt buộc)</span>
                            <div className="ve-image-row">
                                {item.image ? (
                                    <img src={item.image} alt="" />
                                ) : (
                                    <span className="ve-image-empty">Dùng ảnh sản phẩm</span>
                                )}
                                <label className="ve-file">
                                    {item.image ? 'Đổi ảnh' : 'Chọn ảnh'}
                                    <input type="file" accept="image/*" hidden onChange={event => chooseImage(index, event)} />
                                </label>
                                {item.image && (
                                    <button type="button" onClick={() => update(index, { image: '' })}>
                                        Bỏ ảnh
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {item.isVisible === false && (
                        <p className="ve-note">Loại này đang ẩn: khách không nhìn thấy và không được tính vào giá, tồn kho.</p>
                    )}
                </div>
            ))}

            {imageError && <p className="ve-error" role="alert">{imageError}</p>}

            <div className="ve-footer">
                <button type="button" className="ve-add" onClick={add} disabled={list.length >= MAX_VARIANTS}>
                    + Thêm biến thể
                </button>
                {list.length > 0 && (
                    <span className="ve-summary">
                        {list.length} biến thể · Giá từ <b>{money(summary.minPrice)}</b> · Tổng tồn <b>{summary.totalStock}</b>
                    </span>
                )}
            </div>
        </fieldset>
    );
}
