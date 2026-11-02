import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Orders from './Orders';
import './Account.css';

const roles = { Admin: 'Quản trị viên', Staff: 'Nhân viên', Customer: 'Khách hàng' };
const initials = name => (name || '?').trim().split(/\s+/).slice(-2).map(word => word[0]).join('').toUpperCase();

// THÊM: Truyền onNavigateToAdmin vào props
export default function Account({ currentUser, onLogout, onBuyAgain, onNavigateToAdmin }) {
    const [tab, setTab] = useState('profile');
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(currentUser?.role === 'Admin');
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null);
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const isAdmin = currentUser?.role === 'Admin';

    useEffect(() => {
        let active = true;
        if (isAdmin) {
            api.getUsers().then(res => { if (active) setUsers(res.data); })
                .catch(() => { if (active) setNotice({ error: true, text: 'Không tải được danh sách tài khoản.' }); }).finally(() => { if (active) setLoading(false); });
        }
        return () => { active = false; };
    }, [isAdmin, currentUser?.id]);

    async function reload() {
        setLoading(true); setNotice(null);
        try { const res = await api.getUsers(); setUsers(res.data); }
        catch { setNotice({ error: true, text: 'Không tải được dữ liệu.' }); }
        finally { setLoading(false); }
    }

    async function changeRole(user, newRole) {
        if (!isAdmin || busy || String(user.id) === String(currentUser.id) || newRole === user.role) return;
        if (!window.confirm(`Đổi quyền của “${user.fullName}” sang ${roles[newRole]}?`)) return;
        setBusy(true); setNotice(null);
        try {
            await api.updateUserRole(user.id, { role: newRole });
            setUsers(previous => previous.map(item => item.id === user.id ? { ...item, role: newRole } : item));
            setNotice({ text: 'Đã cập nhật quyền.' });
        } catch { setNotice({ error: true, text: 'Cập nhật thất bại.' }); }
        finally { setBusy(false); }
    }

    async function deleteUser(user) {
        if (!isAdmin || busy || String(user.id) === String(currentUser.id)) return;
        if (!window.confirm(`Xóa tài khoản “${user.fullName}”?`)) return;
        setBusy(true); setNotice(null);
        try {
            await api.deleteUser(user.id); setUsers(previous => previous.filter(item => item.id !== user.id));
            setNotice({ text: 'Đã xóa tài khoản.' });
        } catch { setNotice({ error: true, text: 'Không xóa được tài khoản.' }); }
        finally { setBusy(false); }
    }

    async function changePassword(event) {
        event.preventDefault();
        if (busy) return;

        if (passwords.newPassword.length < 8) {
            setNotice({ error: true, text: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
            return;
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            setNotice({ error: true, text: 'Mật khẩu xác nhận không khớp.' });
            return;
        }
        if (passwords.currentPassword === passwords.newPassword) {
            setNotice({ error: true, text: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
            return;
        }

        setBusy(true);
        setNotice(null);
        try {
            const response = await api.changePassword(currentUser.id, {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setNotice({ text: response.data?.message || 'Đổi mật khẩu thành công.' });
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu hiện tại và thử lại.'
            });
        } finally {
            setBusy(false);
        }
    }

    if (!currentUser) return <div className="acc2-login"><span>◈</span><h2>Không gian tài khoản</h2><p>Vui lòng đăng nhập.</p></div>;

    const filtered = users.filter(user => (!role || user.role === role) && `${user.fullName} ${user.email} ${user.id}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
    const pages = Math.max(1, Math.ceil(filtered.length / 8));
    const currentPage = Math.min(page, pages);
    const visible = filtered.slice((currentPage - 1) * 8, currentPage * 8);
    const management = isAdmin && tab === 'manage_users';

    return (
        <div className="acc2-page">
            <div className="acc2-top">
                <div>
                    <p className="acc2-eyebrow"></p>
                    <h1>{management ? 'Nhân sự & phân quyền' : 'Không gian tài khoản'}</h1>
                    <p>{management ? 'Quản lý thành viên và vai trò trong cửa hàng.' : 'Thông tin cá nhân và hoạt động của bạn.'}</p>
                </div>
                <span className="acc2-top-tag">✿ Cùng cửa hàng phát triển</span>
            </div>

            <div className="acc2-layout">
                <aside className="acc2-sidebar">
                    <div className="acc2-person">
                        <div className="acc2-avatar large">{initials(currentUser.fullName)}</div>
                        <h2>{currentUser.fullName}</h2>
                        <p>{currentUser.email}</p>
                        <span className={`acc2-badge ${currentUser.role}`}>{roles[currentUser.role] || currentUser.role}</span>
                    </div>

                    <nav aria-label="Tài khoản">
                        <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
                            <span>◉</span>Thông tin cá nhân
                        </button>
                        <button className={tab === 'change_password' ? 'active' : ''} onClick={() => { setTab('change_password'); setNotice(null); }}>
                            <span>♙</span>Đổi mật khẩu
                        </button>
                        
                        {isAdmin && (
                            <>
                                <button className={tab === 'manage_users' ? 'active' : ''} onClick={() => setTab('manage_users')}>
                                    <span>♧</span>Nhân sự & phân quyền
                                </button>
                                {/* KHI BẤM NÚT NÀY SẼ GỌI onNavigateToAdmin ĐỂ CHUYỂN HẲN SANG TRANG QUẢN TRỊ */}
                                <button onClick={onNavigateToAdmin}>
                                    <span>◫</span>Trang quản trị cửa hàng
                                </button>
                            </>
                        )}
                        
                        {currentUser.role === 'Customer' && (
                            <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
                                <span>▤</span>Đơn hàng của tôi
                            </button>
                        )}
                    </nav>

                    <button className="acc2-logout" onClick={onLogout}>↪ Đăng xuất</button>
                </aside>

                <main className="acc2-main">
                    {notice && (
                        <div className={`acc2-notice ${notice.error ? 'error' : ''}`} role={notice.error ? 'alert' : 'status'}>
                            {notice.text}
                            <button aria-label="Đóng thông báo" onClick={() => setNotice(null)}>×</button>
                        </div>
                    )}
                    {management ? (
                        <>
                            <section className="acc2-panel" aria-busy={loading || busy}>
                                <header className="acc2-panel-head">
                                    <div><h2>Danh sách tài khoản <span>{users.length}</span></h2></div>
                                    <button disabled={loading || busy} onClick={reload}>{loading ? 'Đang tải…' : '↻ Tải lại'}</button>
                                </header>
                                <div className="acc2-table-scroll">
                                    <table>
                                        <thead><tr><th>THÀNH VIÊN</th><th>VAI TRÒ</th><th>PHÂN QUYỀN</th><th>THAO TÁC</th></tr></thead>
                                        <tbody>
                                            {visible.map(user => {
                                                const self = String(user.id) === String(currentUser.id);
                                                return (
                                                    <tr key={user.id}>
                                                        <td>
                                                            <div className="acc2-member">
                                                                <span className="acc2-avatar">{initials(user.fullName)}</span>
                                                                <div><strong>{user.fullName} {self && <em>Bạn</em>}</strong><small>{user.email}</small></div>
                                                            </div>
                                                        </td>
                                                        <td><span className={`acc2-badge ${user.role}`}>{roles[user.role] || user.role}</span></td>
                                                        <td>
                                                            <select disabled={self || busy || loading} value={user.role} onChange={e => changeRole(user, e.target.value)}>
                                                                {Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <button className="acc2-delete" disabled={self || busy || loading} onClick={() => deleteUser(user)}>Xóa</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    ) : tab === 'change_password' ? (
                        <section className="acc2-panel">
                            <header className="acc2-panel-head">
                                <div>
                                    <h2>Đổi mật khẩu</h2>
                                    <p>Nhập mật khẩu hiện tại để xác nhận thay đổi bảo mật tài khoản.</p>
                                </div>
                            </header>
                            <form className="acc2-password-form" onSubmit={changePassword}>
                                <label>
                                    Mật khẩu hiện tại
                                    <input
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={passwords.currentPassword}
                                        onChange={event => setPasswords(previous => ({ ...previous, currentPassword: event.target.value }))}
                                    />
                                </label>
                                <label>
                                    Mật khẩu mới
                                    <input
                                        type="password"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                        value={passwords.newPassword}
                                        onChange={event => setPasswords(previous => ({ ...previous, newPassword: event.target.value }))}
                                    />
                                </label>
                                <label>
                                    Xác nhận mật khẩu mới
                                    <input
                                        type="password"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                        value={passwords.confirmPassword}
                                        onChange={event => setPasswords(previous => ({ ...previous, confirmPassword: event.target.value }))}
                                    />
                                </label>
                                <p className="acc2-password-help">Mật khẩu mới cần có ít nhất 8 ký tự.</p>
                                <button className="acc2-password-submit" type="submit" disabled={busy}>
                                    {busy ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
                                </button>
                            </form>
                        </section>
                    ) : tab === 'profile' ? (
                        <section className="acc2-panel">
                            <div className="acc2-profile-banner"><h2>Xin chào, {currentUser.fullName}!</h2></div>
                            <div className="acc2-profile-fields">
                                {[['Họ và tên', currentUser.fullName], ['Email', currentUser.email], ['Vai trò', roles[currentUser.role] || currentUser.role], ['Mã', `#${currentUser.id}`]].map(([label, value]) => (
                                    <div key={label}><small>{label}</small><strong>{value}</strong></div>
                                ))}
                            </div>
                        </section>
                    ) : (
                        <section className="acc2-panel acc2-empty">
                            <span>▤</span><h2>Đơn hàng của tôi</h2>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}