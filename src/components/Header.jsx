import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Header.css';

export default function Header({ setActivePage, cartCount, wishlistCount, currentUser, onLogout }) {
    const [categories, setCategories] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        // Lấy danh mục động từ Database qua API
        api.getCategories()
            .then(res => setCategories(res.data))
            .catch(err => console.error("Lỗi tải danh mục:", err));
    }, []);

    return (
        <header className="site-header">
            <div className="top-announcement-bar">
                <span>🌱 Tươi ngon cho bữa ăn mỗi ngày - Giao hàng nhanh nội thành</span>
                <span>Hỗ trợ khách hàng: 1900 6868 ↗</span>
            </div>

            <div className="main-header">
                <div className="logo-area" onClick={() => setActivePage('home')}>
                    <div className="logo-icon">🌱</div>
                    <div className="logo-text">
                        <h1>Vườn Nhà</h1>
                        <span>RAU CỦ & TRÁI CÂY</span>
                    </div>
                </div>

                <div className="search-bar-container">
                    <input type="text" placeholder="Tìm kiếm rau củ tươi sạch..." className="search-input" />
                    <button className="search-btn">Tìm kiếm</button>
                </div>

                <div className="user-actions">
                    {/* Icon Yêu thích */}
                    <div className="action-icon" onClick={() => setActivePage('wishlist')} title="Sản phẩm yêu thích">
                        ❤️ <span className="badge">{wishlistCount}</span>
                    </div>
                    {/* Icon Giỏ hàng */}
                    <div className="action-icon" onClick={() => setActivePage('cart')} title="Giỏ hàng">
                        🛒 <span className="badge">{cartCount}</span>
                    </div>

                    {/* Khu vực Tài khoản */}
                    {currentUser ? (
                        <div className="user-profile-menu" onClick={() => setActivePage('account')}>
                            <span className="user-avatar">👤</span>
                            <div className="user-info">
                                <strong>{currentUser.fullName}</strong>
                                <small>{currentUser.role === 'Admin' ? 'Quản trị viên' : 'Khách hàng'}</small>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setActivePage('login')} className="btn-login-header">Đăng nhập</button>
                    )}
                </div>
            </div>

            {/* Menu điều hướng chính */}
            <nav className="sub-nav">
                <ul className="nav-links">
                    <li onClick={() => setActivePage('home')} className="active">Trang chủ</li>
                    
                    {/* Menu Sản phẩm có Dropdown xổ xuống */}
                    <li 
                        className="dropdown-container"
                        onMouseEnter={() => setShowDropdown(true)}
                        onMouseLeave={() => setShowDropdown(false)}
                        onClick={() => setActivePage('products')}
                    >
                        Sản phẩm ▾
                        {showDropdown && (
                            <div className="dropdown-menu">
                                {categories.map(cat => (
                                    <div key={cat.id} className="dropdown-item" onClick={() => setActivePage('products')}>
                                        {cat.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </li>

                    <li onClick={() => setActivePage('home')}>Về chúng tôi</li>
                    <li onClick={() => setActivePage('home')}>Mẹo hay nhà bếp</li>
                    <li onClick={() => setActivePage('home')}>Liên hệ</li>
                    {currentUser && currentUser.role === 'Admin' && (
                        <li onClick={() => setActivePage('admin')} style={{color: '#e74c3c', fontWeight: 'bold'}}>⚙️ Trang quản trị Admin</li>
                    )}
                </ul>
                <div className="nav-slogan">🌿 Nông trại xanh đến căn bếp sạch</div>
            </nav>
        </header>
    );
}