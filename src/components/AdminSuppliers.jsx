import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './AdminSuppliers.css';

const CERT_OPTIONS = [
    'VietGAP',
    'GlobalGAP',
    'Hữu cơ (Organic)',
    'VietGAP & GlobalGAP',
    'Thông thường'
];

const emptySupplierForm = {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    certificationType: 'VietGAP',
    certificationCode: '',
    certificationExpiryDate: '',
    notes: '',
    isActive: true
};

const money = value => Number(value || 0).toLocaleString('vi-VN') + ' ₫';

const formatDate = value => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export function getCertBadgeClass(certType) {
    switch (certType) {
        case 'VietGAP':
            return 'sup-cert-badge vietgap';
        case 'GlobalGAP':
            return 'sup-cert-badge globalgap';
        case 'Hữu cơ (Organic)':
            return 'sup-cert-badge organic';
        case 'VietGAP & GlobalGAP':
            return 'sup-cert-badge dual';
        default:
            return 'sup-cert-badge standard';
    }
}

const batchStatusLabel = {
    Valid: { text: 'Còn hạn', cls: '' },
    NearExpiry: { text: 'Cận date', cls: 'amber' },
    Expired: { text: 'Hết hạn', cls: 'red' },
    Depleted: { text: 'Đã xuất hết', cls: 'muted' }
};

export default function AdminSuppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [search, setSearch] = useState('');
    const [certFilter, setCertFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [form, setForm] = useState(null);
    const [detailModal, setDetailModal] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);

    async function loadSuppliers() {
        setLoading(true);
        try {
            const params = {};
            if (search.trim()) params.search = search.trim();
            if (certFilter) params.certification = certFilter;
            if (statusFilter === 'active') params.isActive = true;
            if (statusFilter === 'inactive') params.isActive = false;

            const { data } = await api.getSuppliers(params);
            setSuppliers(Array.isArray(data) ? data : []);
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không tải được danh sách nhà cung cấp.'
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            loadSuppliers();
        }, 200);
        return () => clearTimeout(timer);
    }, [search, certFilter, statusFilter]);

    function startForm(supplier = null) {
        setNotice(null);
        if (supplier) {
            setForm({
                id: supplier.id,
                name: supplier.name || '',
                contactPerson: supplier.contactPerson || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                address: supplier.address || '',
                certificationType: supplier.certificationType || 'Thông thường',
                certificationCode: supplier.certificationCode || '',
                certificationExpiryDate: supplier.certificationExpiryDate
                    ? String(supplier.certificationExpiryDate).slice(0, 10)
                    : '',
                notes: supplier.notes || '',
                isActive: supplier.isActive !== false
            });
        } else {
            setForm({ ...emptySupplierForm });
        }
    }

    async function handleSaveSupplier(e) {
        e.preventDefault();
        if (saving) return;

        const name = (form.name || '').trim();
        if (!name) {
            setNotice({ error: true, text: 'Vui lòng nhập tên nhà cung cấp / nhà vườn.' });
            return;
        }

        const payload = {
            name,
            contactPerson: form.contactPerson.trim() || null,
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            address: form.address.trim() || null,
            certificationType: form.certificationType || 'Thông thường',
            certificationCode: form.certificationCode.trim() || null,
            certificationExpiryDate: form.certificationExpiryDate || null,
            notes: form.notes.trim() || null,
            isActive: Boolean(form.isActive)
        };

        setSaving(true);
        setNotice(null);
        try {
            if (form.id) {
                const { data } = await api.updateSupplier(form.id, payload);
                setNotice({ text: data?.message || 'Đã cập nhật thông tin nhà cung cấp.' });
            } else {
                const { data } = await api.createSupplier(payload);
                setNotice({ text: data?.message || 'Đã thêm nhà cung cấp mới.' });
            }
            setForm(null);
            await loadSuppliers();
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Lưu nhà cung cấp thất bại.'
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleToggleActive(supplier) {
        if (saving) return;
        const nextActive = !supplier.isActive;
        setSaving(true);
        try {
            await api.updateSupplier(supplier.id, {
                name: supplier.name,
                contactPerson: supplier.contactPerson,
                phone: supplier.phone,
                email: supplier.email,
                address: supplier.address,
                certificationType: supplier.certificationType,
                certificationCode: supplier.certificationCode,
                certificationExpiryDate: supplier.certificationExpiryDate
                    ? String(supplier.certificationExpiryDate).slice(0, 10)
                    : null,
                notes: supplier.notes,
                isActive: nextActive
            });
            setNotice({
                text: nextActive
                    ? `Đã kích hoạt lại hợp tác với “${supplier.name}”.`
                    : `Đã chuyển “${supplier.name}” sang trạng thái ngừng hợp tác.`
            });
            await loadSuppliers();
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không cập nhật được trạng thái nhà cung cấp.'
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteSupplier(supplier) {
        if (!window.confirm(`Xóa nhà cung cấp “${supplier.name}”?`)) return;
        setSaving(true);
        try {
            const { data } = await api.deleteSupplier(supplier.id);
            setNotice({ text: data?.message || 'Đã xóa nhà cung cấp.' });
            await loadSuppliers();
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không thể xóa nhà cung cấp này.'
            });
        } finally {
            setSaving(false);
        }
    }

    async function openSupplierHistory(supplierId) {
        setDetailLoading(true);
        setDetailModal({ id: supplierId });
        try {
            const { data } = await api.getSupplierById(supplierId);
            setDetailModal(data);
        } catch (error) {
            setDetailModal(null);
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không tải được lịch sử nhập hàng của nhà vườn.'
            });
        } finally {
            setDetailLoading(false);
        }
    }

    const certifiedCount = suppliers.filter(s => s.certificationType && s.certificationType !== 'Thông thường').length;
    const activeCount = suppliers.filter(s => s.isActive).length;

    return (
        <div className="sup-wrap">
            {notice && (
                <div role={notice.error ? 'alert' : 'status'} className={`adm-notice ${notice.error ? 'error' : ''}`}>
                    {notice.text}
                    <button aria-label="Đóng thông báo" onClick={() => setNotice(null)}>×</button>
                </div>
            )}

            {/* Thống kê nhanh */}
            <div className="sup-kpi-row">
                <article className="sup-kpi-card">
                    <span>Tổng nhà vườn / NCC</span>
                    <strong>{suppliers.length}</strong>
                    <small>{activeCount} đang hợp tác cung ứng</small>
                </article>
                <article className="sup-kpi-card green">
                    <span>Đạt chuẩn GAP / Hữu cơ</span>
                    <strong>{certifiedCount}</strong>
                    <small>VietGAP, GlobalGAP, Organic</small>
                </article>
                <article className="sup-kpi-card">
                    <span>Tổng lô hàng đã nhập</span>
                    <strong>{suppliers.reduce((sum, s) => sum + (s.totalBatches || 0), 0)}</strong>
                    <small>Liên kết truy xuất nguồn gốc kho</small>
                </article>
            </div>

            {form ? (
                <section className="adm-panel">
                    <div className="adm-panel-head">
                        <div>
                            <h2>{form.id ? `Chỉnh sửa: ${form.name}` : 'Thêm Nhà cung cấp / Nhà vườn mới'}</h2>
                            <p>Lưu thông tin vùng trồng và chứng nhận chất lượng để gắn vào phiếu nhập lô.</p>
                        </div>
                        <button type="button" disabled={saving} onClick={() => setForm(null)}>
                            ← Quay lại
                        </button>
                    </div>

                    <form onSubmit={handleSaveSupplier} className="adm-form">
                        <label>
                            Tên nhà vườn / HTX / Công ty *
                            <input
                                required
                                type="text"
                                maxLength={200}
                                placeholder="VD: HTX Rau sạch Đà Lạt Xanh"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />
                        </label>

                        <label>
                            Người đại diện / Chủ vườn
                            <input
                                type="text"
                                maxLength={120}
                                placeholder="VD: Nguyễn Văn An"
                                value={form.contactPerson}
                                onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                            />
                        </label>

                        <label>
                            Số điện thoại liên hệ
                            <input
                                type="tel"
                                maxLength={25}
                                placeholder="VD: 0909 123 456"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                            />
                        </label>

                        <label>
                            Email
                            <input
                                type="email"
                                maxLength={150}
                                placeholder="nhavuon@example.com"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                            />
                        </label>

                        <label className="adm-wide">
                            Địa chỉ vùng trồng / Trang trại
                            <input
                                type="text"
                                maxLength={350}
                                placeholder="VD: Xã Xuân Thọ, TP. Đà Lạt, Lâm Đồng"
                                value={form.address}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                            />
                        </label>

                        <label>
                            Tiêu chuẩn chứng nhận
                            <select
                                value={form.certificationType}
                                onChange={e => setForm({ ...form, certificationType: e.target.value })}
                            >
                                {CERT_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Mã số chứng nhận (VietGAP / GlobalGAP)
                            <input
                                type="text"
                                maxLength={100}
                                placeholder="VD: VG-LD-2026-0892"
                                value={form.certificationCode}
                                onChange={e => setForm({ ...form, certificationCode: e.target.value.toUpperCase() })}
                            />
                        </label>

                        <label>
                            Ngày hết hạn chứng nhận
                            <input
                                type="date"
                                value={form.certificationExpiryDate}
                                onChange={e => setForm({ ...form, certificationExpiryDate: e.target.value })}
                            />
                        </label>

                        <label>
                            Trạng thái hợp tác
                            <select
                                value={form.isActive ? 'true' : 'false'}
                                onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}
                            >
                                <option value="true">Đang hợp tác</option>
                                <option value="false">Ngừng hợp tác</option>
                            </select>
                        </label>

                        <label className="adm-wide">
                            Ghi chú nguồn cung / Mặt hàng thế mạnh
                            <textarea
                                rows="3"
                                maxLength={500}
                                placeholder="VD: Chuyên cung cấp rau ăn lá thủy canh, giao hàng lúc 5h sáng..."
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                            />
                        </label>

                        <div className="adm-wide adm-actions">
                            <button type="submit" className="adm-primary" disabled={saving}>
                                {saving ? 'Đang lưu…' : 'Lưu nhà cung cấp'}
                            </button>
                            <button type="button" disabled={saving} onClick={() => setForm(null)}>
                                Hủy
                            </button>
                        </div>
                    </form>
                </section>
            ) : (
                <section className="adm-panel">
                    <div className="adm-panel-head">
                        <div>
                            <h2>Danh sách Nhà cung cấp / Nhà vườn</h2>
                            <p>{suppliers.length} đơn vị cung ứng nông sản</p>
                        </div>
                        <div className="adm-actions">
                            <button
                                type="button"
                                className="adm-primary"
                                disabled={loading}
                                onClick={() => startForm()}
                            >
                                + Thêm nhà vườn
                            </button>
                        </div>
                    </div>

                    {/* Bộ lọc */}
                    <div className="adm-filters">
                        <input
                            aria-label="Tìm nhà cung cấp"
                            placeholder="Tìm tên nhà vườn, vùng trồng, SĐT, mã chứng nhận…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <select
                            aria-label="Lọc theo chứng nhận"
                            value={certFilter}
                            onChange={e => setCertFilter(e.target.value)}
                        >
                            <option value="">Mọi chứng nhận</option>
                            {CERT_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <select
                            aria-label="Lọc trạng thái hợp tác"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Đang hợp tác</option>
                            <option value="inactive">Ngừng hợp tác</option>
                        </select>
                    </div>

                    {/* Bảng danh sách */}
                    <div className="adm-table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nhà cung cấp / Vùng trồng</th>
                                    <th>Chứng nhận chất lượng</th>
                                    <th>Liên hệ</th>
                                    <th>Lô đã nhập</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map(s => (
                                    <tr key={s.id} className={!s.isActive ? 'sup-row-inactive' : ''}>
                                        <td>
                                            <div className="adm-product">
                                                <span className="adm-thumb">🏡</span>
                                                <div>
                                                    <strong>{s.name}</strong>
                                                    <small>{s.address || 'Chưa cập nhật địa chỉ vùng trồng'}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="sup-cert-cell">
                                                <span className={getCertBadgeClass(s.certificationType)}>
                                                    {s.certificationType}
                                                </span>
                                                {s.certificationCode && (
                                                    <small className="sup-cert-code">Mã: {s.certificationCode}</small>
                                                )}
                                                {s.certificationExpiryDate && (
                                                    <small
                                                        className={`sup-cert-exp ${
                                                            s.isCertificationExpired
                                                                ? 'expired'
                                                                : s.isCertificationNearExpiry
                                                                ? 'near'
                                                                : ''
                                                        }`}
                                                    >
                                                        {s.isCertificationExpired
                                                            ? `⚠ Hết hạn (${formatDate(s.certificationExpiryDate)})`
                                                            : s.isCertificationNearExpiry
                                                            ? `⏰ Sắp hết hạn (${formatDate(s.certificationExpiryDate)})`
                                                            : `HSD: ${formatDate(s.certificationExpiryDate)}`}
                                                    </small>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <strong>{s.contactPerson || '—'}</strong>
                                            <small>{s.phone || 'Chưa có SĐT'}</small>
                                        </td>
                                        <td>
                                            <strong>{s.totalBatches} lô</strong>
                                            <small>
                                                {s.lastImportDate
                                                    ? `Gần nhất: ${formatDate(s.lastImportDate)}`
                                                    : 'Chưa có phiếu nhập'}
                                            </small>
                                        </td>
                                        <td>
                                            <span className={`adm-badge ${s.isActive ? '' : 'red'}`}>
                                                {s.isActive ? 'Đang hợp tác' : 'Ngừng hợp tác'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="adm-actions">
                                                <button
                                                    type="button"
                                                    className="sup-history-btn"
                                                    onClick={() => openSupplierHistory(s.id)}
                                                >
                                                    📋 Lịch sử lô
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={saving}
                                                    onClick={() => handleToggleActive(s)}
                                                    title={s.isActive ? 'Tạm ngừng hợp tác' : 'Kích hoạt hợp tác'}
                                                >
                                                    {s.isActive ? 'Ngừng' : 'Mở lại'}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={saving}
                                                    onClick={() => startForm(s)}
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    type="button"
                                                    className="adm-danger"
                                                    disabled={saving}
                                                    onClick={() => handleDeleteSupplier(s)}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!suppliers.length && (
                            <p className="adm-empty">
                                {loading ? 'Đang tải danh sách nhà cung cấp…' : 'Chưa có nhà cung cấp / nhà vườn phù hợp.'}
                            </p>
                        )}
                    </div>
                </section>
            )}

            {/* Modal Chi tiết & Lịch sử lô hàng của Nhà cung cấp */}
            {detailModal && (
                <div
                    className="sup-modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setDetailModal(null)}
                >
                    <div className="sup-modal" onClick={e => e.stopPropagation()}>
                        <header className="sup-modal-head">
                            <div>
                                <span className="adm-eyebrow">HỒ SƠ TRUY XUẤT NGUỒN GỐC</span>
                                <h2>{detailModal.name || 'Đang tải thông tin…'}</h2>
                                {detailModal.address && <p>{detailModal.address}</p>}
                            </div>
                            <button
                                type="button"
                                className="sup-modal-close"
                                aria-label="Đóng"
                                onClick={() => setDetailModal(null)}
                            >
                                ×
                            </button>
                        </header>

                        {detailLoading ? (
                            <p className="adm-empty">Đang tải lịch sử cung ứng…</p>
                        ) : (
                            <>
                                <div className="sup-detail-meta">
                                    <div>
                                        <span>Chứng nhận</span>
                                        <span className={getCertBadgeClass(detailModal.certificationType)}>
                                            {detailModal.certificationType}
                                        </span>
                                        {detailModal.certificationCode && (
                                            <small>Mã: {detailModal.certificationCode}</small>
                                        )}
                                    </div>
                                    <div>
                                        <span>Người đại diện</span>
                                        <strong>{detailModal.contactPerson || '—'}</strong>
                                        <small>{detailModal.phone || '—'}</small>
                                    </div>
                                    <div>
                                        <span>Tổng sản lượng cung cấp</span>
                                        <strong>{(detailModal.totalSuppliedQuantity || 0).toLocaleString('vi-VN')} đơn vị</strong>
                                        <small>{detailModal.totalBatches || 0} phiếu nhập lô</small>
                                    </div>
                                    <div>
                                        <span>Tổng giá trị nhập</span>
                                        <strong>{money(detailModal.totalImportValue)}</strong>
                                        <small>{detailModal.activeBatches || 0} lô đang còn tồn</small>
                                    </div>
                                </div>

                                <div className="sup-modal-body">
                                    <h3>Lịch sử các lô nông sản đã nhập</h3>
                                    {detailModal.batches?.length > 0 ? (
                                        <div className="adm-table-scroll">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Mã lô</th>
                                                        <th>Sản phẩm</th>
                                                        <th>Ngày nhập</th>
                                                        <th>Hạn sử dụng</th>
                                                        <th>Tồn / Nhập</th>
                                                        <th>Trạng thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {detailModal.batches.map(b => {
                                                        const st = batchStatusLabel[b.status] || { text: b.status, cls: '' };
                                                        return (
                                                            <tr key={b.batchId}>
                                                                <td><strong>{b.batchCode}</strong></td>
                                                                <td>
                                                                    <strong>{b.productName}</strong>
                                                                    {b.variantName && <small>Loại: {b.variantName}</small>}
                                                                </td>
                                                                <td>{formatDate(b.importDate)}</td>
                                                                <td>{formatDate(b.expiryDate)}</td>
                                                                <td>
                                                                    <strong>{b.remainingQuantity}</strong> / {b.initialQuantity} {b.unit}
                                                                </td>
                                                                <td>
                                                                    <span className={`adm-badge ${st.cls}`}>{st.text}</span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="adm-empty">Nhà vườn này chưa có lô nhập kho nào.</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}