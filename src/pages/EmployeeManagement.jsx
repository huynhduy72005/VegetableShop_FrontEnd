
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './EmployeeManagement.css';

const validateEmployee = (form) => {
    const errors = {};

    const code = form.employeeCode?.trim() || '';
    const name = form.fullName?.trim() || '';
    const email = form.email?.trim() || '';
    const phone = form.phone?.trim() || '';

    if (!code) {
        errors.employeeCode = 'Vui lòng nhập mã nhân viên.';
    } else if (!/^NV[0-9]+$/i.test(code)) {
        errors.employeeCode =
            'Mã nhân viên phải có dạng NV001, NV002...';
    }

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

    if (!['Staff', 'Admin'].includes(form.position)) {
        errors.position = 'Vui lòng chọn chức vụ hợp lệ.';
    }

    return errors;
};

const emptyForm = {
    employeeCode: '',
    fullName: '',
    email: '',
    phone: '',
    position: 'Staff'
};

export default function EmployeeManagement() {
    const [employees, setEmployees] = useState([]);
    const [logs, setLogs] = useState([]);
    const [tab, setTab] = useState('list');
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [selected, setSelected] = useState(null);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState({});

    async function loadEmployees() {
        try {
            const res = await api.getEmployees();
            setEmployees(res.data);
        } catch (err) {
            setMessage(err.response?.data?.message
                || 'Không tải được nhân viên.');
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
        loadEmployees();
    }, []);

    function startAdd() {
        setForm(emptyForm);
        setEditingId(null);
        setMessage('');
        setTab('form');
    }

    function startEdit(emp) {
        setForm({
            employeeCode: emp.employeeCode,
            fullName: emp.fullName,
            email: emp.email,
            phone: emp.phone,
            position: emp.position
        });
        setEditingId(emp.id);
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
                employeeCode: form.employeeCode.trim(),
                fullName: form.fullName.trim(),
                email: form.email.trim().toLowerCase(),
                phone: form.phone.trim(),
                position: form.position
            };

            if (editingId) {
                await api.updateEmployee(editingId, payload);
            } else {
                await api.createEmployee(payload);
            }

            await loadEmployees();
            setErrors({});
            setMessage('Đã lưu thông tin nhân viên thành công.');
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
        setBusy(true);
        setMessage('');

        try {
            await api.updateEmployeePermissions(
                selected.id,
                {
                    canManageProducts: selected.canManageProducts,
                    canManageOrders: selected.canManageOrders,
                    canManageInventory: selected.canManageInventory,
                    status: selected.status
                }
            );

            await loadEmployees();
            setMessage('Đã cập nhật quyền.');
            setTab('list');
        } catch (err) {
            setMessage(err.response?.data?.message
                || 'Cập nhật quyền thất bại.');
        } finally {
            setBusy(false);
        }
    }


    const field = (label, key, type = 'text') => (
        <label className="emp-field">
            <span>{label} <b style={{ color: '#c0392b' }}>*</b></span>

            <input
                type={type}
                value={form[key]}
                aria-invalid={Boolean(errors[key])}
                onChange={e => {
                    setForm(prev => ({
                        ...prev,
                        [key]: e.target.value
                    }));

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
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp.id}>
                                    <td>{emp.employeeCode}</td>
                                    <td>{emp.fullName}</td>
                                    <td>{emp.email}</td>
                                    <td>{emp.phone}</td>
                                    <td>{emp.position}</td>
                                    <td>{emp.status}</td>
                                    <td>
                                        <button onClick={() => startEdit(emp)}>
                                            Sửa
                                        </button>
                                        <button onClick={() => {
                                            setSelected({ ...emp });
                                            setTab('permissions');
                                        }}>
                                            Phân quyền
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'form' && (
                <form className="emp-form" onSubmit={saveEmployee}>
                    <h3>{editingId
                        ? 'Chỉnh sửa nhân viên'
                        : 'Thêm nhân viên'}</h3>

                    {field('Mã nhân viên', 'employeeCode')}
                    {field('Họ và tên', 'fullName')}
                    {field('Email', 'email', 'email')}
                    {field('Số điện thoại', 'phone')}

                    <label className="emp-field">
                        <span>Chức vụ</span>
                        <select
                            value={form.position}
                            onChange={e =>
                                setForm({
                                    ...form,
                                    position: e.target.value
                                })
                            }
                        >
                            <option value="Staff">Nhân viên</option>
                            <option value="Admin">Quản trị viên</option>
                        </select>
                    </label>

                    <button disabled={busy} type="submit">
                        {busy ? 'Đang lưu...' : 'Lưu thông tin'}
                    </button>
                </form>
            )}

            {tab === 'permissions' && selected && (
                <form className="emp-form" onSubmit={savePermissions}>
                    <h3>Phân quyền: {selected.fullName}</h3>
                    <label className="emp-field">
                        <span>Vai trò nhân viên</span>

                        <select
                            value={selected.position}
                            onChange={(e) =>
                                setSelected({
                                    ...selected,
                                    position: e.target.value
                                })
                            }
                        >
                            <option value="Staff">Nhân viên bán hàng</option>
                            <option value="Admin">Quản trị viên</option>
                        </select>
                    </label>
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
        </section>
    );
}
