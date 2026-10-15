import { useEffect, useState } from 'react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Products.css';

// Icon minh hoạ theo tên danh mục (có icon mặc định nếu không khớp)
const categoryIcons = {
    'Rau xanh': '🥬',
    'Củ': '🥕',
    'Trái cây': '🍎',
    'Nấm': '🍄',
};

// Các mốc khoảng giá để lọc nhanh
const priceRanges = [
    { id: 'all', label: 'Tất cả mức giá', test: () => true },
    { id: 'lt20', label: 'Dưới 20.000 đ', test: (price) => price < 20000 },
    { id: '20-50', label: '20.000 đ - 50.000 đ', test: (price) => price >= 20000 && price <= 50000 },
    { id: 'gt50', label: 'Trên 50.000 đ', test: (price) => price > 50000 },
];

export default function Products({ categoryId, onViewDetail, onBuyNow }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState(categoryId ?? null);
    const [activePriceRange, setActivePriceRange] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Tải danh sách sản phẩm + danh mục từ API
    useEffect(() => {
        setLoading(true);
        Promise.all([api.getProducts(), api.getCategories()])
            .then(([prodRes, catRes]) => {
                setProducts(prodRes.data || []);
                setCategories(catRes.data || []);
                setError(null);
            })
            .catch(err => {
                console.error('Lỗi tải sản phẩm:', err);
                setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
            })
            .finally(() => setLoading(false));
    }, []);

    // Đồng bộ bộ lọc khi người dùng chọn danh mục khác từ menu Header
    useEffect(() => {
        setActiveCategory(categoryId ?? null);
    }, [categoryId]);

    const selectedPriceRange = priceRanges.find(r => r.id === activePriceRange) || priceRanges[0];

    const filteredProducts = products.filter(p => {
        const matchCategory = activeCategory ? p.categoryId === activeCategory : true;
        const matchSearch = p.name.toLowerCase().includes(search.trim().toLowerCase());
        const matchPrice = selectedPriceRange.test(p.price);
        return matchCategory && matchSearch && matchPrice;
    });

    const activeCategoryName = activeCategory
        ? categories.find(c => c.id === activeCategory)?.name
        : null;

    // Đếm số sản phẩm theo từng danh mục (không tính bộ lọc giá/tìm kiếm, để số liệu ổn định)
    const countInCategory = (catId) =>
        catId ? products.filter(p => p.categoryId === catId).length : products.length;

    return (
        <div className="products-container">
            <div className="products-topbar">
                <div>
                    <span className="prod-sub-title">CỬA HÀNG VƯỜN NHÀ</span>
                    <h1>{activeCategoryName || 'Tất cả sản phẩm'}</h1>
                    <p className="products-count">
                        {loading ? 'Đang tải...' : `${filteredProducts.length} sản phẩm`}
                    </p>
                </div>

                <div className="products-search">
                    <input
                        type="text"
                        placeholder="Tìm trong sản phẩm..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="products-layout">
                {/* ---- Sidebar lọc: Danh mục + Khoảng giá ---- */}
                <aside className="products-sidebar">
                    <div className="sidebar-block">
                        <h3>Danh mục</h3>
                        <ul className="sidebar-list">
                            <li
                                className={activeCategory === null ? 'active' : ''}
                                onClick={() => setActiveCategory(null)}
                            >
                                <span>🌿 Tất cả</span>
                                <span className="sidebar-count">{countInCategory(null)}</span>
                            </li>
                            {categories.map(cat => (
                                <li
                                    key={cat.id}
                                    className={activeCategory === cat.id ? 'active' : ''}
                                    onClick={() => setActiveCategory(cat.id)}
                                >
                                    <span>{categoryIcons[cat.name] || '🌱'} {cat.name}</span>
                                    <span className="sidebar-count">{countInCategory(cat.id)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="sidebar-block">
                        <h3>Khoảng giá</h3>
                        <ul className="sidebar-list">
                            {priceRanges.map(range => (
                                <li
                                    key={range.id}
                                    className={activePriceRange === range.id ? 'active' : ''}
                                    onClick={() => setActivePriceRange(range.id)}
                                >
                                    <span>{range.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {(activeCategory !== null || activePriceRange !== 'all' || search) && (
                        <button
                            type="button"
                            className="sidebar-reset"
                            onClick={() => { setActiveCategory(null); setActivePriceRange('all'); setSearch(''); }}
                        >
                            ✕ Xóa bộ lọc
                        </button>
                    )}
                </aside>

                {/* ---- Nội dung: lưới sản phẩm ---- */}
                <div className="products-main">
                    {loading && (
                        <div className="products-state">Đang tải sản phẩm...</div>
                    )}

                    {!loading && error && (
                        <div className="products-state products-error">{error}</div>
                    )}

                    {!loading && !error && filteredProducts.length === 0 && (
                        <div className="products-state">
                            Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
                        </div>
                    )}

                    {!loading && !error && filteredProducts.length > 0 && (
                        <div className="product-grid">
                            {filteredProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onViewDetail={onViewDetail}
                                    onBuyNow={onBuyNow}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}