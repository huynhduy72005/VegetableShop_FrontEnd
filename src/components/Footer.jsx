import React from 'react';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <div className="footer-logo">🌱 Vườn Nhà</div>
                    <p>Thêm sắc xanh cho bữa ăn của bạn.</p>
                </div>
                <div className="footer-links">
                    <span>Khám phá sản phẩm</span>
                    <span>Thông tin</span>
                    <span>Hướng dẫn mua hàng</span>
                    <span>Liên hệ</span>
                    <span>Tài khoản</span>
                </div>
            </div>
            <div className="footer-bottom">
                <p>© 2026 Vườn Nhà</p>
                <p>Sản phẩm, giá và xuất xứ minh họa.</p>
            </div>
        </footer>
    );
}