import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './Vouchers.css';

const money = value => Number(value || 0).toLocaleString('vi-VN') + ' đ';

const formatDate = dateStr => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export default function Vouchers({ currentUser, onUseVoucher, embedded = false }) {
    const [myWallet, setMyWallet] = useState([]);
    const [discoverable, setDiscoverable] = useState([]);
    const [filter, setFilter] = useState('available'); // 'available' | 'discover' | 'history'
    const [promoCode, setPromoCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [notice, setNotice] = useState(null);
    const [copiedCode, setCopiedCode] = useState('');

    async function loadVouchers() {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await api.getMyVouchers();
            setMyWallet(response.data?.myWallet || []);
            setDiscoverable(response.data?.discoverable || []);
        } catch {
            setNotice({ error: true, text: 'Không tải được danh sách voucher. Vui lòng thử lại.' });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadVouchers();
    }, [currentUser?.id]);

    async function handleClaimCode(codeToClaim) {
        const cleanCode = (codeToClaim || '').trim().toUpperCase();
        if (!cleanCode || claiming) return;

        setClaiming(true);
        setNotice(null);
        try {
            const response = await api.claimVoucher(cleanCode);
            setNotice({ text: response.data?.message || `Đã lưu mã ${cleanCode}!` });
            setPromoCode('');
            await loadVouchers();
            setFilter('available');
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không thể lưu mã giảm giá này.'
            });
        } finally {
            setClaiming(false);
        }
    }

    function handleCopyCode(code) {
        navigator.clipboard?.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(''), 2000);
    }

    const availableVouchers = myWallet.filter(v => v.status === 'Available');
    const historyVouchers = myWallet.filter(v => v.status !== 'Available');

    const displayedList =
        filter === 'available'
            ? availableVouchers
            : filter === 'discover'
                ? discoverable
                : historyVouchers;

    return (
        <div className={`vc-page${embedded ? ' vc-embedded' : ''}`}>
            <section className="vc-banner">
                <div>
                    <span className="vc-eyebrow">ƯU ĐÃI VƯỜN NHÀ</span>
                    <h1>
                        Ví Voucher
                        <span>{availableVouchers.length}</span>
                    </h1>
                    <p>Lưu trữ mã giảm giá của bạn và áp dụng nhanh chỉ với một chạm khi thanh toán.</p>
                </div>

                <form
                    className="vc-claim-form"
                    onSubmit={e => {
                        e.preventDefault();
                        handleClaimCode(promoCode);
                    }}
                >
                    <input
                        type="text"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Nhập mã ưu đãi (VD: VUONNHA20)"
                        maxLength={30}
                        aria-label="Nhập mã voucher"
                    />
                    <button type="submit" disabled={claiming || !promoCode.trim()}>
                        {claiming ? 'Đang lưu...' : 'Lưu mã'}
                    </button>
                </form>
            </section>

            {notice && (
                <div className={`vc-notice ${notice.error ? 'is-error' : ''}`} role="status">
                    <span>{notice.text}</span>
                    <button type="button" onClick={() => setNotice(null)}>×</button>
                </div>
            )}

            <div className="vc-tabs" role="tablist">
                <button
                    type="button"
                    className={filter === 'available' ? 'active' : ''}
                    onClick={() => setFilter('available')}
                >
                    Có thể dùng ({availableVouchers.length})
                </button>
                <button
                    type="button"
                    className={filter === 'discover' ? 'active' : ''}
                    onClick={() => setFilter('discover')}
                >
                    Săn thêm mã ({discoverable.length})
                </button>
                <button
                    type="button"
                    className={filter === 'history' ? 'active' : ''}
                    onClick={() => setFilter('history')}
                >
                    Đã dùng / Hết hạn ({historyVouchers.length})
                </button>
            </div>

            {loading ? (
                <div className="vc-empty">Đang tải Ví Voucher của bạn...</div>
            ) : displayedList.length === 0 ? (
                <div className="vc-empty">
                    <h3>
                        {filter === 'available'
                            ? 'Bạn chưa có mã giảm giá nào khả dụng'
                            : filter === 'discover'
                                ? 'Bạn đã lưu hết tất cả mã ưu đãi hiện có!'
                                : 'Chưa có lịch sử sử dụng mã giảm giá'}
                    </h3>
                    <p>
                        {filter === 'available'
                            ? 'Chuyển sang tab "Săn thêm mã" hoặc nhập mã khuyến mãi ở khung phía trên để lưu vào ví.'
                            : 'Các ưu đãi mới từ Vườn Nhà sẽ sớm được cập nhật tại đây.'}
                    </p>
                    {filter === 'available' && discoverable.length > 0 && (
                        <button
                            type="button"
                            className="vc-primary-btn"
                            onClick={() => setFilter('discover')}
                        >
                            Khám phá {discoverable.length} mã ưu đãi ngay
                        </button>
                    )}
                </div>
            ) : (
                <div className="vc-grid">
                    {displayedList.map(item => {
                        const isDiscover = filter === 'discover';
                        const isUsable = !isDiscover && item.status === 'Available';
                        const badgeText =
                            item.discountType === 'Percent'
                                ? `GIẢM ${item.discountValue}%`
                                : `GIẢM ${Number(item.discountValue / 1000).toLocaleString('vi-VN')}K`;

                        return (
                            <article
                                key={item.userVoucherId || item.voucherId}
                                className={`vc-ticket ${!isDiscover && !isUsable ? 'is-disabled' : ''}`}
                            >
                                <div className="vc-ticket-left">
                                    <span className="vc-ticket-badge">{badgeText}</span>
                                    <strong className="vc-ticket-code">{item.code}</strong>
                                    {item.isPersonal && (
                                        <span className="vc-personal-tag">Dành riêng cho bạn</span>
                                    )}
                                </div>

                                <div className="vc-ticket-divider" aria-hidden="true" />

                                <div className="vc-ticket-right">
                                    <h3>{item.title}</h3>
                                    {item.description && <p className="vc-desc">{item.description}</p>}

                                    <div className="vc-meta">
                                        <span>Đơn tối thiểu {money(item.minOrderValue)}</span>
                                        <span>HSD: {formatDate(item.endDate)}</span>
                                    </div>

                                    <div className="vc-actions">
                                        <button
                                            type="button"
                                            className="vc-copy-btn"
                                            onClick={() => handleCopyCode(item.code)}
                                        >
                                            {copiedCode === item.code ? '✓ Đã chép' : 'Sao chép mã'}
                                        </button>

                                        {isDiscover ? (
                                            <button
                                                type="button"
                                                className="vc-primary-btn"
                                                disabled={claiming}
                                                onClick={() => handleClaimCode(item.code)}
                                            >
                                                Lưu vào ví
                                            </button>
                                        ) : isUsable ? (
                                            <button
                                                type="button"
                                                className="vc-primary-btn"
                                                onClick={() => onUseVoucher?.(item)}
                                            >
                                                Dùng ngay
                                            </button>
                                        ) : (
                                            <span className="vc-status-label">
                                                {item.status === 'Used' ? 'Đã sử dụng' : 'Hết hạn'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}