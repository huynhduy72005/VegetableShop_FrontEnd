import { useState } from 'react';
import './ProductDetail.css';

export default function ProductDetail({ product, onAddToCart, onToggleWishlist, isWishlisted, onViewCart, onBack }) {
    const [quantity, setQuantity] = useState(1);

    if (!product) return <div style={{ padding: '40px' }}>Đang tải sản phẩm...</div>;

    const stockQuantity = Number(product.quantity) || 0;

    return (
        <div className="product-detail-page">
            <div className="breadcrumb">
                <span onClick={onBack}>Trang chủ</span> / <span>Sản phẩm</span> / <strong>{product.name}</strong>
            </div>

            <div className="detail-container">
                <div className="detail-image-box">
                    <img src={product.image || 'https://via.placeholder.com/400'} alt={product.name} />
                </div>

                <div className="detail-info-box">
                    <div className="brand-tag">🌱 VƯỜN NHÀ</div>
                    <h1>{product.name}</h1>
                    <div className="location-tag">📍 Đà Lạt</div>

                    <div className="price-display">
                        {product.price.toLocaleString()} đ <span className="unit-text">/ {product.unit}</span>
                    </div>

                    <p className="description-text">
                        {product.description || 'Sản phẩm tươi sạch, đạt chuẩn an toàn vệ sinh thực phẩm, phù hợp cho món salad, canh và chế biến các bữa ăn gia đình.'}
                    </p>

                    <div className="specs-table">
                        <div className="spec-row">
                            <span>Quy cách</span>
                            <strong>{product.unit} / đơn vị</strong>
                        </div>
                        <div className="spec-row">
                            <span>Tình trạng</span>
                            <strong>{stockQuantity > 0 ? `Còn ${stockQuantity} đơn vị` : 'Tạm hết hàng'}</strong>
                        </div>
                    </div>

                    <div className="action-row">
                        <label className="quantity-control">
                            <span>Số lượng</span>
                            <input
                                type="number"
                                min="1"
                                max={stockQuantity}
                                value={quantity}
                                onChange={(event) => {
                                    const nextQuantity = Number(event.target.value);
                                    if (nextQuantity >= 1 && nextQuantity <= stockQuantity) {
                                        setQuantity(nextQuantity);
                                    }
                                }}
                                aria-label="Số lượng sản phẩm"
                            />
                        </label>
                        <button
                            onClick={() => onAddToCart({ ...product, quantity })}
                            className="btn-add-cart"
                            disabled={stockQuantity < 1 || quantity > stockQuantity}
                        >
                            {stockQuantity > 0 ? '🛒 Thêm vào giỏ hàng' : 'Tạm hết hàng'}
                        </button>
                        <button
                            type="button"
                            onClick={() => onToggleWishlist(product)}
                            className="btn-wishlist"
                            aria-pressed={isWishlisted}
                        >
                            {isWishlisted ? '❤️ Đã yêu thích' : '🤍 Yêu thích'}
                        </button>
                    </div>

                    <button type="button" className="view-cart-link" onClick={onViewCart}>
                        Xem giỏ hàng của bạn
                    </button>
                </div>
            </div>
        </div>
    );
}