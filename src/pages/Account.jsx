import { useCallback, useState, useEffect } from 'react';
import { api } from '../services/api';
import './Account.css';

export default function Account({ currentUser, onLogout }) {
    const [activeTab, setActiveTab] = useState('profile');
    const [usersList, setUsersList] = useState([]);

    const loadUsers = useCallback(async () => {
        const res = await api.getUsers();
        return res.data;
    }, []);

    useEffect(() => {
        if (currentUser && currentUser.role === 'Admin') {
            loadUsers()
                .then(setUsersList)
                .catch(err => console.error("Lỗi tải danh sách người dùng:", err));
        }
    }, [currentUser, loadUsers]);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.updateUserRole(userId, { role: newRole });
            alert("Đã cập nhật quyền thành công!");
            setUsersList(await loadUsers());
        } catch {
            alert("Lỗi khi cập nhật quyền!");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm("Bạn có chắc muốn xóa tài khoản này?")) {
            try {
                await api.deleteUser(userId);
                alert("Đã xóa tài khoản thành công!");
                setUsersList(await loadUsers());
            } catch {
                alert("Xóa thất bại!");
            }
        }
    };

    if (!currentUser) {
        return <div style={{padding: '60px', textAlign: 'center'}}>Vui lòng đăng nhập để sử dụng tính năng này!</div>;
    }

    return (
        <div className="account-page">
            <h2>Quản Lý Tài Khoản ({currentUser.role})</h2>
            
            <div className="account-layout">
                {/* Sidebar menu */}
                <div className="account-sidebar">
                    <div className="acc-user-brief">
                        <div className="brief-avatar">👤</div>
                        <div>
                            <strong>{currentUser.fullName}</strong>
                            <p>{currentUser.email}</p>
                            <span className="role-tag">{currentUser.role}</span>
                        </div>
                    </div>
                    <ul className="acc-menu">
                        <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>📋 Thông tin cá nhân</li>
                        
                        {currentUser.role === 'Customer' && (
                            <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>📦 Đơn hàng của tôi</li>
                        )}

                        {currentUser.role === 'Staff' && (
                            <li className={activeTab === 'manage_orders' ? 'active' : ''} onClick={() => setActiveTab('manage_orders')}>🛠️ Xử lý đơn hàng</li>
                        )}

                        {currentUser.role === 'Admin' && (
                            <li className={activeTab === 'manage_users' ? 'active' : ''} onClick={() => setActiveTab('manage_users')}>👥 Quản lý nhân sự & phân quyền</li>
                        )}

                        <li onClick={onLogout} className="logout-item">🚪 Đăng xuất</li>
                    </ul>
                </div>

                {/* Nội dung chi tiết các tab */}
                <div className="account-content">
                    {activeTab === 'profile' && (
                        <div className="tab-pane">
                            <h3>Hồ sơ tài khoản</h3>
                            <div className="profile-info-grid">
                                <div className="info-group">
                                    <span>Họ và tên:</span>
                                    <strong>{currentUser.fullName}</strong>
                                </div>
                                <div className="info-group">
                                    <span>Email liên hệ:</span>
                                    <strong>{currentUser.email}</strong>
                                </div>
                                <div className="info-group">
                                    <span>Vai trò hệ thống:</span>
                                    <strong style={{color: '#2d6a4f'}}>{currentUser.role}</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="tab-pane">
                            <h3>Lịch sử mua hàng của bạn</h3>
                            <p>Danh sách đơn hàng bạn đã đặt tại cửa hàng Vườn Nhà.</p>
                            {/* Hiển thị danh sách đơn hàng cá nhân */}
                        </div>
                    )}

                    {activeTab === 'manage_orders' && (
                        <div className="tab-pane">
                            <h3>Trang dành cho Nhân viên (Staff): Xử lý đơn hàng</h3>
                            <p>Nhân viên có thể duyệt đơn, cập nhật trạng thái giao hàng cho khách.</p>
                        </div>
                    )}

                    {activeTab === 'manage_users' && (
                        <div className="tab-pane">
                            <h3>Trang dành cho Quản lý (Admin): Quản lý Nhân sự & Phân quyền</h3>
                            <p>Quản lý toàn bộ tài khoản khách hàng, nhân viên trong hệ thống.</p>
                            <table style={{width: '100%', marginTop: '15px', borderCollapse: 'collapse'}}>
                                <thead>
                                    <tr style={{background: '#f4f1ea', textAlign: 'left'}}>
                                        <th style={{padding: '10px'}}>ID</th>
                                        <th style={{padding: '10px'}}>Họ tên</th>
                                        <th style={{padding: '10px'}}>Email</th>
                                        <th style={{padding: '10px'}}>Quyền hạn (Role)</th>
                                        <th style={{padding: '10px'}}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersList.map(u => (
                                        <tr key={u.id} style={{borderBottom: '1px solid #eae6df'}}>
                                            <td style={{padding: '10px'}}>{u.id}</td>
                                            <td style={{padding: '10px'}}>{u.fullName}</td>
                                            <td style={{padding: '10px'}}>{u.email}</td>
                                            <td style={{padding: '10px'}}>
                                                <select 
                                                    value={u.role} 
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    style={{padding: '5px', borderRadius: '4px'}}
                                                >
                                                    <option value="Customer">Customer (Khách)</option>
                                                    <option value="Staff">Staff (Nhân viên)</option>
                                                    <option value="Admin">Admin (Quản lý)</option>
                                                </select>
                                            </td>
                                            <td style={{padding: '10px'}}>
                                                <button onClick={() => handleDeleteUser(u.id)} style={{background: '#e74c3c', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}>Xóa</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}