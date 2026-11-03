import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import './Auth.css';

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const emailInputRef = useRef(null);
    const [isRequestingReset, setIsRequestingReset] = useState(false);
    const [verifiedEmail, setVerifiedEmail] = useState('');
    const [isAdminAccount, setIsAdminAccount] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [emailCheckError, setEmailCheckError] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [adminRecoveryKey, setAdminRecoveryKey] = useState('');
    const [requestId, setRequestId] = useState('');
    const [requestStatus, setRequestStatus] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [resetError, setResetError] = useState('');
    const [isSubmittingReset, setIsSubmittingReset] = useState(false);

    useEffect(() => {
        if (!requestId || requestStatus !== 'Pending') return undefined;

        let active = true;
        const checkStatus = async () => {
            try {
                const response = await api.getPasswordResetRequestStatus(requestId);
                if (!active) return;
                setRequestStatus(response.data.status);
                if (response.data.status === 'Approved') {
                    setResetMessage('Admin đã chấp nhận yêu cầu. Bạn có thể đăng nhập bằng mật khẩu mới.');
                } else if (response.data.status === 'Rejected') {
                    setResetMessage('Admin đã từ chối yêu cầu đổi mật khẩu.');
                }
            } catch (error) {
                if (active) {
                    setResetError(
                        error.response?.data?.message ||
                        'Không thể cập nhật trạng thái yêu cầu. Vui lòng thử lại sau.'
                    );
                }
            }
        };

        checkStatus();
        const intervalId = window.setInterval(checkStatus, 3000);
        return () => {
            active = false;
            window.clearInterval(intervalId);
        };
    }, [requestId, requestStatus]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.login({ email, password });
            alert(res.data.message);
            onLoginSuccess(res.data.user, res.data.token);
        } catch (err) {
            alert(err.response?.data?.message || "Đăng nhập thất bại!");
        }
    };

    const handleStartPasswordReset = async () => {
        const emailInput = emailInputRef.current;
        if (!emailInput?.reportValidity()) return;

        setIsCheckingEmail(true);
        setEmailCheckError('');
        try {
            const normalizedEmail = email.trim();
            const response = await api.checkPasswordResetEligibility(normalizedEmail);
            setVerifiedEmail(normalizedEmail);
            setIsAdminAccount(response.data.requiresAdminRecoveryKey);
            setIsRequestingReset(true);
            setResetMessage('');
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
            const response = await api.createPasswordResetRequest({
                email: verifiedEmail,
                newPassword,
                ...(isAdminAccount ? { adminRecoveryKey } : {})
            });

            if (response.data.status === 'Approved') {
                setRequestStatus('Approved');
                setResetMessage(response.data.message);
            } else if (response.data.requestId) {
                setRequestId(response.data.requestId);
                setRequestStatus(response.data.status);
                setResetMessage(
                    response.data.status === 'Pending'
                        ? 'Yêu cầu đã được gửi đến admin. Trạng thái sẽ tự cập nhật sau khi được xử lý.'
                        : 'Yêu cầu đã được xử lý.'
                );
            } else {
                setResetMessage(
                    'Nếu email thuộc tài khoản hợp lệ, yêu cầu sẽ được gửi đến admin.'
                );
            }
        } catch (err) {
            setResetError(
                err.response?.data?.message ||
                'Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.'
            );
        } finally {
            setIsSubmittingReset(false);
        }
    };

    const showLoginForm = () => {
        setIsRequestingReset(false);
        setEmail(verifiedEmail);
        setVerifiedEmail('');
        setIsAdminAccount(false);
        setRequestId('');
        setRequestStatus('');
        setNewPassword('');
        setConfirmPassword('');
        setAdminRecoveryKey('');
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
                            {isAdminAccount
                                ? 'Nhập mã khôi phục admin và mật khẩu mới.'
                                : 'Nhập mật khẩu mới. Yêu cầu đổi mật khẩu sẽ chờ admin duyệt.'}
                        </p>
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
                                    placeholder="Nhập email..."
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
                            {isAdminAccount && (
                                <div className="form-group">
                                    <label htmlFor="admin-recovery-key">Mã khôi phục admin</label>
                                    <input
                                        id="admin-recovery-key"
                                        type="password"
                                        required
                                        autoComplete="off"
                                        value={adminRecoveryKey}
                                        onChange={e => setAdminRecoveryKey(e.target.value)}
                                        placeholder="Nhập mã khôi phục admin"
                                    />
                                </div>
                            )}
                            {resetMessage && <p className="auth-feedback" role="status">{resetMessage}</p>}
                            {requestStatus === 'Pending' && (
                                <p className="auth-pending">Đang chờ admin xử lý yêu cầu…</p>
                            )}
                            {resetError && <p className="auth-feedback error" role="alert">{resetError}</p>}
                            <button type="submit" className="btn-auth" disabled={isSubmittingReset || requestStatus === 'Pending'}>
                                {isSubmittingReset ? 'Đang gửi...' : 'Gửi yêu cầu'}
                            </button>
                        </form>
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
                                <label htmlFor="login-email">Email</label>
                                <input
                                    id="login-email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    ref={emailInputRef}
                                    value={email}
                                    onChange={e => {
                                        setEmail(e.target.value);
                                        setEmailCheckError('');
                                    }}
                                    placeholder="Nhập email..."
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
