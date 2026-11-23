import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './KitchenTips.css';

const CATEGORIES = [
    'Tất cả',
    'Mẹo bảo quản',
    'Công thức nấu ăn',
    'Dinh dưỡng xanh',
    'Sơ chế sạch'
];

const formatDate = value => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export default function KitchenTips({ onBack }) {
    const [tips, setTips] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [search, setSearch] = useState('');
    const [activeTip, setActiveTip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        const timer = setTimeout(() => {
            setLoading(true);
            setError('');
            const params = {};
            if (selectedCategory && selectedCategory !== 'Tất cả') {
                params.category = selectedCategory;
            }
            if (search.trim()) {
                params.search = search.trim();
            }

            api.getKitchenTips(params)
                .then(({ data }) => {
                    if (!active) return;
                    setTips(Array.isArray(data) ? data : []);
                })
                .catch(() => {
                    if (!active) return;
                    setError('Không tải được danh sách bài viết Mẹo hay nhà bếp.');
                })
                .finally(() => {
                    if (active) setLoading(false);
                });
        }, 200);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [selectedCategory, search]);

    async function handleOpenArticle(tip) {
        setActiveTip(tip);
        try {
            const { data } = await api.getKitchenTipById(tip.id);
            if (data) {
                setActiveTip(data);
                setTips(prev =>
                    prev.map(item =>
                        item.id === data.id ? { ...item, viewCount: data.viewCount } : item
                    )
                );
            }
        } catch {
            // Giữ nguyên dữ liệu hiện có nếu không gọi tăng view được
        }
    }

    return (
        <div className="kt-page">
            <header className="kt-hero">
                {onBack && (
                    <button type="button" className="kt-back-btn" onClick={onBack}>
                        ← Quay lại cửa hàng
                    </button>
                )}
                <span className="kt-eyebrow">CẨM NANG BẾP XANH VEGETABLE</span>
                <h1>Mẹo hay nhà bếp & Dinh dưỡng sạch</h1>
                <p>
                    Bí quyết bảo quản rau củ tươi lâu, cách sơ chế giữ trọn vitamin và gợi ý
                    món ngon thanh đạm mỗi ngày cho gia đình.
                </p>
            </header>

            <div className="kt-toolbar">
                <div className="kt-cats" role="tablist" aria-label="Chuyên mục mẹo nhà bếp">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            className={selectedCategory === cat ? 'active' : ''}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <input
                    type="search"
                    className="kt-search"
                    aria-label="Tìm kiếm mẹo nhà bếp"
                    placeholder="Tìm cách bảo quản, công thức nấu…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {error && <div role="alert" className="kt-alert">{error}</div>}

            {loading ? (
                <p className="kt-empty">Đang tải bài viết từ Bếp VEGETABLE…</p>
            ) : tips.length === 0 ? (
                <div className="kt-empty">
                    <p>Chưa có bài viết nào trong chuyên mục này.</p>
                </div>
            ) : (
                <section className="kt-grid">
                    {tips.map(tip => (
                        <article
                            key={tip.id}
                            className="kt-card"
                            onClick={() => handleOpenArticle(tip)}
                        >
                            <div className="kt-card-media">
                                {tip.image ? (
                                    <img
                                        src={tip.image}
                                        alt={tip.title}
                                        onError={e => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="kt-card-placeholder">🌿</div>
                                )}
                                <span className="kt-card-badge">{tip.category}</span>
                            </div>

                            <div className="kt-card-body">
                                <div className="kt-card-meta">
                                    <span>{tip.authorName || 'Bếp VEGETABLE'}</span>
                                    <span>·</span>
                                    <span>{formatDate(tip.createdAt)}</span>
                                    <span>·</span>
                                    <span>{(tip.viewCount || 0).toLocaleString('vi-VN')} lượt xem</span>
                                </div>

                                <h2>{tip.title}</h2>
                                <p>
                                    {tip.summary ||
                                        (tip.content ? tip.content.slice(0, 130) + '…' : '')}
                                </p>

                                <span className="kt-read-more">Đọc chi tiết →</span>
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {/* Modal đọc chi tiết bài viết */}
            {activeTip && (
                <div
                    className="kt-modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setActiveTip(null)}
                >
                    <article className="kt-modal" onClick={e => e.stopPropagation()}>
                        <button
                            type="button"
                            className="kt-modal-close"
                            aria-label="Đóng bài viết"
                            onClick={() => setActiveTip(null)}
                        >
                            ×
                        </button>

                        {activeTip.image && (
                            <img
                                className="kt-modal-cover"
                                src={activeTip.image}
                                alt={activeTip.title}
                            />
                        )}

                        <div className="kt-modal-content">
                            <div className="kt-card-meta">
                                <span className="kt-card-badge inline">{activeTip.category}</span>
                                <span>Tác giả: {activeTip.authorName || 'Bếp VEGETABLE'}</span>
                                <span>·</span>
                                <span>{formatDate(activeTip.createdAt)}</span>
                                <span>·</span>
                                <span>{(activeTip.viewCount || 0).toLocaleString('vi-VN')} lượt đọc</span>
                            </div>

                            <h2>{activeTip.title}</h2>

                            {activeTip.summary && (
                                <p className="kt-modal-summary">{activeTip.summary}</p>
                            )}

                            <div className="kt-modal-body">
                                {activeTip.content}
                            </div>
                        </div>
                    </article>
                </div>
            )}
        </div>
    );
}