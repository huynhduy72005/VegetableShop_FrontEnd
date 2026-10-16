import { useEffect, useState } from 'react';
import { api } from '../services/api';

const PAGE_SIZE = 8;
const money = value => Number(value || 0).toLocaleString('vi-VN') + ' ₫';
const formatDate = value => (value ? new Date(value).toLocaleString('vi-VN') : '—');

// Trạng thái -> [nhãn hiển thị, màu badge]
const STATUS = {
    Pending: ['Chờ xử lý', 'amber'],
    Completed: ['Hoàn thành', ''],
    Cancelled: ['Đã hủy', 'red'],
};
const statusInfo = status => STATUS[status] || [status || '—', ''];

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
        setDetailLoading(true);
        try {
            const res = await api.getOrderById(id);
            setDetail(res.data);
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
    }

    // ===== MÀN HÌNH CHI TIẾT =====
    if (selectedId !== null) {
        const [label, color] = statusInfo(detail?.status);
        const items = detail?.items || [];
        const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
        const extra = detail ? Number(detail.totalPrice) - subtotal : 0;

        return <section className="adm-panel">
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
                    <div><small>Trạng thái</small><span className={`adm-badge ${color}`}>{label}</span></div>
                    <div><small>Địa chỉ giao hàng</small><strong>{detail.shippingAddress || '—'}</strong></div>
                    <div><small>Tổng tiền</small><strong>{money(detail.totalPrice)}</strong></div>
                </div>

                <div className="adm-table-scroll">
                    <table>
                        <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th></tr></thead>
                        <tbody>
                            {items.map(item => <tr key={item.id}>
                                <td><div className="adm-product">
                                    <span className="adm-thumb">{item.image ? <img src={item.image} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} /> : '✿'}</span>
                                    <div><strong>{item.productName || `Sản phẩm #${item.productId}`}</strong><small>SP-{item.productId}</small></div>
                                </div></td>
                                <td>{money(item.price)}{item.unit && <small>/ {item.unit}</small>}</td>
                                <td>{item.quantity}</td>
                                <td><strong>{money(item.lineTotal)}</strong></td>
                            </tr>)}
                        </tbody>
                        <tfoot>
                            <tr><td colSpan="3" className="adm-right">Tạm tính</td><td>{money(subtotal)}</td></tr>
                            <tr><td colSpan="3" className="adm-right">Phí giao hàng / khác</td><td>{money(extra)}</td></tr>
                            <tr><td colSpan="3" className="adm-right"><strong>Tổng cộng</strong></td><td><strong>{money(detail.totalPrice)}</strong></td></tr>
                        </tfoot>
                    </table>
                    {!items.length && <p className="adm-empty">Đơn hàng này chưa có sản phẩm nào.</p>}
                </div>
            </>}
        </section>;
    }

    // ===== MÀN HÌNH DANH SÁCH =====
    const statuses = [...new Set(orders.map(o => o.status))];
    const keyword = search.trim().toLocaleLowerCase('vi');
    const filtered = orders.filter(o =>
        (!status || o.status === status) &&
        (!keyword || `${o.id} ${o.customerName} ${o.customerEmail || ''}`.toLocaleLowerCase('vi').includes(keyword))
    );
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return <section className="adm-panel" aria-busy={loading}>
        <div className="adm-panel-head">
            <div><h2>Danh sách đơn hàng</h2><p>{filtered.length} đơn hàng</p></div>
            <button disabled={loading} onClick={reload}>{loading ? 'Đang tải…' : '↻ Tải lại'}</button>
        </div>

        <div className="adm-filters">
            <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm theo mã đơn, tên hoặc email khách hàng…"
            />
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                <option value="">Tất cả trạng thái</option>
                {statuses.map(s => <option key={s} value={s}>{statusInfo(s)[0]}</option>)}
            </select>
        </div>

        {error && <p className="adm-empty" role="alert">{error}</p>}

        <div className="adm-table-scroll">
            <table>
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