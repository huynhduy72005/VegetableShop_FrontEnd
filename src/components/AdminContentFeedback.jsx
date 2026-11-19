import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './AdminContentFeedback.css';

const TIP_CATEGORIES = [
    'Mẹo bảo quản',
    'Công thức nấu ăn',
    'Dinh dưỡng xanh',
    'Sơ chế sạch'
];

const CONTACT_STATUS_META = {
    Pending: { label: 'Chờ xử lý', badge: 'red' },
    Processing: { label: 'Đang xử lý', badge: 'amber' },
    Resolved: { label: 'Đã giải quyết', badge: '' }
};

const emptyTipForm = {
    title: '',
    category: 'Mẹo bảo quản',
    authorName: 'Bếp Vườn Nhà',
    image: '',
    summary: '',
    content: '',
    isPublished: true
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

const renderStars = rating => {
    const count = Math.max(1, Math.min(5, Number(rating) || 5));
    return '★'.repeat(count) + '☆'.repeat(5 - count);
};

export default function AdminContentFeedback({ onChanged }) {
    const [subTab, setSubTab] = useState('tips'); // 'tips' | 'reviews' | 'contacts'
    const [notice, setNotice] = useState(null);
    const [saving, setSaving] = useState(false);

    // ===== 1. STATE MẸO HAY NHÀ BẾP =====
    const [tips, setTips] = useState([]);
    const [tipsLoading, setTipsLoading] = useState(true);
    const [tipSearch, setTipSearch] = useState('');
    const [tipCategoryFilter, setTipCategoryFilter] = useState('');
    const [tipPublishFilter, setTipPublishFilter] = useState('');
    const [tipForm, setTipForm] = useState(null);

    // ===== 2. STATE ĐÁNH GIÁ SẢN PHẨM =====
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewSearch, setReviewSearch] = useState('');
    const [reviewRatingFilter, setReviewRatingFilter] = useState('');
    const [reviewHiddenFilter, setReviewHiddenFilter] = useState('');
    const [replyingReview, setReplyingReview] = useState(null);
    const [replyText, setReplyText] = useState('');

    // ===== 3. STATE LIÊN HỆ & KHIẾU NẠI =====
    const [contacts, setContacts] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(true);
    const [contactSearch, setContactSearch] = useState('');
    const [contactStatusFilter, setContactStatusFilter] = useState('');
    const [handlingContact, setHandlingContact] = useState(null);
    const [contactForm, setContactForm] = useState({ status: 'Pending', adminNote: '' });

    // ----- LOAD DATA -----
    async function loadTips() {
        setTipsLoading(true);
        try {
            const params = {};
            if (tipSearch.trim()) params.search = tipSearch.trim();
            if (tipCategoryFilter) params.category = tipCategoryFilter;
            if (tipPublishFilter === 'published') params.isPublished = true;
            if (tipPublishFilter === 'draft') params.isPublished = false;

            const { data } = await api.getAdminKitchenTips(params);
            setTips(Array.isArray(data) ? data : []);
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không tải được danh sách bài viết Mẹo nhà bếp.'
            });
        } finally {
            setTipsLoading(false);
        }
    }

    async function loadReviews() {
        setReviewsLoading(true);
        try {
            const params = {};
            if (reviewSearch.trim()) params.search = reviewSearch.trim();
            if (reviewRatingFilter) params.rating = Number(reviewRatingFilter);
            if (reviewHiddenFilter === 'visible') params.isHidden = false;
            if (reviewHiddenFilter === 'hidden') params.isHidden = true;

            const { data } = await api.getAdminReviews(params);
            setReviews(Array.isArray(data) ? data : []);
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không tải được danh sách đánh giá sản phẩm.'
            });
        } finally {
            setReviewsLoading(false);
        }
    }

    async function loadContacts() {
        setContactsLoading(true);
        try {
            const params = {};
            if (contactSearch.trim()) params.search = contactSearch.trim();
            if (contactStatusFilter) params.status = contactStatusFilter;

            const { data } = await api.getContactMessages(params);
            setContacts(Array.isArray(data) ? data : []);
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không tải được danh sách liên hệ / khiếu nại.'
            });
        } finally {
            setContactsLoading(false);
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            loadTips();
        }, 200);
        return () => clearTimeout(timer);
    }, [tipSearch, tipCategoryFilter, tipPublishFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadReviews();
        }, 200);
        return () => clearTimeout(timer);
    }, [reviewSearch, reviewRatingFilter, reviewHiddenFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadContacts();
        }, 200);
        return () => clearTimeout(timer);
    }, [contactSearch, contactStatusFilter]);

    // ----- HANDLERS: MẸO HAY NHÀ BẾP -----
    function openTipForm(tip = null) {
        setNotice(null);
        if (tip) {
            setTipForm({
                id: tip.id,
                title: tip.title || '',
                category: tip.category || 'Mẹo bảo quản',
                authorName: tip.authorName || 'Bếp Vườn Nhà',
                image: tip.image || '',
                summary: tip.summary || '',
                content: tip.content || '',
                isPublished: tip.isPublished !== false
            });
        } else {
            setTipForm({ ...emptyTipForm });
        }
    }

    function handleTipImageFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setTipForm(prev => ({ ...prev, image: reader.result }));
        };
        reader.readAsDataURL(file);
    }

    async function handleSaveTip(e) {
        e.preventDefault();
        if (saving) return;

        const title = (tipForm.title || '').trim();
        const content = (tipForm.content || '').trim();
        if (!title || !content) {
            setNotice({ error: true, text: 'Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.' });
            return;
        }

        const payload = {
            title,
            category: tipForm.category || 'Mẹo bảo quản',
            authorName: (tipForm.authorName || '').trim() || 'Bếp Vườn Nhà',
            image: (tipForm.image || '').trim() || null,
            summary: (tipForm.summary || '').trim() || null,
            content,
            isPublished: Boolean(tipForm.isPublished)
        };

        setSaving(true);
        setNotice(null);
        try {
            if (tipForm.id) {
                const { data } = await api.updateKitchenTip(tipForm.id, payload);
                setNotice({ text: data?.message || 'Đã cập nhật bài viết.' });
            } else {
                const { data } = await api.createKitchenTip(payload);
                setNotice({ text: data?.message || 'Đã đăng bài viết mới.' });
            }
            setTipForm(null);
            await loadTips();
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Lưu bài viết thất bại.'
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleToggleTipPublish(tip) {
        if (saving) return;
        const nextPublished = !tip.isPublished;
        setSaving(true);
        try {
            await api.updateKitchenTip(tip.id, {
                title: tip.title,
                category: tip.category,
                authorName: tip.authorName,
                image: tip.image,
                summary: tip.summary,
                content: tip.content,
                isPublished: nextPublished
            });
            setNotice({
                text: nextPublished
                    ? `Đã xuất bản bài viết “${tip.title}”.`
                    : `Đã chuyển “${tip.title}” sang ẩn / bản nháp.`
            });
            await loadTips();
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không cập nhật được trạng thái bài viết.'
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteTip(tip) {
        if (!window.confirm(`Xóa vĩnh viễn bài viết “${tip.title}”?`)) return;
        setSaving(true);
        try {
            const { data } = await api.deleteKitchenTip(tip.id);
            setNotice({ text: data?.message || 'Đã xóa bài viết.' });
            await loadTips();
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không xóa được bài viết.'
            });
        } finally {
            setSaving(false);
        }
    }

    // ----- HANDLERS: ĐÁNH GIÁ SẢN PHẨM -----
    async function handleToggleReviewVisibility(review) {
        if (saving) return;
        const nextHidden = !review.isHidden;
        setSaving(true);
        try {
            const { data } = await api.toggleReviewVisibility(review.id, nextHidden);
            setNotice({
                text: data?.message || (nextHidden ? 'Đã ẩn đánh giá xấu.' : 'Đã duyệt hiển thị đánh giá.')
            });
            await loadReviews();
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không cập nhật được trạng thái đánh giá.'
            });
        } finally {
            setSaving(false);
        }
    }

    function openReplyModal(review) {
        setNotice(null);
        setReplyingReview(review);
        setReplyText(review.adminReply || '');
    }

    async function handleSaveReply(e) {
        e.preventDefault();
        if (saving || !replyingReview) return;
        setSaving(true);
        try {
            const { data } = await api.replyReview(replyingReview.id, replyText.trim());
            setNotice({ text: data?.message || 'Đã lưu phản hồi của cửa hàng.' });
            setReplyingReview(null);
            setReplyText('');
            await loadReviews();
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Lưu phản hồi thất bại.'
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteReview(review) {
        if (!window.confirm(`Xóa vĩnh viễn đánh giá của “${review.customerName}”?`)) return;
        setSaving(true);
        try {
            const { data } = await api.deleteReview(review.id);
            setNotice({ text: data?.message || 'Đã xóa đánh giá.' });
            await loadReviews();
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không xóa được đánh giá.'
            });
        } finally {
            setSaving(false);
        }
    }

    // ----- HANDLERS: LIÊN HỆ & KHIẾU NẠI -----
    function openContactModal(contact) {
        setNotice(null);
        setHandlingContact(contact);
        setContactForm({
            status: contact.status === 'Pending' ? 'Processing' : contact.status,
            adminNote: contact.adminNote || ''
        });
    }

    async function handleSaveContactStatus(e) {
        e.preventDefault();
        if (saving || !handlingContact) return;
        setSaving(true);
        try {
            const { data } = await api.updateContactStatus(handlingContact.id, {
                status: contactForm.status,
                adminNote: contactForm.adminNote.trim()
            });
            setNotice({ text: data?.message || 'Đã cập nhật trạng thái xử lý phản hồi.' });
            setHandlingContact(null);
            await loadContacts();
            if (onChanged) await onChanged();
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Cập nhật thất bại.'
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteContact(contact) {
        if (!window.confirm(`Xóa tin nhắn liên hệ từ “${contact.fullName}”?`)) return;
        setSaving(true);
        try {
            const { data } = await api.deleteContactMessage(contact.id);
            setNotice({ text: data?.message || 'Đã xóa tin nhắn liên hệ.' });
            await loadContacts();
            if (onChanged) await onChanged();
        } catch (error) {
            setNotice({
                error: true,
                text: error.response?.data?.message || 'Không xóa được liên hệ.'
            });
        } finally {
            setSaving(false);
        }
    }

    const pendingContactsCount = contacts.filter(c => c.status === 'Pending').length;
    const lowRatingReviewsCount = reviews.filter(r => r.rating <= 2 && !r.isHidden).length;

    return (
        <div className="acf-wrap">
            {notice && (
                <div role={notice.error ? 'alert' : 'status'} className={`adm-notice ${notice.error ? 'error' : ''}`}>
                    {notice.text}
                    <button aria-label="Đóng thông báo" onClick={() => setNotice(null)}>×</button>
                </div>
            )}

            {/* Thanh chuyển 3 phân hệ con */}
            <div className="acf-subnav" role="tablist" aria-label="Quản lý nội dung và phản hồi">
                <button
                    type="button"
                    role="tab"
                    aria-selected={subTab === 'tips'}
                    className={subTab === 'tips' ? 'active' : ''}
                    onClick={() => { setSubTab('tips'); setTipForm(null); }}
                >
                    <span>🍳</span>
                    <div>
                        <strong>Mẹo hay nhà bếp</strong>
                        <small>{tips.length} bài viết</small>
                    </div>
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={subTab === 'reviews'}
                    className={subTab === 'reviews' ? 'active' : ''}
                    onClick={() => setSubTab('reviews')}
                >
                    <span>⭐</span>
                    <div>
                        <strong>Đánh giá sản phẩm</strong>
                        <small>
                            {reviews.length} đánh giá
                            {lowRatingReviewsCount > 0 ? ` · ${lowRatingReviewsCount} sao thấp` : ''}
                        </small>
                    </div>
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={subTab === 'contacts'}
                    className={subTab === 'contacts' ? 'active' : ''}
                    onClick={() => setSubTab('contacts')}
                >
                    <span>📩</span>
                    <div>
                        <strong>Liên hệ & Khiếu nại</strong>
                        <small>
                            {pendingContactsCount > 0
                                ? `${pendingContactsCount} chờ xử lý`
                                : `${contacts.length} phản hồi`}
                        </small>
                    </div>
                    {pendingContactsCount > 0 && (
                        <span className="acf-pill-count">{pendingContactsCount}</span>
                    )}
                </button>
            </div>

            {/* =========================================================
                TAB 1: QUẢN LÝ BÀI VIẾT "MẸO HAY NHÀ BẾP"
               ========================================================= */}
            {subTab === 'tips' && (
                tipForm ? (
                    <section className="adm-panel">
                        <div className="adm-panel-head">
                            <div>
                                <h2>{tipForm.id ? 'Chỉnh sửa bài viết Mẹo nhà bếp' : 'Đăng bài viết Mẹo hay nhà bếp mới'}</h2>
                                <p>Bài viết xuất bản sẽ hiển thị trực tiếp trên trang Mẹo hay nhà bếp của khách hàng.</p>
                            </div>
                            <button type="button" disabled={saving} onClick={() => setTipForm(null)}>
                                ← Quay lại
                            </button>
                        </div>

                        <form onSubmit={handleSaveTip} className="adm-form">
                            <label className="adm-wide">
                                Tiêu đề bài viết *
                                <input
                                    required
                                    type="text"
                                    maxLength={220}
                                    placeholder="VD: 5 cách giữ rau cải xanh tươi giòn cả tuần trong tủ lạnh"
                                    value={tipForm.title}
                                    onChange={e => setTipForm({ ...tipForm, title: e.target.value })}
                                />
                            </label>

                            <label>
                                Chuyên mục
                                <select
                                    value={tipForm.category}
                                    onChange={e => setTipForm({ ...tipForm, category: e.target.value })}
                                >
                                    {TIP_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Tác giả / Bút danh
                                <input
                                    type="text"
                                    maxLength={120}
                                    placeholder="Bếp Vườn Nhà"
                                    value={tipForm.authorName}
                                    onChange={e => setTipForm({ ...tipForm, authorName: e.target.value })}
                                />
                            </label>

                            <label>
                                Ảnh bìa bài viết (URL hoặc tải ảnh lên)
                                <input
                                    type="text"
                                    placeholder="https://… hoặc /images/…"
                                    value={tipForm.image}
                                    onChange={e => setTipForm({ ...tipForm, image: e.target.value })}
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleTipImageFile}
                                    style={{ marginTop: '8px' }}
                                />
                            </label>

                            <label>
                                Trạng thái hiển thị
                                <select
                                    value={tipForm.isPublished ? 'true' : 'false'}
                                    onChange={e => setTipForm({ ...tipForm, isPublished: e.target.value === 'true' })}
                                >
                                    <option value="true">Xuất bản công khai</option>
                                    <option value="false">Lưu bản nháp (Ẩn)</option>
                                </select>
                            </label>

                            <label className="adm-wide">
                                Tóm tắt ngắn (hiển thị ở thẻ bài viết)
                                <textarea
                                    rows="2"
                                    maxLength={500}
                                    placeholder="Mô tả ngắn gọn nội dung chính thu hút người đọc..."
                                    value={tipForm.summary}
                                    onChange={e => setTipForm({ ...tipForm, summary: e.target.value })}
                                />
                            </label>

                            <label className="adm-wide">
                                Nội dung chi tiết bài viết *
                                <textarea
                                    required
                                    rows="10"
                                    placeholder="Nhập các bước sơ chế, mẹo bảo quản hoặc công thức nấu ăn chi tiết..."
                                    value={tipForm.content}
                                    onChange={e => setTipForm({ ...tipForm, content: e.target.value })}
                                />
                            </label>

                            <div className="adm-wide adm-actions">
                                <button type="submit" className="adm-primary" disabled={saving}>
                                    {saving ? 'Đang lưu…' : 'Lưu & Đăng bài'}
                                </button>
                                <button type="button" disabled={saving} onClick={() => setTipForm(null)}>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </section>
                ) : (
                    <section className="adm-panel">
                        <div className="adm-panel-head">
                            <div>
                                <h2>Danh sách bài viết Mẹo hay nhà bếp</h2>
                                <p>{tips.length} bài viết trong hệ thống</p>
                            </div>
                            <div className="adm-actions">
                                <button
                                    type="button"
                                    className="adm-primary"
                                    disabled={tipsLoading}
                                    onClick={() => openTipForm()}
                                >
                                    + Đăng bài mới
                                </button>
                            </div>
                        </div>

                        <div className="adm-filters">
                            <input
                                aria-label="Tìm bài viết"
                                placeholder="Tìm tiêu đề, tóm tắt, tác giả…"
                                value={tipSearch}
                                onChange={e => setTipSearch(e.target.value)}
                            />
                            <select
                                aria-label="Lọc chuyên mục"
                                value={tipCategoryFilter}
                                onChange={e => setTipCategoryFilter(e.target.value)}
                            >
                                <option value="">Tất cả chuyên mục</option>
                                {TIP_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <select
                                aria-label="Lọc trạng thái xuất bản"
                                value={tipPublishFilter}
                                onChange={e => setTipPublishFilter(e.target.value)}
                            >
                                <option value="">Mọi trạng thái</option>
                                <option value="published">Đã xuất bản</option>
                                <option value="draft">Bản nháp / Đang ẩn</option>
                            </select>
                        </div>

                        <div className="adm-table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Bài viết</th>
                                        <th>Chuyên mục</th>
                                        <th>Lượt đọc</th>
                                        <th>Ngày đăng</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tips.map(t => (
                                        <tr key={t.id} className={!t.isPublished ? 'acf-row-muted' : ''}>
                                            <td>
                                                <div className="adm-product">
                                                    <span className="adm-thumb">
                                                        {t.image ? (
                                                            <img src={t.image} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />
                                                        ) : '🥬'}
                                                    </span>
                                                    <div>
                                                        <strong>{t.title}</strong>
                                                        <small>
                                                            Tác giả: {t.authorName || 'Bếp Vườn Nhà'}
                                                            {t.summary ? ` · ${t.summary.slice(0, 70)}${t.summary.length > 70 ? '…' : ''}` : ''}
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="acf-cat-tag">{t.category}</span>
                                            </td>
                                            <td>
                                                <strong>{(t.viewCount || 0).toLocaleString('vi-VN')}</strong> lượt
                                            </td>
                                            <td>
                                                <small>{formatDateTime(t.createdAt)}</small>
                                            </td>
                                            <td>
                                                <span className={`adm-badge ${t.isPublished ? '' : 'amber'}`}>
                                                    {t.isPublished ? 'Đang hiển thị' : 'Bản nháp / Ẩn'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="adm-actions">
                                                    <button
                                                        type="button"
                                                        disabled={saving}
                                                        onClick={() => handleToggleTipPublish(t)}
                                                    >
                                                        {t.isPublished ? 'Ẩn bài' : 'Xuất bản'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={saving}
                                                        onClick={() => openTipForm(t)}
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="adm-danger"
                                                        disabled={saving}
                                                        onClick={() => handleDeleteTip(t)}
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!tips.length && (
                                <p className="adm-empty">
                                    {tipsLoading ? 'Đang tải danh sách bài viết…' : 'Chưa có bài viết Mẹo hay nhà bếp nào.'}
                                </p>
                            )}
                        </div>
                    </section>
                )
            )}

            {/* =========================================================
                TAB 2: QUẢN LÝ ĐÁNH GIÁ SẢN PHẨM (DUYỆT / ẨN / PHẢN HỒI)
               ========================================================= */}
            {subTab === 'reviews' && (
                <section className="adm-panel">
                    <div className="adm-panel-head">
                        <div>
                            <h2>Kiểm duyệt Đánh giá sản phẩm</h2>
                            <p>Ẩn các bình luận tiêu cực/spam vi phạm và gửi phản hồi chăm sóc khách hàng.</p>
                        </div>
                    </div>

                    <div className="adm-filters">
                        <input
                            aria-label="Tìm đánh giá"
                            placeholder="Tìm tên sản phẩm, khách hàng, nội dung bình luận…"
                            value={reviewSearch}
                            onChange={e => setReviewSearch(e.target.value)}
                        />
                        <select
                            aria-label="Lọc theo số sao"
                            value={reviewRatingFilter}
                            onChange={e => setReviewRatingFilter(e.target.value)}
                        >
                            <option value="">Tất cả số sao</option>
                            <option value="1">1 sao (Rất tệ)</option>
                            <option value="2">2 sao (Không hài lòng)</option>
                            <option value="3">3 sao (Bình thường)</option>
                            <option value="4">4 sao (Tốt)</option>
                            <option value="5">5 sao (Tuyệt vời)</option>
                        </select>
                        <select
                            aria-label="Lọc trạng thái kiểm duyệt"
                            value={reviewHiddenFilter}
                            onChange={e => setReviewHiddenFilter(e.target.value)}
                        >
                            <option value="">Mọi trạng thái</option>
                            <option value="visible">Đang hiển thị</option>
                            <option value="hidden">Đã ẩn</option>
                        </select>
                    </div>

                    <div className="adm-table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Sản phẩm & Khách hàng</th>
                                    <th>Đánh giá & Bình luận</th>
                                    <th>Phản hồi của Shop</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.map(r => (
                                    <tr key={r.id} className={r.isHidden ? 'acf-row-muted' : ''}>
                                        <td>
                                            <div className="adm-product">
                                                <span className="adm-thumb">
                                                    {r.productImage ? (
                                                        <img src={r.productImage} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />
                                                    ) : '✿'}
                                                </span>
                                                <div>
                                                    <strong>{r.productName}</strong>
                                                    <small>Khách: {r.customerName} · {formatDateTime(r.createdAt)}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="acf-comment-cell">
                                            <span className={`acf-stars ${r.rating <= 2 ? 'low' : ''}`}>
                                                {renderStars(r.rating)} ({r.rating}/5)
                                            </span>
                                            <p className="acf-comment-text">{r.comment}</p>
                                        </td>
                                        <td className="acf-reply-cell">
                                            {r.adminReply ? (
                                                <div className="acf-shop-reply">
                                                    <strong>Vườn Nhà phản hồi:</strong>
                                                    <p>{r.adminReply}</p>
                                                </div>
                                            ) : (
                                                <small>Chưa phản hồi</small>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`adm-badge ${r.isHidden ? 'red' : ''}`}>
                                                {r.isHidden ? 'Đã ẩn' : 'Đang hiển thị'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="adm-actions">
                                                <button
                                                    type="button"
                                                    className="acf-reply-btn"
                                                    disabled={saving}
                                                    onClick={() => openReplyModal(r)}
                                                >
                                                    💬 {r.adminReply ? 'Sửa phản hồi' : 'Phản hồi'}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={saving}
                                                    onClick={() => handleToggleReviewVisibility(r)}
                                                >
                                                    {r.isHidden ? 'Duyệt hiện' : 'Ẩn bình luận'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="adm-danger"
                                                    disabled={saving}
                                                    onClick={() => handleDeleteReview(r)}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!reviews.length && (
                            <p className="adm-empty">
                                {reviewsLoading ? 'Đang tải đánh giá sản phẩm…' : 'Chưa có đánh giá sản phẩm phù hợp.'}
                            </p>
                        )}
                    </div>
                </section>
            )}

            {/* =========================================================
                TAB 3: XỬ LÝ LIÊN HỆ & KHIẾU NẠI (ContactController)
               ========================================================= */}
            {subTab === 'contacts' && (
                <section className="adm-panel">
                    <div className="adm-panel-head">
                        <div>
                            <h2>Hộp thư Liên hệ & Khiếu nại khách hàng</h2>
                            <p>Theo dõi và cập nhật tiến độ xử lý các yêu cầu gửi từ trang Liên hệ.</p>
                        </div>
                    </div>

                    <div className="adm-filters">
                        <input
                            aria-label="Tìm liên hệ"
                            placeholder="Tìm tên khách, SĐT, email, chủ đề, nội dung…"
                            value={contactSearch}
                            onChange={e => setContactSearch(e.target.value)}
                        />
                        <select
                            aria-label="Lọc trạng thái xử lý"
                            value={contactStatusFilter}
                            onChange={e => setContactStatusFilter(e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="Pending">Chờ xử lý</option>
                            <option value="Processing">Đang xử lý</option>
                            <option value="Resolved">Đã giải quyết</option>
                        </select>
                    </div>

                    <div className="adm-table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Khách hàng</th>
                                    <th>Chủ đề & Nội dung</th>
                                    <th>Ghi chú xử lý</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map(c => {
                                    const st = CONTACT_STATUS_META[c.status] || CONTACT_STATUS_META.Pending;
                                    return (
                                        <tr key={c.id}>
                                            <td>
                                                <strong>{c.fullName}</strong>
                                                <small>{c.phone || 'Không có SĐT'}</small>
                                                <small>{c.email}</small>
                                                <small>{formatDateTime(c.createdAt)}</small>
                                            </td>
                                            <td className="acf-comment-cell">
                                                <span className="acf-topic-tag">{c.topic}</span>
                                                <p className="acf-comment-text">{c.message}</p>
                                            </td>
                                            <td className="acf-reply-cell">
                                                {c.adminNote ? (
                                                    <p className="acf-admin-note">{c.adminNote}</p>
                                                ) : (
                                                    <small>Chưa có ghi chú</small>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`adm-badge ${st.badge}`}>{st.label}</span>
                                            </td>
                                            <td>
                                                <div className="adm-actions">
                                                    <button
                                                        type="button"
                                                        className="acf-reply-btn"
                                                        disabled={saving}
                                                        onClick={() => openContactModal(c)}
                                                    >
                                                        ✔ Xử lý
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="adm-danger"
                                                        disabled={saving}
                                                        onClick={() => handleDeleteContact(c)}
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {!contacts.length && (
                            <p className="adm-empty">
                                {contactsLoading ? 'Đang tải hộp thư liên hệ…' : 'Chưa có tin nhắn liên hệ hoặc khiếu nại nào.'}
                            </p>
                        )}
                    </div>
                </section>
            )}

            {/* Modal Phản hồi Đánh giá sản phẩm */}
            {replyingReview && (
                <div
                    className="acf-modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setReplyingReview(null)}
                >
                    <div className="acf-modal" onClick={e => e.stopPropagation()}>
                        <header className="acf-modal-head">
                            <div>
                                <span className="adm-eyebrow">PHẢN HỒI ĐÁNH GIÁ KHÁCH HÀNG</span>
                                <h3>{replyingReview.productName}</h3>
                            </div>
                            <button type="button" onClick={() => setReplyingReview(null)}>×</button>
                        </header>
                        <div className="acf-modal-quote">
                            <strong>{replyingReview.customerName}</strong> ·{' '}
                            <span className="acf-stars">{renderStars(replyingReview.rating)}</span>
                            <p>“{replyingReview.comment}”</p>
                        </div>
                        <form onSubmit={handleSaveReply} className="acf-modal-form">
                            <label>
                                Nội dung phản hồi chính thức từ Vườn Nhà
                                <textarea
                                    rows="4"
                                    maxLength={1000}
                                    placeholder="Cảm ơn bạn đã tin tưởng ủng hộ rau sạch Vườn Nhà..."
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                />
                            </label>
                            <div className="adm-actions">
                                <button type="submit" className="adm-primary" disabled={saving}>
                                    {saving ? 'Đang lưu…' : 'Lưu phản hồi'}
                                </button>
                                <button type="button" disabled={saving} onClick={() => setReplyingReview(null)}>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Xử lý Liên hệ / Khiếu nại */}
            {handlingContact && (
                <div
                    className="acf-modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setHandlingContact(null)}
                >
                    <div className="acf-modal" onClick={e => e.stopPropagation()}>
                        <header className="acf-modal-head">
                            <div>
                                <span className="adm-eyebrow">XỬ LÝ LIÊN HỆ & KHIẾU NẠI</span>
                                <h3>{handlingContact.topic} — {handlingContact.fullName}</h3>
                            </div>
                            <button type="button" onClick={() => setHandlingContact(null)}>×</button>
                        </header>
                        <div className="acf-modal-quote">
                            <small>
                                SĐT: <strong>{handlingContact.phone || '—'}</strong> · Email:{' '}
                                <strong>{handlingContact.email}</strong>
                            </small>
                            <p>{handlingContact.message}</p>
                        </div>
                        <form onSubmit={handleSaveContactStatus} className="acf-modal-form">
                            <label>
                                Trạng thái xử lý
                                <select
                                    value={contactForm.status}
                                    onChange={e => setContactForm({ ...contactForm, status: e.target.value })}
                                >
                                    <option value="Pending">Chờ xử lý</option>
                                    <option value="Processing">Đang xử lý</option>
                                    <option value="Resolved">Đã giải quyết</option>
                                </select>
                            </label>
                            <label>
                                Ghi chú hướng giải quyết nội bộ
                                <textarea
                                    rows="4"
                                    maxLength={1000}
                                    placeholder="VD: Đã gọi điện xin lỗi khách và gửi voucher bù 30.000đ..."
                                    value={contactForm.adminNote}
                                    onChange={e => setContactForm({ ...contactForm, adminNote: e.target.value })}
                                />
                            </label>
                            <div className="adm-actions">
                                <button type="submit" className="adm-primary" disabled={saving}>
                                    {saving ? 'Đang cập nhật…' : 'Cập nhật trạng thái'}
                                </button>
                                <button type="button" disabled={saving} onClick={() => setHandlingContact(null)}>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}