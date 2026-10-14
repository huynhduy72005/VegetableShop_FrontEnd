import { useState } from 'react';
import './Wishlist.css';

const money = value =>
    Number(value || 0).toLocaleString('vi-VN') + ' đ';

// Tìm kiếm được cả tên có dấu và không dấu.
const normalize = value =>
    String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .trim();

const iconPaths = {
    heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
    search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    cart: 'M2 3h3l3 13h11l3-9H6 M10 21h.01 M18 21h.01',
    arrow: 'M5 12h14 m-6-6 6 6-6 6',
    leaf: 'M20 4C9 2 3 8 5 15c2 6 13 7 15-11Z M4 21 15 10',
    trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7'
};

function WishlistIcon({ name, size = 20 }) {
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
            <path d={iconPaths[name]} />
        </svg>
    );
}

function WishlistCard({
    product,
    onViewDetail,
    onAddToCart,
    onRemoveWishlist
}) {
    const [imageError, setImageError] = useState(false);

    const stock =
        Number(product.stockQuantity ?? product.quantity) || 0;

    const inStock = stock > 0;

    return (
        <article className="wl-card">
            <div className="wl-photo">
                <button
                    type="button"
                    className="wl-photo-button"
                    onClick={() => onViewDetail(product)}
                    aria-label={`Xem chi tiết ${product.name}`}
                >
                    {product.image && !imageError ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="wl-image-empty">
                            <WishlistIcon name="leaf" size={48} />
                            <span>Chưa có hình ảnh</span>
                        </div>
                    )}
                </button>

                <span className="wl-saved">Đã lưu</span>

                <button
                    type="button"
                    className="wl-heart-button"
                    onClick={() => onRemoveWishlist(product.id)}
                    aria-label={`Bỏ yêu thích ${product.name}`}
                    title="Bỏ yêu thích"
                >
                    <WishlistIcon name="heart" size={18} />
                </button>
            </div>

            <div className="wl-card-body">
                <span className="wl-brand">VƯỜN NHÀ</span>

                <button
                    type="button"
                    className="wl-product-name"
                    onClick={() => onViewDetail(product)}
                >
                    {product.name}
                </button>

                <p className="wl-price">
                    {money(product.price)}
                    <small> / {product.unit || 'đơn vị'}</small>
                </p>

                <div className="wl-card-actions">
                    <button
                        type="button"
                        className="wl-detail-button"
                        onClick={() => onViewDetail(product)}
                    >
                        Chi tiết
                    </button>

                    <button
                        type="button"
                        className="wl-add-button"
                        disabled={!inStock}
                        onClick={() =>
                            onAddToCart({
                                ...product,
                                stockQuantity: stock,
                                quantity: 1
                            })
                        }
                    >
                        <WishlistIcon name="cart" size={16} />
                        {inStock ? 'Thêm giỏ' : 'Hết hàng'}
                    </button>
                </div>

                <div className="wl-card-footer">
                    <span
                        className={`wl-stock ${
                            inStock ? '' : 'is-out'
                        }`}
                    >
                        <span />
                        {inStock ? 'Còn hàng' : 'Tạm hết hàng'}
                    </span>

                    <button
                        type="button"
                        className="wl-remove-button"
                        onClick={() =>
                            onRemoveWishlist(product.id)
                        }
                        aria-label={`Bỏ yêu thích ${product.name}`}
                    >
                        <WishlistIcon name="trash" size={13} />
                        Bỏ yêu thích
                    </button>
                </div>
            </div>
        </article>
    );
}

export default function Wishlist({
    wishlistItems = [],
    onViewDetail,
    onAddToCart,
    onRemoveWishlist,
    onBrowseProducts
}) {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('saved');

    const filtered = wishlistItems.filter(product =>
        normalize(product.name).includes(normalize(search))
    );

    if (sort === 'price-asc') {
        filtered.sort(
            (a, b) => Number(a.price) - Number(b.price)
        );
    }

    if (sort === 'price-desc') {
        filtered.sort(
            (a, b) => Number(b.price) - Number(a.price)
        );
    }

    if (sort === 'name') {
        filtered.sort((a, b) =>
            String(a.name).localeCompare(String(b.name), 'vi')
        );
    }

    function clearFilters() {
        setSearch('');
        setSort('saved');
    }

    return (
        <div className="wl-page">
            {/* Tiêu đề */}
            <section className="wl-heading">
                <div className="wl-heading-copy">
                    <span className="wl-eyebrow">
                        GÓC NHỎ CỦA BẠN
                    </span>

                    <h1>
                        Sản phẩm yêu thích
                        <span>{wishlistItems.length}</span>
                    </h1>

                    <p>
                        Lưu những món bạn thích, chọn lại dễ dàng
                        cho bữa cơm nhà.
                    </p>

                    <button
                        type="button"
                        className="wl-browse-button"
                        onClick={onBrowseProducts}
                    >
                        Tiếp tục mua sắm
                        <WishlistIcon name="arrow" size={16} />
                    </button>
                </div>

                <div
                    className="wl-heading-art"
                    aria-hidden="true"
                >
                    <WishlistIcon name="heart" size={50} />

                    <span>
                        Một chút yêu thích.
                        <br />
                        Một bữa ăn thêm xanh.
                    </span>
                </div>
            </section>

            {wishlistItems.length === 0 ? (
                <section className="wl-empty">
                    <span className="wl-empty-icon">
                        <WishlistIcon name="heart" size={38} />
                    </span>

                    <h2>Danh sách yêu thích đang chờ bạn</h2>

                    <p>
                        Nhấn vào trái tim ở sản phẩm bạn thích.
                        <br />
                        Những lựa chọn đó sẽ xuất hiện tại đây.
                    </p>

                    <button
                        type="button"
                        className="wl-browse-button"
                        onClick={onBrowseProducts}
                    >
                        Khám phá sản phẩm
                        <WishlistIcon name="arrow" size={16} />
                    </button>
                </section>
            ) : (
                <>
                    {/* Tìm kiếm và sắp xếp */}
                    <div className="wl-toolbar">
                        <div className="wl-search">
                            <WishlistIcon name="search" size={18} />

                            <input
                                type="search"
                                value={search}
                                onChange={event =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Tìm trong sản phẩm yêu thích…"
                                aria-label="Tìm sản phẩm yêu thích"
                            />
                        </div>

                        <div className="wl-sort">
                            <label htmlFor="wl-sort">
                                Sắp xếp
                            </label>

                            <select
                                id="wl-sort"
                                value={sort}
                                onChange={event =>
                                    setSort(event.target.value)
                                }
                            >
                                <option value="saved">
                                    Thứ tự đã lưu
                                </option>
                                <option value="price-asc">
                                    Giá thấp đến cao
                                </option>
                                <option value="price-desc">
                                    Giá cao đến thấp
                                </option>
                                <option value="name">
                                    Tên A → Z
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="wl-results" role="status">
                        <span>
                            {filtered.length} sản phẩm
                            {search.trim()
                                ? ` phù hợp / ${wishlistItems.length} đã lưu`
                                : ' đã lưu'}
                        </span>

                        {search.trim() && (
                            <button
                                type="button"
                                onClick={clearFilters}
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    {/* Danh sách sản phẩm */}
                    {filtered.length > 0 ? (
                        <div className="wl-grid">
                            {filtered.map(product => (
                                <WishlistCard
                                    key={product.id}
                                    product={product}
                                    onViewDetail={onViewDetail}
                                    onAddToCart={onAddToCart}
                                    onRemoveWishlist={onRemoveWishlist}
                                />
                            ))}
                        </div>
                    ) : (
                        <section className="wl-empty wl-no-results">
                            <span className="wl-empty-icon">
                                <WishlistIcon
                                    name="search"
                                    size={34}
                                />
                            </span>

                            <h2>
                                Chưa tìm thấy sản phẩm phù hợp
                            </h2>

                            <p>
                                Thử một tên khác hoặc xem lại
                                tất cả sản phẩm đã lưu.
                            </p>

                            <button
                                type="button"
                                className="wl-browse-button"
                                onClick={clearFilters}
                            >
                                Xem lại danh sách
                            </button>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}