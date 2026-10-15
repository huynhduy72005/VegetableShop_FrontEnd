import './ProductCard.css';

export default function ProductCard({ product, onViewDetail, onBuyNow }) {
    return (
        <div className="product-card" onClick={() => onViewDetail(product)}>
            <div className="pc-image-box">
                <img src={product.image || 'https://via.placeholder.com/200'} alt={product.name} />
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