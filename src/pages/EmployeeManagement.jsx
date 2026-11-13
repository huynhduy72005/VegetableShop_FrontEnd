
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './EmployeeManagement.css';

const validateEmployee = (form) => {
    const errors = {};

    const name = form.fullName?.trim() || '';
    const email = form.email?.trim() || '';
    const phone = form.phone?.trim() || '';

    if (!name) {
        errors.fullName = 'Vui lòng nhập họ và tên.';
    }

    if (!email) {
        errors.email = 'Vui lòng nhập email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Địa chỉ email không hợp lệ.';
    }

    if (!phone) {
        errors.phone = 'Vui lòng nhập số điện thoại.';
    } else if (!phone.startsWith('0')) {
        errors.phone = 'Số điện thoại phải bắt đầu bằng số 0.';
    } else if (!/^\d+$/.test(phone)) {
        errors.phone = 'Số điện thoại chỉ được chứa chữ số.';
    } else if (phone.length !== 10) {
        errors.phone = 'Số điện thoại phải có đúng 10 chữ số.';
    }

    if (!form.position?.trim()) {
        errors.position = 'Vui lòng nhập chức vụ.';
    }

    if (!['Admin', 'Staff'].includes(form.userRole)) {
        errors.userRole = 'Vui lòng chọn vai trò hợp lệ.';
    }

    if (form.createAccount) {
        if (!/^[a-z0-9._-]{3,100}$/i.test(form.username?.trim() || '')) {
            errors.username = 'Tên đăng nhập cần dài 3–100 ký tự (chữ, số, dấu chấm, gạch dưới hoặc gạch ngang).';
        }
        if (!form.generateTemporaryPassword &&
            (form.initialPassword || '').length < 8) {
            errors.initialPassword = 'Mật khẩu ban đầu phải có ít nhất 8 ký tự.';
        }
    }

    return errors;
};

const emptyForm = {
    fullName: '',
    email: '',
    phone: '',
    position: 'Nhân viên bán hàng',
    userRole: 'Staff',
    createAccount: true,
    username: '',
    generateTemporaryPassword: true,
    initialPassword: '',
    accountIsActive: true
};
const userRoles = {
    Admin: 'Quản trị viên',
    Staff: 'Nhân viên',
    Customer: 'Khách hàng'
};

export default function EmployeeManagement() {
    const [employees, setEmployees] = useState([]);
    const [logs, setLogs] = useState([]);
    const [tab, setTab] = useState('list');
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [linkingUserId, setLinkingUserId] = useState(null);
    const [selected, setSelected] = useState(null);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState({});
    const [usernameEdited, setUsernameEdited] = useState(false);
    const [initialCredentials, setInitialCredentials] = useState(null);
    const [copiedCredentials, setCopiedCredentials] = useState(false);

    async function loadEmployees() {
        try {
            const res = await api.getEmployees();
            setEmployees(res.data);
            return true;
        } catch (err) {
            setMessage(err.response?.data?.message
                || 'Không tải được nhân viên.');
            return false;
        }
    }

    async function loadLogs() {
        try {
            const res = await api.getEmployeeLogs();
            setLogs(res.data);
        } catch {
            setMessage('Không tải được nhật ký.');
        }
    }

    useEffect(() => {
        let active = true;
        api.getEmployees()
            .then(res => {
                if (active) setEmployees(res.data);
            })
            .catch(err => {
                if (active) {
                    setMessage(err.response?.data?.message
                        || 'Không tải được nhân viên.');
                }
            });

        return () => {
            active = false;
        };
    }, []);

    function startAdd() {
        setForm(emptyForm);
        setUsernameEdited(false);
        setEditingId(null);
        setLinkingUserId(null);
        setErrors({});
        setInitialCredentials(null);
        setMessage('');
        setTab('form');
    }

    function startEdit(emp) {
        setForm({
            fullName: emp.fullName,
            email: emp.email,
            phone: emp.phone,
            position: emp.position,
            userRole: emp.userRole || 'Staff',
            createAccount: false,
            username: emp.username || '',
            generateTemporaryPassword: true,
            initialPassword: '',
            accountIsActive: emp.accountIsActive ?? true
        });
        setUsernameEdited(true);
        setEditingId(emp.id);
        setLinkingUserId(null);
        setMessage('');
        setTab('form');
    }

    function startLinkEmployee(emp) {
        setForm({
            ...emptyForm,
            fullName: emp.fullName,
            email: emp.email,
            phone: emp.phone || '',
            position: 'Nhân viên',
            userRole: 'Staff',
            createAccount: false,
            username: emp.username || '',
            accountIsActive: emp.accountIsActive ?? true
        });
        setUsernameEdited(true);
        setEditingId(null);
        setLinkingUserId(emp.userId);
        setErrors({});
        setMessage('');
        setTab('form');
    }


    async function saveEmployee(e) {
        e.preventDefault();

        if (busy) return;

        setErrors({});
        setMessage('');

        const validationErrors = validateEmployee(form);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setMessage('Vui lòng kiểm tra các thông tin được đánh dấu.');
            return;
        }

        setBusy(true);

        try {
            const payload = {
                fullName: form.fullName.trim(),
                email: form.email.trim().toLowerCase(),
                phone: form.phone.trim(),
                position: form.position.trim(),
                userRole: form.userRole,
                createAccount: editingId || linkingUserId
                    ? false
                    : form.createAccount,
                username: form.username.trim(),
                generateTemporaryPassword: form.generateTemporaryPassword,
                initialPassword: form.initialPassword,
                accountIsActive: form.accountIsActive
            };

            let createdCredentials = null;
            if (editingId) {
                await api.updateEmployee(editingId, payload);
            } else {
                const result = await api.createEmployee(payload);
                createdCredentials = result.data.initialCredentials;
            }

            const refreshed = await loadEmployees();
            setErrors({});
            setMessage(refreshed
                ? (createdCredentials
                    ? 'Đã tạo nhân viên và tài khoản đăng nhập.'
                    : 'Đã lưu thông tin nhân viên thành công.')
                : 'Đã lưu nhân viên nhưng không tải lại được danh sách.');
            setForm(emptyForm);
            setUsernameEdited(false);
            setEditingId(null);
            setLinkingUserId(null);
            setInitialCredentials(createdCredentials);
            setCopiedCredentials(false);
            setTab('list');

        } catch (err) {
            const status = err.response?.status;
            const data = err.response?.data;

            if (status === 400) {
                if (data?.errors) {
                    const backendErrors = {};

                    for (const [key, messages] of Object.entries(data.errors)) {
                        backendErrors[
                            key.charAt(0).toLowerCase() + key.slice(1)
                        ] = Array.isArray(messages)
                                ? messages.join(' ')
                                : String(messages);
                    }

                    setErrors(backendErrors);
                }

                setMessage(
                    data?.message ||
                    'Thông tin không hợp lệ. Vui lòng kiểm tra lại.'
                );

            } else if (status === 409) {
                setMessage(
                    data?.message ||
                    'Mã nhân viên hoặc email đã tồn tại.'
                );

            } else if (status === 401) {
                setMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

            } else if (status === 403) {
                setMessage('Bạn không có quyền thực hiện thao tác này.');

            } else if (status === 500) {
                setMessage('Máy chủ gặp lỗi. Vui lòng kiểm tra Backend.');

            } else {
                setMessage(
                    'Không kết nối được máy chủ. Vui lòng kiểm tra lại.'
                );
            }

        } finally {
            setBusy(false);
        }
    }


    async function savePermissions(e) {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setMessage('');

        try {
            await api.updateEmployeePermissions(
                selected.id,
                {
                    canManageProducts: selected.canManageProducts,
                    canManageOrders: selected.canManageOrders,
                    canManageInventory: selected.canManageInventory,
                    userRole: selected.userId ? selected.userRole : null,
                    accountIsActive: selected.userId
                        ? selected.accountIsActive
                        : null,
                    status: selected.status
                }
            );

            const refreshed = await loadEmployees();
            setMessage(refreshed
                ? 'Đã cập nhật quyền.'
                : 'Đã cập nhật quyền nhưng không tải lại được danh sách.');
            setTab('list');
        } catch (err) {
            setMessage(err.response?.data?.message
                || 'Cập nhật quyền thất bại.');
        } finally {
            setBusy(false);
        }
    }

    async function copyCredentials() {
        const credentials = initialCredentials;
        if (!credentials) return;

        try {
            await navigator.clipboard.writeText(
                `Tên đăng nhập: ${credentials.username}\nEmail: ${credentials.email}\nMật khẩu ban đầu: ${credentials.password}`
            );
            setCopiedCredentials(true);
        } catch {
            setMessage('Không thể tự sao chép. Hãy sao chép thông tin đang hiển thị.');
        }
    }


    const field = (label, key, type = 'text', disabled = false) => (
        <label className="emp-field">
            <span>{label} <b style={{ color: '#c0392b' }}>*</b></span>

            <input
                type={type}
                value={form[key]}
                disabled={disabled}
                aria-invalid={Boolean(errors[key])}
                onChange={e => {
                    const value = e.target.value;
                    if (key === 'username') setUsernameEdited(true);
                    setForm(prev => {
                        const next = { ...prev, [key]: value };
                        if (key === 'email' && !usernameEdited) {
                            next.username = value.split('@')[0].toLowerCase();
                        }
                        return next;
                    });

                    setErrors(prev => ({
                        ...prev,
                        [key]: ''
                    }));
                }}
            />

            {errors[key] && (
                <small className="emp-error">
                    {errors[key]}
                </small>
            )}
        </label>
    );

    return (
        <section className="emp-page">
            <h2>Quản lý nhân viên</h2>

            <div className="emp-toolbar">
                <button onClick={() => setTab('list')}>
                    Danh sách
                </button>
                <button onClick={startAdd}>
                    + Thêm nhân viên
                </button>
                <button onClick={() => {
                    setTab('logs');
                    loadLogs();
                }}>
                    Nhật ký hoạt động
                </button>
            </div>


            {message && (
                <div className="emp-alert" role="status">
                    <span>{message}</span>

                    <button
                        type="button"
                        className="emp-alert-close"
                        onClick={() => setMessage('')}
                        aria-label="Đóng thông báo"
                        title="Đóng thông báo"
                    >
                        ×
                    </button>
                </div>
            )}


            {tab === 'list' && (
                <div className="emp-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Mã NV</th>
                                <th>Họ tên</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Chức vụ</th>
                                <th>Tài khoản</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length === 0 ? (
                                <tr>
                                    <td colSpan="8">Chưa có hồ sơ nhân viên.</td>
                                </tr>
                            ) : employees.map(emp => (
                                <tr key={emp.id}>
                                    <td>{emp.employeeCode || 'Chưa cấp'}</td>
                                    <td>{emp.fullName}</td>
                                    <td>{emp.email}</td>
                                    <td>{emp.phone}</td>
                                    <td>{emp.position || 'Chưa cập nhật'}</td>
                                    <td>{emp.userId ? (
                                        <>
                                            <strong>{emp.username}</strong>
                                            <small>
                                                {userRoles[emp.userRole] || emp.userRole}
                                                {' · '}
                                                {emp.accountIsActive ? 'Đang hoạt động' : 'Đã khóa'}
                                                {emp.mustChangePassword
                                                    ? ' · Cần đổi mật khẩu'
                                                    : ''}
                                            </small>
                                        </>
                                    ) : 'Chưa có tài khoản'}</td>
                                    <td>{emp.profilePending ? 'Chưa có hồ sơ' : emp.status}</td>
                                    <td>
                                        {emp.profilePending ? (
                                            <button onClick={() => startLinkEmployee(emp)}>
                                                Tạo hồ sơ
                                            </button>
                                        ) : (
                                            <>
                                                <button onClick={() => startEdit(emp)}>
                                                    Sửa
                                                </button>
                                                <button onClick={() => {
                                                    setSelected({ ...emp });
                                                    setTab('permissions');
                                                }}>
                                                    Phân quyền
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'form' && (
                <form className="emp-form" onSubmit={saveEmployee}>
                    <h3>{linkingUserId
                        ? 'Tạo hồ sơ cho nhân viên hiện có'
                        : editingId
                            ? 'Chỉnh sửa nhân viên'
                            : 'Thêm nhân viên'}</h3>

                    {!editingId && (
                        <p className="emp-code-note">
                            Mã nhân viên được hệ thống tự tạo theo vai trò và không thể sửa.
                        </p>
                    )}
                    {field('Họ và tên', 'fullName')}
                    {field('Email', 'email', 'email', Boolean(linkingUserId))}
                    {field('Số điện thoại', 'phone')}

                    {field('Chức vụ', 'position')}

                    {!editingId && (
                        <>
                            {linkingUserId ? (
                                <p className="emp-permission-hint">
                                    Tài khoản Nhân viên đã tồn tại và sẽ được liên kết với hồ sơ này.
                                </p>
                            ) : (
                                <>
                                    <label className="emp-field">
                                        <span>Vai trò tài khoản</span>
                                        <select
                                            value={form.userRole}
                                            aria-invalid={Boolean(errors.userRole)}
                                            onChange={e => setForm({
                                                ...form,
                                                userRole: e.target.value
                                            })}
                                        >
                                            <option value="Staff">Nhân viên (NV)</option>
                                            <option value="Admin">Quản trị viên (AD)</option>
                                        </select>
                                        {errors.userRole && (
                                            <small className="emp-error">{errors.userRole}</small>
                                        )}
                                    </label>

                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={form.createAccount}
                                            onChange={e => setForm({
                                                ...form,
                                                createAccount: e.target.checked
                                            })}
                                        />
                                        Tạo tài khoản đăng nhập cùng lúc
                                    </label>
                                </>
                            )}
                            {!form.createAccount && !linkingUserId && (
                                <p className="emp-permission-hint">
                                    Nếu email đã có tài khoản, hệ thống sẽ liên kết tài khoản đó.
                                </p>
                            )}

                            {form.createAccount && (
                                <>
                                    {field('Tên đăng nhập', 'username')}
                                    <label className="emp-field">
                                        <span>Trạng thái tài khoản</span>
                                        <select
                                            value={form.accountIsActive ? 'active' : 'inactive'}
                                            onChange={e => setForm({
                                                ...form,
                                                accountIsActive: e.target.value === 'active'
                                            })}
                                        >
                                            <option value="active">Đang hoạt động</option>
                                            <option value="inactive">Đã khóa</option>
                                        </select>
                                    </label>
                                    <label className="emp-field">
                                        <span>Cách tạo mật khẩu ban đầu</span>
                                        <select
                                            value={form.generateTemporaryPassword ? 'temporary' : 'manual'}
                                            onChange={e => setForm({
                                                ...form,
                                                generateTemporaryPassword: e.target.value === 'temporary',
                                                initialPassword: ''
                                            })}
                                        >
                                            <option value="temporary">Tự tạo mật khẩu tạm thời</option>
                                            <option value="manual">Admin tự đặt mật khẩu ban đầu</option>
                                        </select>
                                    </label>
                                    {!form.generateTemporaryPassword &&
                                        field('Mật khẩu ban đầu', 'initialPassword', 'password')}
                                    <p className="emp-permission-hint">
                                        Mật khẩu ban đầu chỉ hiển thị một lần sau khi tạo. Nhân viên phải đổi mật khẩu ở lần đăng nhập đầu tiên.
                                    </p>
                                </>
                            )}
                        </>
                    )}

                    <button disabled={busy} type="submit">
                        {busy ? 'Đang lưu...' : 'Lưu thông tin'}
                    </button>
                </form>
            )}

            {tab === 'permissions' && selected && (
                <form className="emp-form emp-permissions-form" onSubmit={savePermissions}>
                    <h3>Phân quyền: {selected.fullName}</h3>
                    <label className="emp-field">
                        <span>Vai trò tài khoản</span>
                        <select
                            value={selected.userId ? selected.userRole || '' : ''}
                            disabled={!selected.userId}
                            onChange={(e) =>
                                setSelected({
                                    ...selected,
                                    userRole: e.target.value
                                })
                            }
                        >
                            <option value="">Chưa liên kết tài khoản</option>
                            <option value="Customer">Khách hàng</option>
                            <option value="Staff">Nhân viên</option>
                            <option value="Admin">Quản trị viên</option>
                        </select>
                    </label>
                    <label className="emp-field">
                        <span>Trạng thái tài khoản</span>
                        <select
                            value={selected.accountIsActive == null
                                ? ''
                                : selected.accountIsActive ? 'active' : 'inactive'}
                            disabled={!selected.userId}
                            onChange={e => setSelected({
                                ...selected,
                                accountIsActive: e.target.value === 'active'
                            })}
                        >
                            <option value="">Chưa liên kết tài khoản</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="inactive">Đã khóa</option>
                        </select>
                    </label>
                    <p className="emp-permission-hint">
                        {selected.userId
                            ? 'Vai trò này được áp dụng cho tài khoản đăng nhập.'
                            : 'Hồ sơ sẽ tự liên kết với tài khoản cùng email khi lưu. Sau đó mở lại để đổi vai trò.'}
                    </p>
                    <label className="emp-field">
                        <span>Trạng thái</span>
                        <select
                            value={selected.status}
                            onChange={e => setSelected({
                                ...selected,
                                status: e.target.value
                            })}
                        >
                            <option value="Active">Đang làm việc</option>
                            <option value="Inactive">Ngừng hoạt động</option>
                        </select>
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={Boolean(selected.canManageProducts)}
                            onChange={e => setSelected({
                                ...selected,
                                canManageProducts: e.target.checked
                            })}
                        />
                        Quản lý sản phẩm
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={Boolean(selected.canManageOrders)}
                            onChange={e => setSelected({
                                ...selected,
                                canManageOrders: e.target.checked
                            })}
                        />
                        Quản lý đơn hàng
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={Boolean(selected.canManageInventory)}
                            onChange={e => setSelected({
                                ...selected,
                                canManageInventory: e.target.checked
                            })}
                        />
                        Quản lý tồn kho
                    </label>

                    <button disabled={busy} type="submit">
                        Lưu phân quyền
                    </button>
                </form>
            )}

            {tab === 'logs' && (
                <div className="emp-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Thời gian (UTC)</th>
                                <th>ID người thao tác</th>
                                <th>ID nhân viên</th>
                                <th>Hành động</th>
                                <th>Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td>{new Date(
                                        log.createdAt
                                    ).toLocaleString('vi-VN', {
                                        timeZone: 'UTC'
                                    })}</td>
                                    <td>{log.actorUserId ?? '-'}</td>
                                    <td>{log.employeeId ?? '-'}</td>
                                    <td>{log.action}</td>
                                    <td>{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {initialCredentials && (
                <div className="emp-credential-backdrop">
                    <section
                        className="emp-credential-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="emp-credential-title"
                    >
                        <h3 id="emp-credential-title">Tài khoản đã được tạo</h3>
                        <p>
                            Mật khẩu này chỉ hiển thị lần này. Hãy gửi riêng cho nhân viên;
                            họ sẽ phải đổi mật khẩu khi đăng nhập lần đầu.
                        </p>
                        <dl>
                            <dt>Tên đăng nhập</dt>
                            <dd>{initialCredentials.username}</dd>
                            <dt>Email</dt>
                            <dd>{initialCredentials.email}</dd>
                            <dt>Mật khẩu ban đầu</dt>
                            <dd><code>{initialCredentials.password}</code></dd>
                        </dl>
                        <div className="emp-credential-actions">
                            <button type="button" onClick={copyCredentials}>
                                {copiedCredentials ? 'Đã sao chép' : 'Sao chép thông tin'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setInitialCredentials(null);
                                    setCopiedCredentials(false);
                                }}
                            >
                                Đóng
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}
