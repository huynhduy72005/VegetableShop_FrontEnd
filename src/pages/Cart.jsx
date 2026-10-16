import { useEffect, useRef, useState } from 'react';
import './Cart.css';

export default function Cart({ cartItems, onUpdateQuantity, onRemoveItem, onProceedCheckout }) {
    const [unselectedItemIds, setUnselectedItemIds] = useState(() => new Set());
    const selectAllRef = useRef(null);
    const selectedItems = cartItems.filter(item => !unselectedItemIds.has(item.id));
    const allSelected = cartItems.length > 0 && selectedItems.length === cartItems.length;
    const someSelected = selectedItems.length > 0 && !allSelected;
    const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = selectedItems.length > 0 ? 15000 : 0;
    const total = subtotal + shippingFee;

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = someSelected;
        }
    }, [someSelected]);

    const toggleItem = (itemId) => {
        setUnselectedItemIds(currentIds => {
            const nextIds = new Set(currentIds);
            if (nextIds.has(itemId)) {
                nextIds.delete(itemId);
            } else {
                nextIds.add(itemId);
            }
            return nextIds;
        });
    };

    const toggleAllItems = () => {
        setUnselectedItemIds(
            allSelected ? new Set(cartItems.map(item => item.id)) : new Set()
        );
    };

    return (
        <div className="cart-page">
            <h2>Giỏ hàng của bạn</h2>
            {cartItems.length === 0 ? (
                <div className="empty-cart">
                    <p>Giỏ hàng chưa có sản phẩm nào.</p>
                </div>
            ) : (
                <div className="cart-layout">
                    <div className="cart-items-list">
                        <div className="cart-selection-bar">
                            <label className="cart-checkbox-label">
                                <input
                                    ref={selectAllRef}
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAllItems}
                                    aria-label="Chọn tất cả sản phẩm trong giỏ hàng"
                                />
                                <span>Chọn tất cả</span>
                            </label>
                            <span className="cart-selection-count" aria-live="polite">
                                Đã chọn {selectedItems.length}/{cartItems.length} sản phẩm
                            </span>
                        </div>
                        {cartItems.map(item => (
                            <div
                                key={item.id}
                                className={`cart-item${!unselectedItemIds.has(item.id) ? ' is-selected' : ''}`}
                            >
                                <label className="cart-item-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={!unselectedItemIds.has(item.id)}
                                        onChange={() => toggleItem(item.id)}
                                        aria-label={`Chọn ${item.name}`}
                                    />
                                </label>
                                <img src={item.image || 'https://via.placeholder.com/80'} alt={item.name} />
                                <div className="ci-info">
                                    <h4>{item.name}</h4>
                                    <p className="ci-price">{item.price.toLocaleString()} đ / {item.unit}</p>
                                </div>
                                <div className="ci-quantity">
                                    <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                                </div>
                                <div className="ci-total">
                                    <strong>{(item.price * item.quantity).toLocaleString()} đ</strong>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemoveItem(item.id)}
                                    className="ci-remove"
                                    aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary-box">
                        <h3>Cộng giỏ hàng</h3>
                        <div className="summary-row">
                            <span>Sản phẩm đã chọn</span>
                            <strong>{selectedItems.length}/{cartItems.length}</strong>
                        </div>
                        <div className="summary-row">
                            <span>Tạm tính</span>
                            <strong>{subtotal.toLocaleString()} đ</strong>
                        </div>
                        <div className="summary-row">
                            <span>Phí vận chuyển</span>
                            <strong>{shippingFee.toLocaleString()} đ</strong>
                        </div>
                        <hr />
                        <div className="summary-row total">
                            <span>Tổng tiền</span>
                            <span className="total-price">{total.toLocaleString()} đ</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => onProceedCheckout(selectedItems)}
                            className="btn-checkout"
                            disabled={selectedItems.length === 0}
                        >
                            Tiến hành thanh toán
                        </button>
                        {selectedItems.length === 0 && (
                            <p className="cart-checkout-hint">Vui lòng chọn ít nhất một sản phẩm để tiếp tục.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}