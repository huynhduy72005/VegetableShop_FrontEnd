import React, { useState } from 'react';
import './ProductDetail.css';

export default function ProductDetail({ product, onAddToCart, onBack }) {
    const [quantity, setQuantity] = useState(1);

    if (!product) return <div style={{ padding: '40px' }}>Đang tải sản phẩm...</div>;

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
                            <strong>Còn {product.quantity} đơn vị</strong>
                        </div>
                    </div>

                    <div className="action-row">
                        <button onClick={() => onAddToCart({ ...product, quantity })} className="btn-add-cart">
                            🛒 Thêm vào giỏ hàng
                        </button>
                       const [isLiked, setIsLiked] = useState(false);
// Tại nút Yêu thích:
<button onClick={() => { setIsLiked(!isLiked); alert(isLiked ? "Đã xóa khỏi yêu thích" : "Đã thêm vào sản phẩm yêu thích!"); }} style={{background: isLiked ? '#ffebee' : '#fff', color: isLiked ? 'red' : '#333'}} className="btn-wishlist">
    {isLiked ? '❤️ Đã yêu thích' : '🤍 Yêu thích'}
</button>
                    </div>

                    <div className="view-cart-link" onClick={() => {}}>Xem giỏ hàng của bạn</div>
                </div>
            </div>
        </div>
    );
}