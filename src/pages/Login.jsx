import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './Auth.css';

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRequestingReset, setIsRequestingReset] = useState(false);
    const [verifiedEmail, setVerifiedEmail] = useState('');
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [emailCheckError, setEmailCheckError] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resendSeconds, setResendSeconds] = useState(0);
    const [isResetComplete, setIsResetComplete] = useState(false);
    const [resetMessage, setResetMessage] = useState('');
    const [resetError, setResetError] = useState('');
    const [isSubmittingReset, setIsSubmittingReset] = useState(false);

    useEffect(() => {
        if (!isRequestingReset || resendSeconds <= 0) return undefined;
        const timeoutId = window.setTimeout(
            () => setResendSeconds(seconds => Math.max(0, seconds - 1)),
            1000
        );
        return () => window.clearTimeout(timeoutId);
    }, [isRequestingReset, resendSeconds]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.login({ login: email.trim(), password });
            alert(res.data.message);
            onLoginSuccess(res.data.user, res.data.token);
        } catch (err) {
            alert(err.response?.data?.message || "Đăng nhập thất bại!");
        }
    };

    const handleStartPasswordReset = async () => {
        const normalizedEmail = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setEmailCheckError('Vui lòng nhập email hợp lệ để khôi phục mật khẩu.');
            return;
        }

        setIsCheckingEmail(true);
        setEmailCheckError('');
        try {
            const response = await api.sendPasswordResetOtp(normalizedEmail);
            setVerifiedEmail(normalizedEmail);
            setIsRequestingReset(true);
            setResendSeconds(60);
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
            setIsResetComplete(false);
            setResetMessage(response.data.message);
            setResetError('');
        } catch (error) {
            setEmailCheckError(
                error.response?.data?.message ||
                'Không kiểm tra được email. Vui lòng thử lại sau.'
            );
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendSeconds > 0 || isCheckingEmail) return;
        setIsCheckingEmail(true);
        setResetError('');
        try {
            const response = await api.sendPasswordResetOtp(verifiedEmail);
            setResetMessage(response.data.message);
            setResendSeconds(60);
        } catch (error) {
            setResetError(
                error.response?.data?.message ||
                'Không thể gửi lại mã OTP. Vui lòng thử lại sau.'
            );
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handlePasswordResetRequest = async (e) => {
        e.preventDefault();
        setResetMessage('');
        setResetError('');

        if (newPassword !== confirmPassword) {
            setResetError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setIsSubmittingReset(true);
        try {
            const response = await api.confirmPasswordReset({
                email: verifiedEmail,
                code: otp.trim(),
                newPassword,
            });
            setIsResetComplete(true);
            setResetMessage(response.data.message);
        } catch (err) {
            setResetError(
                err.response?.data?.message ||
                'Không thể xác minh mã OTP. Vui lòng thử lại sau.'
            );
        } finally {
            setIsSubmittingReset(false);
        }
    };

    const showLoginForm = () => {
        setIsRequestingReset(false);
        setEmail(verifiedEmail);
        setVerifiedEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setResendSeconds(0);
        setIsResetComplete(false);
        setResetMessage('');
        setResetError('');
        setEmailCheckError('');
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {isRequestingReset ? (
                    <>
                        <h2>Quên mật khẩu?</h2>
                        <p className="auth-subtitle">
                            Nhập mã OTP gửi về email để xác minh và đặt lại mật khẩu.
                        </p>
                        {isResetComplete ? (
                            resetMessage && <p className="auth-feedback" role="status">{resetMessage}</p>
                        ) : (
                            <>
                                {resetMessage && <p className="auth-feedback" role="status">{resetMessage}</p>}
                                <form onSubmit={handlePasswordResetRequest} className="auth-form">
                                    <div className="form-group">
                                        <label htmlFor="reset-email">Email tài khoản</label>
                                        <input
                                            id="reset-email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            className="auth-locked-field"
                                            value={verifiedEmail}
                                            readOnly
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reset-otp">Mã OTP</label>
                                        <input
                                            id="reset-otp"
                                            type="text"
                                            required
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            pattern="[0-9]{6}"
                                            maxLength={6}
                                            value={otp}
                                            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="Nhập mã 6 chữ số"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reset-new-password">Mật khẩu mới</label>
                                        <input
                                            id="reset-new-password"
                                            type="password"
                                            required
                                            minLength={8}
                                            autoComplete="new-password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="Ít nhất 8 ký tự"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reset-confirm-password">Xác nhận mật khẩu mới</label>
                                        <input
                                            id="reset-confirm-password"
                                            type="password"
                                            required
                                            minLength={8}
                                            autoComplete="new-password"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Nhập lại mật khẩu mới"
                                        />
                                    </div>
                                    {resetError && <p className="auth-feedback error" role="alert">{resetError}</p>}
                                    <button type="submit" className="btn-auth" disabled={isSubmittingReset}>
                                        {isSubmittingReset ? 'Đang xác minh...' : 'Xác minh OTP và đổi mật khẩu'}
                                    </button>
                                </form>
                                <p className="auth-switch">
                                    <button
                                        type="button"
                                        className="auth-text-button"
                                        onClick={handleResendOtp}
                                        disabled={isCheckingEmail || resendSeconds > 0}
                                    >
                                        {isCheckingEmail
                                            ? 'Đang gửi mã...'
                                            : resendSeconds > 0
                                                ? `Gửi lại mã sau ${resendSeconds}s`
                                                : 'Gửi lại mã OTP'}
                                    </button>
                                </p>
                            </>
                        )}
                        {resetError && isResetComplete && (
                            <p className="auth-feedback error" role="alert">{resetError}</p>
                        )}
                        <p className="auth-switch">
                            <button type="button" className="auth-text-button" onClick={showLoginForm}>
                                Quay lại đăng nhập
                            </button>
                        </p>
                    </>
                ) : (
                    <>
                        <h2>Đăng nhập tài khoản</h2>
                        <form onSubmit={handleLogin} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="login-identifier">Tên đăng nhập hoặc email</label>
                                <input
                                    id="login-identifier"
                                    type="text"
                                    required
                                    autoComplete="username"
                                    value={email}
                                    onChange={e => {
                                        setEmail(e.target.value);
                                        setEmailCheckError('');
                                    }}
                                    placeholder="Nhập tên đăng nhập hoặc email..."
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="login-password">Mật khẩu</label>
                                <input
                                    id="login-password"
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu..."
                                />
                            </div>
                            {emailCheckError && <p className="auth-feedback error" role="alert">{emailCheckError}</p>}
                            <div className="auth-forgot-row">
                                <button
                                    type="button"
                                    className="auth-text-button"
                                    onClick={handleStartPasswordReset}
                                    disabled={isCheckingEmail}
                                >
                                    {isCheckingEmail ? 'Đang kiểm tra email...' : 'Quên mật khẩu?'}
                                </button>
                            </div>
                            <button type="submit" className="btn-auth">Đăng nhập</button>
                        </form>
                        <p className="auth-switch">
                            Chưa có tài khoản? <span onClick={onSwitchToRegister}>Đăng ký ngay</span>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
