import { useState } from 'react';
import './ProductDetail.css';

const money = value =>
    Number(value || 0).toLocaleString('vi-VN') + ' đ';

// Icon SVG, không cần cài thư viện.
const paths = {
    leaf: 'M20 4C9 2 3 8 5 15c2 6 13 7 15-11Z M4 21 15 10',
    cart: 'M2 3h3l3 13h11l3-9H6 M10 21h.01 M18 21h.01',
    heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
    arrow: 'M5 12h14 m-6-6 6 6-6 6',
    back: 'M19 12H5 m6-6-6 6 6 6',
    check: 'm5 12 4 4L19 6',
    box: 'm12 3 9 5v8l-9 5-9-5V8Z m-9 5 9 5 9-5 M12 13v8'
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

    const stockQuantity = Math.max(
        0,
        Math.floor(
            Number(product.stockQuantity ?? product.quantity) || 0
        )
    );

    const price = Number(product.price) || 0;
    const unit = product.unit || 'đơn vị';
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

    function addToCart() {
        if (!inStock || !validQuantity) return;

        onAddToCart({
            ...product,
            stockQuantity,
            quantity: amount
        });
    }

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
                            VƯỜN NHÀ
                        </span>

                        {product.image && !imageError ? (
                            <img
                                key={product.image}
                                src={product.image}
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

                    <p className="vd-summary">
                        {product.description ||
                            'Chọn số lượng và thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm tại Vườn Nhà.'}
                    </p>

                    {/* Giá bán */}
                    <div className="vd-price-panel">
                        <span>GIÁ SẢN PHẨM</span>

                        <div>
                            <strong>{money(price)}</strong>
                            <small>/ {unit}</small>
                        </div>

                        <p>Giá bán theo đơn vị {unit}.</p>
                    </div>

                    {/* Thông số */}
                    <dl className="vd-specs">
                        <div>
                            <dt>Đơn vị tính</dt>
                            <dd>{unit}</dd>
                        </div>

                        <div>
                            <dt>Số lượng hiện có</dt>
                            <dd>
                                {stockQuantity} {unit}
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

            {/* Mô tả và cách đặt hàng */}
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