import { useRef, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import Admin from './pages/Admin';
import Wishlist from './pages/Wishlist';
import AboutUs from './pages/AboutUs';
import KitchenTips from './pages/KitchenTips';
import Promotions from './pages/Promotions';
import Reviews from './pages/Reviews';
import Contact from './pages/Contact';
import ChatWidget from './components/ChatWidget';

import OrderHistory from './pages/OrderHistory'; // Đường dẫn tới file vừa tạo

import './App.css';

export default function App() {
    const [activePage, setActivePage] = useState('home');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [checkoutItems, setCheckoutItems] = useState(null);
    const [checkoutCartItemIds, setCheckoutCartItemIds] = useState(null);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const detailPreviousPage = useRef('home');

    const handleViewDetail = (product) => {
        if (activePage !== 'detail') {
            detailPreviousPage.current = activePage;
        }
        setSelectedProduct(product);
        setActivePage('detail');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackFromDetail = () => {
        setActivePage(detailPreviousPage.current);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBuyNow = (product) => {
        setCheckoutItems([{
            ...product,
            quantity: Number(product.quantity) || 1
        }]);
        setCheckoutCartItemIds(null);
        setActivePage('checkout');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCheckoutFromCart = (selectedItems) => {
        setCheckoutItems(selectedItems);
        setCheckoutCartItemIds(selectedItems.map(item => item.id));
        setActivePage('checkout');
    };

    const handleOrderSuccess = () => {
        if (checkoutCartItemIds !== null) {
            const orderedItemIds = new Set(checkoutCartItemIds);
            setCartItems(prev => prev.filter(item => !orderedItemIds.has(item.id)));
        }
        setCheckoutItems(null);
        setCheckoutCartItemIds(null);
        setActivePage('home');
    };

    // Thêm một sản phẩm vào giỏ hàng
    const handleAddToCart = (product) => {
        setCartItems(prev => {
            const exist = prev.find(item => item.id === product.id);
            const qty = product.quantity || 1;
            if (exist) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + qty }
                        : item
                );
            }
            return [...prev, { ...product, quantity: qty }];
        });
        alert(`Đã thêm ${product.name} vào giỏ hàng!`);
    };

    // Thêm nhiều sản phẩm do Gemini AI đề xuất vào giỏ hàng
    const handleAddMultipleToCart = (products) => {
        if (!Array.isArray(products) || products.length === 0) {
            alert('Không có sản phẩm để thêm.');
            return;
        }

        const updatedCart = [...cartItems];
        const processedIds = new Set();
        let addedCount = 0;
        let skippedCount = 0;

        products.forEach(product => {
            const id = Number(product.id);
            const stock = Number(product.stockQuantity);
            const price = Number(product.price);

            if (
                !Number.isInteger(id) ||
                id <= 0 ||
                !Number.isInteger(stock) ||
                stock <= 0 ||
                !Number.isFinite(price) ||
                price < 0 ||
                processedIds.has(id)
            ) {
                skippedCount++;
                return;
            }

            processedIds.add(id);
            const index = updatedCart.findIndex(item => Number(item.id) === id);
            const currentQuantity = index >= 0
                ? Number(updatedCart[index].quantity) || 0
                : 0;

            if (currentQuantity >= stock) {
                skippedCount++;
                return;
            }

            if (index >= 0) {
                updatedCart[index] = {
                    ...updatedCart[index],
                    quantity: currentQuantity + 1
                };
            } else {
                updatedCart.push({ ...product, id, quantity: 1 });
            }

            addedCount++;
        });

        if (addedCount === 0) {
            alert('Không có sản phẩm nào có thể thêm vào giỏ hàng.');
            return;
        }

        setCartItems(updatedCart);
        alert(
            `Đã thêm ${addedCount} sản phẩm vào giỏ hàng!` +
            (skippedCount > 0
                ? ` Bỏ qua ${skippedCount} sản phẩm do trùng lặp, hết hàng hoặc đã đạt giới hạn tồn kho.`
                : '')
        );
    };

    // Thêm / Xóa khỏi danh sách yêu thích
    const handleToggleWishlist = (product) => {
        setWishlistItems(prev => {
            const exist = prev.find(item => item.id === product.id);
            if (exist) {
                alert(`Đã xóa ${product.name} khỏi sản phẩm yêu thích.`);
                return prev.filter(item => item.id !== product.id);
            }
            alert(`Đã thêm ${product.name} vào sản phẩm yêu thích!`);
            return [...prev, product];
        });
    };

    return (
        <div className="app-container">
          <Header
            setActivePage={setActivePage}
            activePage={activePage}
            cartCount={cartItems.reduce(
                (sum, item) => sum + item.quantity,
                0
            )}
            wishlistCount={wishlistItems.length}
            currentUser={currentUser}
            onSelectCategory={setSelectedCategoryId}
            onViewProduct={handleViewDetail}
/>

            <main className="main-content">
                {activePage === 'home' && (
    <Home
        onViewDetail={handleViewDetail}
        onBuyNow={handleBuyNow}
        onToggleWishlist={handleToggleWishlist}
        wishlistItems={wishlistItems}
        onBrowseProducts={(categoryId = null) => {
            setSelectedCategoryId(categoryId);
            setActivePage('products');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigate={(page) => {
            setActivePage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
    />
)}
                {activePage === 'products' && (
                    <Products
                        categoryId={selectedCategoryId}
                        onViewDetail={handleViewDetail}
                        onBuyNow={handleBuyNow}
                        onAddToCart={handleAddToCart}
                    />
                )}
                {activePage === 'about' && <AboutUs />}
                {activePage === 'tips' && <KitchenTips />}
                {activePage === 'promotions' && (
                    <Promotions onBrowseProducts={() => setActivePage('home')} />
                )}
                {activePage === 'reviews' && <Reviews />}
                {activePage === 'contact' && <Contact />}
                {activePage === 'detail' && (
                    <ProductDetail
                        product={selectedProduct}
                        onAddToCart={handleAddToCart}
                        onToggleWishlist={handleToggleWishlist}
                        isWishlisted={wishlistItems.some(item => item.id === selectedProduct?.id)}
                        onViewCart={() => setActivePage('cart')}
                        onBack={handleBackFromDetail}
                    />
                )}
                {activePage === 'cart' && (
                    <Cart
                        cartItems={cartItems}
                        onUpdateQuantity={(id, q) => setCartItems(prev =>
                            prev.map(i => i.id === id ? { ...i, quantity: q } : i)
                                .filter(i => i.quantity > 0)
                        )}
                        onRemoveItem={(id) => setCartItems(prev =>
                            prev.filter(i => i.id !== id)
                        )}
                        onProceedCheckout={handleCheckoutFromCart}
                    />
                )}
                {activePage === 'checkout' && (
                    <Checkout
                        cartItems={checkoutItems ?? cartItems}
                        currentUser={currentUser}
                        onOrderSuccess={handleOrderSuccess}
                    />
                )}
                {activePage === 'wishlist' && (
                    <Wishlist
                        wishlistItems={wishlistItems}
                        onViewDetail={(p) => { setSelectedProduct(p); setActivePage('detail'); }}
                        onBuyNow={handleBuyNow}
                        onRemoveWishlist={(id) => setWishlistItems(prev =>
                            prev.filter(i => i.id !== id)
                        )}
                    />
                )}
                {activePage === 'account' && (
                    <Account
                        currentUser={currentUser}
                        onLogout={() => { setCurrentUser(null); setActivePage('home'); }}
                    />
                )}
                {activePage === 'admin' && <Admin />}
                {activePage === 'login' && (
                    <Login
                        onLoginSuccess={(user) => { setCurrentUser(user); setActivePage('home'); }}
                        onSwitchToRegister={() => setActivePage('register')}
                    />
                )}
                {activePage === 'register' && (
                    <Register onSwitchToLogin={() => setActivePage('login')} />
                )}
            </main>

            <Footer />

            {/* Gemini AI Chatbot */}
            <ChatWidget
                onAddToCart={handleAddToCart}
                onAddMultipleToCart={handleAddMultipleToCart}
            />
        </div>

        
    );
    
}
