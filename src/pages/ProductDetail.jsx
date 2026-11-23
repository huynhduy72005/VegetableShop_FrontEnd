import { useEffect, useState } from 'react';
import './ProductDetail.css';
import VariantPicker from '../components/VariantPicker';
import { buildCartLine, getDefaultVariant, getVariants } from '../services/ProductVariants';
import { api } from '../services/api';

const money = value =>
    Number(value || 0).toLocaleString('vi-VN') + ' đ';

const formatDate = value => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const renderStars = rating => {
    const count = Math.max(1, Math.min(5, Number(rating) || 5));
    return '★'.repeat(count) + '☆'.repeat(5 - count);
};

// Icon SVG, không cần cài thư viện.
const paths = {
    leaf: 'M20 4C9 2 3 8 5 15c2 6 13 7 15-11Z M4 21 15 10',
    cart: 'M2 3h3l3 13h11l3-9H6 M10 21h.01 M18 21h.01',
    heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
    arrow: 'M5 12h14 m-6-6 6 6-6 6',
    back: 'M19 12H5 m6-6-6 6 6 6',
    check: 'm5 12 4 4L19 6',
    box: 'm12 3 9 5v8l-9 5-9-5V8Z m-9 5 9 5 9-5 M12 13v8',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z m-3-10 2 2 4-4'
};

function DetailIcon({ name, size = 20 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            <path d={paths[name]} />
        </svg>
    );
}

export default function ProductDetail(props) {
    if (!props.product) {
        return (
            <div className="vd-empty">
                <DetailIcon name="leaf" size={38} />
                <h2>Chưa có sản phẩm để hiển thị</h2>

                <button type="button" onClick={props.onBack}>
                    Quay về trang chủ
                </button>
            </div>
        );
    }

    // Khi đổi sản phẩm, tự đặt lại số lượng và trạng thái ảnh.
    return (
        <ProductDetailContent
            key={props.product.id}
            {...props}
        />
    );
}

function ProductDetailContent({
    product,
    onAddToCart,
    onToggleWishlist,
    isWishlisted = false,
    onViewCart,
    onBack
}) {
    const [quantity, setQuantity] = useState('1');
    const [imageError, setImageError] = useState(false);
    const [activeTab, setActiveTab] = useState('description');
    const [origin, setOrigin] = useState(() => product.origin || product.Origin || null);

    // State đánh giá sản phẩm từ khách hàng
    const [reviewSummary, setReviewSummary] = useState({
        averageRating: 0,
        totalReviews: 0,
        reviews: []
    });
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewNotice, setReviewNotice] = useState(null);

    const isLoggedIn = Boolean(sessionStorage.getItem('token'));

    async function loadReviews(productId) {
        try {
            const { data } = await api.getProductReviews(productId);
            setReviewSummary({
                averageRating: Number(data?.averageRating || 0),
                totalReviews: Number(data?.totalReviews || 0),
                reviews: Array.isArray(data?.reviews) ? data.reviews : []
            });
        } catch {
            // Bỏ qua nếu chưa tải được đánh giá
        }
    }

    useEffect(() => {
        let active = true;
        if (product?.id) {
            api.getProductById(product.id)
                .then(({ data }) => {
                    if (!active) return;
                    const resolvedOrigin = data?.origin || data?.Origin || null;
                    setOrigin(resolvedOrigin);
                })
                .catch(() => {});

            loadReviews(product.id);
        }
        return () => { active = false; };
    }, [product?.id]);

    async function handleSubmitReview(e) {
        e.preventDefault();
        if (submittingReview || !product?.id) return;

        const comment = newComment.trim();
        if (!comment) {
            setReviewNotice({ error: true, text: 'Vui lòng nhập nhận xét của bạn về sản phẩm.' });
            return;
        }

        setSubmittingReview(true);
        setReviewNotice(null);
        try {
            const { data } = await api.createProductReview({
                productId: product.id,
                rating: newRating,
                comment
            });
            setNewComment('');
            setNewRating(5);
            setReviewNotice({ error: false, text: data?.message || 'Cảm ơn bạn đã gửi đánh giá!' });
            await loadReviews(product.id);
        } catch (error) {
            setReviewNotice({
                error: true,
                text: error.response?.data?.message || 'Gửi đánh giá thất bại. Vui lòng thử lại.'
            });
        } finally {
            setSubmittingReview(false);
        }
    }

    // Biến thể: mặc định chọn loại còn hàng đầu tiên
    const variants = getVariants(product);
    const [selectedVariantId, setSelectedVariantId] = useState(
        () => getDefaultVariant(product)?.id ?? null
    );
    const selectedVariant =
        variants.find(variant => variant.id === selectedVariantId) || null;

    const stockQuantity = Math.max(
        0,
        Math.floor(
            Number(
                selectedVariant
                    ? selectedVariant.quantity
                    : product.stockQuantity ?? product.quantity
            ) || 0
        )
    );

    const price = Number(selectedVariant ? selectedVariant.price : product.price) || 0;
    const unit = product.unit || 'đơn vị';
    const unitLabel = selectedVariant ? (selectedVariant.unit || unit) : unit;
    const displayImage = selectedVariant?.image || product.image;
    const amount = Number(quantity);
    const inStock = stockQuantity > 0;

    const validQuantity =
        Number.isInteger(amount) &&
        amount >= 1 &&
        amount <= stockQuantity;

    // Giữ số lượng trong khoảng hợp lệ.
    function clampQuantity(value) {
        const number = Number(value);
        const integer = Number.isFinite(number)
            ? Math.trunc(number)
            : 1;

        return Math.min(
            Math.max(stockQuantity, 1),
            Math.max(1, integer)
        );
    }

    function changeQuantity(step) {
        setQuantity(
            String(
                clampQuantity(clampQuantity(quantity) + step)
            )
        );
    }

    function selectVariant(variant) {
        setSelectedVariantId(variant.id);
        setQuantity('1');
        setImageError(false);
    }

    function addToCart() {
        if (!inStock || !validQuantity) return;

        // Dòng giỏ hàng gồm cả biến thể đã chọn (giá, tồn kho, tên loại)
        onAddToCart(buildCartLine(product, selectedVariant, amount));
    }

    const isCertified =
        origin?.certificationType && origin.certificationType !== 'Thông thường';

    return (
        <div className="vd-page">
            {/* Đường dẫn */}
            <nav
                className="vd-breadcrumb"
                aria-label="Đường dẫn"
            >
                <button
                    type="button"
                    className="vd-return-button"
                    onClick={onBack}
                    aria-label="Quay lại trang trước"
                >
                    <DetailIcon name="back" size={17} />
                    <span>Quay lại</span>
                </button>

                <span>/</span>
                <span>Cửa hàng</span>
                <span>/</span>
                <span>Chi tiết sản phẩm</span>
                <span>/</span>
                <strong>{product.name}</strong>
            </nav>

            {/* Ảnh và thông tin sản phẩm */}
            <section className="vd-product">
                <div className="vd-gallery">
                    <div className="vd-media">
                        <span className="vd-image-label">
                            <DetailIcon name="leaf" size={15} />
                            VEGETABLE
                        </span>

                        {displayImage && !imageError ? (
                            <img
                                key={displayImage}
                                src={displayImage}
                                alt={product.name}
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="vd-image-empty">
                                <DetailIcon name="leaf" size={70} />
                                <span>
                                    Chưa có hình ảnh sản phẩm
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="vd-image-caption">
                        <span>
                            Một chút xanh cho bữa cơm nhà.
                        </span>
                        <span>SP-{product.id}</span>
                    </div>
                </div>

                <div className="vd-info">
                    <div className="vd-info-top">
                        <span className="vd-eyebrow">
                            TỪ VƯỜN XANH ĐẾN BẾP NHÀ
                        </span>

                        <span
                            className={`vd-status ${
                                inStock ? '' : 'is-out'
                            }`}
                        >
                            <span />
                            {inStock ? 'Còn hàng' : 'Tạm hết hàng'}
                        </span>
                    </div>

                    <h1>{product.name}</h1>

                    {/* Tóm tắt điểm sao đánh giá */}
                    <button
                        type="button"
                        className="vd-rating-pill"
                        onClick={() => setActiveTab('reviews')}
                    >
                        <span className="vd-rating-stars">
                            {reviewSummary.totalReviews > 0
                                ? `★ ${reviewSummary.averageRating.toFixed(1)} / 5`
                                : '☆ Chưa có đánh giá'}
                        </span>
                        <span>({reviewSummary.totalReviews} nhận xét từ khách hàng)</span>
                    </button>

                    <p className="vd-summary">
                        {product.description ||
                            'Chọn số lượng và thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm tại VEGETABLE.'}
                    </p>

                    {/* Khung Truy xuất nguồn gốc nông sản */}
                    {origin && (
                        <div className="vd-origin-card" aria-label="Truy xuất nguồn gốc">
                            <div className="vd-origin-head">
                                <span className="vd-origin-title">
                                    <DetailIcon name="shield" size={16} />
                                    TRUY XUẤT NGUỒN GỐC NÔNG SẢN
                                </span>
                                {isCertified && (
                                    <span className="vd-origin-cert-badge">
                                        ✓ Đạt chuẩn {origin.certificationType}
                                    </span>
                                )}
                            </div>
                            <dl className="vd-origin-grid">
                                <div>
                                    <dt>Nhà vườn / Đơn vị cung ứng</dt>
                                    <dd>{origin.supplierName}</dd>
                                </div>
                                {origin.farmAddress && (
                                    <div>
                                        <dt>Vùng trồng</dt>
                                        <dd>{origin.farmAddress}</dd>
                                    </div>
                                )}
                                {origin.certificationCode && (
                                    <div>
                                        <dt>Mã chứng nhận</dt>
                                        <dd>{origin.certificationCode}</dd>
                                    </div>
                                )}
                                {origin.batchCode && (
                                    <div>
                                        <dt>Mã lô nhập kho</dt>
                                        <dd>
                                            {origin.batchCode}
                                            {origin.importDate ? ` (Nhập ${formatDate(origin.importDate)})` : ''}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    )}

                    {/* Giá bán */}
                    <div className="vd-price-panel">
                        <span>GIÁ SẢN PHẨM</span>

                        <div>
                            <strong>{money(price)}</strong>
                            <small>/ {unitLabel}</small>
                        </div>

                        <p>Giá bán theo đơn vị {unitLabel}.</p>
                    </div>

                    {/* Chọn biến thể */}
                    {variants.length > 0 && (
                        <VariantPicker
                            variants={variants}
                            selectedId={selectedVariant?.id}
                            onSelect={selectVariant}
                        />
                    )}

                    {/* Thông số */}
                    <dl className="vd-specs">
                        <div>
                            <dt>Đơn vị tính</dt>
                            <dd>{unitLabel}</dd>
                        </div>

                        <div>
                            <dt>Số lượng hiện có</dt>
                            <dd>
                                {stockQuantity} {unitLabel}
                            </dd>
                        </div>
                    </dl>

                    {/* Số lượng và tạm tính */}
                    <div className="vd-purchase-row">
                        <div className="vd-quantity-block">
                            <label htmlFor="vd-quantity">
                                Số lượng
                            </label>

                            <div className="vd-stepper">
                                <button
                                    type="button"
                                    disabled={
                                        !inStock ||
                                        (validQuantity && amount <= 1)
                                    }
                                    onClick={() => changeQuantity(-1)}
                                    aria-label="Giảm số lượng"
                                >
                                    −
                                </button>

                                <input
                                    id="vd-quantity"
                                    type="number"
                                    min="1"
                                    max={stockQuantity || 1}
                                    step="1"
                                    value={quantity}
                                    disabled={!inStock}
                                    onChange={event =>
                                        setQuantity(event.target.value)
                                    }
                                    onBlur={() =>
                                        setQuantity(
                                            String(
                                                clampQuantity(quantity)
                                            )
                                        )
                                    }
                                    aria-describedby="vd-quantity-help"
                                    aria-invalid={
                                        inStock && !validQuantity
                                    }
                                />

                                <button
                                    type="button"
                                    disabled={
                                        !inStock ||
                                        (validQuantity &&
                                            amount >= stockQuantity)
                                    }
                                    onClick={() => changeQuantity(1)}
                                    aria-label="Tăng số lượng"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="vd-subtotal">
                            <span>Tạm tính</span>

                            <strong>
                                {validQuantity
                                    ? money(price * amount)
                                    : '—'}
                            </strong>
                        </div>
                    </div>

                    <p
                        id="vd-quantity-help"
                        className={`vd-help ${
                            inStock && !validQuantity
                                ? 'is-error'
                                : ''
                        }`}
                    >
                        {!inStock
                            ? 'Sản phẩm hiện đang hết hàng.'
                            : !validQuantity
                            ? `Nhập số nguyên từ 1 đến ${stockQuantity}.`
                            : 'Tạm tính chưa bao gồm phí giao hàng.'}
                    </p>

                    {/* Các nút mua hàng */}
                    <div className="vd-actions">
                        <button
                            type="button"
                            className="vd-add-button"
                            onClick={addToCart}
                            disabled={!inStock || !validQuantity}
                        >
                            <DetailIcon name="cart" />

                            {inStock
                                ? 'Thêm vào giỏ hàng'
                                : 'Tạm hết hàng'}
                        </button>

                        <button
                            type="button"
                            className={`vd-wishlist ${
                                isWishlisted ? 'is-loved' : ''
                            }`}
                            onClick={() =>
                                onToggleWishlist(product)
                            }
                            aria-pressed={isWishlisted}
                        >
                            <DetailIcon name="heart" />

                            {isWishlisted
                                ? 'Đã yêu thích'
                                : 'Yêu thích'}
                        </button>
                    </div>

                    <button
                        type="button"
                        className="vd-cart-link"
                        onClick={onViewCart}
                    >
                        Xem giỏ hàng của bạn
                        <DetailIcon name="arrow" size={16} />
                    </button>
                </div>
            </section>

            {/* Tiện ích */}
            <div className="vd-benefits">
                {[
                    [
                        'leaf',
                        'Giá rõ ràng',
                        'Hiển thị theo đơn vị sản phẩm.'
                    ],
                    [
                        'check',
                        'Dễ chọn số lượng',
                        'Theo lượng hàng hiện có.'
                    ],
                    [
                        'box',
                        'Mua sắm thuận tiện',
                        'Thanh toán nhanh sản phẩm bạn chọn.'
                    ]
                ].map(([icon, title, text]) => (
                    <article key={title}>
                        <span>
                            <DetailIcon name={icon} size={22} />
                        </span>

                        <div>
                            <h3>{title}</h3>
                            <p>{text}</p>
                        </div>
                    </article>
                ))}
            </div>

            {/* Mô tả, Đánh giá khách hàng và Cách đặt hàng */}
            <section className="vd-details">
                <div
                    className="vd-tabs"
                    role="group"
                    aria-label="Thông tin chi tiết"
                >
                    <button
                        type="button"
                        className={
                            activeTab === 'description'
                                ? 'active'
                                : ''
                        }
                        aria-pressed={
                            activeTab === 'description'
                        }
                        onClick={() =>
                            setActiveTab('description')
                        }
                    >
                        Thông tin sản phẩm
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab === 'reviews' ? 'active' : ''
                        }
                        aria-pressed={activeTab === 'reviews'}
                        onClick={() => setActiveTab('reviews')}
                    >
                        Đánh giá khách hàng ({reviewSummary.totalReviews})
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab === 'guide' ? 'active' : ''
                        }
                        aria-pressed={activeTab === 'guide'}
                        onClick={() => setActiveTab('guide')}
                    >
                        Cách đặt hàng
                    </button>
                </div>

                <div className="vd-detail-body">
                    {activeTab === 'description' ? (
                        <>
                            <span className="vd-eyebrow">
                                KHÁM PHÁ SẢN PHẨM
                            </span>

                            <h2>{product.name}</h2>

                            <p className="vd-full-description">
                                {product.description ||
                                    'Thông tin mô tả của sản phẩm sẽ được cửa hàng cập nhật.'}
                            </p>

                            <div className="vd-detail-meta">
                                <span>
                                    Mã sản phẩm:{' '}
                                    <strong>SP-{product.id}</strong>
                                </span>

                                <span>
                                    Đơn vị: <strong>{unit}</strong>
                                </span>
                            </div>
                        </>
                    ) : activeTab === 'reviews' ? (
                        <div className="vd-reviews-section">
                            <div className="vd-reviews-head">
                                <div>
                                    <span className="vd-eyebrow">CẢM NHẬN TỪ KHÁCH HÀNG</span>
                                    <h2>Đánh giá về {product.name}</h2>
                                </div>
                                <div className="vd-reviews-score">
                                    <strong>
                                        {reviewSummary.totalReviews > 0
                                            ? reviewSummary.averageRating.toFixed(1)
                                            : '—'}
                                    </strong>
                                    <span>/ 5 sao ({reviewSummary.totalReviews} lượt)</span>
                                </div>
                            </div>

                            {/* Form gửi đánh giá cho khách đã đăng nhập */}
                            {isLoggedIn ? (
                                <form className="vd-review-form" onSubmit={handleSubmitReview}>
                                    <div className="vd-star-picker" role="radiogroup" aria-label="Chọn số sao">
                                        <span>Chất lượng sản phẩm:</span>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={star <= newRating ? 'active' : ''}
                                                onClick={() => setNewRating(star)}
                                                aria-label={`${star} sao`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        rows="3"
                                        maxLength={1000}
                                        placeholder="Chia sẻ trải nghiệm của bạn về độ tươi ngon, đóng gói sản phẩm..."
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                    />
                                    {reviewNotice && (
                                        <p className={`vd-review-notice ${reviewNotice.error ? 'error' : ''}`}>
                                            {reviewNotice.text}
                                        </p>
                                    )}
                                    <button
                                        type="submit"
                                        className="vd-add-button vd-review-submit"
                                        disabled={submittingReview}
                                    >
                                        {submittingReview ? 'Đang gửi…' : 'Gửi đánh giá'}
                                    </button>
                                </form>
                            ) : (
                                <p className="vd-review-login-hint">
                                    Vui lòng <strong>đăng nhập</strong> để gửi đánh giá cho sản phẩm này.
                                </p>
                            )}

                            {/* Danh sách đánh giá */}
                            {reviewSummary.reviews.length === 0 ? (
                                <p className="vd-reviews-empty">
                                    Chưa có đánh giá nào. Hãy là người đầu tiên nhận xét sản phẩm này!
                                </p>
                            ) : (
                                <div className="vd-review-list">
                                    {reviewSummary.reviews.map(rev => (
                                        <article key={rev.id} className="vd-review-item">
                                            <div className="vd-review-item-top">
                                                <div>
                                                    <strong>{rev.customerName}</strong>
                                                    <span className="vd-review-stars">{renderStars(rev.rating)}</span>
                                                </div>
                                                <small>{formatDate(rev.createdAt)}</small>
                                            </div>
                                            <p className="vd-review-comment">{rev.comment}</p>
                                            {rev.adminReply && (
                                                <div className="vd-review-shop-reply">
                                                    <strong>🌱 Phản hồi từ VEGETABLE:</strong>
                                                    <p>{rev.adminReply}</p>
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <span className="vd-eyebrow">
                                ĐI CHỢ ONLINE THẬT ĐƠN GIẢN
                            </span>

                            <h2>
                                Hoàn tất mua hàng trong 3 bước
                            </h2>

                            <ol className="vd-guide">
                                <li>
                                    Chọn số lượng sản phẩm và bấm{' '}
                                    <strong>
                                        Thêm vào giỏ hàng
                                    </strong>.
                                </li>

                                <li>
                                    Mở giỏ hàng, kiểm tra sản phẩm
                                    và tiến hành thanh toán.
                                </li>

                                <li>
                                    Điền thông tin nhận hàng,
                                    kiểm tra tổng tiền và xác nhận
                                    đặt hàng.
                                </li>
                            </ol>

                            <button
                                type="button"
                                className="vd-guide-link"
                                onClick={onViewCart}
                            >
                                Mở giỏ hàng
                                <DetailIcon name="arrow" size={16} />
                            </button>
                        </>
                    )}
                </div>
            </section>

            <button
                type="button"
                className="vd-back-link"
                onClick={onBack}
            >
                <DetailIcon name="back" size={17} />
                Tiếp tục khám phá cửa hàng
            </button>
        </div>
    );
}