import './ProductCard.css';

export default function ProductCard({ product, onViewDetail, onBuyNow, onAddToCart }) {
    const stockQuantity = Number(product.stockQuantity ?? product.quantity) || 0;

    return (
        <div className="product-card" onClick={() => onViewDetail(product)}>
            <div className="pc-image-box">
                <img src={product.image || 'https://via.placeholder.com/200'} alt={product.name} />
                <button
                    type="button"
                    className="pc-quick-add"
                    onClick={(event) => {
                        event.stopPropagation();
                        onAddToCart({
                            ...product,
                            stockQuantity,
                            quantity: 1
                        });
                    }}
                    disabled={stockQuantity <= 0}
                    aria-label={`Thêm ${product.name} vào giỏ hàng`}
                    title={stockQuantity > 0 ? 'Thêm vào giỏ hàng' : 'Sản phẩm đã hết hàng'}
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="19"
                        height="19"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M3 3h2l2.4 11.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6" />
                        <circle cx="10" cy="20" r="1" />
                        <circle cx="18" cy="20" r="1" />
                    </svg>
                </button>
            </div>
            <div className="pc-details">
                <span className="pc-brand">🌱 VƯỜN NHÀ</span>
                <h4>{product.name}</h4>
                <div className="pc-price-row">
                    <span className="price">{product.price.toLocaleString()} đ</span>
                    <span className="unit">/ {product.unit}</span>
                </div>
                <div className="pc-actions" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onViewDetail(product)} className="btn-detail">Chi tiết</button>
                    <button
                        onClick={() =>
                            onBuyNow({
                                ...product,
                                stockQuantity: product.quantity,
                                quantity: 1
                            })
                        }
                        className="btn-add"
                    >
                        Mua ngay
                    </button>
                </div>
            </div>
        </div>
    );
}