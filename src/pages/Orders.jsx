import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import './Orders.css';

const ORDERS_API = `${(
    import.meta.env.VITE_API_BASE_URL || 'https://localhost:7179/api'
).replace(/\/+$/, '')}/orders`;

const ORDER_STATUSES = [
    { key: 'Pending', label: 'Chờ xác nhận', icon: '◷' },
    { key: 'Processing', label: 'Đang xử lý', icon: '◉' },
    { key: 'Shipping', label: 'Đang giao hàng', icon: '➜' },
    { key: 'Completed', label: 'Đã giao hàng', icon: '✓' },
    { key: 'Cancelled', label: 'Đã hủy', icon: '×' }
];

function normalizeStatus(status) {
    const value = String(status ?? '').toLowerCase();
    const byName = ORDER_STATUSES.find(item => item.key.toLowerCase() === value);
    if (byName) return byName.key;
    return ({ '0': 'Pending', '1': 'Processing', '2': 'Shipping', '3': 'Completed', '4': 'Cancelled' })[value] || 'Unknown';
}

function getStatusInfo(status) {
    return ORDER_STATUSES.find(item => item.key === normalizeStatus(status))
        || { key: 'Unknown', label: status || 'Chưa xác định', icon: '•' };
}

function money(value) {
    return `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
}

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

    return (
        <span className={`detail-item-image${!src || failed ? ' is-fallback' : ''}`}>
            {src && !failed
                ? <img src={src} alt={alt} onError={() => setFailed(true)} />
                : <span aria-hidden="true">✿</span>}
        </span>
    );
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Orders({ currentUser, onBuyAgain }) {
    const userId = currentUser?.id;
    const [orders, setOrders] = useState([]);
    const [activeStatus, setActiveStatus] = useState('Pending');
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [orderDetail, setOrderDetail] = useState(null);
    const [loading, setLoading] = useState(Boolean(userId));
    const [detailLoading, setDetailLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [reorderLoadingId, setReorderLoadingId] = useState(null);
    const [error, setError] = useState(userId ? '' : 'Vui lòng đăng nhập để xem đơn hàng của bạn.');
    const [detailError, setDetailError] = useState('');
    const [notice, setNotice] = useState('');

    useEffect(() => {
        if (!userId) return undefined;
        let active = true;
        axios.get(ORDERS_API, {
            params: { userId },
            headers: getAuthHeaders()
        })
            .then(response => {
                if (active) {
                    setOrders(Array.isArray(response.data) ? response.data : []);
                    setError('');
                }
            })
            .catch(requestError => {
                if (active) {
                    console.error('Lỗi tải đơn hàng:', requestError);
                    setError(requestError.response?.data?.message || 'Không tải được đơn hàng. Vui lòng thử lại.');
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [userId]);

    const fetchOrders = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(ORDERS_API, {
                params: { userId },
                headers: getAuthHeaders()
            });
            setOrders(Array.isArray(response.data) ? response.data : []);
        } catch (requestError) {
            console.error('Lỗi tải đơn hàng:', requestError);
            setError(requestError.response?.data?.message || 'Không tải được đơn hàng. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    async function openOrder(order) {
        setSelectedOrderId(order.id);
        setOrderDetail(order);
        setDetailError('');
        setDetailLoading(true);

        try {
            const response = await axios.get(`${ORDERS_API}/${order.id}`, {
                headers: getAuthHeaders()
            });
            setOrderDetail(response.data);
        } catch (requestError) {
            console.error('Lỗi tải chi tiết đơn hàng:', requestError);
            setDetailError(requestError.response?.data?.message || 'Không tải được chi tiết đơn hàng. Vui lòng thử lại.');
        } finally {
            setDetailLoading(false);
        }
    }

    function closeOrder() {
        setSelectedOrderId(null);
        setOrderDetail(null);
        setDetailError('');
    }

    async function cancelOrder() {
        if (
            !orderDetail ||
            normalizeStatus(orderDetail.status) !== 'Pending' ||
            cancelLoading
        ) return;

        const confirmed = window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderDetail.id} không?`);
        if (!confirmed) return;

        setCancelLoading(true);
        setNotice('');
        try {
            const response = await axios.put(`${ORDERS_API}/${orderDetail.id}/cancel`, {}, {
                params: { userId },
                headers: getAuthHeaders()
            });
            setOrders(current => current.map(order =>
                order.id === orderDetail.id
                    ? { ...order, status: response.data.status || 'Cancelled' }
                    : order
            ));
            setActiveStatus('Cancelled');
            setNotice(`Đơn hàng #${orderDetail.id} đã được hủy và chuyển sang mục Đã hủy.`);
            closeOrder();
        } catch (requestError) {
            console.error('Lỗi hủy đơn hàng:', requestError);
            setDetailError(requestError.response?.data?.message || 'Hủy đơn hàng thất bại. Vui lòng thử lại.');
        } finally {
            setCancelLoading(false);
        }
    }

    async function buyAgain(order) {
        if (!order || reorderLoadingId !== null) return;

        setReorderLoadingId(order.id);
        setNotice('');
        setDetailError('');
        try {
            const response = await axios.get(`${ORDERS_API}/${order.id}`, {
                headers: getAuthHeaders()
            });
            const items = Array.isArray(response.data.items) ? response.data.items : [];
            if (!items.length) {
                setNotice(`Đơn hàng #${order.id} chưa có sản phẩm để mua lại.`);
                return;
            }

            const products = items.map(item => ({
                id: item.productId,
                name: item.productName || `Sản phẩm #${item.productId}`,
                image: item.image || '',
                price: Number(item.price) || 0,
                unit: item.unit || '',
                quantity: Number(item.quantity) || 1,
                stockQuantity: Number(item.stockQuantity) || 0
            }));
            const unavailable = products.filter(product => product.stockQuantity < product.quantity);
            if (unavailable.length) {
                setNotice(`Không thể mua lại vì tồn kho không đủ: ${unavailable.map(product => product.name).join(', ')}.`);
                return;
            }

            onBuyAgain(products);
        } catch (requestError) {
            console.error('Lỗi tải sản phẩm để mua lại:', requestError);
            setNotice(requestError.response?.data?.message || 'Không thể tải sản phẩm của đơn hàng để mua lại. Vui lòng thử lại.');
        } finally {
            setReorderLoadingId(null);
        }
    }

    const filteredOrders = orders.filter(order => normalizeStatus(order.status) === activeStatus);
    const statusCounts = ORDER_STATUSES.reduce((counts, status) => {
        counts[status.key] = orders.filter(order => normalizeStatus(order.status) === status.key).length;
        return counts;
    }, {});
    const detailItems = orderDetail?.items || [];
    const detailSubtotal = detailItems.reduce(
        (sum, item) => sum + Number(item.lineTotal ?? Number(item.price || 0) * Number(item.quantity || item.qty || 0)),
        0
    );
    const detailShippingFee = orderDetail?.shippingFee ?? Math.max(
        0,
        Number(orderDetail?.totalPrice ?? orderDetail?.totalAmount ?? 0) - detailSubtotal
    );

    return (
        <main className="orders-page">
            <section className="orders-hero">
                <div className="orders-container orders-hero-content">
                    <span className="orders-eyebrow">VƯỜN NHÀ · ĐƠN HÀNG CỦA BẠN</span>
                    <h1>Theo dõi đơn hàng</h1>
                    <p>Cập nhật hành trình đơn hàng và xem lại lịch sử mua sắm của bạn.</p>
                    <div className="orders-hero-note"><span aria-hidden="true">✦</span> Nông sản tươi ngon, giao tận nhà</div>
                </div>
            </section>

            <div className="orders-container orders-content">
                {notice && <div className="orders-notice" role="status">
                    <span aria-hidden="true">✓</span>{notice}
                    <button type="button" onClick={() => setNotice('')} aria-label="Đóng thông báo">×</button>
                </div>}

                {selectedOrderId !== null ? (
                    <section className="order-detail-card" aria-busy={detailLoading || cancelLoading}>
                        <div className="detail-heading">
                            <button type="button" className="back-to-orders" onClick={closeOrder}>← <span>Danh sách đơn hàng</span></button>
                            <span className={`order-status-tag ${getStatusInfo(orderDetail?.status).key.toLowerCase()}`}>
                                {getStatusInfo(orderDetail?.status).label}
                            </span>
                            <h2>Chi tiết đơn hàng <span>#{selectedOrderId}</span></h2>
                            <p>Đặt ngày {formatDate(orderDetail?.createdDate || orderDetail?.orderDate)}</p>
                        </div>

                        {detailError && <div className="orders-error" role="alert">{detailError}</div>}
                        {detailLoading && <div className="orders-loading" role="status">Đang tải chi tiết đơn hàng…</div>}

                        {orderDetail && !detailLoading && (
                            <>
                                <div className="detail-summary">
                                    <div><span>Trạng thái</span><strong>{getStatusInfo(orderDetail.status).label}</strong></div>
                                    <div><span>Số sản phẩm</span><strong>{orderDetail.totalItems ?? orderDetail.itemCount ?? detailItems.reduce((sum, item) => sum + Number(item.quantity || item.qty || 0), 0)} món</strong></div>
                                    <div><span>Tổng thanh toán</span><strong className="detail-total">{money(orderDetail.totalAmount ?? orderDetail.totalPrice)}</strong></div>
                                </div>

                                <div className="detail-section">
                                    <h3>Sản phẩm trong đơn</h3>
                                    {detailItems.length ? (
                                        <div className="detail-items">
                                            {detailItems.map((item, index) => (
                                                <article className="detail-item" key={item.id || item.productId || index}>
                                                    <OrderProductImage
                                                        key={`${item.id || item.productId || index}-${item.image || ''}`}
                                                        image={item.image}
                                                        alt={item.productName || item.name || `Sản phẩm ${item.productId}`}
                                                    />
                                                    <div className="detail-item-copy">
                                                        <strong>{item.productName || item.name || `Sản phẩm #${item.productId}`}</strong>
                                                        <span>{Number(item.quantity || item.qty || 0)} {item.unit || 'sản phẩm'} · {money(item.price)}</span>
                                                    </div>
                                                    <strong>{money(item.lineTotal ?? Number(item.price || 0) * Number(item.quantity || item.qty || 0))}</strong>
                                                </article>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="detail-empty">{detailError ? 'Không thể tải danh sách sản phẩm.' : 'Đơn hàng chưa có thông tin sản phẩm chi tiết.'}</p>
                                    )}
                                    {detailItems.length > 0 && (
                                        <div className="detail-cost-summary">
                                            <div><span>Tạm tính</span><strong>{money(detailSubtotal)}</strong></div>
                                            <div><span>Phí vận chuyển</span><strong>{money(detailShippingFee)}</strong></div>
                                            <div className="detail-cost-total"><span>Tổng thanh toán</span><strong>{money(orderDetail.totalAmount ?? orderDetail.totalPrice)}</strong></div>
                                        </div>
                                    )}
                                </div>

                                <div className="shipping-address">
                                    <div className="shipping-address-heading">
                                        <span aria-hidden="true">⌖</span>
                                        <strong>Thông tin giao hàng</strong>
                                    </div>
                                    <div className="shipping-info-line"><span>Người nhận</span><strong>{orderDetail.recipientName || orderDetail.customerName || currentUser?.fullName || '—'}</strong></div>
                                    <div className="shipping-info-line"><span>Địa chỉ</span><strong>{orderDetail.shippingAddress || orderDetail.address || '—'}</strong></div>
                                    <div className="shipping-info-line"><span>Số điện thoại</span><strong>{orderDetail.phone || '—'}</strong></div>
                                    <div className="shipping-info-line"><span>Ghi chú</span><strong>{orderDetail.note || '—'}</strong></div>
                                    <div className="shipping-info-line"><span>Phí vận chuyển</span><strong>{money(detailShippingFee)}</strong></div>
                                    {orderDetail.paymentMethod && (
                                        <div className="shipping-info-line"><span>Thanh toán</span><strong>{orderDetail.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : orderDetail.paymentMethod}</strong></div>
                                    )}
                                </div>

                                {normalizeStatus(orderDetail.status) === 'Pending' && (
                                    <div className="detail-actions">
                                        <p>Đơn chỉ có thể hủy khi đang chờ xác nhận.</p>
                                        <button type="button" className="cancel-btn" onClick={cancelOrder} disabled={cancelLoading}>
                                            {cancelLoading ? 'Đang hủy đơn…' : 'Hủy đơn hàng'}
                                        </button>
                                    </div>
                                )}
                                {normalizeStatus(orderDetail.status) === 'Cancelled' && (
                                    <div className="detail-actions reorder-actions">
                                        <p>Sản phẩm sẽ được kiểm tra tồn kho trước khi thanh toán.</p>
                                        <button
                                            type="button"
                                            className="reorder-btn"
                                            onClick={() => buyAgain(orderDetail)}
                                            disabled={reorderLoadingId === orderDetail.id}
                                        >
                                            {reorderLoadingId === orderDetail.id ? 'Đang kiểm tra…' : 'Mua lại đơn này'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                ) : !userId ? (
                    <div className="orders-message">
                        <span className="empty-icon" aria-hidden="true">♙</span>
                        <h3>Đăng nhập để xem đơn hàng</h3>
                        <p>Đơn hàng sẽ được liên kết với tài khoản của bạn sau khi đăng nhập.</p>
                    </div>
                ) : (
                    <>
                        <div className="orders-intro">
                            <div><span className="orders-section-label">LỊCH SỬ MUA SẮM</span><h2>Đơn hàng của bạn</h2></div>
                            <p>{orders.length} đơn hàng trong tài khoản</p>
                        </div>

                        <div className="order-tabs" aria-label="Lọc đơn hàng theo trạng thái">
                            {ORDER_STATUSES.map(status => (
                                <button
                                    type="button"
                                    aria-pressed={activeStatus === status.key}
                                    className={`tab-btn ${activeStatus === status.key ? 'active' : ''}`}
                                    key={status.key}
                                    onClick={() => setActiveStatus(status.key)}
                                >
                                    <span className="tab-icon" aria-hidden="true">{status.icon}</span>
                                    <span>{status.label}</span>
                                    <span className="tab-count">{statusCounts[status.key] || 0}</span>
                                </button>
                            ))}
                        </div>

                        {error ? (
                            <div className="orders-message orders-message-error" role="alert">
                                <span className="message-icon" aria-hidden="true">!</span>
                                <h3>Chưa thể tải đơn hàng</h3>
                                <p>{error}</p>
                                <button type="button" onClick={fetchOrders}>Thử tải lại</button>
                            </div>
                        ) : loading ? (
                            <div className="orders-message" role="status"><span className="orders-spinner" />Đang tải đơn hàng của bạn…</div>
                        ) : filteredOrders.length ? (
                            <div className="order-list">
                                {filteredOrders.map(order => {
                                    const status = getStatusInfo(order.status);
                                    const itemCount = order.totalItems ?? order.itemCount ?? order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ?? 0;
                                    return (
                                        <article className="order-card" key={order.id}>
                                            <div className="order-header">
                                                <div className="order-meta">
                                                    <span className="order-id">
                                                        <svg className="order-id-icon" viewBox="0 0 24 24" aria-hidden="true">
                                                            <path d="M7 3.75h7l4.25 4.3v11.2A1.75 1.75 0 0 1 16.5 21h-9A1.75 1.75 0 0 1 5.75 19.25v-13.75A1.75 1.75 0 0 1 7.5 3.75Z" />
                                                            <path d="M14 4v4.5h4.5M8.5 12h7M8.5 15.5h7" />
                                                        </svg>
                                                        <span>Mã đơn</span><strong>#{order.id}</strong>
                                                    </span>
                                                    <span className="order-date">{formatDate(order.createdDate || order.orderDate)}</span>
                                                </div>
                                                <span className={`order-status-tag ${status.key.toLowerCase()}`}><span aria-hidden="true">{status.icon}</span>{status.label}</span>
                                            </div>
                                            <div className="order-card-summary">
                                                <div className="order-summary-icon" aria-hidden="true">▧</div>
                                                <div className="order-summary-copy">
                                                    <strong>{itemCount} sản phẩm</strong>
                                                    <span>{order.shippingAddress || 'Đơn hàng từ Vườn Nhà'}</span>
                                                </div>
                                                <div className="order-total"><span>Tổng thanh toán</span><strong>{money(order.totalAmount ?? order.totalPrice)}</strong></div>
                                            </div>
                                            <div className="order-footer">
                                                <span className="order-help">Cần hỗ trợ? Liên hệ cửa hàng để được giúp đỡ.</span>
                                                <div className="order-footer-actions">
                                                    {status.key === 'Cancelled' && (
                                                        <button
                                                            type="button"
                                                            className="reorder-btn"
                                                            onClick={() => buyAgain(order)}
                                                            disabled={reorderLoadingId === order.id}
                                                        >
                                                            {reorderLoadingId === order.id ? 'Đang kiểm tra…' : 'Mua lại'}
                                                        </button>
                                                    )}
                                                    <button type="button" className="detail-btn" onClick={() => openOrder(order)}>Xem chi tiết <span aria-hidden="true">→</span></button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="orders-message empty-orders">
                                <span className="empty-icon" aria-hidden="true">{getStatusInfo(activeStatus).icon}</span>
                                <h3>Chưa có đơn hàng {getStatusInfo(activeStatus).label.toLowerCase()}</h3>
                                <p>Đơn hàng thuộc trạng thái này sẽ hiển thị tại đây.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
