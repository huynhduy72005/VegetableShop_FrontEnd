import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

const roleLabels = {
    Admin: 'Quản trị viên',
    AdminVIP: 'Quản trị viên VIP',
    Staff: 'Nhân viên',
    Customer: 'Khách hàng'
};
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
    return matchingStatus ||
        ({ '0': 'Pending', '1': 'Processing', '2': 'Shipping', '3': 'Completed', '4': 'Cancelled' })[value] ||
        value;
};
const formatDate = value => {
    if (!value) return 'Chưa cập nhật';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Chưa cập nhật' : date.toLocaleString('vi-VN');
};
const formatMoney = value => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const formatDateOfBirth = value => {
    if (!value) return 'Chưa cập nhật';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
};
const initials = name => (name || '?')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map(word => word[0])
    .join('')
    .toUpperCase();

export default function AdminUserManagement({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [passwordResetRequests, setPasswordResetRequests] = useState([]);
    const [roleDrafts, setRoleDrafts] = useState({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [notice, setNotice] = useState(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userOrders, setUserOrders] = useState([]);
    const [userOrdersLoading, setUserOrdersLoading] = useState(false);
    const [userOrdersError, setUserOrdersError] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderError, setOrderError] = useState('');
    const isVipAdmin = Boolean(currentUser?.isVipAdmin);

    const fetchUsers = useCallback(async () => {
        const { data } = await api.getUsers();
        return Array.isArray(data) ? data : [];
    }, []);

    const fetchPasswordResetRequests = useCallback(async () => {
        const { data } = await api.getPasswordResetRequests();
        if (!Array.isArray(data))
            throw new Error('Dữ liệu yêu cầu đặt lại mật khẩu không hợp lệ.');
        return data;
    }, []);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const [userData, requestData] = await Promise.all([
                fetchUsers(),
                fetchPasswordResetRequests()
            ]);
            setUsers(userData);
            setPasswordResetRequests(requestData);
            setRoleDrafts({});
            setNotice(null);
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không tải được danh sách tài khoản.'
            });
        } finally {
            setLoading(false);
        }
    }, [fetchPasswordResetRequests, fetchUsers]);

    useEffect(() => {
        let active = true;
        Promise.all([fetchUsers(), fetchPasswordResetRequests()])
            .then(([userData, requestData]) => {
                if (active) {
                    setUsers(userData);
                    setPasswordResetRequests(requestData);
                    setNotice(null);
                }
            })
            .catch(error => {
                if (active) {
                    setNotice({
                        error: true,
                        text: error.response?.data?.message || 'Không tải được danh sách tài khoản.'
                    });
                }
            })
            .finally(() => {
                if (active)
                    setLoading(false);
            });
        return () => { active = false; };
    }, [fetchPasswordResetRequests, fetchUsers]);

    async function reviewPasswordResetRequest(request, decision) {
        const action = decision === 'approve' ? 'chấp nhận' : 'từ chối';
        if (!window.confirm(`Bạn có chắc muốn ${action} yêu cầu của ${request.email}?`))
            return;

        setSavingId(request.id);
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
            setSavingId(null);
        }
    }

    async function updateRole(user) {
        const role = roleDrafts[user.id] ?? user.role;
        if (role === user.role)
            return;

        setSavingId(user.id);
        try {
            await api.updateUserRole(user.id, { role });
            setNotice({ text: `Đã cập nhật vai trò cho ${user.email}.` });
            await loadUsers();
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không thể cập nhật vai trò tài khoản.'
            });
        } finally {
            setSavingId(null);
        }
    }

    async function setAccountActive(user, active) {
        const action = active ? 'khôi phục' : 'vô hiệu hóa';
        if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản ${user.email}?`))
            return;

        setSavingId(user.id);
        try {
            if (active)
                await api.restoreUser(user.id);
            else
                await api.deleteUser(user.id);
            setNotice({ text: `Đã ${action} tài khoản ${user.email}.` });
            await loadUsers();
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || `Không thể ${action} tài khoản.`
            });
        } finally {
            setSavingId(null);
        }
    }

    async function showUserDetails(user) {
        setSelectedUser(user);
        setSelectedOrderId(null);
        setSelectedOrderDetail(null);
        setOrderError('');
        setUserOrders([]);
        setUserOrdersError('');
        if (user.role !== 'Customer') {
            setUserOrdersLoading(false);
            return;
        }

        setUserOrdersLoading(true);
        try {
            const { data } = await api.getOrders({ userId: user.id });
            if (Array.isArray(data))
                setUserOrders(data);
            else
                setUserOrdersError('Dữ liệu lịch sử đơn hàng không hợp lệ.');
        } catch {
            setUserOrdersError('Không tải được lịch sử đơn hàng của khách hàng.');
        } finally {
            setUserOrdersLoading(false);
        }
    }

    async function showOrderDetails(orderId) {
        setSelectedOrderId(orderId);
        setSelectedOrderDetail(null);
        setOrderError('');
        setOrderLoading(true);
        try {
            const { data } = await api.getOrderById(orderId);
            setSelectedOrderDetail(data);
        } catch (error) {
            setOrderError(error.response?.status === 404
                ? 'Không tìm thấy đơn hàng này.'
                : 'Không tải được chi tiết đơn hàng.');
        } finally {
            setOrderLoading(false);
        }
    }

    function closeUserDetails() {
        setSelectedUser(null);
        setSelectedOrderId(null);
        setSelectedOrderDetail(null);
        setUserOrders([]);
        setUserOrdersError('');
        setOrderError('');
    }

    function closeOrderDetails() {
        setSelectedOrderId(null);
        setSelectedOrderDetail(null);
        setOrderError('');
    }

    const keyword = search.trim().toLocaleLowerCase('vi');
    const filteredUsers = users.filter(user =>
        (!roleFilter || user.role === roleFilter) &&
        (!statusFilter || String(user.isActive) === statusFilter) &&
        `${user.fullName || ''} ${user.email || ''} ${user.username || ''} ${user.id}`
            .toLocaleLowerCase('vi')
            .includes(keyword)
    );
    const pageCount = Math.max(1, Math.ceil(filteredUsers.length / 8));
    const currentPage = Math.min(page, pageCount);
    const visibleUsers = filteredUsers.slice((currentPage - 1) * 8, currentPage * 8);

    return (
        <div className="adm-users">
            <section className="adm-panel">
                <div className="adm-panel-head">
                    <div>
                        <h2>Quản lý tài khoản</h2>
                        <p>
                            {isVipAdmin
                                ? 'Quản trị viên VIP có thể quản lý mọi tài khoản khác.'
                                : 'Admin thường không thể thay đổi hoặc vô hiệu hóa tài khoản Admin.'}
                            {' '}Mật khẩu không được lưu hoặc hiển thị dưới dạng chữ thường.
                        </p>
                    </div>
                    <button type="button" disabled={loading || savingId !== null} onClick={loadUsers}>
                        {loading ? 'Đang tải…' : '↻ Tải lại'}
                    </button>
                </div>

                {notice && (
                    <div role={notice.error ? 'alert' : 'status'} className={`adm-notice ${notice.error ? 'error' : ''}`}>
                        {notice.text}
                    </div>
                )}

                {selectedUser ? (
                    <section className="adm-account-detail" aria-busy={userOrdersLoading}>
                        <header className="adm-detail-head">
                            <div>
                                <h3>Chi tiết tài khoản</h3>
                                <p>Thông tin hồ sơ và trạng thái tài khoản.</p>
                            </div>
                            <button type="button" onClick={closeUserDetails}>← Quay lại danh sách</button>
                        </header>
                        <div className="adm-user-summary">
                            <span className="adm-user-avatar">{initials(selectedUser.fullName)}</span>
                            <div>
                                <h3>{selectedUser.fullName || 'Chưa cập nhật'}</h3>
                                <span className={`adm-badge ${selectedUser.role}`}>
                                    {roleLabels[selectedUser.role] || selectedUser.role}
                                </span>
                            </div>
                        </div>
                        <dl className="adm-user-fields">
                            {[
                                ['Mã tài khoản', selectedUser.id],
                                ['Tên đăng nhập', selectedUser.username || 'Chưa cập nhật'],
                                ['Email', selectedUser.email || 'Chưa cập nhật'],
                                ['Số điện thoại', selectedUser.phone || 'Chưa cập nhật'],
                                ['Giới tính', selectedUser.gender || 'Chưa cập nhật'],
                                ['Ngày sinh', formatDateOfBirth(selectedUser.dateOfBirth)],
                                ['Trạng thái', selectedUser.isActive ? 'Đang hoạt động' : 'Đã khóa'],
                                ['Đổi mật khẩu', selectedUser.mustChangePassword ? 'Cần đổi mật khẩu' : 'Không yêu cầu']
                            ].map(([label, value]) => (
                                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                            ))}
                        </dl>

                        {selectedUser.role === 'Customer' && (
                            <section className="adm-customer-orders">
                                <header className="adm-detail-head">
                                    <div>
                                        <h3>Lịch sử đơn hàng</h3>
                                        {!userOrdersLoading && !userOrdersError &&
                                            <p>{userOrders.length} đơn hàng</p>}
                                    </div>
                                </header>
                                {userOrdersLoading ? (
                                    <p className="adm-empty" role="status">Đang tải lịch sử đơn hàng…</p>
                                ) : userOrdersError ? (
                                    <p className="adm-empty" role="alert">{userOrdersError}</p>
                                ) : userOrders.length ? (
                                    <div className="adm-table-scroll">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Mã đơn</th>
                                                    <th>Ngày đặt</th>
                                                    <th>Số món</th>
                                                    <th>Tổng tiền</th>
                                                    <th>Trạng thái</th>
                                                    <th>Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userOrders.map(order => {
                                                    const status = normalizeOrderStatus(order.status);
                                                    return (
                                                        <tr key={order.id}>
                                                            <td>#{order.id}</td>
                                                            <td>{formatDate(order.orderDate)}</td>
                                                            <td>{order.itemCount ?? '—'}</td>
                                                            <td>{formatMoney(order.totalPrice)}</td>
                                                            <td>{orderStatuses[status] || status || 'Chưa xác định'}</td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    disabled={orderLoading}
                                                                    onClick={() => showOrderDetails(order.id)}
                                                                >
                                                                    {orderLoading && selectedOrderId === order.id
                                                                        ? 'Đang tải…'
                                                                        : 'Xem chi tiết'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="adm-empty">Khách hàng chưa có đơn hàng nào.</p>
                                )}

                                {selectedOrderId !== null && (
                                    <section className="adm-order-detail">
                                        <header className="adm-detail-head">
                                            <div>
                                                <h3>Chi tiết đơn hàng #{selectedOrderId}</h3>
                                                {selectedOrderDetail &&
                                                    <p>Đặt lúc {formatDate(selectedOrderDetail.orderDate)}</p>}
                                            </div>
                                            <button type="button" onClick={closeOrderDetails}>Đóng chi tiết</button>
                                        </header>
                                        {orderLoading ? (
                                            <p className="adm-empty" role="status">Đang tải chi tiết đơn hàng…</p>
                                        ) : orderError ? (
                                            <p className="adm-empty" role="alert">{orderError}</p>
                                        ) : selectedOrderDetail && (
                                            <>
                                                <div className="adm-order-info">
                                                    <div><small>Khách hàng</small><strong>{selectedOrderDetail.customerName || selectedUser.fullName}</strong></div>
                                                    <div><small>Trạng thái</small><strong>{orderStatuses[normalizeOrderStatus(selectedOrderDetail.status)] || selectedOrderDetail.status}</strong></div>
                                                    <div><small>Tổng tiền</small><strong>{formatMoney(selectedOrderDetail.totalPrice)}</strong></div>
                                                    <div className="adm-order-shipping">
                                                        <small>Thông tin giao hàng</small>
                                                        <p><span>Địa chỉ</span><strong>{selectedOrderDetail.shippingAddress || '—'}</strong></p>
                                                        <p><span>Người nhận</span><strong>{selectedOrderDetail.recipientName || selectedOrderDetail.customerName || selectedUser.fullName}</strong></p>
                                                        <p><span>Số điện thoại</span><strong>{selectedOrderDetail.phone || '—'}</strong></p>
                                                        <p><span>Ghi chú</span><strong>{selectedOrderDetail.note || '—'}</strong></p>
                                                    </div>
                                                </div>
                                                <div className="adm-table-scroll adm-order-items">
                                                    <table>
                                                        <thead>
                                                            <tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th></tr>
                                                        </thead>
                                                        <tbody>
                                                            {(selectedOrderDetail.items || []).map(item => (
                                                                <tr key={item.id}>
                                                                    <td>{item.productName || `Sản phẩm #${item.productId}`}</td>
                                                                    <td>{formatMoney(item.price)}{item.unit && ` / ${item.unit}`}</td>
                                                                    <td>{item.quantity}</td>
                                                                    <td>{formatMoney(item.lineTotal ?? Number(item.price || 0) * Number(item.quantity || 0))}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        )}
                                    </section>
                                )}
                            </section>
                        )}
                    </section>
                ) : (
                    <>
                        <div className="adm-filters adm-account-filters">
                            <input
                                type="search"
                                aria-label="Tìm tài khoản"
                                placeholder="Tìm theo tên, email, tên đăng nhập hoặc mã tài khoản…"
                                value={search}
                                onChange={event => { setSearch(event.target.value); setPage(1); }}
                            />
                            <select
                                aria-label="Lọc theo vai trò"
                                value={roleFilter}
                                onChange={event => { setRoleFilter(event.target.value); setPage(1); }}
                            >
                                <option value="">Tất cả vai trò</option>
                                {Object.entries(roleLabels).map(([role, label]) => (
                                    <option key={role} value={role}>{label}</option>
                                ))}
                            </select>
                            <select
                                aria-label="Lọc theo trạng thái"
                                value={statusFilter}
                                onChange={event => { setStatusFilter(event.target.value); setPage(1); }}
                            >
                                <option value="">Mọi trạng thái</option>
                                <option value="true">Đang hoạt động</option>
                                <option value="false">Đã vô hiệu hóa</option>
                            </select>
                        </div>

                        <div className="adm-table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Tài khoản</th>
                                        <th>Vai trò</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleUsers.map(user => {
                                        const isSelf = String(user.id) === String(currentUser?.id);
                                        const isVipAccount = user.isVipAdmin || user.role === 'AdminVIP';
                                        const protectedAccount = isSelf || isVipAccount;
                                        const canManageUser = !protectedAccount &&
                                            (isVipAdmin || (user.role !== 'Admin' && user.role !== 'AdminVIP'));
                                        const selectedRole = roleDrafts[user.id] ?? user.role;

                                        return (
                                            <tr
                                                key={user.id}
                                                className={isVipAccount ? 'adm-vip-account' : ''}
                                                title={isVipAccount ? 'Tài khoản Quản trị viên VIP được bảo vệ' : undefined}
                                            >
                                                <td>
                                                    <div className="adm-product">
                                                        <div>
                                                            <strong className={isVipAccount ? 'adm-vip-name' : ''}>
                                                                {user.fullName || user.username}
                                                                {isVipAccount && <span className="adm-vip-crown" aria-hidden="true">👑</span>}
                                                            </strong>
                                                            <small>{user.email} · @{user.username}</small>
                                                        </div>
                                                    </div>
                                                    {isSelf && <span className="adm-badge blue">Bạn</span>}
                                                </td>
                                                <td>
                                                    {isVipAccount
                                                        ? <span className="adm-vip-role">Quản trị viên VIP</span>
                                                        : roleLabels[user.role] || user.role}
                                                </td>
                                                <td>
                                                    <span className={`adm-badge ${user.isActive ? '' : 'red'}`}>
                                                        {user.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="adm-actions">
                                                        {!isVipAccount && (
                                                            <button type="button" onClick={() => showUserDetails(user)}>
                                                                Xem chi tiết
                                                            </button>
                                                        )}
                                                        {canManageUser ? (
                                                            <>
                                                                <select
                                                                    aria-label={`Vai trò của ${user.email}`}
                                                                    value={selectedRole}
                                                                    disabled={savingId === user.id}
                                                                    onChange={event => setRoleDrafts(current => ({
                                                                        ...current,
                                                                        [user.id]: event.target.value
                                                                    }))}
                                                                >
                                                                    <option value="Customer">Khách hàng</option>
                                                                    <option value="Staff">Nhân viên</option>
                                                                    {isVipAdmin && <option value="Admin">Quản trị viên</option>}
                                                                </select>
                                                                {selectedRole !== user.role && (
                                                                    <button
                                                                        type="button"
                                                                        disabled={savingId === user.id}
                                                                        onClick={() => updateRole(user)}
                                                                    >
                                                                        Lưu quyền
                                                                    </button>
                                                                )}
                                                                {user.isActive ? (
                                                                    <button
                                                                        type="button"
                                                                        className="adm-danger"
                                                                        disabled={savingId === user.id}
                                                                        onClick={() => setAccountActive(user, false)}
                                                                    >
                                                                        Vô hiệu hóa
                                                                    </button>
                                                                ) : isVipAdmin ? (
                                                                    <button
                                                                        type="button"
                                                                        disabled={savingId === user.id}
                                                                        onClick={() => setAccountActive(user, true)}
                                                                    >
                                                                        Khôi phục
                                                                    </button>
                                                                ) : (
                                                                    <small>Chỉ Quản trị viên VIP được khôi phục</small>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <small className={isVipAccount ? 'adm-vip-locked' : ''}>
                                                                {isVipAccount
                                                                    ? 'Tài khoản được bảo vệ'
                                                                    : isSelf ? 'Không thể tự thao tác' : 'Tài khoản được bảo vệ'}
                                                            </small>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {!visibleUsers.length && (
                                <p className="adm-empty">
                                    {loading ? 'Đang tải tài khoản…' : 'Không tìm thấy tài khoản phù hợp.'}
                                </p>
                            )}
                        </div>
                        <div className="adm-pagination">
                            <span>{filteredUsers.length} tài khoản · Trang {currentPage} / {pageCount}</span>
                            <div>
                                <button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                                    ← Trước
                                </button>
                                <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>
                                    Sau →
                                </button>
                            </div>
                        </div>
                        <section className="adm-reset-requests">
                            <header className="adm-detail-head">
                                <div>
                                    <h3>Yêu cầu đổi mật khẩu</h3>
                                    <p>{passwordResetRequests.length} yêu cầu đang chờ xử lý</p>
                                </div>
                            </header>
                            {!passwordResetRequests.length ? (
                                <p className="adm-empty">Hiện không có yêu cầu đang chờ duyệt.</p>
                            ) : (
                                <div className="adm-table-scroll">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Tài khoản</th>
                                                <th>Thời gian</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {passwordResetRequests.map(request => (
                                                <tr key={request.id}>
                                                    <td>
                                                        <strong>{request.fullName}</strong>
                                                        <small>{request.email}</small>
                                                    </td>
                                                    <td>{formatDate(request.createdAtUtc)}</td>
                                                    <td>
                                                        <div className="adm-actions">
                                                            <button
                                                                type="button"
                                                                disabled={savingId !== null}
                                                                onClick={() => reviewPasswordResetRequest(request, 'approve')}
                                                            >
                                                                Chấp nhận
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="adm-danger"
                                                                disabled={savingId !== null}
                                                                onClick={() => reviewPasswordResetRequest(request, 'reject')}
                                                            >
                                                                Từ chối
                                                            </button>
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
                )}
            </section>
        </div>
    );
}
