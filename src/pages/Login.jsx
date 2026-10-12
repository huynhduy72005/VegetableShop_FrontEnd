import React, { useState } from 'react';
import { api } from '../services/api';
import './Auth.css';

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.login({ email, password });
            alert(res.data.message);
            onLoginSuccess(res.data.user);
        } catch (err) {
            alert(err.response?.data?.message || "Đăng nhập thất bại!");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Đăng nhập tài khoản</h2>
                <form onSubmit={handleLogin} className="auth-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Nhập email..." />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Nhập mật khẩu..." />
                    </div>
                    <button type="submit" className="btn-auth">Đăng nhập</button>
                </form>
                <p className="auth-switch">
                    Chưa có tài khoản? <span onClick={onSwitchToRegister}>Đăng ký ngay</span>
                </p>
            </div>
        </div>
    );
}