import { useEffect, useState } from 'react';
import { api } from '../services/api';

const PAGE_SIZE = 8;
const money = value => Number(value || 0).toLocaleString('vi-VN') + ' ₫';
const formatDate = value => (value ? new Date(value).toLocaleString('vi-VN') : '—');

// Trạng thái -> [nhãn hiển thị, màu badge]
const STATUS = {
    Pending: ['Chờ xác nhận', 'amber'],
    Processing: ['Đang xử lý', 'purple'],
    Shipping: ['Đang giao hàng', 'blue'],
    Completed: ['Hoàn thành', ''],
    Cancelled: ['Đã hủy', 'red'],
};
const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipping', 'Completed', 'Cancelled'];
const normalizeStatus = status => {
    const value = String(status ?? '').toLowerCase();
    const matchingStatus = STATUS_OPTIONS.find(option => option.toLowerCase() === value);
    if (matchingStatus) return matchingStatus;
    return ({ '0': 'Pending', '1': 'Processing', '2': 'Shipping', '3': 'Completed', '4': 'Cancelled' })[value] || status;
};
const statusInfo = status => STATUS[normalizeStatus(status)] || [status || '—', ''];

function getProductImageUrl(image) {
    const source = String(image ?? '').trim();
    if (!source || /^(?:data:|blob:|https?:|\/\/)/i.test(source)) return source;

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7179/api';
    const apiOrigin = new URL(apiBaseUrl, window.location.origin).origin;
    return new URL(source, `${apiOrigin}/`).href;
}

function OrderProductImage({ image, alt }) {
    const [failed, setFailed] = useState(false);
    const src = getProductImageUrl(image);

    return <span className={`adm-thumb${!src || failed ? ' adm-thumb-fallback' : ''}`}>
        {src && !failed
            ? <img src={src} alt={alt} onError={() => setFailed(true)} />
            : <span aria-hidden="true">✿</span>}
    </span>;
}

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);

    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [statusDraft, setStatusDraft] = useState('');
    const [statusSaving, setStatusSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // Tải danh sách đơn hàng
    useEffect(() => {
        let active = true;
        api.getOrders()
            .then(res => { if (active) { setOrders(res.data); setError(''); } })
            .catch(() => { if (active) setError('Không tải được danh sách đơn hàng. Kiểm tra backend rồi bấm Tải lại.'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [reloadKey]);

    function reload() {
        setLoading(true);
        setReloadKey(key => key + 1);
    }

    // Mở chi tiết một đơn hàng
    async function openDetail(id) {
        setSelectedId(id);
        setDetail(null);
        setDetailError('');
        setStatusMessage('');
        setDetailLoading(true);
        try {
            const res = await api.getOrderById(id);
            setDetail(res.data);
            setStatusDraft(normalizeStatus(res.data.status) || '');
        } catch (err) {
            setDetailError(err.response?.status === 404
                ? 'Không tìm thấy đơn hàng này.'
                : 'Không tải được chi tiết đơn hàng. Hãy thử lại.');
        } finally {
            setDetailLoading(false);
        }
    }

    function closeDetail() {
        setSelectedId(null);
        setDetail(null);
        setDetailError('');
        setStatusMessage('');
    }

    async function saveStatus() {
        if (!detail || !statusDraft || statusDraft === detail.status || statusSaving) return;
        setStatusSaving(true);
        setStatusMessage('');
        setDetailError('');
        try {
            await api.updateOrderStatus(detail.id, statusDraft);
            setDetail(current => ({ ...current, status: statusDraft }));
            setStatusMessage('Trạng thái đơn hàng đã được cập nhật.');
            setReloadKey(key => key + 1);
        } catch (err) {
            setDetailError(err.response?.data?.message || 'Không cập nhật được trạng thái đơn hàng. Vui lòng thử lại.');
        } finally {
            setStatusSaving(false);
        }
    }

    // ===== MÀN HÌNH CHI TIẾT =====
    if (selectedId !== null) {
        const [label, color] = statusInfo(detail?.status);
        const items = detail?.items || [];
        const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
        const extra = detail ? Number(detail.totalPrice) - subtotal : 0;
        const shippingFee = detail?.shippingFee ?? Math.max(0, extra);

        return <section className="adm-panel adm-orders adm-order-detail">
            <div className="adm-panel-head">
                <div>
                    <h2>Đơn hàng #{selectedId}</h2>
                    {detail && <p>Đặt lúc {formatDate(detail.orderDate)}</p>}
                </div>
                <button onClick={closeDetail}>← Quay lại danh sách</button>
            </div>

            {detailLoading && <p className="adm-empty">Đang tải chi tiết…</p>}
            {detailError && <p className="adm-empty" role="alert">{detailError}</p>}

            {detail && <>
                <div className="adm-order-info">
                    <div><small>Khách hàng</small><strong>{detail.customerName}</strong><p>{detail.customerEmail || '—'}</p></div>
                    <div className="adm-order-status-control">
                        <small>Trạng thái</small>
                        <span className={`adm-badge ${color}`}>{label}</span>
                        <div className="adm-status-editor">
                            <select
                                aria-label="Trạng thái đơn hàng"
                                value={statusDraft}
                                onChange={event => setStatusDraft(event.target.value)}
                                disabled={statusSaving}
                            >
                                {STATUS_OPTIONS.map(option => <option key={option} value={option}>{statusInfo(option)[0]}</option>)}
                            </select>
                            <button
                                type="button"
                                className="adm-status-save"
                                onClick={saveStatus}
                                disabled={statusSaving || !statusDraft || statusDraft === detail.status}
                            >
                                {statusSaving ? 'Đang lưu…' : 'Cập nhật'}
                            </button>
                        </div>
                    </div>
                    <div><small>Tổng tiền</small><strong>{money(detail.totalPrice)}</strong></div>
                    <div className="adm-order-shipping">
                        <small>Thông tin giao hàng</small>
                        <div className="adm-shipping-line"><span>Địa chỉ</span><strong>{detail.shippingAddress || '—'}</strong></div>
                        <div className="adm-shipping-line"><span>Người nhận</span><strong>{detail.recipientName || detail.customerName || '—'}</strong></div>
                        <div className="adm-shipping-line"><span>Số điện thoại</span><strong>{detail.phone || '—'}</strong></div>
                        <div className="adm-shipping-line"><span>Ghi chú</span><strong>{detail.note || '—'}</strong></div>
                        <div className="adm-shipping-line"><span>Phí vận chuyển</span><strong>{money(shippingFee)}</strong></div>
                    </div>
                </div>
                {statusMessage && <p className="adm-status-message" role="status">{statusMessage}</p>}
                {detailError && <p className="adm-status-error" role="alert">{detailError}</p>}

                <div className="adm-table-scroll adm-order-items">
                    <table>
                        <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th></tr></thead>
                        <tbody>
                            {items.map(item => <tr key={item.id}>
                                <td><div className="adm-product">
                                    <OrderProductImage
                                        key={`${item.id}-${item.image || ''}`}
                                        image={item.image}
                                        alt={item.productName || `Sản phẩm ${item.productId}`}
                                    />
                                    <div><strong>{item.productName || `Sản phẩm #${item.productId}`}</strong><small>SP-{item.productId}</small></div>
                                </div></td>
                                <td>{money(item.price)}{item.unit && <small>/ {item.unit}</small>}</td>
                                <td>{item.quantity}</td>
                                <td><strong>{money(item.lineTotal)}</strong></td>
                            </tr>)}
                        </tbody>
                        <tfoot>
                            <tr><td colSpan="3" className="adm-right">Tạm tính</td><td>{money(subtotal)}</td></tr>
                            <tr><td colSpan="3" className="adm-right">Phí vận chuyển</td><td>{money(shippingFee)}</td></tr>
                            <tr><td colSpan="3" className="adm-right"><strong>Tổng cộng</strong></td><td><strong>{money(detail.totalPrice)}</strong></td></tr>
                        </tfoot>
                    </table>
                    {!items.length && <p className="adm-empty">Đơn hàng này chưa có sản phẩm nào.</p>}
                </div>
            </>}
        </section>;
    }

    // ===== MÀN HÌNH DANH SÁCH =====
    const statuses = [...new Set(orders.map(o => normalizeStatus(o.status)))];
    const keyword = search.trim().toLocaleLowerCase('vi');
    const filtered = orders.filter(o =>
        (!status || normalizeStatus(o.status) === status) &&
        (!keyword || `${o.id} ${o.customerName} ${o.customerEmail || ''}`.toLocaleLowerCase('vi').includes(keyword))
    );
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return <section className="adm-panel adm-orders" aria-busy={loading}>
        <div className="adm-panel-head">
            <div><h2>Danh sách đơn hàng</h2><p>{filtered.length} đơn hàng</p></div>
            <button disabled={loading} onClick={reload}>{loading ? 'Đang tải…' : '↻ Tải lại'}</button>
        </div>

        <div className="adm-filters">
            <input
                aria-label="Tìm đơn hàng"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm theo mã đơn, tên hoặc email khách hàng…"
            />
            <select aria-label="Lọc theo trạng thái" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                <option value="">Tất cả trạng thái</option>
                {statuses.map(s => <option key={s} value={s}>{statusInfo(s)[0]}</option>)}
            </select>
        </div>

        {error && <p className="adm-empty" role="alert">{error}</p>}

        <div className="adm-table-scroll">
            <table className="adm-orders-table">
                <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th><th>Số món</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                    {visible.map(o => {
                        const [label, color] = statusInfo(o.status);
                        return <tr key={o.id}>
                            <td><strong>#{o.id}</strong></td>
                            <td><strong>{o.customerName}</strong><small>{o.customerEmail || '—'}</small></td>
                            <td>{formatDate(o.orderDate)}</td>
                            <td>{o.itemCount}</td>
                            <td><strong>{money(o.totalPrice)}</strong></td>
                            <td><span className={`adm-badge ${color}`}>{label}</span></td>
                            <td><div className="adm-actions"><button onClick={() => openDetail(o.id)}>Xem chi tiết</button></div></td>
                        </tr>;
                    })}
                </tbody>
            </table>
            {!visible.length && !error && <p className="adm-empty">{loading ? 'Đang tải dữ liệu…' : 'Chưa có đơn hàng phù hợp.'}</p>}
        </div>

        <div className="adm-pagination">
            <span>Trang {currentPage} / {pageCount}</span>
            <div className="adm-actions">
                <button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>← Trước</button>
                <button disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Sau →</button>
            </div>
        </div>
    </section>;
}