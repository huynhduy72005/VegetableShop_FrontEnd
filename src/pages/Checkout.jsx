import React, { useState } from 'react';
import { api } from '../services/api';
import './Checkout.css';

export default function Checkout({ cartItems, currentUser, onOrderSuccess }) {
    const [formData, setFormData] = useState({
        fullName: currentUser ? currentUser.fullName : '',
        phone: '',
        address: '',
        note: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('COD');

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal > 0 ? 15000 : 0;
    const total = subtotal + shippingFee;

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        const orderData = {
            userId: currentUser ? currentUser.id : 1,
            shippingAddress: `${formData.address} - SĐT: ${formData.phone} - Ghi chú: ${formData.note}`,
            totalPrice: total,
            items: cartItems.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price
            }))
        };

        try {
            await api.createOrder(orderData);
            alert("🎉 Đặt hàng thành công! Đơn hàng đã lưu vào Database.");
            onOrderSuccess();
        } catch (err) {
            alert("Lỗi khi đặt hàng: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="checkout-page">
            <h2>Thanh toán đơn hàng</h2>
            <form onSubmit={handleSubmitOrder} className="checkout-layout">
                <div className="checkout-form">
                    <h3>Thông tin nhận hàng</h3>
                    <div className="form-group">
                        <label>Họ và tên</label>
                        <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Nhập họ và tên" />
                    </div>
                    <div className="form-group">
                        <label>Số điện thoại</label>
                        <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Nhập số điện thoại" />
                    </div>
                    <div className="form-group">
                        <label>Địa chỉ nhận hàng</label>
                        <input type="text" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Số nhà, đường, phường/xã, quận/huyện..." />
                    </div>
                    <div className="form-group">
                        <label>Ghi chú đơn hàng</label>
                        <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Ghi chú về thời gian giao hàng..." />
                    </div>
                </div>

                <div className="checkout-summary">
                    <h3>Đơn hàng của bạn</h3>
                    <div className="mini-items">
                        {cartItems.map(item => (
                            <div key={item.id} className="mini-item">
                                <span>{item.name} x {item.quantity}</span>
                                <strong>{(item.price * item.quantity).toLocaleString()} đ</strong>
                            </div>
                        ))}
                    </div>
                    <hr />
                    <div className="payment-options">
                        <h4>Phương thức thanh toán</h4>
                        <label className="radio-label">
                            <input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                            Thanh toán khi nhận hàng (COD)
                        </label>
                        <label className="radio-label">
                            <input type="radio" checked={paymentMethod === 'Transfer'} onChange={() => setPaymentMethod('Transfer')} />
                            Chuyển khoản ngân hàng
                        </label>
                    </div>
                    <div className="summary-total">
                        <span>Tổng cộng:</span>
                        <strong>{total.toLocaleString()} đ</strong>
                    </div>
                    <button type="submit" className="btn-place-order">Đặt hàng ngay</button>
                </div>
            </form>
        </div>
    );
}