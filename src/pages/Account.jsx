import React, { useState } from 'react';
import './Account.css';

export default function Account({ currentUser, onLogout }) {
    const [activeTab, setActiveTab] = useState('profile');

    // Dữ liệu mẫu lịch sử đơn hàng minh họa trực quan khi thuyết trình
    const [mockOrders] = useState([
        { id: 101, date: '2026-06-06', total: 68000, status: 'Đã giao hàng', address: '123 Nguyễn Văn Linh, Q.7, TP.HCM' },
        { id: 102, date: '2026-06-10', total: 45000, status: 'Đang xử lý', address: '45 Lê Duẩn, Quận 1, TP.HCM' }
    ]);

    if (!currentUser) {
        return <div style={{padding: '50px', textAlign: 'center'}}>Vui lòng đăng nhập để xem thông tin tài khoản!</div>;
    }

    return (
        <div className="account-page">
            <h2>Trang Quản Lý Tài Khoản Cá Nhân</h2>
            
            <div className="account-layout">
                {/* Menu trái */}
                <div className="account-sidebar">
                    <div className="acc-user-brief">
                        <div className="brief-avatar">👤</div>
                        <div>
                            <strong>{currentUser.fullName}</strong>
                            <p>{currentUser.email}</p>
                        </div>
                    </div>
                    <ul className="acc-menu">
                        <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>📋 Thông tin tài khoản</li>
                        <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>📦 Đơn hàng của tôi</li>
                        <li onClick={onLogout} className="logout-item">🚪 Đăng xuất</li>
                    </ul>
                </div>

                {/* Nội dung phải */}
                <div className="account-content">
                    {activeTab === 'profile' && (
                        <div className="tab-pane">
                            <h3>Hồ sơ cá nhân</h3>
                            <div className="profile-info-grid">
                                <div className="info-group">
                                    <span>Họ và tên:</span>
                                    <strong>{currentUser.fullName}</strong>
                                </div>
                                <div className="info-group">
                                    <span>Địa chỉ Email:</span>
                                    <strong>{currentUser.email}</strong>
                                </div>
                                <div className="info-group">
                                    <span>Phân quyền (Role):</span>
                                    <strong style={{color: '#2d6a4f'}}>{currentUser.role}</strong>
                                </div>
                                <div className="info-group">
                                    <span>Trạng thái tài khoản:</span>
                                    <strong style={{color: '#27ae60'}}>Hoạt động bình thường ✓</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="tab-pane">
                            <h3>Lịch sử đơn hàng đã đặt</h3>
                            <div className="orders-table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Mã đơn</th>
                                            <th>Ngày đặt</th>
                                            <th>Tổng tiền</th>
                                            <th>Trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mockOrders.map(ord => (
                                            <tr key={ord.id}>
                                                <strong>#{ord.id}</strong>
                                                <td>{ord.date}</td>
                                                <td style={{color: '#e74c3c', fontWeight: 'bold'}}>{ord.total.toLocaleString()} đ</td>
                                                <td><span className="status-badge">{ord.status}</span></td>
                                                <td>
                                                    <button onClick={() => window.print()} className="btn-print-invoice">🖨️ Xuất hóa đơn</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}