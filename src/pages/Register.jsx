import React, { useState } from 'react';
import { api } from '../services/api';
import './Auth.css';

export default function Register({ onSwitchToLogin }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await api.register({ fullName, email, password });
            alert(res.data.message);
            onSwitchToLogin();
        } catch (err) {
            alert(err.response?.data?.message || "Đăng ký thất bại!");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Đăng ký tài khoản</h2>
                <form onSubmit={handleRegister} className="auth-form">
                    <div className="form-group">
                        <label>Họ và tên</label>
                        <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nhập họ tên..." />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Nhập email..." />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Nhập mật khẩu..." />
                    </div>
                    <button type="submit" className="btn-auth">Đăng ký</button>
                </form>
                <p className="auth-switch">
                    Đã có tài khoản? <span onClick={onSwitchToLogin}>Đăng nhập</span>
                </p>
            </div>
        </div>
    );
}