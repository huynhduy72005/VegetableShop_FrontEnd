import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Home.css';

export default function Home({ onViewDetail, onAddToCart }) {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        api.getProducts()
            .then(res => setProducts(res.data))
            .catch(err => console.error("Lỗi tải sản phẩm:", err));
    }, []);

    const categories = [
        { name: 'Rau xanh', count: '3 sản phẩm', image: '🥬', bg: '#e8f5e9' },
        { name: 'Củ & hạt', count: '2 sản phẩm', image: '🥕', bg: '#fff3e0' },
        { name: 'Trái cây', count: '3 sản phẩm', image: '🍎', bg: '#ffebee' },
        { name: 'Nấm sạch', count: '1 sản phẩm', image: '🍄', bg: '#f3e5f5' }
    ];

    return (
        <div className="home-container">
            {/* Banner chính */}
            <div className="hero-banner">
                <div className="hero-content">
                    <span className="hero-tag">🌱 CHỌN TƯỚI, SỐNG LÀNH</span>
                    <h1>Mang chút <strong>tươi xanh</strong> về căn bếp của bạn.</h1>
                    <p>Từ rau xanh giòn mát đến trái cây ngọt lành. Chọn nguyên liệu cho bữa ăn mà bạn mong chờ.</p>
                    <div className="hero-btns">
                        <button className="btn-primary">Ghế vườn, chọn món ↗</button>
                        <span className="hero-link">Câu chuyện khu vườn</span>
                    </div>
                    <div className="hero-note">Mỗi bữa ăn ngon, một ngày nhiều yêu thương.</div>
                </div>

                <div className="hero-visual">
                    <div className="hero-visual-circle"></div>
                    <div className="banner-card-float">
                        <div className="bc-title">Gợi ý hôm nay</div>
                        <div className="bc-name">Cà chua tươi</div>
                        <div className="bc-price">28.000 đ / 500g</div>
                    </div>
                </div>
            </div>

            {/* Menu phụ nhanh */}
            <div className="quick-menu-bar">
                <span>📁 Danh mục</span>
                <span>🛒 Sản phẩm</span>
                <span>🏡 Về chúng tôi</span>
                <span>📦 Cách mua hàng</span>
                <span>💬 Kết nối</span>
            </div>

            {/* Danh mục sản phẩm */}
            <div className="section-block">
                <div className="section-header">
                    <div>
                        <span className="sub-title">MỖI MÓN, MỘT CHÚT YÊU THƯƠNG</span>
                        <h2>Hôm nay bạn chọn gì?</h2>
                    </div>
                    <span className="view-all">Tất cả sản phẩm ↗</span>
                </div>

                <div className="category-grid">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="category-card" style={{ backgroundColor: cat.bg }}>
                            <div className="cat-icon">{cat.image}</div>
                            <h3>{cat.name}</h3>
                            <p>{cat.count} ↗</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Danh sách sản phẩm nổi bật */}
            <div className="section-block">
                <h2>Sản phẩm tươi mới mỗi ngày</h2>
                <div className="product-grid">
                    {products.map(product => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            onViewDetail={onViewDetail} 
                            onAddToCart={onAddToCart} 
                        />
                    ))}
                </div>
            </div>

            {/* Cam kết chất lượng */}
            <div className="trust-bar">
                <div className="trust-item">
                    <div className="trust-icon">🚚</div>
                    <div className="trust-text">
                        <strong>Giao hàng nhanh</strong>
                        <span>Nội thành trong 2–4 giờ</span>
                    </div>
                </div>
                <div className="trust-item">
                    <div className="trust-icon">🌿</div>
                    <div className="trust-text">
                        <strong>100% Tươi sạch</strong>
                        <span>Đạt chuẩn VietGAP</span>
                    </div>
                </div>
                <div className="trust-item">
                    <div className="trust-icon">🔄</div>
                    <div className="trust-text">
                        <strong>Đổi trả dễ dàng</strong>
                        <span>Hoàn tiền trong 24h</span>
                    </div>
                </div>
                <div className="trust-item">
                    <div className="trust-icon">💬</div>
                    <div className="trust-text">
                        <strong>Hỗ trợ 24/7</strong>
                        <span>Hotline: 1900 6868</span>
                    </div>
                </div>
            </div>
        </div>
    );
}