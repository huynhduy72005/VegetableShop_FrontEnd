import './VariantPicker.css';

const money = value => Number(value || 0).toLocaleString('vi-VN') + ' đ';

// Nút chọn biến thể ở trang chi tiết sản phẩm
export default function VariantPicker({ variants, selectedId, onSelect }) {
    return (
        <div className="vp-box" role="radiogroup" aria-label="Chọn loại sản phẩm">
            <span className="vp-label">Chọn loại</span>
            <div className="vp-options">
                {variants.map(variant => {
                    const soldOut = Number(variant.quantity) <= 0;
                    const active = variant.id === selectedId;
                    return (
                        <button
                            key={variant.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={soldOut}
                            className={`vp-option${active ? ' is-active' : ''}${soldOut ? ' is-out' : ''}`}
                            onClick={() => onSelect(variant)}
                        >
                            <strong>{variant.name}</strong>
                            <span>{soldOut ? 'Hết hàng' : money(variant.price)}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
