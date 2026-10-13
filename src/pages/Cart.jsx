import './Cart.css';

export default function Cart({ cartItems, onUpdateQuantity, onRemoveItem, onProceedCheckout }) {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal > 0 ? 15000 : 0;
    const total = subtotal + shippingFee;

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
                        {cartItems.map(item => (
                            <div key={item.id} className="cart-item">
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
                                <button onClick={() => onRemoveItem(item.id)} className="ci-remove">✕</button>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary-box">
                        <h3>Cộng giỏ hàng</h3>
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
                        <button onClick={onProceedCheckout} className="btn-checkout">
                            Tiến hành thanh toán
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}