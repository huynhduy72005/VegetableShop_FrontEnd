import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Header.css';

const navItems = [
    { key: 'home', label: 'Trang chủ' },
    { key: 'products', label: 'Sản phẩm' },
    { key: 'promotions', label: 'Khuyến mãi' },
    { key: 'about', label: 'Về chúng tôi' },
    { key: 'tips', label: 'Mẹo hay nhà bếp' },
    { key: 'reviews', label: 'Đánh giá' },
    { key: 'contact', label: 'Liên hệ' },
];

export default function Header({ setActivePage, activePage, cartCount, wishlistCount, currentUser, onLogout }) {
    const [categories, setCategories] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const isActive = (page) => activePage === page;

    useEffect(() => {
        api.getCategories()
            .then(res => setCategories(res.data))
            .catch(err => console.error('Lỗi tải danh mục:', err));
    }, []);

    return (
        <header className="site-header">
            <div className="top-announcement-bar">
                <span>🌱 Tươi ngon cho bữa ăn mỗi ngày • Giao hàng nhanh nội thành</span>
                <span>Hỗ trợ khách hàng: 1900 6868 ↗</span>
            </div>

            <div className="main-header">
                <div className="logo-area" onClick={() => setActivePage('home')}>
                    <div className="logo-icon">🌿</div>
                    <div className="logo-text">
                        <h1>Vườn Nhà</h1>
                        <span>RAU CỦ &amp; TRÁI CÂY</span>
                    </div>
                </div>

                <div className="search-bar-container">
                    <input type="text" placeholder="Tìm kiếm rau củ tươi sạch..." className="search-input" />
                    <button className="search-btn" type="button">Tìm kiếm</button>
                </div>

                <div className="header-actions">
                    <div className="action-icon" onClick={() => setActivePage('wishlist')} title="Sản phẩm yêu thích">
                        ❤️
                        {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
                    </div>

                    <div className="action-icon" onClick={() => setActivePage('cart')} title="Giỏ hàng">
                        🛒
                        {cartCount > 0 && <span className="badge">{cartCount}</span>}
                    </div>

                    {currentUser ? (
                        <div className="user-profile-menu" onClick={() => setActivePage('account')}>
                            <span className="user-avatar">👤</span>
                            <div className="user-info">
                                <strong>{currentUser.fullName}</strong>
                                <small>{currentUser.role === 'Admin' ? 'Quản trị viên' : 'Khách hàng'}</small>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setActivePage('login')} className="btn-login-header" type="button">Đăng nhập</button>
                    )}

                    <button className="header-cta" type="button" onClick={() => setActivePage('home')}>Đặt hàng ngay</button>
                </div>
            </div>

            <nav className="sub-nav">
                <ul className="nav-links">
                    {navItems.map(item => item.key === 'products' ? (
                        <li
                            key={item.key}
                            className={`dropdown-container ${isActive(item.key) ? 'active' : ''}`}
                            onMouseEnter={() => setShowDropdown(true)}
                            onMouseLeave={() => setShowDropdown(false)}
                            onClick={() => setActivePage(item.key)}
                        >
                            {item.label} ▾
                            {showDropdown && (
                                <div className="dropdown-menu">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="dropdown-item" onClick={() => setActivePage(item.key)}>
                                            {cat.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </li>
                    ) : (
                        <li
                            key={item.key}
                            onClick={() => setActivePage(item.key)}
                            className={isActive(item.key) ? 'active' : ''}
                        >
                            {item.label}
                        </li>
                    ))}

                    {currentUser && currentUser.role === 'Admin' && (
                        <li onClick={() => setActivePage('admin')} className={isActive('admin') ? 'active admin-link' : 'admin-link'}>
                            ⚙️ Admin
                        </li>
                    )}
                </ul>

                <div className="nav-slogan">🌿 Nông trại xanh đến căn bếp sạch</div>
            </nav>
        </header>
    );
}