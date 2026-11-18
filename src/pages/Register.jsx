import { useState } from 'react';
import { api } from '../services/api';
import './Auth.css';

const getRegistrationErrorMessage = (error) => {
    const response = error.response;
    const data = response?.data;
    const message = data?.message;

    if (typeof message === 'string' && /email.*đã được đăng ký/i.test(message)) {
        return 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng một email khác.';
    }

    if (typeof message === 'string' && message.trim()) {
        return message;
    }

    const firstValidationEntry = Object.entries(data?.errors || {}).find(
        ([, messages]) => Array.isArray(messages) &&
            messages.some((item) => typeof item === 'string' && item.trim())
    );
    if (firstValidationEntry) {
        const [field, messages] = firstValidationEntry;
        const firstValidationError = messages.find(
            (item) => typeof item === 'string' && item.trim()
        );
        if (/email/i.test(field) || /email/i.test(firstValidationError)) {
            return 'Email chưa hợp lệ. Hãy kiểm tra lại địa chỉ email.';
        }
        if (/password|mật khẩu/i.test(field) || /password|mật khẩu/i.test(firstValidationError)) {
            return 'Mật khẩu cần có ít nhất 8 ký tự.';
        }
        if (/fullname|name/i.test(field)) {
            return 'Vui lòng nhập họ và tên (tối đa 100 ký tự).';
        }
        return 'Thông tin đăng ký chưa hợp lệ. Hãy kiểm tra lại các mục đã nhập.';
    }

    if (!response) {
        return 'Không thể kết nối đến máy chủ. Hãy kiểm tra mạng và thử đăng ký lại.';
    }
    if (response.status === 409) {
        return 'Email này đã được sử dụng. Hãy đăng nhập hoặc dùng một email khác.';
    }
    if (response.status === 429) {
        return 'Bạn gửi yêu cầu quá nhanh. Vui lòng đợi một chút rồi thử lại.';
    }
    if (response.status >= 500) {
        return 'Máy chủ đang gặp sự cố. Thông tin chưa được xác nhận, vui lòng thử lại sau.';
    }
    if (response.status === 400) {
        return 'Thông tin đăng ký chưa hợp lệ. Hãy kiểm tra email và đảm bảo mật khẩu có ít nhất 8 ký tự.';
    }

    return 'Đăng ký chưa thành công. Hãy kiểm tra thông tin và thử lại.';
};

export default function Register({ onSwitchToLogin }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const trimmedName = fullName.trim();
        const trimmedEmail = email.trim();
        if (!trimmedName) {
            setErrorMessage('Vui lòng nhập họ và tên.');
            return;
        }
        if (trimmedName.length > 100) {
            setErrorMessage('Họ và tên không được vượt quá 100 ký tự.');
            return;
        }
        if (!trimmedEmail) {
            setErrorMessage('Vui lòng nhập email.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setErrorMessage('Email chưa đúng định dạng. Ví dụ: ban@email.com.');
            return;
        }
        if (trimmedEmail.length > 254) {
            setErrorMessage('Email không được vượt quá 254 ký tự.');
            return;
        }
        if (!password) {
            setErrorMessage('Vui lòng nhập mật khẩu.');
            return;
        }
        if (password.length < 8) {
            setErrorMessage('Mật khẩu cần có ít nhất 8 ký tự. Hãy bổ sung thêm ký tự rồi thử lại.');
            return;
        }

        setErrorMessage('');
        setIsSubmitting(true);
        try {
            const res = await api.register({
                fullName: trimmedName,
                email: trimmedEmail,
                password
            });
            alert(res.data.message);
            onSwitchToLogin();
        } catch (err) {
            setErrorMessage(getRegistrationErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Đăng ký tài khoản</h2>
                <form onSubmit={handleRegister} className="auth-form" noValidate>
                    <div className="form-group">
                        <label>Họ và tên</label>
                        <input type="text" required maxLength={100} value={fullName} onChange={e => {
                            setFullName(e.target.value);
                            setErrorMessage('');
                        }} placeholder="Nhập họ tên..." />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" required maxLength={254} value={email} onChange={e => {
                            setEmail(e.target.value);
                            setErrorMessage('');
                        }} placeholder="Nhập email..." />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input type="password" required minLength={8} value={password} onChange={e => {
                            setPassword(e.target.value);
                            setErrorMessage('');
                        }} placeholder="Nhập mật khẩu..." />
                        <small className="auth-hint">Mật khẩu cần có ít nhất 8 ký tự.</small>
                    </div>
                    {errorMessage && <p className="auth-feedback error" role="alert">{errorMessage}</p>}
                    <button type="submit" className="btn-auth" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
                    </button>
                </form>
                <p className="auth-switch">
                    Đã có tài khoản? <span onClick={onSwitchToLogin}>Đăng nhập</span>
                </p>
            </div>
        </div>
    );
}