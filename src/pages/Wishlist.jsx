import ProductCard from '../components/ProductCard';
import './Wishlist.css';

export default function Wishlist({ wishlistItems, onViewDetail, onAddToCart, onRemoveWishlist }) {
    return (
        <div className="wishlist-page">
            <h2>❤️ Sản phẩm yêu thích của bạn</h2>
            {wishlistItems.length === 0 ? (
                <div className="empty-wishlist">
                    <p>Chưa có sản phẩm nào trong danh sách yêu thích.</p>
                </div>
            ) : (
                <div className="wishlist-grid">
                    {wishlistItems.map(product => (
                        <div key={product.id} className="wishlist-card-wrapper">
                            <ProductCard 
                                product={product} 
                                onViewDetail={onViewDetail} 
                                onAddToCart={onAddToCart} 
                            />
                            <button 
                                onClick={() => onRemoveWishlist(product.id)} 
                                className="btn-remove-wishlist"
                            >
                                ✕ Xóa khỏi yêu thích
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}