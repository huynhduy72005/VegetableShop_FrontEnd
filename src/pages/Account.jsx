// import { useEffect, useState } from 'react';
// import { api } from '../services/api';
// import './Account.css';
// import Orders from './Orders';
// import EmployeeManagement from './EmployeeManagement';

// const roles = { Admin: 'Quản trị viên', Staff: 'Nhân viên', Customer: 'Khách hàng' };
// const genders = ['Nam', 'Nữ', 'Khác', 'Không muốn tiết lộ'];
// const initials = name => (name || '?').trim().split(/\s+/).slice(-2).map(word => word[0]).join('').toUpperCase();
// const formatDateOfBirth = date => {
//     if (!date) return 'Chưa cập nhật';
//     const [year, month, day] = date.split('-');
//     return `${day}/${month}/${year}`;
// };
// const isVietnamesePhoneNumber = phone => /^(?:0(?:3|5|7|8|9)\d{8}|02\d{8,9}|\+84(?:3|5|7|8|9)\d{8}|\+842\d{8,9})$/.test(phone.trim().replace(/[\s().-]/g, ''));
// const profileUpdateErrorMessage = error => {
//     const data = error.response?.data;
//     if (typeof data === 'string' && data.trim()) return data;
//     if (data?.message || data?.detail || data?.title) {
//         return data.message || data.detail || data.title;
//     }
//     if (data?.errors && typeof data.errors === 'object') {
//         return Object.values(data.errors).flat().join(' ');
//     }
//     if (error.response?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
//     if (error.response?.status === 403) return 'Bạn không có quyền cập nhật thông tin này.';
//     if (error.response) return `Máy chủ từ chối cập nhật (HTTP ${error.response.status}).`;
//     return 'Không kết nối được máy chủ. Vui lòng kiểm tra backend và địa chỉ API.';
// };


// export default function Account({ currentUser, onLogout, onNavigateToAdmin, onUserUpdated, onBuyAgain }) {
//     const [tab, setTab] = useState(
//         currentUser?.mustChangePassword ? 'change_password' : 'profile'
//     );
//     const [users, setUsers] = useState([]);
//     const [passwordResetRequests, setPasswordResetRequests] = useState([]);
//     const [profile, setProfile] = useState({
//         fullName: currentUser?.fullName || '',
//         email: currentUser?.email || '',
//         phone: currentUser?.phone || '',
//         gender: currentUser?.gender || '',
//         dateOfBirth: currentUser?.dateOfBirth || ''
//     });
//     const [isEditingProfile, setIsEditingProfile] = useState(false);
//     const search = '';
//     const role = '';
//     const page = 1;
//     const [loading, setLoading] = useState(currentUser?.role === 'Admin');
//     const [busy, setBusy] = useState(false);
//     const [notice, setNotice] = useState(null);
//     const [passwords, setPasswords] = useState({
//         currentPassword: '',
//         newPassword: '',
//         confirmPassword: ''
//     });
//     const isAdmin = currentUser?.role === 'Admin';
//     const forcePasswordChange = Boolean(currentUser?.mustChangePassword);

//     useEffect(() => {
//         let active = true;
//         if (isAdmin) {
//             Promise.all([api.getUsers(), api.getPasswordResetRequests()])
//                 .then(([usersResponse, requestsResponse]) => {
//                     if (active) {
//                         setUsers(usersResponse.data);
//                         setPasswordResetRequests(requestsResponse.data);
//                     }
//                 })
//                 .catch(() => { if (active) setNotice({ error: true, text: 'Không tải được danh sách tài khoản.' }); }).finally(() => { if (active) setLoading(false); });
//         }
//         return () => { active = false; };
//     }, [isAdmin, currentUser?.id]);

//     async function reload() {
//         setLoading(true); setNotice(null);
//         try {
//             const [usersResponse, requestsResponse] = await Promise.all([
//                 api.getUsers(),
//                 api.getPasswordResetRequests()
//             ]);
//             setUsers(usersResponse.data);
//             setPasswordResetRequests(requestsResponse.data);
//         }
//         catch { setNotice({ error: true, text: 'Không tải được dữ liệu.' }); }
//         finally { setLoading(false); }
//     }

//     async function reviewPasswordResetRequest(request, decision) {
//         if (!isAdmin || busy) return;
//         const action = decision === 'approve' ? 'chấp nhận' : 'từ chối';
//         if (!window.confirm(`Bạn có chắc muốn ${action} yêu cầu của ${request.email}?`)) return;

//         setBusy(true);
//         setNotice(null);
//         try {
//             const response = decision === 'approve'
//                 ? await api.approvePasswordResetRequest(request.id)
//                 : await api.rejectPasswordResetRequest(request.id);
//             setPasswordResetRequests(previous =>
//                 previous.filter(item => item.id !== request.id)
//             );
//             setNotice({ text: response.data?.message || 'Đã xử lý yêu cầu.' });
//         } catch (error) {
//             setNotice({
//                 error: true,
//                 text: error.response?.data?.message || 'Không thể xử lý yêu cầu đổi mật khẩu.'
//             });
//         } finally {
//             setBusy(false);
//         }
//     }

//     async function changeRole(user, newRole) {
//         if (!isAdmin || busy || String(user.id) === String(currentUser.id) || newRole === user.role) return;
//         if (!window.confirm(`Đổi quyền của “${user.fullName}” sang ${roles[newRole]}?`)) return;
//         setBusy(true); setNotice(null);
//         try {
//             await api.updateUserRole(user.id, { role: newRole });
//             setUsers(previous => previous.map(item => item.id === user.id ? { ...item, role: newRole } : item));
//             setNotice({
//                 text: newRole === 'Staff'
//                     ? 'Đã chuyển tài khoản sang Nhân viên. Người dùng cần đăng nhập lại; lần đăng nhập tiếp theo sẽ mở trang nhân viên.'
//                     : 'Đã cập nhật quyền.'
//             });
//         } catch { setNotice({ error: true, text: 'Cập nhật thất bại.' }); }
//         finally { setBusy(false); }
//     }

//     async function deleteUser(user) {
//         if (!isAdmin || busy || String(user.id) === String(currentUser.id)) return;
//         if (!user.isActive) return;
//         if (!window.confirm(`Vô hiệu hóa tài khoản “${user.fullName}”? Tài khoản không thể đăng nhập, nhưng lịch sử đơn hàng sẽ được giữ lại.`)) return;
//         setBusy(true); setNotice(null);
//         try {
//             const response = await api.deleteUser(user.id);
//             setUsers(previous => previous.map(item =>
//                 item.id === user.id ? { ...item, isActive: false } : item
//             ));
//             setNotice({ text: response.data.message || 'Đã vô hiệu hóa tài khoản.' });
//         } catch (error) {
//             setNotice({
//                 error: true,
//                 text: error.response?.data?.message || 'Không vô hiệu hóa được tài khoản.'
//             });
//         }
//         finally { setBusy(false); }
//     }

//     async function updateProfile(event) {
//         event.preventDefault();
//         if (busy) return;

//         const updatedProfile = {
//             fullName: profile.fullName.trim(),
//             email: profile.email.trim(),
//             phone: profile.phone.trim(),
//             gender: profile.gender,
//             dateOfBirth: profile.dateOfBirth || null
//         };
//         if (!isVietnamesePhoneNumber(updatedProfile.phone)) {
//             setNotice({ error: true, text: 'Vui lòng nhập số điện thoại Việt Nam hợp lệ.' });
//             return;
//         }

//         setBusy(true);
//         setNotice(null);
//         try {
//             const response = await api.updateProfile(currentUser.id, updatedProfile);
//             const savedUser = response.data?.user || {};
//             const updatedUser = { ...currentUser, ...updatedProfile, ...savedUser };
//             onUserUpdated(updatedUser);
//             setProfile({
//                 fullName: updatedUser.fullName,
//                 email: updatedUser.email,
//                 phone: updatedUser.phone || '',
//                 gender: updatedUser.gender || '',
//                 dateOfBirth: updatedUser.dateOfBirth || ''
//             });
//             setIsEditingProfile(false);
//             setNotice({ text: response.data?.message || 'Đã cập nhật thông tin cá nhân.' });
//         } catch (error) {
//             setNotice({
//                 error: true,
//                 text: profileUpdateErrorMessage(error)
//             });
//         } finally {
//             setBusy(false);
//         }
//     }

//     async function changePassword(event) {
//         event.preventDefault();
//         if (busy) return;

//         if (passwords.newPassword.length < 8) {
//             setNotice({ error: true, text: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
//             return;
//         }
//         if (passwords.newPassword !== passwords.confirmPassword) {
//             setNotice({ error: true, text: 'Mật khẩu xác nhận không khớp.' });
//             return;
//         }
//         if (passwords.currentPassword === passwords.newPassword) {
//             setNotice({ error: true, text: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
//             return;
//         }

//         setBusy(true);
//         setNotice(null);
//         try {
//             const response = await api.changePassword(currentUser.id, {
//                 currentPassword: passwords.currentPassword,
//                 newPassword: passwords.newPassword
//             });
//             onUserUpdated(
//                 response.data?.user || { ...currentUser, mustChangePassword: false },
//                 response.data?.token
//             );
//             setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
//             setNotice({ text: response.data?.message || 'Đổi mật khẩu thành công.' });
//         } catch (error) {
//             setNotice({
//                 error: true,
//                 text: error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu hiện tại và thử lại.'
//             });
//         } finally {
//             setBusy(false);
//         }
//     }

//     if (!currentUser) return <div className="acc2-login"><span>◈</span><h2>Không gian tài khoản</h2><p>Vui lòng đăng nhập.</p></div>;

//     const filtered = users.filter(user => (!role || user.role === role) && `${user.fullName} ${user.email} ${user.id}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
//     const pages = Math.max(1, Math.ceil(filtered.length / 8));
//     const currentPage = Math.min(page, pages);
//     const visible = filtered.slice((currentPage - 1) * 8, currentPage * 8);
//     const management = isAdmin && tab === 'manage_users';

//     return (
//         <div className={`acc2-page${forcePasswordChange ? ' acc2-password-required' : ''}`}>
//             <div className="acc2-top">
//                 <div>
//                     <p className="acc2-eyebrow"></p>
//                     <h1>
//                         {forcePasswordChange
//                             ? 'Đổi mật khẩu bắt buộc'
//                             : management
//                             ? 'Nhân sự & phân quyền'
//                             : isAdmin && tab === 'manage_employees'
//                                 ? 'Quản lý nhân viên'
//                                 : 'Không gian tài khoản'}
//                     </h1>

//                     <p>
//                         {forcePasswordChange
//                             ? 'Bạn cần tạo mật khẩu mới trước khi tiếp tục sử dụng hệ thống.'
//                             : management
//                             ? 'Quản lý thành viên và vai trò trong cửa hàng.'
//                             : isAdmin && tab === 'manage_employees'
//                                 ? 'Thêm, chỉnh sửa, phân quyền và xem nhật ký hoạt động nhân viên.'
//                                 : 'Thông tin cá nhân và hoạt động của bạn.'}
//                     </p>

//                 </div>
//                 <span className="acc2-top-tag">✿ Cùng cửa hàng phát triển</span>
//             </div>

//             <div className={`acc2-layout${forcePasswordChange ? ' acc2-password-required' : ''}`}>
//                 <aside className="acc2-sidebar">
//                     <div className="acc2-person">
//                         <div className="acc2-avatar large">{initials(currentUser.fullName)}</div>
//                         <h2>{currentUser.fullName}</h2>
//                         <p>{currentUser.email}</p>
//                         {isAdmin && <span className="acc2-badge Admin">{roles[currentUser.role]}</span>}
//                     </div>

//                     {!forcePasswordChange && <nav aria-label="Tài khoản">
//                         <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
//                             <span>◉</span>Thông tin cá nhân
//                         </button>
//                         <button className={tab === 'change_password' ? 'active' : ''} onClick={() => { setTab('change_password'); setNotice(null); }}>
//                             <span>♙</span>Đổi mật khẩu
//                         </button>

//                         {isAdmin && (
//                             <>
//                                 <button className={tab === 'manage_users' ? 'active' : ''} onClick={() => setTab('manage_users')}>
//                                     <span>♧</span>Nhân sự & phân quyền
//                                 </button>

//                                 <button
//                                     className={tab === 'manage_employees' ? 'active' : ''}
//                                     onClick={() => {
//                                         setTab('manage_employees');
//                                         setNotice(null);
//                                     }}
//                                 >
//                                     <span>👥</span>Quản lý nhân viên
//                                 </button>
                       
//                                 {/* KHI BẤM NÚT NÀY SẼ GỌI onNavigateToAdmin ĐỂ CHUYỂN HẲN SANG TRANG QUẢN TRỊ */}
//                                 <button onClick={onNavigateToAdmin}>
//                                     <span>◫</span>Trang quản trị cửa hàng
//                                 </button>
//                             </>
//                         )}

//                         {currentUser.role === 'Staff' && (
//                             <button onClick={onNavigateToAdmin}>
//                                 <span>◫</span>Quản trị cửa hàng
//                             </button>
//                         )}

//                         {currentUser.role === 'Customer' && (
//                             <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
//                                 <span>▤</span>Đơn hàng của tôi
//                             </button>
//                         )}
//                     </nav>}

//                     <button className="acc2-logout" onClick={onLogout}>↪ Đăng xuất</button>
//                 </aside>

//                 <main className="acc2-main">
//                     {notice && (
//                         <div className={`acc2-notice ${notice.error ? 'error' : ''}`} role={notice.error ? 'alert' : 'status'}>
//                             {notice.text}
//                             <button aria-label="Đóng thông báo" onClick={() => setNotice(null)}>×</button>
//                         </div>
//                     )}
//                     {management ? (
//                         <>
//                             <section className="acc2-panel" aria-busy={loading || busy}>
//                                 <header className="acc2-panel-head">
//                                     <div><h2>Danh sách tài khoản <span>{users.length}</span></h2></div>
//                                     <button disabled={loading || busy} onClick={reload}>{loading ? 'Đang tải…' : '↻ Tải lại'}</button>
//                                 </header>
//                                 <div className="acc2-table-scroll">
//                                     <table>
//                                         <thead><tr><th>THÀNH VIÊN</th><th>VAI TRÒ</th><th>PHÂN QUYỀN</th><th>THAO TÁC</th></tr></thead>
//                                         <tbody>
//                                             {visible.map(user => {
//                                                 const self = String(user.id) === String(currentUser.id);
//                                                 return (
//                                                     <tr key={user.id}>
//                                                         <td>
//                                                             <div className="acc2-member">
//                                                                 <span className="acc2-avatar">{initials(user.fullName)}</span>
//                                                                 <div>
//                                                                     <strong>{user.fullName} {self && <em>Bạn</em>}</strong>
//                                                                     <small>{user.email}</small>
//                                                                     <small>
//                                                                         {user.username} · {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
//                                                                         {user.mustChangePassword ? ' · Cần đổi mật khẩu' : ''}
//                                                                     </small>
//                                                                 </div>
//                                                             </div>
//                                                         </td>
//                                                         <td><span className={`acc2-badge ${user.role}`}>{roles[user.role] || user.role}</span></td>
//                                                         <td>
//                                                             <select disabled={self || busy || loading} value={user.role} onChange={e => changeRole(user, e.target.value)}>
//                                                                 {Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
//                                                             </select>
//                                                         </td>
//                                                         <td>
//                                                             <button className="acc2-delete" disabled={self || busy || loading || !user.isActive} onClick={() => deleteUser(user)}>{user.isActive ? 'Vô hiệu hóa' : 'Đã khóa'}</button>
//                                                         </td>
//                                                     </tr>
//                                                 );
//                                             })}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </section>
//                             <section className="acc2-panel acc2-reset-requests">
//                                 <header className="acc2-panel-head">
//                                     <div>
//                                         <h2>Yêu cầu đổi mật khẩu <span>{passwordResetRequests.length}</span></h2>
//                                         <p>Chấp nhận yêu cầu sẽ thay đổi mật khẩu tài khoản ngay lập tức.</p>
//                                     </div>
//                                 </header>
//                                 {passwordResetRequests.length === 0 ? (
//                                     <div className="acc2-empty"><p>Hiện không có yêu cầu đang chờ duyệt.</p></div>
//                                 ) : (
//                                     <div className="acc2-table-scroll">
//                                         <table>
//                                             <thead><tr><th>TÀI KHOẢN</th><th>THỜI GIAN</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead>
//                                             <tbody>
//                                                 {passwordResetRequests.map(request => (
//                                                     <tr key={request.id}>
//                                                         <td>
//                                                             <div className="acc2-member">
//                                                                 <span className="acc2-avatar">{initials(request.fullName)}</span>
//                                                                 <div><strong>{request.fullName}</strong><small>{request.email}</small></div>
//                                                             </div>
//                                                         </td>
//                                                         <td>{new Date(request.createdAtUtc).toLocaleString('vi-VN')}</td>
//                                                         <td><span className="acc2-reset-pending">Chờ duyệt</span></td>
//                                                         <td>
//                                                             <div className="acc2-reset-actions">
//                                                                 <button disabled={busy || loading} onClick={() => reviewPasswordResetRequest(request, 'approve')}>Chấp nhận</button>
//                                                                 <button className="acc2-delete" disabled={busy || loading} onClick={() => reviewPasswordResetRequest(request, 'reject')}>Từ chối</button>
//                                                             </div>
//                                                         </td>
//                                                     </tr>
//                                                 ))}
//                                             </tbody>
//                                         </table>
//                                     </div>
//                                 )}
//                             </section>
//                         </>

//                     ) : isAdmin && tab === 'manage_employees' ? (
//                         <EmployeeManagement />
//                     ) : tab === 'change_password' ? (

//                         <section className="acc2-panel">
//                             <header className="acc2-panel-head">
//                                 <div>
//                                     <h2>Đổi mật khẩu</h2>
//                                     <p>{forcePasswordChange
//                                         ? 'Đổi mật khẩu ban đầu trước khi tiếp tục sử dụng hệ thống.'
//                                         : 'Nhập mật khẩu hiện tại để xác nhận thay đổi bảo mật tài khoản.'}</p>
//                                 </div>
//                             </header>
//                             <form className="acc2-password-form" onSubmit={changePassword}>
//                                 <label>
//                                     Mật khẩu hiện tại
//                                     <input
//                                         type="password"
//                                         autoComplete="current-password"
//                                         required
//                                         value={passwords.currentPassword}
//                                         onChange={event => setPasswords(previous => ({ ...previous, currentPassword: event.target.value }))}
//                                     />
//                                 </label>
//                                 <label>
//                                     Mật khẩu mới
//                                     <input
//                                         type="password"
//                                         autoComplete="new-password"
//                                         minLength={8}
//                                         required
//                                         value={passwords.newPassword}
//                                         onChange={event => setPasswords(previous => ({ ...previous, newPassword: event.target.value }))}
//                                     />
//                                 </label>
//                                 <label>
//                                     Xác nhận mật khẩu mới
//                                     <input
//                                         type="password"
//                                         autoComplete="new-password"
//                                         minLength={8}
//                                         required
//                                         value={passwords.confirmPassword}
//                                         onChange={event => setPasswords(previous => ({ ...previous, confirmPassword: event.target.value }))}
//                                     />
//                                 </label>
//                                 <p className="acc2-password-help">Mật khẩu mới cần có ít nhất 8 ký tự.</p>
//                                 <button className="acc2-password-submit" type="submit" disabled={busy}>
//                                     {busy ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
//                                 </button>
//                             </form>
//                         </section>
//                     ) : tab === 'profile' ? (
//                         <section className="acc2-panel">
//                             <header className="acc2-panel-head">
//                                 <div>
//                                     <h2>Thông tin cá nhân</h2>
//                                     <p>Xem và cập nhật thông tin liên hệ của bạn.</p>
//                                 </div>
//                                 {!isEditingProfile && (
//                                     <button type="button" onClick={() => { setIsEditingProfile(true); setNotice(null); }}>
//                                         Chỉnh sửa
//                                     </button>
//                                 )}
//                             </header>
//                             <div className="acc2-profile-banner">
//                                 <span>HỒ SƠ CỦA BẠN</span>
//                                 <h2>Xin chào, {currentUser.fullName}!</h2>
//                                 <p>Thông tin này được sử dụng để liên hệ và hỗ trợ đơn hàng.</p>
//                             </div>
//                             {isEditingProfile ? (
//                                 <form className="acc2-profile-form" onSubmit={updateProfile}>
//                                     <label>
//                                         Họ và tên
//                                         <input
//                                             type="text"
//                                             autoComplete="name"
//                                             required
//                                             maxLength={100}
//                                             value={profile.fullName}
//                                             onChange={event => setProfile(previous => ({ ...previous, fullName: event.target.value }))}
//                                         />
//                                     </label>
//                                     <label>
//                                         Email
//                                         <input
//                                             type="email"
//                                             autoComplete="email"
//                                             required
//                                             maxLength={254}
//                                             value={profile.email}
//                                             onChange={event => setProfile(previous => ({ ...previous, email: event.target.value }))}
//                                         />
//                                     </label>
//                                     <label>
//                                         Số điện thoại
//                                         <input
//                                             type="tel"
//                                             autoComplete="tel"
//                                             inputMode="tel"
//                                             required
//                                             maxLength={20}
//                                             placeholder="0912 345 678"
//                                             value={profile.phone}
//                                             onChange={event => setProfile(previous => ({ ...previous, phone: event.target.value }))}
//                                         />
//                                     </label>
//                                     <label>
//                                         Giới tính
//                                         <select
//                                             required
//                                             value={profile.gender}
//                                             onChange={event => setProfile(previous => ({ ...previous, gender: event.target.value }))}
//                                         >
//                                             <option value="" disabled>Chọn giới tính</option>
//                                             {genders.map(gender => <option key={gender} value={gender}>{gender}</option>)}
//                                         </select>
//                                     </label>
//                                     <label>
//                                         Ngày sinh
//                                         <input
//                                             type="date"
//                                             max={new Date().toISOString().slice(0, 10)}
//                                             value={profile.dateOfBirth}
//                                             onChange={event => setProfile(previous => ({ ...previous, dateOfBirth: event.target.value }))}
//                                         />
//                                     </label>
//                                     {isAdmin && (
//                                         <div className="acc2-profile-readonly">
//                                             <small>Vai trò</small>
//                                             <strong>{roles[currentUser.role] || currentUser.role}</strong>
//                                         </div>
//                                     )}
//                                     <div className="acc2-profile-actions">
//                                         <button type="button" disabled={busy} onClick={() => {
//                                             setProfile({
//                                                 fullName: currentUser.fullName || '',
//                                                 email: currentUser.email || '',
//                                                 phone: currentUser.phone || '',
//                                                 gender: currentUser.gender || '',
//                                                 dateOfBirth: currentUser.dateOfBirth || ''
//                                             });
//                                             setIsEditingProfile(false);
//                                             setNotice(null);
//                                         }}>
//                                             Hủy
//                                         </button>
//                                         <button className="acc2-password-submit" type="submit" disabled={busy}>
//                                             {busy ? 'Đang cập nhật…' : 'Lưu thay đổi'}
//                                         </button>
//                                     </div>
//                                 </form>
//                             ) : (
//                                 <div className="acc2-profile-fields">
//                                     {[
//                                         ['Họ và tên', currentUser.fullName],
//                                         ['Email', currentUser.email],
//                                         ['Số điện thoại', currentUser.phone || 'Chưa cập nhật'],
//                                         ['Giới tính', currentUser.gender || 'Chưa cập nhật'],
//                                         ['Ngày sinh', formatDateOfBirth(currentUser.dateOfBirth)],
//                                         ...(isAdmin ? [['Vai trò', roles[currentUser.role] || currentUser.role]] : [])
//                                     ].map(([label, value]) => (
//                                         <div key={label}><small>{label}</small><strong>{value}</strong></div>
//                                     ))}
//                                 </div>
//                             )}
//                         </section>
//                     ) : (
//                         <Orders currentUser={currentUser} onBuyAgain={onBuyAgain} embedded={true} />
//                     )}
//                 </main>
//             </div>
//         </div>
//     );
// }

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './Account.css';
import Orders from './Orders';
import Wishlist from './Wishlist';
import Vouchers from './Vouchers';
import EmployeeManagement from './EmployeeManagement';

const roles = { Admin: 'Quản trị viên', Staff: 'Nhân viên', Customer: 'Khách hàng' };
const genders = ['Nam', 'Nữ', 'Khác', 'Không muốn tiết lộ'];
const initials = name => (name || '?').trim().split(/\s+/).slice(-2).map(word => word[0]).join('').toUpperCase();
const orderStatuses = {
    Pending: 'Chờ xác nhận',
    Processing: 'Đang xử lý',
    Shipping: 'Đang giao hàng',
    Completed: 'Hoàn thành',
    Cancelled: 'Đã hủy'
};
const normalizeOrderStatus = status => {
    const value = String(status ?? '');
    const matchingStatus = Object.keys(orderStatuses).find(
        option => option.toLowerCase() === value.toLowerCase()
    );
    return matchingStatus || ({ '0': 'Pending', '1': 'Processing', '2': 'Shipping', '3': 'Completed', '4': 'Cancelled' })[value] || value;
};
const formatAccountDate = value => {
    if (!value) return 'Chưa cập nhật';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Chưa cập nhật' : date.toLocaleString('vi-VN');
};
const formatMoney = value => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const formatDateOfBirth = date => {
    if (!date) return 'Chưa cập nhật';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
};
const isVietnamesePhoneNumber = phone => /^(?:0(?:3|5|7|8|9)\d{8}|02\d{8,9}|\+84(?:3|5|7|8|9)\d{8}|\+842\d{8,9})$/.test(phone.trim().replace(/[\s().-]/g, ''));
const profileUpdateErrorMessage = error => {
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data?.message || data?.detail || data?.title) {
        return data.message || data.detail || data.title;
    }
    if (data?.errors && typeof data.errors === 'object') {
        return Object.values(data.errors).flat().join(' ');
    }
    if (error.response?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (error.response?.status === 403) return 'Bạn không có quyền cập nhật thông tin này.';
    if (error.response) return `Máy chủ từ chối cập nhật (HTTP ${error.response.status}).`;
    return 'Không kết nối được máy chủ. Vui lòng kiểm tra backend và địa chỉ API.';
};

export default function Account({
    currentUser,
    onLogout,
    onNavigateToAdmin,
    onUserUpdated,
    onBuyAgain,
    wishlistItems = [],
    onViewDetail,
    onBuyNow,
    onRemoveWishlist,
    onBrowseProducts,
    onUseVoucher
}) {
    const [tab, setTab] = useState(
        currentUser?.mustChangePassword ? 'change_password' : 'profile'
    );
    const [users, setUsers] = useState([]);
    const [passwordResetRequests, setPasswordResetRequests] = useState([]);
    const [profile, setProfile] = useState({
        fullName: currentUser?.fullName || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        gender: currentUser?.gender || '',
        dateOfBirth: currentUser?.dateOfBirth || ''
    });
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userOrders, setUserOrders] = useState([]);
    const [userOrdersLoading, setUserOrdersLoading] = useState(false);
    const [userOrdersError, setUserOrdersError] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
    const [orderDetailLoading, setOrderDetailLoading] = useState(false);
    const [orderDetailError, setOrderDetailError] = useState('');
    const [loading, setLoading] = useState(currentUser?.role === 'Admin');
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null);
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const isAdmin = currentUser?.role === 'Admin';
    const forcePasswordChange = Boolean(currentUser?.mustChangePassword);

    function openUserDetails(user) {
        setSelectedOrderId(null);
        setSelectedOrderDetail(null);
        setOrderDetailLoading(false);
        setOrderDetailError('');
        setSelectedUser(user);
        setUserOrders([]);
        setUserOrdersError('');
        setUserOrdersLoading(user.role === 'Customer');
    }

    function closeUserDetails() {
        setSelectedUser(null);
        setUserOrdersLoading(false);
        setSelectedOrderId(null);
        setSelectedOrderDetail(null);
        setOrderDetailLoading(false);
        setOrderDetailError('');
    }

    function openOrderDetails(orderId) {
        setSelectedOrderId(orderId);
        setSelectedOrderDetail(null);
        setOrderDetailError('');
        setOrderDetailLoading(true);
    }

    function closeOrderDetails() {
        setSelectedOrderId(null);
        setSelectedOrderDetail(null);
        setOrderDetailLoading(false);
        setOrderDetailError('');
    }

    useEffect(() => {
        if (selectedUser?.role !== 'Customer') return undefined;
        let active = true;
        api.getOrders({ userId: selectedUser.id })
            .then(response => {
                if (!active) return;
                if (!Array.isArray(response.data)) {
                    setUserOrdersError('Dữ liệu lịch sử đơn hàng không hợp lệ.');
                    return;
                }
                setUserOrders(response.data);
            })
            .catch(() => {
                if (active) setUserOrdersError('Không tải được lịch sử đơn hàng của khách hàng.');
            })
            .finally(() => {
                if (active) setUserOrdersLoading(false);
            });
        return () => { active = false; };
    }, [selectedUser]);

    useEffect(() => {
        if (selectedOrderId === null) return undefined;
        let active = true;
        api.getOrderById(selectedOrderId)
            .then(response => {
                if (active) setSelectedOrderDetail(response.data);
            })
            .catch(error => {
                if (!active) return;
                setOrderDetailError(error.response?.status === 404
                    ? 'Không tìm thấy đơn hàng này.'
                    : 'Không tải được chi tiết đơn hàng.');
            })
            .finally(() => {
                if (active) setOrderDetailLoading(false);
            });
        return () => { active = false; };
    }, [selectedOrderId]);

    useEffect(() => {
        let active = true;
        if (isAdmin) {
            Promise.all([api.getUsers(), api.getPasswordResetRequests()])
                .then(([usersResponse, requestsResponse]) => {
                    if (active) {
                        setUsers(usersResponse.data);
                        setPasswordResetRequests(requestsResponse.data);
                    }
                })
                .catch(() => { if (active) setNotice({ error: true, text: 'Không tải được danh sách tài khoản.' }); }).finally(() => { if (active) setLoading(false); });
        }
        return () => { active = false; };
    }, [isAdmin, currentUser?.id]);

    async function reload() {
        setLoading(true); setNotice(null);
        try {
            const [usersResponse, requestsResponse] = await Promise.all([
                api.getUsers(),
                api.getPasswordResetRequests()
            ]);
            setUsers(usersResponse.data);
            setPasswordResetRequests(requestsResponse.data);
        }
        catch { setNotice({ error: true, text: 'Không tải được dữ liệu.' }); }
        finally { setLoading(false); }
    }

    async function reviewPasswordResetRequest(request, decision) {
        if (!isAdmin || busy) return;
        const action = decision === 'approve' ? 'chấp nhận' : 'từ chối';
        if (!window.confirm(`Bạn có chắc muốn ${action} yêu cầu của ${request.email}?`)) return;

        setBusy(true);
        setNotice(null);
        try {
            const response = decision === 'approve'
                ? await api.approvePasswordResetRequest(request.id)
                : await api.rejectPasswordResetRequest(request.id);
            setPasswordResetRequests(previous =>
                previous.filter(item => item.id !== request.id)
            );
            setNotice({ text: response.data?.message || 'Đã xử lý yêu cầu.' });
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không thể xử lý yêu cầu đổi mật khẩu.'
            });
        } finally {
            setBusy(false);
        }
    }

    async function changeRole(user, newRole) {
        if (!isAdmin || busy || String(user.id) === String(currentUser.id) || newRole === user.role) return;
        if (!window.confirm(`Đổi quyền của “${user.fullName}” sang ${roles[newRole]}?`)) return;
        setBusy(true); setNotice(null);
        try {
            await api.updateUserRole(user.id, { role: newRole });
            setUsers(previous => previous.map(item => item.id === user.id ? { ...item, role: newRole } : item));
            setNotice({
                text: newRole === 'Staff'
                    ? 'Đã chuyển tài khoản sang Nhân viên. Người dùng cần đăng nhập lại; lần đăng nhập tiếp theo sẽ mở trang nhân viên.'
                    : 'Đã cập nhật quyền.'
            });
        } catch { setNotice({ error: true, text: 'Cập nhật thất bại.' }); }
        finally { setBusy(false); }
    }

    async function deleteUser(user) {
        if (!isAdmin || busy || String(user.id) === String(currentUser.id)) return;
        if (!user.isActive) return;
        if (!window.confirm(`Vô hiệu hóa tài khoản “${user.fullName}”? Tài khoản không thể đăng nhập, nhưng lịch sử đơn hàng sẽ được giữ lại.`)) return;
        setBusy(true); setNotice(null);
        try {
            const response = await api.deleteUser(user.id);
            setUsers(previous => previous.map(item =>
                item.id === user.id ? { ...item, isActive: false } : item
            ));
            setNotice({ text: response.data.message || 'Đã vô hiệu hóa tài khoản.' });
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không vô hiệu hóa được tài khoản.'
            });
        }
        finally { setBusy(false); }
    }

    async function updateProfile(event) {
        event.preventDefault();
        if (busy) return;

        const updatedProfile = {
            fullName: profile.fullName.trim(),
            email: profile.email.trim(),
            phone: profile.phone.trim(),
            gender: profile.gender,
            dateOfBirth: profile.dateOfBirth || null
        };
        if (!isVietnamesePhoneNumber(updatedProfile.phone)) {
            setNotice({ error: true, text: 'Vui lòng nhập số điện thoại Việt Nam hợp lệ.' });
            return;
        }

        setBusy(true);
        setNotice(null);
        try {
            const response = await api.updateProfile(currentUser.id, updatedProfile);
            const savedUser = response.data?.user || {};
            const updatedUser = { ...currentUser, ...updatedProfile, ...savedUser };
            onUserUpdated(updatedUser);
            setProfile({
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                phone: updatedUser.phone || '',
                gender: updatedUser.gender || '',
                dateOfBirth: updatedUser.dateOfBirth || ''
            });
            setIsEditingProfile(false);
            setNotice({ text: response.data?.message || 'Đã cập nhật thông tin cá nhân.' });
        } catch (error) {
            setNotice({
                error: true,
                text: profileUpdateErrorMessage(error)
            });
        } finally {
            setBusy(false);
        }
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
            onUserUpdated(
                response.data?.user || { ...currentUser, mustChangePassword: false },
                response.data?.token
            );
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

    const keyword = search.trim().toLocaleLowerCase('vi');
    const filtered = users.filter(user =>
        (!role || user.role === role) &&
        `${user.fullName || ''} ${user.email || ''} ${user.username || ''} ${user.id}`
            .toLocaleLowerCase('vi')
            .includes(keyword)
    );
    const pages = Math.max(1, Math.ceil(filtered.length / 8));
    const currentPage = Math.min(page, pages);
    const visible = filtered.slice((currentPage - 1) * 8, currentPage * 8);
    const management = isAdmin && tab === 'manage_users';

    return (
        <div className={`acc2-page${forcePasswordChange ? ' acc2-password-required' : ''}`}>
            <div className="acc2-top">
                <div>
                    <p className="acc2-eyebrow"></p>
                    <h1>
                        {forcePasswordChange
                            ? 'Đổi mật khẩu bắt buộc'
                            : management
                            ? 'Nhân sự & phân quyền'
                            : isAdmin && tab === 'manage_employees'
                                ? 'Quản lý nhân viên'
                                : 'Không gian tài khoản'}
                    </h1>

                    <p>
                        {forcePasswordChange
                            ? 'Bạn cần tạo mật khẩu mới trước khi tiếp tục sử dụng hệ thống.'
                            : management
                            ? 'Quản lý thành viên và vai trò trong cửa hàng.'
                            : isAdmin && tab === 'manage_employees'
                                ? 'Thêm, chỉnh sửa, phân quyền và xem nhật ký hoạt động nhân viên.'
                                : 'Thông tin cá nhân và hoạt động của bạn.'}
                    </p>
                </div>
                <span className="acc2-top-tag">✿ Cùng cửa hàng phát triển</span>
            </div>

            <div className={`acc2-layout${forcePasswordChange ? ' acc2-password-required' : ''}`}>
                <aside className="acc2-sidebar">
                    <div className="acc2-person">
                        <div className="acc2-avatar large">{initials(currentUser.fullName)}</div>
                        <h2>{currentUser.fullName}</h2>
                        <p>{currentUser.email}</p>
                        {isAdmin && <span className="acc2-badge Admin">{roles[currentUser.role]}</span>}
                    </div>

                    {!forcePasswordChange && <nav aria-label="Tài khoản">
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

                                <button
                                    className={tab === 'manage_employees' ? 'active' : ''}
                                    onClick={() => {
                                        setTab('manage_employees');
                                        setNotice(null);
                                    }}
                                >
                                    <span>👥</span>Quản lý nhân viên
                                </button>

                                <button onClick={onNavigateToAdmin}>
                                    <span>◫</span>Trang quản trị cửa hàng
                                </button>
                            </>
                        )}

                        {currentUser.role === 'Staff' && (
                            <button onClick={onNavigateToAdmin}>
                                <span>◫</span>Quản trị cửa hàng
                            </button>
                        )}

                        {currentUser.role === 'Customer' && (
                            <>
                                <button className={tab === 'orders' ? 'active' : ''} onClick={() => { setTab('orders'); setNotice(null); }}>
                                    <span>▤</span>Đơn hàng của tôi
                                </button>

                                <button className={tab === 'wishlist' ? 'active' : ''} onClick={() => { setTab('wishlist'); setNotice(null); }}>
                                    <span>♡</span>Sản phẩm yêu thích
                                    {wishlistItems.length > 0 && (
                                        <span className="acc2-nav-badge">{wishlistItems.length}</span>
                                    )}
                                </button>

                                <button className={tab === 'vouchers' ? 'active' : ''} onClick={() => { setTab('vouchers'); setNotice(null); }}>
                                    <span>🎟</span>Ví Voucher
                                </button>
                            </>
                        )}
                    </nav>}

                    <button className="acc2-logout" onClick={onLogout}>↪ Đăng xuất</button>
                </aside>

                <main className="acc2-main">
                    {notice && (
                        <div className={`acc2-notice ${notice.error ? 'error' : ''}`} role={notice.error ? 'alert' : 'status'}>
                            {notice.text}
                            <button aria-label="Đóng thông báo" onClick={() => setNotice(null)}>×</button>
                        </div>
                    )}
                    {management ? selectedUser ? (
                        <section className="acc2-panel acc2-account-detail" aria-busy={userOrdersLoading}>
                            <header className="acc2-panel-head">
                                <div>
                                    <h2>Chi tiết tài khoản</h2>
                                    <p>Thông tin hồ sơ và trạng thái tài khoản.</p>
                                </div>
                                <button type="button" onClick={closeUserDetails}>← Quay lại danh sách</button>
                            </header>
                            <div className="acc2-account-summary">
                                <span className="acc2-avatar large">{initials(selectedUser.fullName)}</span>
                                <div>
                                    <h3>{selectedUser.fullName || 'Chưa cập nhật'}</h3>
                                    <span className={`acc2-badge ${selectedUser.role}`}>
                                        {roles[selectedUser.role] || selectedUser.role}
                                    </span>
                                </div>
                            </div>
                            <dl className="acc2-account-fields">
                                {[
                                    ['Mã tài khoản', selectedUser.id],
                                    ['Tên đăng nhập', selectedUser.username || 'Chưa cập nhật'],
                                    ['Email', selectedUser.email || 'Chưa cập nhật'],
                                    ['Số điện thoại', selectedUser.phone || 'Chưa cập nhật'],
                                    ['Giới tính', selectedUser.gender || 'Chưa cập nhật'],
                                    ['Ngày sinh', formatDateOfBirth(selectedUser.dateOfBirth)],
                                    ['Trạng thái', selectedUser.isActive ? 'Đang hoạt động' : 'Đã khóa'],
                                    ['Ngày tạo', formatAccountDate(selectedUser.createdAtUtc || selectedUser.createdAt)],
                                    ['Đổi mật khẩu', selectedUser.mustChangePassword ? 'Cần đổi mật khẩu' : 'Không yêu cầu']
                                ].map(([label, value]) => (
                                    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                                ))}
                            </dl>
                            {selectedUser.role === 'Customer' && (
                                <section className="acc2-customer-orders">
                                    <header className="acc2-panel-head">
                                        <div>
                                            <h3>Lịch sử đơn hàng</h3>
                                            {!userOrdersLoading && !userOrdersError && <p>{userOrders.length} đơn hàng</p>}
                                        </div>
                                    </header>
                                    {userOrdersLoading ? (
                                        <p className="acc2-empty" role="status">Đang tải lịch sử đơn hàng…</p>
                                    ) : userOrdersError ? (
                                        <p className="acc2-empty" role="alert">{userOrdersError}</p>
                                    ) : userOrders.length ? (
                                        <div className="acc2-table-scroll">
                                            <table>
                                                <thead><tr><th>MÃ ĐƠN</th><th>NGÀY ĐẶT</th><th>SỐ MÓN</th><th>TỔNG TIỀN</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead>
                                                <tbody>
                                                    {userOrders.map(order => {
                                                        const normalizedStatus = normalizeOrderStatus(order.status);
                                                        return <tr key={order.id}>
                                                            <td><strong>#{order.id}</strong></td>
                                                            <td>{formatAccountDate(order.orderDate)}</td>
                                                            <td>{order.itemCount ?? order.items?.length ?? '—'}</td>
                                                            <td><strong>{formatMoney(order.totalPrice)}</strong></td>
                                                            <td>{orderStatuses[normalizedStatus] || normalizedStatus || 'Chưa xác định'}</td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    className="acc2-order-view"
                                                                    disabled={orderDetailLoading}
                                                                    onClick={() => openOrderDetails(order.id)}
                                                                >
                                                                    {orderDetailLoading && selectedOrderId === order.id ? 'Đang tải…' : 'Xem chi tiết'}
                                                                </button>
                                                            </td>
                                                        </tr>;
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="acc2-empty">Khách hàng chưa có đơn hàng nào.</p>
                                    )}
                                    {selectedOrderId !== null && (
                                        <section className="acc2-order-detail" aria-busy={orderDetailLoading}>
                                            <header className="acc2-panel-head">
                                                <div>
                                                    <h3>Chi tiết đơn hàng #{selectedOrderId}</h3>
                                                    {selectedOrderDetail && <p>Đặt lúc {formatAccountDate(selectedOrderDetail.orderDate)}</p>}
                                                </div>
                                                <button type="button" onClick={closeOrderDetails}>Đóng chi tiết</button>
                                            </header>
                                            {orderDetailLoading ? (
                                                <p className="acc2-empty" role="status">Đang tải chi tiết đơn hàng…</p>
                                            ) : orderDetailError ? (
                                                <p className="acc2-empty" role="alert">{orderDetailError}</p>
                                            ) : selectedOrderDetail && (() => {
                                                const items = Array.isArray(selectedOrderDetail.items)
                                                    ? selectedOrderDetail.items
                                                    : [];
                                                const subtotal = items.reduce((sum, item) =>
                                                    sum + Number(item.lineTotal ?? Number(item.price || 0) * Number(item.quantity || 0)), 0
                                                );
                                                const extra = Number(selectedOrderDetail.totalPrice || 0) - subtotal;
                                                const shippingFee = selectedOrderDetail.shippingFee ?? Math.max(0, extra);
                                                const normalizedStatus = normalizeOrderStatus(selectedOrderDetail.status);

                                                return <>
                                                    <div className="acc2-order-info">
                                                        <div><small>Khách hàng</small><strong>{selectedOrderDetail.customerName || selectedUser.fullName}</strong><p>{selectedOrderDetail.customerEmail || selectedUser.email}</p></div>
                                                        <div><small>Trạng thái</small><strong>{orderStatuses[normalizedStatus] || normalizedStatus || 'Chưa xác định'}</strong></div>
                                                        <div><small>Tổng tiền</small><strong>{formatMoney(selectedOrderDetail.totalPrice)}</strong></div>
                                                        <div className="acc2-order-shipping">
                                                            <small>Thông tin giao hàng</small>
                                                            <p><span>Địa chỉ</span><strong>{selectedOrderDetail.shippingAddress || '—'}</strong></p>
                                                            <p><span>Người nhận</span><strong>{selectedOrderDetail.recipientName || selectedOrderDetail.customerName || selectedUser.fullName}</strong></p>
                                                            <p><span>Số điện thoại</span><strong>{selectedOrderDetail.phone || '—'}</strong></p>
                                                            <p><span>Ghi chú</span><strong>{selectedOrderDetail.note || '—'}</strong></p>
                                                            <p><span>Phí vận chuyển</span><strong>{formatMoney(shippingFee)}</strong></p>
                                                        </div>
                                                    </div>
                                                    <div className="acc2-table-scroll acc2-order-items">
                                                        <table>
                                                            <thead><tr><th>SẢN PHẨM</th><th>ĐƠN GIÁ</th><th>SỐ LƯỢNG</th><th>THÀNH TIỀN</th></tr></thead>
                                                            <tbody>
                                                                {items.map(item => (
                                                                    <tr key={item.id}>
                                                                        <td><strong>{item.productName || `Sản phẩm #${item.productId}`}</strong></td>
                                                                        <td>{formatMoney(item.price)}{item.unit && ` / ${item.unit}`}</td>
                                                                        <td>{item.quantity}</td>
                                                                        <td><strong>{formatMoney(item.lineTotal ?? Number(item.price || 0) * Number(item.quantity || 0))}</strong></td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot>
                                                                <tr><td colSpan="3">Tạm tính</td><td>{formatMoney(subtotal)}</td></tr>
                                                                <tr><td colSpan="3">Phí vận chuyển</td><td>{formatMoney(shippingFee)}</td></tr>
                                                                <tr><td colSpan="3"><strong>Tổng cộng</strong></td><td><strong>{formatMoney(selectedOrderDetail.totalPrice)}</strong></td></tr>
                                                            </tfoot>
                                                        </table>
                                                        {!items.length && <p className="acc2-empty">Đơn hàng này chưa có sản phẩm nào.</p>}
                                                    </div>
                                                </>;
                                            })()}
                                        </section>
                                    )}
                                </section>
                            )}
                        </section>
                    ) : (
                        <>
                            <section className="acc2-panel" aria-busy={loading || busy}>
                                <header className="acc2-panel-head">
                                    <div><h2>Danh sách tài khoản <span>{filtered.length}</span></h2></div>
                                    <button disabled={loading || busy} onClick={reload}>{loading ? 'Đang tải…' : '↻ Tải lại'}</button>
                                </header>
                                <div className="acc2-toolbar">
                                    <input
                                        type="search"
                                        aria-label="Tìm tài khoản"
                                        placeholder="Tìm theo tên, email, tên đăng nhập hoặc mã tài khoản…"
                                        value={search}
                                        onChange={event => { setSearch(event.target.value); setPage(1); }}
                                    />
                                    <select
                                        aria-label="Lọc theo vai trò"
                                        value={role}
                                        onChange={event => { setRole(event.target.value); setPage(1); }}
                                    >
                                        <option value="">Tất cả vai trò</option>
                                        {Object.entries(roles).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
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
                                                                <div>
                                                                    <strong>{user.fullName} {self && <em>Bạn</em>}</strong>
                                                                    <small>{user.email}</small>
                                                                    <small>
                                                                        {user.username} · {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                                                                        {user.mustChangePassword ? ' · Cần đổi mật khẩu' : ''}
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td><span className={`acc2-badge ${user.role}`}>{roles[user.role] || user.role}</span></td>
                                                        <td>
                                                            <select disabled={self || busy || loading} value={user.role} onChange={e => changeRole(user, e.target.value)}>
                                                                {Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <div className="acc2-account-actions">
                                                                <button type="button" onClick={() => openUserDetails(user)}>Xem chi tiết</button>
                                                                <button className="acc2-delete" disabled={self || busy || loading || !user.isActive} onClick={() => deleteUser(user)}>{user.isActive ? 'Vô hiệu hóa' : 'Đã khóa'}</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {!visible.length && <p className="acc2-empty">{loading ? 'Đang tải tài khoản…' : 'Không tìm thấy tài khoản phù hợp.'}</p>}
                                </div>
                                <div className="acc2-pagination">
                                    <span>Trang {currentPage} / {pages}</span>
                                    <div>
                                        <button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>← Trước</button>
                                        <button type="button" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Sau →</button>
                                    </div>
                                </div>
                            </section>
                            <section className="acc2-panel acc2-reset-requests">
                                <header className="acc2-panel-head">
                                    <div>
                                        <h2>Yêu cầu đổi mật khẩu <span>{passwordResetRequests.length}</span></h2>
                                        <p>Chấp nhận yêu cầu sẽ thay đổi mật khẩu tài khoản ngay lập tức.</p>
                                    </div>
                                </header>
                                {passwordResetRequests.length === 0 ? (
                                    <div className="acc2-empty"><p>Hiện không có yêu cầu đang chờ duyệt.</p></div>
                                ) : (
                                    <div className="acc2-table-scroll">
                                        <table>
                                            <thead><tr><th>TÀI KHOẢN</th><th>THỜI GIAN</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead>
                                            <tbody>
                                                {passwordResetRequests.map(request => (
                                                    <tr key={request.id}>
                                                        <td>
                                                            <div className="acc2-member">
                                                                <span className="acc2-avatar">{initials(request.fullName)}</span>
                                                                <div><strong>{request.fullName}</strong><small>{request.email}</small></div>
                                                            </div>
                                                        </td>
                                                        <td>{new Date(request.createdAtUtc).toLocaleString('vi-VN')}</td>
                                                        <td><span className="acc2-reset-pending">Chờ duyệt</span></td>
                                                        <td>
                                                            <div className="acc2-reset-actions">
                                                                <button disabled={busy || loading} onClick={() => reviewPasswordResetRequest(request, 'approve')}>Chấp nhận</button>
                                                                <button className="acc2-delete" disabled={busy || loading} onClick={() => reviewPasswordResetRequest(request, 'reject')}>Từ chối</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        </>

                    ) : isAdmin && tab === 'manage_employees' ? (
                        <EmployeeManagement />
                    ) : tab === 'change_password' ? (

                        <section className="acc2-panel">
                            <header className="acc2-panel-head">
                                <div>
                                    <h2>Đổi mật khẩu</h2>
                                    <p>{forcePasswordChange
                                        ? 'Đổi mật khẩu ban đầu trước khi tiếp tục sử dụng hệ thống.'
                                        : 'Nhập mật khẩu hiện tại để xác nhận thay đổi bảo mật tài khoản.'}</p>
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
                            <header className="acc2-panel-head">
                                <div>
                                    <h2>Thông tin cá nhân</h2>
                                    <p>Xem và cập nhật thông tin liên hệ của bạn.</p>
                                </div>
                                {!isEditingProfile && (
                                    <button type="button" onClick={() => { setIsEditingProfile(true); setNotice(null); }}>
                                        Chỉnh sửa
                                    </button>
                                )}
                            </header>
                            <div className="acc2-profile-banner">
                                <span>HỒ SƠ CỦA BẠN</span>
                                <h2>Xin chào, {currentUser.fullName}!</h2>
                                <p>Thông tin này được sử dụng để liên hệ và hỗ trợ đơn hàng.</p>
                            </div>
                            {isEditingProfile ? (
                                <form className="acc2-profile-form" onSubmit={updateProfile}>
                                    <label>
                                        Họ và tên
                                        <input
                                            type="text"
                                            autoComplete="name"
                                            required
                                            maxLength={100}
                                            value={profile.fullName}
                                            onChange={event => setProfile(previous => ({ ...previous, fullName: event.target.value }))}
                                        />
                                    </label>
                                    <label>
                                        Email
                                        <input
                                            type="email"
                                            autoComplete="email"
                                            required
                                            maxLength={254}
                                            value={profile.email}
                                            onChange={event => setProfile(previous => ({ ...previous, email: event.target.value }))}
                                        />
                                    </label>
                                    <label>
                                        Số điện thoại
                                        <input
                                            type="tel"
                                            autoComplete="tel"
                                            inputMode="tel"
                                            required
                                            maxLength={20}
                                            placeholder="0912 345 678"
                                            value={profile.phone}
                                            onChange={event => setProfile(previous => ({ ...previous, phone: event.target.value }))}
                                        />
                                    </label>
                                    <label>
                                        Giới tính
                                        <select
                                            required
                                            value={profile.gender}
                                            onChange={event => setProfile(previous => ({ ...previous, gender: event.target.value }))}
                                        >
                                            <option value="" disabled>Chọn giới tính</option>
                                            {genders.map(gender => <option key={gender} value={gender}>{gender}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        Ngày sinh
                                        <input
                                            type="date"
                                            max={new Date().toISOString().slice(0, 10)}
                                            value={profile.dateOfBirth}
                                            onChange={event => setProfile(previous => ({ ...previous, dateOfBirth: event.target.value }))}
                                        />
                                    </label>
                                    {isAdmin && (
                                        <div className="acc2-profile-readonly">
                                            <small>Vai trò</small>
                                            <strong>{roles[currentUser.role] || currentUser.role}</strong>
                                        </div>
                                    )}
                                    <div className="acc2-profile-actions">
                                        <button type="button" disabled={busy} onClick={() => {
                                            setProfile({
                                                fullName: currentUser.fullName || '',
                                                email: currentUser.email || '',
                                                phone: currentUser.phone || '',
                                                gender: currentUser.gender || '',
                                                dateOfBirth: currentUser.dateOfBirth || ''
                                            });
                                            setIsEditingProfile(false);
                                            setNotice(null);
                                        }}>
                                            Hủy
                                        </button>
                                        <button className="acc2-password-submit" type="submit" disabled={busy}>
                                            {busy ? 'Đang cập nhật…' : 'Lưu thay đổi'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="acc2-profile-fields">
                                    {[
                                        ['Họ và tên', currentUser.fullName],
                                        ['Email', currentUser.email],
                                        ['Số điện thoại', currentUser.phone || 'Chưa cập nhật'],
                                        ['Giới tính', currentUser.gender || 'Chưa cập nhật'],
                                        ['Ngày sinh', formatDateOfBirth(currentUser.dateOfBirth)],
                                        ...(isAdmin ? [['Vai trò', roles[currentUser.role] || currentUser.role]] : [])
                                    ].map(([label, value]) => (
                                        <div key={label}><small>{label}</small><strong>{value}</strong></div>
                                    ))}
                                </div>
                            )}
                        </section>
                    ) : tab === 'wishlist' ? (
                        <Wishlist
                            wishlistItems={wishlistItems}
                            onViewDetail={onViewDetail}
                            onBuyNow={onBuyNow}
                            onRemoveWishlist={onRemoveWishlist}
                            onBrowseProducts={onBrowseProducts}
                            embedded={true}
                        />
                    ) : tab === 'vouchers' ? (
                        <Vouchers
                            currentUser={currentUser}
                            onUseVoucher={onUseVoucher}
                            embedded={true}
                        />
                    ) : (
                        <Orders currentUser={currentUser} onBuyAgain={onBuyAgain} embedded={true} />
                    )}
                </main>
            </div>
        </div>
    );
}