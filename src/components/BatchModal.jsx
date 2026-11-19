import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getCertBadgeClass } from './AdminSuppliers';
import './BatchModal.css';

const money = value => Number(value || 0).toLocaleString('vi-VN') + ' ₫';

const formatDate = value => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const formatDateTime = value => {
    if (!value) return '—';
    return new Date(value).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const todayInput = () => new Date().toISOString().slice(0, 10);

const defaultExpiryInput = () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().slice(0, 10);
};

const statusConfig = {
    Valid: { label: 'Còn hạn', badgeClass: 'bm-badge valid' },
    NearExpiry: { label: 'Cận date', badgeClass: 'bm-badge near' },
    Expired: { label: 'Hết hạn', badgeClass: 'bm-badge expired' },
    Depleted: { label: 'Đã xuất hết', badgeClass: 'bm-badge depleted' }
};

const expiryCountdownText = batch => {
    if (batch.status === 'Depleted') return 'Đã xuất hết tồn lô';
    if (batch.daysUntilExpiry < 0) return `Quá hạn ${Math.abs(batch.daysUntilExpiry)} ngày`;
    if (batch.daysUntilExpiry === 0) return 'Hết hạn hôm nay';
    return `Còn ${batch.daysUntilExpiry} ngày`;
};

const quickDisposalReasons = [
    'Quá hạn sử dụng',
    'Rau củ dập nát / úng hỏng',
    'Hao hụt trong quá trình bảo quản'
];

export default function BatchModal({ product, onClose, onChanged }) {
    const hasVariants = Array.isArray(product?.variants) && product.variants.length > 0;
    const [batches, setBatches] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [summary, setSummary] = useState({
        validStock: 0,
        nearExpiryStock: 0,
        expiredStock: 0,
        nearExpiryBatchCount: 0,
        expiredBatchCount: 0
    });
    const [disposals, setDisposals] = useState([]);
    const [activeView, setActiveView] = useState('batches'); // 'batches' | 'disposals'
    const [showImportForm, setShowImportForm] = useState(false);
    const [disposingBatch, setDisposingBatch] = useState(null);

    const [importForm, setImportForm] = useState({
        productVariantId: hasVariants ? String(product.variants[0].id) : '',
        batchCode: '',
        importDate: todayInput(),
        expiryDate: defaultExpiryInput(),
        quantity: '',
        importPrice: '',
        supplierId: '',
        supplierName: '',
        note: ''
    });

    const [disposeForm, setDisposeForm] = useState({
        quantity: '',
        reason: ''
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    async function loadBatchData() {
        if (!product?.id) return;
        setLoading(true);
        try {
            const [batchRes, disposalRes, supplierRes] = await Promise.all([
                api.getBatchesByProduct(product.id),
                api.getBatchDisposalLogs(product.id).catch(() => ({ data: [] })),
                api.getSuppliers({ isActive: true }).catch(() => ({ data: [] }))
            ]);
            setBatches(batchRes.data?.batches || []);
            setSummary(batchRes.data?.summary || {
                validStock: 0,
                nearExpiryStock: 0,
                expiredStock: 0,
                nearExpiryBatchCount: 0,
                expiredBatchCount: 0
            });
            setDisposals(Array.isArray(disposalRes.data) ? disposalRes.data : []);
            setSuppliers(Array.isArray(supplierRes.data) ? supplierRes.data : []);
        } catch (error) {
            setMessage({
                error: true,
                text: error.response?.data?.message || 'Không tải được danh sách lô hàng.'
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadBatchData();
    }, [product?.id]);

    async function handleImportSubmit(e) {
        e.preventDefault();
        if (submitting) return;

        const qty = Number(importForm.quantity);
        if (!Number.isInteger(qty) || qty <= 0) {
            setMessage({ error: true, text: 'Số lượng nhập phải là số nguyên lớn hơn 0.' });
            return;
        }
        if (!importForm.expiryDate) {
            setMessage({ error: true, text: 'Vui lòng chọn hạn sử dụng của lô hàng.' });
            return;
        }
        if (hasVariants && !importForm.productVariantId) {
            setMessage({ error: true, text: 'Vui lòng chọn loại/biến thể sản phẩm cần nhập lô.' });
            return;
        }

        const isManualSupplier = importForm.supplierId === 'manual';
        const parsedSupplierId =
            importForm.supplierId && !isManualSupplier ? Number(importForm.supplierId) : null;

        setSubmitting(true);
        setMessage(null);
        try {
            const payload = {
                productId: product.id,
                productVariantId: hasVariants ? Number(importForm.productVariantId) : null,
                batchCode: importForm.batchCode.trim() || null,
                importDate: importForm.importDate || null,
                expiryDate: importForm.expiryDate,
                quantity: qty,
                importPrice: importForm.importPrice !== '' ? Number(importForm.importPrice) : null,
                supplierId: parsedSupplierId,
                supplierName: isManualSupplier ? importForm.supplierName.trim() || null : null,
                note: importForm.note.trim() || null
            };

            const { data } = await api.importProductBatch(payload);
            setMessage({ error: false, text: data?.message || 'Đã nhập lô hàng mới thành công.' });
            setShowImportForm(false);
            setImportForm({
                productVariantId: hasVariants ? String(product.variants[0].id) : '',
                batchCode: '',
                importDate: todayInput(),
                expiryDate: defaultExpiryInput(),
                quantity: '',
                importPrice: '',
                supplierId: '',
                supplierName: '',
                note: ''
            });
            await loadBatchData();
            if (onChanged) await onChanged();
        } catch (error) {
            setMessage({
                error: true,
                text: error.response?.data?.message || 'Nhập lô thất bại. Kiểm tra lại ngày nhập và hạn sử dụng.'
            });
        } finally {
            setSubmitting(false);
        }
    }

    function openDisposeForm(batch) {
        setMessage(null);
        setShowImportForm(false);
        setDisposingBatch(batch);
        setDisposeForm({
            quantity: batch.status === 'Expired' ? String(batch.remainingQuantity) : '1',
            reason: batch.status === 'Expired' ? 'Quá hạn sử dụng' : ''
        });
    }

    async function handleDisposeSubmit(e) {
        e.preventDefault();
        if (submitting || !disposingBatch) return;

        const qty = Number(disposeForm.quantity);
        if (!Number.isInteger(qty) || qty <= 0 || qty > disposingBatch.remainingQuantity) {
            setMessage({
                error: true,
                text: `Số lượng hủy phải từ 1 đến ${disposingBatch.remainingQuantity}.`
            });
            return;
        }
        if (!disposeForm.reason.trim()) {
            setMessage({ error: true, text: 'Vui lòng nhập lý do xuất hủy hàng.' });
            return;
        }

        setSubmitting(true);
        setMessage(null);
        try {
            const { data } = await api.disposeProductBatch({
                batchId: disposingBatch.id,
                quantity: qty,
                reason: disposeForm.reason.trim()
            });
            setMessage({ error: false, text: data?.message || 'Đã xuất hủy lô hàng.' });
            setDisposingBatch(null);
            setDisposeForm({ quantity: '', reason: '' });
            await loadBatchData();
            if (onChanged) await onChanged();
        } catch (error) {
            setMessage({
                error: true,
                text: error.response?.data?.message || 'Không xuất hủy được lô hàng.'
            });
        } finally {
            setSubmitting(false);
        }
    }

    const selectedSupplier = suppliers.find(s => String(s.id) === String(importForm.supplierId));

    return (
        <div className="bm-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="bm-title">
            <div className="bm-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <header className="bm-header">
                    <div className="bm-prod-info">
                        <span className="bm-thumb">
                            {product.image ? <img src={product.image} alt="" /> : '✿'}
                        </span>
                        <div>
                            <span className="bm-eyebrow">QUẢN LÝ LÔ HÀNG & TRUY XUẤT NGUỒN GỐC</span>
                            <h2 id="bm-title">{product.name}</h2>
                            <small>Mã SP: SP-{product.id} · Đơn vị chuẩn: {product.unit}</small>
                        </div>
                    </div>
                    <button type="button" className="bm-close" onClick={onClose} aria-label="Đóng cửa sổ">
                        ×
                    </button>
                </header>

                {/* Thống kê nhanh của sản phẩm */}
                <div className="bm-summary-grid">
                    <div className="bm-stat-card valid">
                        <span>Tồn khả dụng (Còn hạn)</span>
                        <strong>{summary.validStock} {product.unit}</strong>
                        <small>Đang mở bán cho khách</small>
                    </div>
                    <div className="bm-stat-card near">
                        <span>Sắp hết hạn (≤ 3 ngày)</span>
                        <strong>{summary.nearExpiryStock} {product.unit}</strong>
                        <small>{summary.nearExpiryBatchCount} lô cần ưu tiên đẩy bán</small>
                    </div>
                    <div className="bm-stat-card expired">
                        <span>Đã quá hạn sử dụng</span>
                        <strong>{summary.expiredStock} {product.unit}</strong>
                        <small>{summary.expiredBatchCount} lô đã tự ngừng bán</small>
                    </div>
                </div>

                {/* Thông báo */}
                {message && (
                    <div role={message.error ? 'alert' : 'status'} className={`bm-notice ${message.error ? 'error' : ''}`}>
                        <span>{message.text}</span>
                        <button type="button" onClick={() => setMessage(null)}>×</button>
                    </div>
                )}

                {/* Thanh công cụ chuyển tab & nút Nhập lô mới */}
                <div className="bm-toolbar">
                    <div className="bm-tabs">
                        <button
                            type="button"
                            className={activeView === 'batches' ? 'active' : ''}
                            onClick={() => setActiveView('batches')}
                        >
                            Danh sách lô hàng ({batches.length})
                        </button>
                        <button
                            type="button"
                            className={activeView === 'disposals' ? 'active' : ''}
                            onClick={() => setActiveView('disposals')}
                        >
                            Lịch sử xuất hủy ({disposals.length})
                        </button>
                    </div>
                    <button
                        type="button"
                        className="bm-btn-primary"
                        disabled={submitting}
                        onClick={() => {
                            setDisposingBatch(null);
                            setShowImportForm(prev => !prev);
                        }}
                    >
                        {showImportForm ? '− Đóng form nhập' : '+ Nhập lô mới'}
                    </button>
                </div>

                {/* Form Nhập lô hàng mới */}
                {showImportForm && (
                    <form className="bm-subform" onSubmit={handleImportSubmit}>
                        <h3>Phiếu nhập lô hàng & Truy xuất nguồn gốc</h3>
                        <div className="bm-form-grid">
                            {hasVariants && (
                                <label>
                                    Loại / Quy cách sản phẩm *
                                    <select
                                        required
                                        value={importForm.productVariantId}
                                        onChange={e => setImportForm({ ...importForm, productVariantId: e.target.value })}
                                    >
                                        {product.variants.map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.name} ({v.unit || product.unit})
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                            <label>
                                Số lượng nhập ({product.unit}) *
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Ví dụ: 30"
                                    value={importForm.quantity}
                                    onChange={e => setImportForm({ ...importForm, quantity: e.target.value })}
                                />
                            </label>
                            <label>
                                Ngày nhập kho *
                                <input
                                    required
                                    type="date"
                                    value={importForm.importDate}
                                    onChange={e => setImportForm({ ...importForm, importDate: e.target.value })}
                                />
                            </label>
                            <label>
                                Hạn sử dụng (HSD) *
                                <input
                                    required
                                    type="date"
                                    min={importForm.importDate || undefined}
                                    value={importForm.expiryDate}
                                    onChange={e => setImportForm({ ...importForm, expiryDate: e.target.value })}
                                />
                            </label>
                            <label>
                                Mã lô / Số phiếu nhập (tự sinh nếu trống)
                                <input
                                    type="text"
                                    maxLength={50}
                                    placeholder={`VD: LO-SP${product.id}-01`}
                                    value={importForm.batchCode}
                                    onChange={e => setImportForm({ ...importForm, batchCode: e.target.value.toUpperCase() })}
                                />
                            </label>
                            <label>
                                Nhà cung cấp / Nhà vườn
                                <select
                                    value={importForm.supplierId}
                                    onChange={e =>
                                        setImportForm({
                                            ...importForm,
                                            supplierId: e.target.value,
                                            supplierName: ''
                                        })
                                    }
                                >
                                    <option value="">-- Chọn nhà vườn / nhà cung cấp --</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} [{s.certificationType}]
                                        </option>
                                    ))}
                                    <option value="manual">✎ Nhập tên nguồn khác bên ngoài…</option>
                                </select>
                            </label>
                            {importForm.supplierId === 'manual' && (
                                <label>
                                    Tên nhà vườn / Nguồn nhập ngoài
                                    <input
                                        type="text"
                                        maxLength={200}
                                        placeholder="VD: Vườn rau Đà Lạt"
                                        value={importForm.supplierName}
                                        onChange={e => setImportForm({ ...importForm, supplierName: e.target.value })}
                                    />
                                </label>
                            )}
                            <label>
                                Giá vốn nhập / {product.unit} (VNĐ)
                                <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    placeholder="Tùy chọn"
                                    value={importForm.importPrice}
                                    onChange={e => setImportForm({ ...importForm, importPrice: e.target.value })}
                                />
                            </label>
                            <label>
                                Ghi chú bảo quản
                                <input
                                    type="text"
                                    maxLength={500}
                                    placeholder="VD: Bảo quản ngăn mát 4°C"
                                    value={importForm.note}
                                    onChange={e => setImportForm({ ...importForm, note: e.target.value })}
                                />
                            </label>
                        </div>

                        {selectedSupplier && (
                            <div className="bm-supplier-preview">
                                <span className={getCertBadgeClass(selectedSupplier.certificationType)}>
                                    {selectedSupplier.certificationType}
                                </span>
                                <span>
                                    <strong>{selectedSupplier.name}</strong>
                                    {selectedSupplier.address ? ` · Vùng trồng: ${selectedSupplier.address}` : ''}
                                    {selectedSupplier.certificationCode ? ` · Mã CN: ${selectedSupplier.certificationCode}` : ''}
                                </span>
                            </div>
                        )}

                        <div className="bm-form-actions">
                            <button type="submit" className="bm-btn-primary" disabled={submitting}>
                                {submitting ? 'Đang lưu lô…' : 'Xác nhận nhập kho'}
                            </button>
                            <button type="button" disabled={submitting} onClick={() => setShowImportForm(false)}>
                                Hủy
                            </button>
                        </div>
                    </form>
                )}

                {/* Form Xuất hủy / Báo hỏng */}
                {disposingBatch && (
                    <form className="bm-subform bm-dispose-form" onSubmit={handleDisposeSubmit}>
                        <h3>Xuất hủy / Báo hỏng lô {disposingBatch.batchCode}</h3>
                        <p className="bm-dispose-hint">
                            Tồn hiện tại của lô này: <strong>{disposingBatch.remainingQuantity} {product.unit}</strong>
                            {disposingBatch.variantName ? ` (${disposingBatch.variantName})` : ''}.
                        </p>
                        <div className="bm-form-grid">
                            <label>
                                Số lượng xuất hủy ({product.unit}) *
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    max={disposingBatch.remainingQuantity}
                                    step="1"
                                    value={disposeForm.quantity}
                                    onChange={e => setDisposeForm({ ...disposeForm, quantity: e.target.value })}
                                />
                            </label>
                            <label>
                                Lý do xuất hủy *
                                <input
                                    required
                                    type="text"
                                    maxLength={300}
                                    placeholder="Nhập lý do hao hụt / hư hỏng..."
                                    value={disposeForm.reason}
                                    onChange={e => setDisposeForm({ ...disposeForm, reason: e.target.value })}
                                />
                            </label>
                        </div>
                        <div className="bm-reason-chips">
                            {quickDisposalReasons.map(reason => (
                                <button
                                    key={reason}
                                    type="button"
                                    className="bm-chip"
                                    onClick={() => setDisposeForm(prev => ({ ...prev, reason }))}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                        <div className="bm-form-actions">
                            <button type="submit" className="bm-btn-danger" disabled={submitting}>
                                {submitting ? 'Đang xử lý…' : 'Xác nhận xuất hủy'}
                            </button>
                            <button type="button" disabled={submitting} onClick={() => setDisposingBatch(null)}>
                                Hủy
                            </button>
                        </div>
                    </form>
                )}

                {/* Nội dung danh sách */}
                <div className="bm-body">
                    {loading ? (
                        <p className="bm-empty">Đang tải dữ liệu lô hàng…</p>
                    ) : activeView === 'batches' ? (
                        batches.length === 0 ? (
                            <div className="bm-empty">
                                <p>Sản phẩm này chưa có lô nhập kho nào.</p>
                                <small>Bấm <strong>+ Nhập lô mới</strong> ở góc trên để bắt đầu theo dõi hạn sử dụng & nguồn gốc.</small>
                            </div>
                        ) : (
                            <div className="bm-table-wrap">
                                <table className="bm-table">
                                    <thead>
                                        <tr>
                                            <th>Mã lô</th>
                                            <th>Nhà cung cấp & Chứng nhận</th>
                                            <th>Ngày nhập</th>
                                            <th>Hạn sử dụng</th>
                                            <th>Tồn lô / Nhập</th>
                                            <th>Trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {batches.map(b => {
                                            const st = statusConfig[b.status] || statusConfig.Valid;
                                            return (
                                                <tr key={b.id} className={b.status === 'Expired' ? 'row-expired' : b.status === 'NearExpiry' ? 'row-near' : ''}>
                                                    <td>
                                                        <strong>{b.batchCode}</strong>
                                                        {b.variantName && <small className="bm-variant-tag">Loại: {b.variantName}</small>}
                                                        {b.importPrice != null && <small>Giá nhập: {money(b.importPrice)}</small>}
                                                    </td>
                                                    <td>
                                                        {b.supplierName ? (
                                                            <div className="bm-origin-cell">
                                                                <strong>{b.supplierName}</strong>
                                                                {b.certificationType && (
                                                                    <span className={getCertBadgeClass(b.certificationType)}>
                                                                        {b.certificationType}
                                                                    </span>
                                                                )}
                                                                {b.supplierAddress && <small>{b.supplierAddress}</small>}
                                                            </div>
                                                        ) : (
                                                            <small>Chưa gắn nhà vườn</small>
                                                        )}
                                                    </td>
                                                    <td>{formatDate(b.importDate)}</td>
                                                    <td>
                                                        <strong>{formatDate(b.expiryDate)}</strong>
                                                        <small className={`bm-countdown ${b.status.toLowerCase()}`}>
                                                            {expiryCountdownText(b)}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <strong>{b.remainingQuantity}</strong> / {b.initialQuantity} {product.unit}
                                                    </td>
                                                    <td>
                                                        <span className={st.badgeClass}>{st.label}</span>
                                                    </td>
                                                    <td>
                                                        {b.remainingQuantity > 0 ? (
                                                            <button
                                                                type="button"
                                                                className="bm-btn-outline-danger"
                                                                disabled={submitting}
                                                                onClick={() => openDisposeForm(b)}
                                                            >
                                                                Xuất hủy / Báo hỏng
                                                            </button>
                                                        ) : (
                                                            <small>—</small>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : disposals.length === 0 ? (
                        <p className="bm-empty">Chưa có lịch sử xuất hủy hàng hỏng cho sản phẩm này.</p>
                    ) : (
                        <div className="bm-table-wrap">
                            <table className="bm-table">
                                <thead>
                                    <tr>
                                        <th>Thời gian hủy</th>
                                        <th>Mã lô</th>
                                        <th>Số lượng hủy</th>
                                        <th>Lý do hao hụt</th>
                                        <th>Người thực hiện</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {disposals.map(d => (
                                        <tr key={d.id}>
                                            <td>{formatDateTime(d.disposedAt)}</td>
                                            <td><strong>{d.batchCode}</strong></td>
                                            <td><strong className="bm-text-red">-{d.quantityDisposed} {d.unit || product.unit}</strong></td>
                                            <td>{d.reason}</td>
                                            <td>{d.disposedBy}</td>
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