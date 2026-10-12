import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import Admin from './pages/Admin';
import Wishlist from './pages/Wishlist';
import './App.css';

export default function App() {
    const [activePage, setActivePage] = useState('home');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    // Thêm vào giỏ hàng
    const handleAddToCart = (product) => {
        setCartItems(prev => {
            const exist = prev.find(item => item.id === product.id);
            const qty = product.quantity || 1;
            if (exist) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
            }
            return [...prev, { ...product, quantity: qty }];
        });
        alert(`Đã thêm ${product.name} vào giỏ hàng!`);
    };

    // Thêm / Xóa khỏi danh sách yêu thích
    const handleToggleWishlist = (product) => {
        setWishlistItems(prev => {
            const exist = prev.find(item => item.id === product.id);
            if (exist) {
                alert(`Đã xóa ${product.name} khỏi sản phẩm yêu thích.`);
                return prev.filter(item => item.id !== product.id);
            } else {
                alert(`Đã thêm ${product.name} vào sản phẩm yêu thích!`);
                return [...prev, product];
            }
        });
    };

    return (
        <div className="app-container">
            <Header 
                setActivePage={setActivePage} 
                cartCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)} 
                wishlistCount={wishlistItems.length}
                currentUser={currentUser} 
            />

            <main className="main-content">
                {activePage === 'home' && (
                    <Home 
                        onViewDetail={(p) => { setSelectedProduct(p); setActivePage('detail'); }} 
                        onAddToCart={handleAddToCart} 
                        onToggleWishlist={handleToggleWishlist}
                    />
                )}
                {activePage === 'detail' && (
                    <ProductDetail 
                        product={selectedProduct} 
                        onAddToCart={handleAddToCart} 
                        onToggleWishlist={handleToggleWishlist}
                        onBack={() => setActivePage('home')} 
                    />
                )}
                {activePage === 'cart' && (
                    <Cart 
                        cartItems={cartItems} 
                        onUpdateQuantity={(id, q) => setCartItems(prev => prev.map(i => i.id === id ? {...i, quantity: q} : i).filter(i => i.quantity > 0))} 
                        onRemoveItem={(id) => setCartItems(prev => prev.filter(i => i.id !== id))} 
                        onProceedCheckout={() => setActivePage('checkout')} 
                    />
                )}
                {activePage === 'checkout' && (
                    <Checkout 
                        cartItems={cartItems} 
                        currentUser={currentUser} 
                        onOrderSuccess={() => { setCartItems([]); setActivePage('home'); }} 
                    />
                )}
                {activePage === 'wishlist' && (
                    <Wishlist 
                        wishlistItems={wishlistItems}
                        onViewDetail={(p) => { setSelectedProduct(p); setActivePage('detail'); }}
                        onAddToCart={handleAddToCart}
                        onRemoveWishlist={(id) => setWishlistItems(prev => prev.filter(i => i.id !== id))}
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
                    <Register 
                        onSwitchToLogin={() => setActivePage('login')} 
                    />
                )}
            </main>

            <Footer />
        </div>
    );
}