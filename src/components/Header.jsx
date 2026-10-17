import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import './Header.css';

const navItems = [
    { key: 'home', label: 'Trang chủ' },
    { key: 'products', label: 'Sản phẩm' },
    { key: 'orders', label: 'Đơn hàng' },
    { key: 'promotions', label: 'Khuyến mãi' },
    { key: 'about', label: 'Về chúng tôi' },
    { key: 'tips', label: 'Mẹo hay nhà bếp' },
    { key: 'reviews', label: 'Đánh giá' },
    { key: 'contact', label: 'Liên hệ' }
];

const roleNames = {
    Admin: 'Quản trị viên',
    Staff: 'Nhân viên',
    Customer: 'Khách hàng'
};

// Icon SVG: dùng trực tiếp, không cần cài thư viện.
const iconPaths = {
    leaf: 'M20 4C9 2 3 8 5 15c2 6 13 7 15-11Z M4 21 15 10',
    search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
    cart: 'M2 3h3l3 13h11l3-9H6 M10 21h.01 M18 21h.01',
    user: 'M20 21v-2a7 7 0 0 0-14 0v2 M17 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z',
    down: 'm6 9 6 6 6-6',
    arrow: 'M5 12h14 m-6-6 6 6-6 6',
    menu: 'M4 6h16 M4 12h16 M4 18h16',
    close: 'm6 6 12 12 M6 18 18 6',
    phone: 'M22 16v3a2 2 0 0 1-2.2 2A20 20 0 0 1 3 4.2 2 2 0 0 1 5 2h3l2 5-2 2a16 16 0 0 0 7 7l2-2Z',
    grid: 'M3 3h7v7H3Z M14 3h7v7h-7Z M3 14h7v7H3Z M14 14h7v7h-7Z'
};

function Icon({ name, size = 20 }) {
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

// Cho phép tìm "cai bo xoi" ra "Cải bó xôi".
function normalize(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .trim();
}

const money = value =>
    Number(value || 0).toLocaleString('vi-VN') + ' đ';

export default function Header({
    setActivePage,
    activePage,
    cartCount = 0,
    wishlistCount = 0,
    currentUser,
    onSelectCategory,
    onViewProduct
}) {
    const [categories, setCategories] = useState([]);
    const [categoryStatus, setCategoryStatus] = useState('loading');
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const [search, setSearch] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchStatus, setSearchStatus] = useState('loading');
    const [retrySearch, setRetrySearch] = useState(0);

    const headerRef = useRef(null);
    const searchRef = useRef(null);
    const categoryRef = useRef(null);
    const menuRef = useRef(null);

    // Lấy danh mục từ backend.
    useEffect(() => {
        let active = true;

        api.getCategories()
            .then(response => {
                if (active) {
                    setCategories(response.data || []);
                    setCategoryStatus('ready');
                }
            })
            .catch(() => {
                if (active) setCategoryStatus('error');
            });

        return () => {
            active = false;
        };
    }, []);

    // Tải sản phẩm khi mở ô tìm kiếm.
    useEffect(() => {
        if (!searchOpen) return;

        let active = true;

        async function load() {
            setSearchStatus('loading');

            try {
                const response = await api.getProducts();

                if (active) {
                    setProducts(response.data || []);
                    setSearchStatus('ready');
                }
            } catch {
                if (active) setSearchStatus('error');
            }
        }

        load();

        return () => {
            active = false;
        };
    }, [searchOpen, retrySearch]);

    // Đóng bảng xổ xuống khi bấm bên ngoài hoặc nhấn Escape.
    useEffect(() => {
        function closeOutside(event) {
            if (!headerRef.current?.contains(event.target)) {
                setCategoryOpen(false);
                setSearchOpen(false);
                setMobileOpen(false);
            }
        }

        function closeEscape(event) {
            if (event.key !== 'Escape') return;

            if (searchOpen) {
                searchRef.current?.focus();
            } else if (categoryOpen) {
                categoryRef.current?.focus();
            } else if (mobileOpen) {
                menuRef.current?.focus();
            }

            setCategoryOpen(false);
            setSearchOpen(false);
            setMobileOpen(false);
        }

        document.addEventListener('pointerdown', closeOutside);
        document.addEventListener('keydown', closeEscape);

        return () => {
            document.removeEventListener('pointerdown', closeOutside);
            document.removeEventListener('keydown', closeEscape);
        };
    }, [searchOpen, categoryOpen, mobileOpen]);

    function closePanels() {
        setCategoryOpen(false);
        setSearchOpen(false);
        setMobileOpen(false);
    }

    function navigate(page) {
        if (page === 'products') {
            onSelectCategory?.(null);
        }

        setActivePage(page);
        closePanels();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function chooseCategory(id) {
        onSelectCategory?.(id);
        setActivePage('products');
        closePanels();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function chooseProduct(product) {
        closePanels();

        if (onViewProduct) {
            onViewProduct(product);
        } else {
            navigate('products');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function submitSearch(event) {
        event.preventDefault();

        if (!search.trim()) {
            navigate('products');
        } else {
            setCategoryOpen(false);
            setSearchOpen(true);
        }
    }

    const results = products.filter(product =>
        normalize(product.name).includes(normalize(search))
    );

    const initials = (currentUser?.fullName || 'Bạn')
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map(word => word[0] || '')
        .join('')
        .toUpperCase();

    const badge = count => count > 99 ? '99+' : count;

    return (
        <header className="vh-header" ref={headerRef}>
            {/* Thanh thông báo */}
            <div className="vh-topbar">
                <div className="vh-container vh-topbar-inner">
                    <span>
                        <Icon name="leaf" size={14} />
                        Tươi xanh mỗi ngày · Giao hàng tận nhà
                    </span>

                    <a href="tel:19006868">
                        <Icon name="phone" size={13} />
                        Hỗ trợ: <strong>1900 6868</strong>
                    </a>
                </div>
            </div>

            {/* Logo, tìm kiếm, tài khoản */}
            <div className="vh-container vh-main">
                <button
                    type="button"
                    className="vh-logo"
                    onClick={() => navigate('home')}
                    aria-label="Vườn Nhà — về trang chủ"
                >
                    <span className="vh-logo-icon">
                        <Icon name="leaf" size={27} />
                    </span>

                    <span className="vh-logo-copy">
                        <strong>Vườn Nhà</strong>
                        <small>RAU CỦ & TRÁI CÂY</small>
                    </span>
                </button>

                <div className="vh-search-wrap">
                    <form
                        className="vh-search"
                        onSubmit={submitSearch}
                        role="search"
                    >
                        <Icon name="search" />

                        <input
                            ref={searchRef}
                            type="search"
                            value={search}
                            onChange={event =>
                                setSearch(event.target.value)
                            }
                            onFocus={() => {
                                setSearchOpen(true);
                                setCategoryOpen(false);
                            }}
                            placeholder="Hôm nay bạn muốn tìm gì?"
                            aria-label="Tìm sản phẩm"
                            autoComplete="off"
                        />

                        <button type="submit">Tìm kiếm</button>
                    </form>

                    {searchOpen && (
                        <div
                            className="vh-search-panel"
                            aria-label="Kết quả tìm sản phẩm"
                        >
                            <div className="vh-panel-title">
                                <strong>
                                    {search.trim()
                                        ? `Kết quả cho “${search.trim()}”`
                                        : 'Gợi ý từ cửa hàng'}
                                </strong>

                                <button
                                    type="button"
                                    className="vh-small-icon"
                                    onClick={() => setSearchOpen(false)}
                                    aria-label="Đóng tìm kiếm"
                                >
                                    <Icon name="close" size={16} />
                                </button>
                            </div>

                            {searchStatus === 'loading' ? (
                                <p
                                    className="vh-panel-message"
                                    role="status"
                                >
                                    Đang tìm sản phẩm…
                                </p>
                            ) : searchStatus === 'error' ? (
                                <div
                                    className="vh-panel-message"
                                    role="status"
                                >
                                    Chưa tải được sản phẩm.{' '}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setRetrySearch(
                                                value => value + 1
                                            )
                                        }
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            ) : results.length === 0 ? (
                                <p
                                    className="vh-panel-message"
                                    role="status"
                                >
                                    Không tìm thấy sản phẩm phù hợp.
                                </p>
                            ) : (
                                <>
                                    {results.slice(0, 6).map(product => (
                                        <button
                                            type="button"
                                            key={product.id}
                                            className="vh-search-result"
                                            onClick={() =>
                                                chooseProduct(product)
                                            }
                                        >
                                            <span className="vh-result-image">
                                                {product.image ? (
                                                    <img
                                                        src={product.image}
                                                        alt=""
                                                    />
                                                ) : (
                                                    <Icon name="leaf" />
                                                )}
                                            </span>

                                            <span className="vh-result-info">
                                                <strong>
                                                    {product.name}
                                                </strong>
                                                <small>
                                                    {money(product.price)}
                                                    {' '}/ {product.unit}
                                                </small>
                                            </span>

                                            <Icon
                                                name="arrow"
                                                size={16}
                                            />
                                        </button>
                                    ))}

                                    {results.length > 6 && (
                                        <p className="vh-panel-message">
                                            Hiển thị 6 / {results.length}
                                            {' '}sản phẩm. Nhập tên cụ thể
                                            hơn để tìm tiếp.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="vh-actions">
                    <button
                        type="button"
                        className={`vh-icon-button ${
                            activePage === 'wishlist'
                                ? 'is-active'
                                : ''
                        }`}
                        onClick={() => navigate('wishlist')}
                        aria-label={`Yêu thích: ${wishlistCount} sản phẩm`}
                        title="Sản phẩm yêu thích"
                    >
                        <Icon name="heart" />

                        {wishlistCount > 0 && (
                            <span className="vh-badge vh-badge-heart">
                                {badge(wishlistCount)}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        className={`vh-icon-button ${
                            activePage === 'cart' ? 'is-active' : ''
                        }`}
                        onClick={() => navigate('cart')}
                        aria-label={`Giỏ hàng: ${cartCount} sản phẩm`}
                        title="Giỏ hàng"
                    >
                        <Icon name="cart" />

                        {cartCount > 0 && (
                            <span className="vh-badge">
                                {badge(cartCount)}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        className="vh-account"
                        onClick={() =>
                            navigate(
                                currentUser ? 'account' : 'login'
                            )
                        }
                        aria-label={
                            currentUser
                                ? `Tài khoản ${currentUser.fullName}`
                                : 'Đăng nhập'
                        }
                    >
                        <span className="vh-avatar">
                            {currentUser ? (
                                initials
                            ) : (
                                <Icon name="user" size={18} />
                            )}
                        </span>

                        <span className="vh-account-copy">
                            <strong>
                                {currentUser
                                    ? currentUser.fullName
                                    : 'Đăng nhập'}
                            </strong>

                            <small>
                                {currentUser
                                    ? roleNames[currentUser.role] ||
                                      currentUser.role
                                    : 'Tài khoản của bạn'}
                            </small>
                        </span>
                    </button>

                    <button
                        type="button"
                        className="vh-shop-button"
                        onClick={() => navigate('products')}
                    >
                        Mua sắm
                        <Icon name="arrow" size={16} />
                    </button>

                    <button
                        ref={menuRef}
                        type="button"
                        className="vh-icon-button vh-menu-toggle"
                        onClick={() => {
                            setMobileOpen(value => !value);
                            setSearchOpen(false);
                            setCategoryOpen(false);
                        }}
                        aria-expanded={mobileOpen}
                        aria-controls="vh-navigation"
                        aria-label={
                            mobileOpen ? 'Đóng menu' : 'Mở menu'
                        }
                    >
                        <Icon
                            name={mobileOpen ? 'close' : 'menu'}
                        />
                    </button>
                </div>
            </div>

            {/* Menu điều hướng */}
            <nav
                id="vh-navigation"
                className={`vh-navigation ${
                    mobileOpen ? 'is-open' : ''
                }`}
                aria-label="Điều hướng chính"
            >
                <div className="vh-container vh-nav-inner">
                    <ul className="vh-nav-list">
                        {navItems.map(item =>
                            item.key === 'products' ? (
                                <li
                                    key={item.key}
                                    className={`vh-products ${
                                        categoryOpen
                                            ? 'is-expanded'
                                            : ''
                                    }`}
                                    onBlur={event => {
                                        if (
                                            !event.currentTarget.contains(
                                                event.relatedTarget
                                            )
                                        ) {
                                            setCategoryOpen(false);
                                        }
                                    }}
                                >
                                    <div
                                        className={`vh-product-buttons ${
                                            activePage === 'products'
                                                ? 'is-active'
                                                : ''
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            className="vh-nav-button"
                                            onClick={() =>
                                                navigate('products')
                                            }
                                            aria-current={
                                                activePage === 'products'
                                                    ? 'page'
                                                    : undefined
                                            }
                                        >
                                            Sản phẩm
                                        </button>

                                        <button
                                            ref={categoryRef}
                                            type="button"
                                            className="vh-category-toggle"
                                            onClick={() => {
                                                setCategoryOpen(
                                                    value => !value
                                                );
                                                setSearchOpen(false);
                                            }}
                                            aria-label="Mở danh mục sản phẩm"
                                            aria-expanded={categoryOpen}
                                            aria-controls="vh-category-panel"
                                        >
                                            <Icon name="down" size={14} />
                                        </button>
                                    </div>

                                    {categoryOpen && (
                                        <div
                                            id="vh-category-panel"
                                            className="vh-category-panel"
                                        >
                                            <span className="vh-category-title">
                                                KHÁM PHÁ DANH MỤC
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate('products')
                                                }
                                            >
                                                <Icon
                                                    name="grid"
                                                    size={17}
                                                />
                                                Tất cả sản phẩm
                                            </button>

                                            {categories.map(category => (
                                                <button
                                                    type="button"
                                                    key={category.id}
                                                    onClick={() =>
                                                        chooseCategory(
                                                            category.id
                                                        )
                                                    }
                                                >
                                                    <Icon
                                                        name="leaf"
                                                        size={17}
                                                    />
                                                    {category.name}
                                                    <span>↗</span>
                                                </button>
                                            ))}

                                            {categoryStatus === 'loading' && (
                                                <p className="vh-panel-message">
                                                    Đang tải danh mục…
                                                </p>
                                            )}

                                            {categoryStatus === 'error' && (
                                                <p className="vh-panel-message">
                                                    Chưa tải được danh mục.
                                                </p>
                                            )}

                                            {categoryStatus === 'ready' &&
                                                categories.length === 0 && (
                                                    <p className="vh-panel-message">
                                                        Chưa có danh mục.
                                                    </p>
                                                )}
                                        </div>
                                    )}
                                </li>
                            ) : (
                                <li key={item.key}>
                                    <button
                                        type="button"
                                        className={`vh-nav-button ${
                                            activePage === item.key
                                                ? 'is-active'
                                                : ''
                                        }`}
                                        onClick={() => navigate(item.key)}
                                        aria-current={
                                            activePage === item.key
                                                ? 'page'
                                                : undefined
                                        }
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            )
                        )}

                        {currentUser?.role === 'Admin' && (
                            <li>
                                <button
                                    type="button"
                                    className={`vh-nav-button vh-admin ${
                                        activePage === 'admin'
                                            ? 'is-active'
                                            : ''
                                    }`}
                                    onClick={() => navigate('admin')}
                                    aria-current={
                                        activePage === 'admin'
                                            ? 'page'
                                            : undefined
                                    }
                                >
                                    <Icon name="grid" size={15} />
                                    Quản trị
                                </button>
                            </li>
                        )}
                    </ul>

                    <span className="vh-nav-note">
                        <span />
                        Từ vườn xanh đến bếp nhà
                    </span>
                </div>
            </nav>
        </header>
    );
}