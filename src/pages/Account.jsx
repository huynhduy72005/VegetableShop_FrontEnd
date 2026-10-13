import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './Account.css';

const roles = { Admin: 'Quản trị viên', Staff: 'Nhân viên', Customer: 'Khách hàng' };
const initials = name => (name || '?').trim().split(/\s+/).slice(-2).map(word => word[0]).join('').toUpperCase();

export default function Account({ currentUser, onLogout }) {
    const [tab, setTab] = useState('profile');
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(currentUser?.role === 'Admin');
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null);
    const isAdmin = currentUser?.role === 'Admin';
    useEffect(() => {
        let active = true;
        if (isAdmin) {
            api.getUsers().then(res => { if (active) setUsers(res.data); })
                .catch(() => { if (active) setNotice({ error: true, text: 'Không tải được danh sách tài khoản. Bấm Tải lại để thử lại.' }); }).finally(() => { if (active) setLoading(false); });
        }
        return () => { active = false; };
    }, [isAdmin, currentUser?.id]);
    async function reload() {
        setLoading(true); setNotice(null);
        try { const res = await api.getUsers(); setUsers(res.data); }
        catch { setNotice({ error: true, text: 'Không tải được dữ liệu. Kiểm tra backend và thử lại.' }); }
        finally { setLoading(false); }
    }
    async function changeRole(user, newRole) {
        if (!isAdmin || busy || String(user.id) === String(currentUser.id) || newRole === user.role) return;
        if (!window.confirm(`Đổi quyền của “${user.fullName}” (${user.email}) từ ${roles[user.role]} sang ${roles[newRole]}?`)) return;
        setBusy(true); setNotice(null);
        try {
            await api.updateUserRole(user.id, { role: newRole });
            setUsers(previous => previous.map(item => item.id === user.id ? { ...item, role: newRole } : item));
            setNotice({ text: 'Đã cập nhật quyền tài khoản.' });
        } catch { setNotice({ error: true, text: 'Cập nhật quyền thất bại. Quyền hiện tại được giữ nguyên.' }); }
        finally { setBusy(false); }
    }
    async function deleteUser(user) {
        if (!isAdmin || busy || String(user.id) === String(currentUser.id)) return;
        if (!window.confirm(`Xóa tài khoản “${user.fullName}” (${user.email})? Thao tác này không thể hoàn tác từ giao diện.`)) return;
        setBusy(true); setNotice(null);
        try {
            await api.deleteUser(user.id); setUsers(previous => previous.filter(item => item.id !== user.id));
            setNotice({ text: 'Đã xóa tài khoản.' });
        } catch { setNotice({ error: true, text: 'Không xóa được tài khoản. Tài khoản có thể đang liên kết với đơn hàng.' }); }
        finally { setBusy(false); }
    }
    if (!currentUser) return <div className="acc2-login"><span>◈</span><h2>Không gian tài khoản</h2><p>Vui lòng đăng nhập để xem thông tin của bạn.</p></div>;
    const filtered = users.filter(user => (!role || user.role === role) && `${user.fullName} ${user.email} ${user.id}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
    const pages = Math.max(1, Math.ceil(filtered.length / 8));
    const currentPage = Math.min(page, pages);
    const visible = filtered.slice((currentPage - 1) * 8, currentPage * 8);
    const management = isAdmin && tab === 'manage_users';
    return <div className="acc2-page"><div className="acc2-top"><div><p className="acc2-eyebrow">VEGETABLESHOP / TÀI KHOẢN</p><h1>{management ? 'Nhân sự & phân quyền' : 'Không gian tài khoản'}</h1><p>{management ? 'Quản lý thành viên và vai trò trong cửa hàng.' : 'Thông tin cá nhân và hoạt động của bạn tại VegetableShop.'}</p></div><span className="acc2-top-tag">✿ Cùng cửa hàng phát triển</span></div>
    <div className="acc2-layout"><aside className="acc2-sidebar"><div className="acc2-person"><div className="acc2-avatar large">{initials(currentUser.fullName)}</div><h2>{currentUser.fullName}</h2><p>{currentUser.email}</p><span className={`acc2-badge ${currentUser.role}`}>{roles[currentUser.role] || currentUser.role}</span></div><nav aria-label="Tài khoản"><button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}><span>◉</span>Thông tin cá nhân</button>{isAdmin && <button className={management ? 'active' : ''} onClick={() => setTab('manage_users')}><span>♧</span>Nhân sự & phân quyền</button>}{currentUser.role === 'Customer' && <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}><span>▤</span>Đơn hàng của tôi</button>}{currentUser.role === 'Staff' && <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}><span>▤</span>Xử lý đơn hàng</button>}</nav><button className="acc2-logout" onClick={onLogout}>↪ Đăng xuất</button><p className="acc2-sidebar-foot">Một cửa hàng xanh.<br />Một trải nghiệm tốt hơn.</p></aside>
    <main className="acc2-main">{notice && <div className={`acc2-notice ${notice.error ? 'error' : ''}`} role={notice.error ? 'alert' : 'status'}>{notice.text}<button aria-label="Đóng thông báo" onClick={() => setNotice(null)}>×</button></div>}
    {management ? <><div className="acc2-stats">{[['', 'Tất cả tài khoản', '◉'], ['Admin', 'Quản trị viên', '◈'], ['Staff', 'Nhân viên', '♧'], ['Customer', 'Khách hàng', '♡']].map(([key, label, icon]) => <button key={key} className={role === key ? 'selected' : ''} onClick={() => { setRole(key); setPage(1); }}><span className="acc2-stat-icon">{icon}</span><span><small>{label}</small><strong>{key ? users.filter(user => user.role === key).length : users.length}</strong></span></button>)}</div>
    <section className="acc2-panel" aria-busy={loading || busy}><header className="acc2-panel-head"><div><h2>Danh sách tài khoản <span>{users.length}</span></h2><p>Tra cứu thành viên và cập nhật quyền phù hợp.</p></div><button disabled={loading || busy} onClick={reload}>{loading ? 'Đang tải…' : '↻ Tải lại'}</button></header><div className="acc2-toolbar"><input aria-label="Tìm tài khoản" placeholder="Tìm họ tên, email hoặc mã tài khoản…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /><select aria-label="Lọc vai trò" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}><option value="">Tất cả vai trò</option>{Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>{(search || role) && <button onClick={() => { setSearch(''); setRole(''); setPage(1); }}>Xóa bộ lọc</button>}</div>
    <div className="acc2-table-scroll"><table><thead><tr><th>THÀNH VIÊN</th><th>VAI TRÒ HIỆN TẠI</th><th>PHÂN QUYỀN</th><th>THAO TÁC</th></tr></thead><tbody>{visible.map(user => { const self = String(user.id) === String(currentUser.id); return <tr key={user.id}><td><div className="acc2-member"><span className="acc2-avatar">{initials(user.fullName)}</span><div><strong>{user.fullName} {self && <em>Bạn</em>}</strong><small>{user.email}</small><small className="acc2-id">Mã tài khoản #{user.id}</small></div></div></td><td><span className={`acc2-badge ${user.role}`}>{roles[user.role] || user.role}</span></td><td><select aria-label={`Vai trò của ${user.fullName}`} disabled={self || busy || loading} title={self ? 'Không thể tự thay đổi quyền của tài khoản đang đăng nhập' : 'Thay đổi vai trò'} value={user.role} onChange={e => changeRole(user, e.target.value)}>{Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></td><td><button className="acc2-delete" disabled={self || busy || loading} onClick={() => deleteUser(user)} title={self ? 'Không thể tự xóa tài khoản đang đăng nhập' : 'Xóa tài khoản'}>Xóa</button></td></tr>; })}</tbody></table>{!visible.length && <div className="acc2-empty"><strong>Không có tài khoản để hiển thị</strong><p>Thử thay đổi bộ lọc hoặc tải lại dữ liệu.</p></div>}</div><footer className="acc2-pagination"><span>{filtered.length} kết quả · Trang {currentPage}/{pages}</span><div><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>← Trước</button><button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Sau →</button></div></footer></section><p className="acc2-help">ⓘ Tài khoản đang đăng nhập được bảo vệ khỏi thao tác tự xóa và tự đổi quyền trên giao diện.</p></> : tab === 'profile' ? <section className="acc2-panel"><div className="acc2-profile-banner"><span>HỒ SƠ CỦA BẠN</span><h2>Xin chào, {currentUser.fullName}!</h2><p>Rất vui khi có bạn tại VegetableShop.</p></div><div className="acc2-profile-fields">{[['Họ và tên', currentUser.fullName], ['Email liên hệ', currentUser.email], ['Vai trò', roles[currentUser.role] || currentUser.role], ['Mã tài khoản', `#${currentUser.id}`]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div></section> : <section className="acc2-panel acc2-empty"><span>▤</span><h2>{currentUser.role === 'Staff' ? 'Xử lý đơn hàng' : 'Đơn hàng của tôi'}</h2><p>Chức năng danh sách đơn hàng chưa được kết nối trong phiên bản hiện tại.</p></section>}
    </main></div></div>;
}
