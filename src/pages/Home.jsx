import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './Home.css';

const money = value =>
    Number(value || 0).toLocaleString('vi-VN') + ' đ';

const HERO_IMAGE =
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85';

function categoryIcon(name) {
    const text = name.toLowerCase();

    if (text.includes('nấm')) return '🍄';
    if (text.includes('trái') || text.includes('quả')) return '🍎';
    if (text.includes('củ')) return '🥕';

    return '🥬';
}

// Thẻ sản phẩm riêng của trang chủ.
function HomeProductCard({
    product,
    onViewDetail,
    onAddToCart,
    onToggleWishlist,
    liked,
    tag
}) {
    const inStock = Number(product.quantity) > 0;

    return (
        <article className="vn-card">
            <div className="vn-card-photo">
                <button
                    type="button"
                    className="vn-photo-link"
                    onClick={() => onViewDetail(product)}
                    aria-label={`Xem ${product.name}`}
                >
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                        />
                    ) : (
                        <span className="vn-photo-empty">🥬</span>
                    )}
                </button>

                {tag && (
                    <span className="vn-card-tag">{tag}</span>
                )}

                <button
                    type="button"
                    className={`vn-heart ${liked ? 'is-liked' : ''}`}
                    onClick={() => onToggleWishlist(product)}
                    aria-label={`${liked ? 'Bỏ' : 'Thêm'} yêu thích ${product.name}`}
                    aria-pressed={liked}
                >
                    {liked ? '♥' : '♡'}
                </button>
            </div>

            <div className="vn-card-body">
                <span className="vn-card-brand">VƯỜN NHÀ</span>

                <button
                    type="button"
                    className="vn-card-name"
                    onClick={() => onViewDetail(product)}
                >
                    {product.name}
                </button>

                <p className="vn-card-price">
                    {money(product.price)}
                    <small> / {product.unit}</small>
                </p>

                <div className="vn-card-bottom">
                    <span
                        className={
                            inStock ? 'vn-stock' : 'vn-stock is-out'
                        }
                    >
                        {inStock ? '● Còn hàng' : 'Tạm hết hàng'}
                    </span>

                    <button
                        type="button"
                        className="vn-add"
                        disabled={!inStock}
                        onClick={() =>
                            onAddToCart({
                                ...product,
                                stockQuantity: product.quantity,
                                quantity: 1
                            })
                        }
                    >
                        + Thêm giỏ
                    </button>
                </div>
            </div>
        </article>
    );
}

export default function Home({
    onViewDetail,
    onAddToCart,
    onToggleWishlist,
    wishlistItems = [],
    onBrowseProducts,
    onNavigate
}) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);
            setError('');

            try {
                const [productResponse, categoryResponse] =
                    await Promise.all([
                        api.getProducts(),
                        api.getCategories()
                    ]);

                if (active) {
                    setProducts(productResponse.data || []);
                    setCategories(categoryResponse.data || []);
                }
            } catch {
                if (active) {
                    setError(
                        'Chưa tải được sản phẩm. Bạn hãy thử lại nhé.'
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        load();

        return () => {
            active = false;
        };
    }, [reload]);

    // 4 sản phẩm còn hàng có mức giá thấp nhất.
    const goodPriceProducts = products
        .filter(product => Number(product.quantity) > 0)
        .sort((a, b) => Number(a.price) - Number(b.price))
        .slice(0, 4);

    // Hiển thị tối đa 8 sản phẩm theo danh mục đang chọn.
    const visibleProducts = products
        .filter(product =>
            activeCategory === null
                ? true
                : product.categoryId === activeCategory
        )
        .slice(0, 8);

    function scrollTo(id) {
        document.getElementById(id)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    function renderProducts(items, tag) {
        if (loading) {
            return (
                <div
                    className="vn-grid"
                    aria-label="Đang tải sản phẩm"
                    aria-busy="true"
                >
                    {[1, 2, 3, 4].map(number => (
                        <div
                            key={number}
                            className="vn-skeleton"
                        />
                    ))}
                </div>
            );
        }

        if (error) return null;

        if (!items.length) {
            return (
                <p className="vn-empty">
                    Chưa có sản phẩm để hiển thị.
                </p>
            );
        }

        return (
            <div className="vn-grid">
                {items.map(product => (
                    <HomeProductCard
                        key={product.id}
                        product={product}
                        tag={tag}
                        onViewDetail={onViewDetail}
                        onAddToCart={onAddToCart}
                        onToggleWishlist={onToggleWishlist}
                        liked={wishlistItems.some(
                            item => item.id === product.id
                        )}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="vn-home">
            {/* Banner */}
            <section className="vn-hero">
                <div className="vn-hero-copy">
                    <span className="vn-eyebrow">
                        🌿 TỪ KHU VƯỜN ĐẾN CĂN BẾP
                    </span>

                    <h1>
                        Một chút tươi xanh.
                        <br />
                        <em>Trọn vị mỗi ngày.</em>
                    </h1>

                    <p>
                        Rau củ giòn mát, trái cây ngọt lành.
                        Chọn những nguyên liệu bạn yêu thích
                        cho bữa cơm nhà thêm đủ đầy.
                    </p>

                    <div className="vn-hero-actions">
                        <button
                            type="button"
                            className="vn-button"
                            onClick={() => onBrowseProducts(null)}
                        >
                            Ghé vườn, chọn món ↗
                        </button>

                        <button
                            type="button"
                            className="vn-text-button"
                            onClick={() => scrollTo('vn-good-price')}
                        >
                            Khám phá giá tốt ↓
                        </button>
                    </div>

                    <div className="vn-hero-notes">
                        <span>✦ Chọn dễ dàng</span>
                        <span>✦ Giá rõ ràng</span>
                        <span>✦ Giao tận nhà</span>
                    </div>
                </div>

                <div className="vn-hero-visual">
                    <img
                        className="vn-hero-image"
                        src={HERO_IMAGE}
                        alt="Rau củ và thực phẩm tại cửa hàng"
                        fetchPriority="high"
                    />

                    <div className="vn-hero-sticker">
                        <span>ĐI CHỢ THẬT NHẸ NHÀNG</span>
                        <strong>Bếp nhà thêm xanh 🌱</strong>
                    </div>
                </div>
            </section>

            {/* Menu cuộn đến từng phần */}
            <nav
                className="vn-quick"
                aria-label="Khám phá trang chủ"
            >
                {[
                    ['vn-categories', '🥬', 'Danh mục'],
                    ['vn-good-price', '✦', 'Giá tốt hôm nay'],
                    ['vn-fresh', '🛒', 'Sản phẩm tươi'],
                    ['vn-how', '📦', 'Cách mua hàng']
                ].map(([id, icon, label]) => (
                    <button
                        type="button"
                        key={id}
                        onClick={() => scrollTo(id)}
                    >
                        <span>{icon}</span>
                        {label}
                    </button>
                ))}
            </nav>

            {error && (
                <div className="vn-error" role="alert">
                    {error}

                    <button
                        type="button"
                        onClick={() => setReload(value => value + 1)}
                    >
                        Tải lại
                    </button>
                </div>
            )}

            {/* Danh mục lấy từ database */}
            <section
                className="vn-section"
                id="vn-categories"
            >
                <div className="vn-section-head">
                    <div>
                        <span className="vn-eyebrow">
                            CHỌN THEO SỞ THÍCH
                        </span>
                        <h2>Hôm nay bạn chọn gì?</h2>
                    </div>

                    <button
                        type="button"
                        className="vn-text-button"
                        onClick={() => onBrowseProducts(null)}
                    >
                        Tất cả sản phẩm ↗
                    </button>
                </div>

                <div className="vn-category-grid">
                    {categories.map((category, index) => (
                        <button
                            type="button"
                            key={category.id}
                            className={`vn-category vn-tone-${index % 4}`}
                            onClick={() =>
                                onBrowseProducts(category.id)
                            }
                        >
                            <span className="vn-category-icon">
                                {categoryIcon(category.name)}
                            </span>

                            <strong>{category.name}</strong>

                            <small>
                                {
                                    products.filter(
                                        product =>
                                            product.categoryId ===
                                            category.id
                                    ).length
                                }{' '}
                                sản phẩm
                            </small>

                            <span className="vn-category-arrow">
                                ↗
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Giá tốt nằm trên sản phẩm tươi mỗi ngày */}
            <section
                className="vn-deals"
                id="vn-good-price"
            >
                <div className="vn-section-head">
                    <div>
                        <span className="vn-eyebrow">
                            ĐI CHỢ VỪA TÚI TIỀN
                        </span>

                        <h2>
                            Giá tốt hôm nay{' '}
                            <span className="vn-title-icon">✦</span>
                        </h2>

                        <p>
                            Những sản phẩm còn hàng có mức giá
                            thấp nhất tại cửa hàng.
                        </p>
                    </div>

                    {goodPriceProducts.length > 0 &&
                        !loading &&
                        !error && (
                            <span className="vn-price-note">
                                Chỉ từ{' '}
                                <strong>
                                    {money(goodPriceProducts[0].price)}
                                </strong>
                                {' '}/ đơn vị
                            </span>
                        )}
                </div>

                {renderProducts(goodPriceProducts, 'Giá tốt')}
            </section>

            {/* Sản phẩm tươi mỗi ngày */}
            <section
                className="vn-section"
                id="vn-fresh"
            >
                <div className="vn-section-head">
                    <div>
                        <span className="vn-eyebrow">
                            THÊM XANH CHO BỮA CƠM NHÀ
                        </span>

                        <h2>Sản phẩm tươi mỗi ngày</h2>

                        <p>
                            Khám phá rau củ và trái cây bạn yêu thích.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="vn-text-button"
                        onClick={() =>
                            onBrowseProducts(activeCategory)
                        }
                    >
                        Xem tất cả ↗
                    </button>
                </div>

                <div
                    className="vn-tabs"
                    role="group"
                    aria-label="Lọc danh mục sản phẩm"
                >
                    <button
                        type="button"
                        className={
                            activeCategory === null ? 'active' : ''
                        }
                        aria-pressed={activeCategory === null}
                        onClick={() => setActiveCategory(null)}
                    >
                        Tất cả
                    </button>

                    {categories.map(category => (
                        <button
                            type="button"
                            key={category.id}
                            className={
                                activeCategory === category.id
                                    ? 'active'
                                    : ''
                            }
                            aria-pressed={
                                activeCategory === category.id
                            }
                            onClick={() =>
                                setActiveCategory(category.id)
                            }
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {renderProducts(visibleProducts)}
            </section>

            {/* Banner mẹo nhà bếp */}
            <section className="vn-story">
                <div>
                    <span className="vn-eyebrow">
                        MỖI BỮA ĂN, MỘT CHÚT YÊU THƯƠNG
                    </span>

                    <h2>Bếp nhà có gì ngon?</h2>

                    <p>
                        Từ một món canh rau đến đĩa salad đầy màu sắc.
                        Khám phá mẹo chọn, bảo quản và chế biến
                        nguyên liệu cho bữa ăn mỗi ngày.
                    </p>

                    <button
                        type="button"
                        className="vn-button"
                        onClick={() => onNavigate('tips')}
                    >
                        Khám phá mẹo nhà bếp ↗
                    </button>
                </div>

                <div
                    className="vn-story-art"
                    aria-hidden="true"
                >
                    🥬 🥕 🍅
                    <span>Tươi xanh trong từng lựa chọn.</span>
                </div>
            </section>

            {/* Hướng dẫn mua hàng */}
            <section
                className="vn-section"
                id="vn-how"
            >
                <div className="vn-section-head">
                    <div>
                        <span className="vn-eyebrow">
                            ĐƠN GIẢN VÀ THUẬN TIỆN
                        </span>
                        <h2>Đi chợ online trong 3 bước</h2>
                    </div>
                </div>

                <div className="vn-steps">
                    {[
                        [
                            '01',
                            'Chọn món bạn thích',
                            'Khám phá sản phẩm và thêm vào giỏ hàng.'
                        ],
                        [
                            '02',
                            'Điền thông tin nhận hàng',
                            'Kiểm tra giỏ hàng, địa chỉ và số điện thoại.'
                        ],
                        [
                            '03',
                            'Hoàn tất đặt hàng',
                            'Gửi đơn hàng để cửa hàng tiếp nhận.'
                        ]
                    ].map(([number, title, text]) => (
                        <article key={number}>
                            <span>{number}</span>

                            <div>
                                <h3>{title}</h3>
                                <p>{text}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <div className="vn-bottom">
                <div>
                    <strong>
                        Vườn Nhà — thêm xanh cho mỗi ngày.
                    </strong>
                    <p>
                        Tìm hiểu cửa hàng hoặc liên hệ để được hỗ trợ.
                    </p>
                </div>

                <div>
                    <button
                        type="button"
                        className="vn-text-button"
                        onClick={() => onNavigate('about')}
                    >
                        Về chúng tôi ↗
                    </button>

                    <button
                        type="button"
                        className="vn-button"
                        onClick={() => onNavigate('contact')}
                    >
                        Liên hệ cửa hàng
                    </button>
                </div>
            </div>
        </div>
    );
}