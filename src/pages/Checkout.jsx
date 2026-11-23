import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import './Checkout.css';

const LOCATION_API_URL = 'https://provinces.open-api.vn/api/v2/?depth=2';
const VIETQR_CONFIG = {
    bankId: 'ICB', // VietinBank
    accountNo: '107879941718',
    accountName: 'PHUONG GIA KIET',
    template: 'compact2'
};

const isVietnamesePhoneNumber = (phone) => {
    const normalizedPhone = phone.trim().replace(/[\s().-]/g, '');
    return /^(?:0(?:3|5|7|8|9)\d{8}|02\d{8,9}|\+84(?:3|5|7|8|9)\d{8}|\+842\d{8,9})$/.test(normalizedPhone);
};

export default function Checkout({ cartItems, currentUser, onOrderSuccess }) {
    const [formData, setFormData] = useState({
        fullName: currentUser ? currentUser.fullName : '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        streetAddress: '',
        note: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [provinces, setProvinces] = useState([]);
    const [provinceCode, setProvinceCode] = useState('');
    const [wardCode, setWardCode] = useState('');
    const [locationStatus, setLocationStatus] = useState('loading');
    const [locationError, setLocationError] = useState('');
    const [locationAttempt, setLocationAttempt] = useState(0);
    const [phoneTouched, setPhoneTouched] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderError, setOrderError] = useState('');
    const [myVouchers, setMyVouchers] = useState([]);
    const [voucherCode, setVoucherCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [voucherMessage, setVoucherMessage] = useState('');
    const [pendingTransfer, setPendingTransfer] = useState(null);
    const [successInfo, setSuccessInfo] = useState(null);
    const phoneInputRef = useRef(null);

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal > 0 ? 15000 : 0;
    const total = Math.max(0, subtotal + shippingFee - discount);
    const selectedProvince = provinces.find(province => String(province.code) === provinceCode);
    const wards = selectedProvince?.wards ?? [];
    const phoneError = useMemo(() => {
        if (!formData.phone.trim() || isVietnamesePhoneNumber(formData.phone)) return '';
        return 'Vui lòng nhập số điện thoại Việt Nam hợp lệ (ví dụ: 0912 345 678).';
    }, [formData.phone]);

    const handleCloseSuccess = () => {
        setSuccessInfo(null);
        onOrderSuccess();
    };

    // Nhấn Esc để đóng popup
    useEffect(() => {
        if (!successInfo && !pendingTransfer) return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                if (successInfo) handleCloseSuccess();
                else if (pendingTransfer && !isSubmitting) setPendingTransfer(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [successInfo, pendingTransfer, isSubmitting]);

    // Tải voucher còn dùng được trong ví của khách
    useEffect(() => {
        if (!currentUser) return;
        let active = true;
        api.getMyVouchers()
            .then(response => {
                if (!active) return;
                const wallet = Array.isArray(response.data)
                    ? response.data
                    : (response.data?.myWallet || []);
                setMyVouchers(wallet.filter(item => item.status === 'Available'));
            })
            .catch(() => { });
        return () => { active = false; };
    }, [currentUser]);

    // Tính số tiền được giảm mỗi khi đổi voucher hoặc đổi tiền hàng
    useEffect(() => {
        if (!voucherCode) {
            setDiscount(0);
            setVoucherMessage('');
            return;
        }

        const selected = myVouchers.find(item => item.code === voucherCode);
        if (!selected) {
            setDiscount(0);
            setVoucherMessage('');
            return;
        }

        const serverPreviewFn =
            typeof api.previewVoucher === 'function'
                ? api.previewVoucher
                : typeof api.validateVoucher === 'function'
                    ? api.validateVoucher
                    : null;

        if (serverPreviewFn) {
            let active = true;
            serverPreviewFn(voucherCode, subtotal)
                .then(response => {
                    if (!active) return;
                    const data = response?.data ?? response;
                    setDiscount(Number(data?.discount ?? data?.discountAmount) || 0);
                    setVoucherMessage('');
                })
                .catch(error => {
                    if (!active) return;
                    setDiscount(0);
                    setVoucherMessage(error.response?.data?.message || 'Không áp dụng được voucher này.');
                });
            return () => { active = false; };
        }

        const minOrder = Number(selected.minOrderValue) || 0;
        if (subtotal < minOrder) {
            setDiscount(0);
            setVoucherMessage(`Đơn tối thiểu ${minOrder.toLocaleString('vi-VN')} đ để dùng mã này.`);
            return;
        }

        if (selected.endDate && new Date(selected.endDate) < new Date()) {
            setDiscount(0);
            setVoucherMessage('Voucher này đã hết hạn sử dụng.');
            return;
        }

        const rawValue = Number(selected.discountValue) || 0;
        let calcDiscount = selected.discountType === 'Percent'
            ? Math.round((subtotal * rawValue) / 100)
            : rawValue;

        const maxDiscount = Number(selected.maxDiscountAmount ?? selected.maxDiscount) || 0;
        if (maxDiscount > 0) {
            calcDiscount = Math.min(calcDiscount, maxDiscount);
        }

        setDiscount(Math.min(calcDiscount, subtotal));
        setVoucherMessage('');
    }, [voucherCode, subtotal, myVouchers]);

    useEffect(() => {
        const controller = new AbortController();

        const loadLocations = async () => {
            setLocationStatus('loading');
            setLocationError('');

            try {
                const response = await fetch(LOCATION_API_URL, { signal: controller.signal });
                if (!response.ok) {
                    throw new Error(`Không thể tải danh sách địa chỉ (mã lỗi ${response.status}).`);
                }

                const data = await response.json();
                if (!Array.isArray(data) || data.length === 0 || data.some(province => !Array.isArray(province.wards))) {
                    throw new Error('Danh sách địa chỉ hiện không khả dụng.');
                }

                setProvinces(data);
                setLocationStatus('ready');
            } catch (error) {
                if (error.name === 'AbortError') return;
                setLocationError(error.message || 'Không thể tải danh sách địa chỉ. Vui lòng thử lại.');
                setLocationStatus('error');
            }
        };

        loadLocations();
        return () => controller.abort();
    }, [locationAttempt]);

    const updateFormField = (field, value) => {
        setFormData(previous => ({ ...previous, [field]: value }));
    };

    const handlePhoneChange = (event) => {
        const value = event.target.value;
        updateFormField('phone', value);
        event.target.setCustomValidity('');
    };

    const submitOrderToServer = async (orderPayload) => {
        setIsSubmitting(true);
        setOrderError('');
        try {
            const response = await api.createOrder(orderPayload);
            const result = response?.data ?? response;

            setPendingTransfer(null);
            setSuccessInfo({
                orderId: result?.orderId,
                email: formData.email.trim(),
                emailSent: Boolean(result?.emailSent),
                total: orderPayload.totalPrice,
                paymentMethod: orderPayload.paymentMethod
            });
        } catch (error) {
            setOrderError(error.response?.data?.message || error.message || 'Không thể đặt hàng. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitOrder = async (event) => {
        event.preventDefault();
        setOrderError('');

        const form = event.currentTarget;
        const requiredTextFields = ['fullName', 'streetAddress'];
        let hasInvalidText = false;

        requiredTextFields.forEach(field => {
            const input = form.elements.namedItem(field);
            const isEmpty = !formData[field].trim();
            input?.setCustomValidity(isEmpty ? 'Vui lòng điền thông tin này.' : '');
            hasInvalidText ||= isEmpty;
        });

        const normalizedPhone = formData.phone.trim();
        const invalidPhone = !isVietnamesePhoneNumber(normalizedPhone);
        phoneInputRef.current.setCustomValidity(
            invalidPhone ? 'Vui lòng nhập số điện thoại Việt Nam hợp lệ.' : ''
        );

        const isFormValid = form.reportValidity();
        if (hasInvalidText || invalidPhone || !isFormValid) {
            setPhoneTouched(true);
            return;
        }

        const orderData = {
            userId: currentUser ? currentUser.id : 1,
            recipientName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: normalizedPhone,
            shippingAddress: [
                formData.streetAddress.trim(),
                wards.find(ward => String(ward.code) === wardCode)?.name,
                selectedProvince?.name
            ].filter(Boolean).join(', '),
            note: formData.note.trim(),
            paymentMethod,
            shippingFee,
            voucherCode: voucherCode && !voucherMessage ? voucherCode : null,
            totalPrice: total,
            items: cartItems.map(item => ({
                productId: item.id,
                variantId: item.variantId ?? null,
                quantity: item.quantity,
                price: item.price
            }))
        };

        // Nếu chọn Chuyển khoản -> Mở popup QR trước, chưa gọi API tạo đơn
        if (paymentMethod === 'Transfer') {
            const transferRef = `VN${Date.now().toString().slice(-6)}`;
            setPendingTransfer({
                transferRef,
                transferContent: `THANH TOAN ${transferRef}`,
                total,
                orderData: {
                    ...orderData,
                    note: [orderData.note, `[Ma CK: ${transferRef}]`].filter(Boolean).join(' - ')
                }
            });
            return;
        }

        // Nếu chọn COD -> Lưu đơn trực tiếp
        await submitOrderToServer(orderData);
    };

    const handleConfirmTransferPaid = async () => {
        if (!pendingTransfer) return;
        await submitOrderToServer(pendingTransfer.orderData);
    };

    return (
        <div className="checkout-page">
            <header className="checkout-header">
                <div className="checkout-eyebrow">VEGETABLE · THANH TOÁN AN TOÀN</div>
                <h2>Hoàn tất đơn hàng</h2>
                <p>Chỉ còn một bước để những sản phẩm tươi ngon được giao đến bạn.</p>
                <div className="checkout-steps" aria-label="Tiến trình đặt hàng">
                    <span className="checkout-step checkout-step--complete"><span>✓</span> Giỏ hàng</span>
                    <span className="checkout-step-line" aria-hidden="true" />
                    <span className="checkout-step checkout-step--active"><span>2</span> Giao hàng & thanh toán</span>
                    <span className="checkout-step-line" aria-hidden="true" />
                    <span className="checkout-step"><span>3</span> Hoàn tất</span>
                </div>
            </header>

            <form onSubmit={handleSubmitOrder} className="checkout-layout" noValidate>
                <section className="checkout-form" aria-labelledby="delivery-heading">
                    <div className="checkout-section-heading">
                        <span className="checkout-section-icon" aria-hidden="true">01</span>
                        <div>
                            <h3 id="delivery-heading">Thông tin nhận hàng</h3>
                            <p>Các thông tin có dấu <span className="checkout-required-mark">*</span> là bắt buộc</p>
                        </div>
                    </div>

                    <div className="checkout-field">
                        <label htmlFor="checkout-full-name">Họ và tên <span className="checkout-required-mark">*</span></label>
                        <input
                            id="checkout-full-name"
                            name="fullName"
                            type="text"
                            autoComplete="name"
                            required
                            maxLength={100}
                            value={formData.fullName}
                            onChange={event => updateFormField('fullName', event.target.value)}
                            placeholder="Ví dụ: Nguyễn Minh Anh"
                        />
                    </div>

                    <div className="checkout-field">
                        <label htmlFor="checkout-phone">Số điện thoại <span className="checkout-required-mark">*</span></label>
                        <input
                            ref={phoneInputRef}
                            id="checkout-phone"
                            name="phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            required
                            maxLength={20}
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            onBlur={() => setPhoneTouched(true)}
                            aria-invalid={Boolean(phoneTouched && phoneError)}
                            aria-describedby="checkout-phone-hint"
                            placeholder="0912 345 678"
                        />
                        <span
                            id="checkout-phone-hint"
                            className={phoneTouched && phoneError ? 'checkout-field-hint checkout-field-hint--error' : 'checkout-field-hint'}
                            aria-live="polite"
                        >
                            {phoneTouched && phoneError ? phoneError : 'Nhập số di động hoặc số bàn tại Việt Nam.'}
                        </span>
                    </div>

                    <div className="checkout-address-block">
                        <div className="checkout-subheading">
                            <h4>Địa chỉ giao hàng</h4>
                            <span>Danh mục hành chính hiện hành</span>
                        </div>

                        {locationStatus === 'loading' && (
                            <div className="checkout-location-message" role="status">
                                <span className="checkout-spinner" aria-hidden="true" />
                                Đang tải danh sách tỉnh/thành phố...
                            </div>
                        )}

                        {locationStatus === 'error' && (
                            <div className="checkout-location-error" role="alert">
                                <span>{locationError}</span>
                                <button type="button" onClick={() => setLocationAttempt(attempt => attempt + 1)}>
                                    Thử tải lại
                                </button>
                            </div>
                        )}

                        <div className="checkout-location-grid">
                            <div className="checkout-field">
                                <label htmlFor="checkout-province">Tỉnh / thành phố <span className="checkout-required-mark">*</span></label>
                                <select
                                    id="checkout-province"
                                    name="province"
                                    required
                                    disabled={locationStatus !== 'ready'}
                                    value={provinceCode}
                                    onChange={event => {
                                        setProvinceCode(event.target.value);
                                        setWardCode('');
                                    }}
                                >
                                    <option value="">Chọn tỉnh / thành phố</option>
                                    {provinces.map(province => (
                                        <option key={province.code} value={province.code}>{province.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="checkout-field">
                                <label htmlFor="checkout-ward">Phường / xã <span className="checkout-required-mark">*</span></label>
                                <select
                                    id="checkout-ward"
                                    name="ward"
                                    required
                                    disabled={!provinceCode}
                                    value={wardCode}
                                    onChange={event => setWardCode(event.target.value)}
                                >
                                    <option value="">Chọn phường / xã</option>
                                    {wards.map(ward => (
                                        <option key={ward.code} value={ward.code}>{ward.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="checkout-field">
                            <label htmlFor="checkout-street-address">Số nhà, tên đường <span className="checkout-required-mark">*</span></label>
                            <input
                                id="checkout-street-address"
                                name="streetAddress"
                                type="text"
                                autoComplete="street-address"
                                required
                                maxLength={200}
                                value={formData.streetAddress}
                                onChange={event => updateFormField('streetAddress', event.target.value)}
                                placeholder="Ví dụ: 12 Nguyễn Huệ"
                            />
                        </div>
                    </div>

                    <div className="checkout-field checkout-note-field">
                        <label htmlFor="checkout-note">Ghi chú <span className="checkout-optional">(không bắt buộc)</span></label>
                        <textarea
                            id="checkout-note"
                            name="note"
                            rows="3"
                            maxLength={500}
                            value={formData.note}
                            onChange={event => updateFormField('note', event.target.value)}
                            placeholder="Thời gian nhận hàng, hướng dẫn giao hàng..."
                        />
                    </div>
                </section>

                <aside className="checkout-summary" aria-labelledby="summary-heading">
                    <div className="checkout-section-heading checkout-summary-heading">
                        <span className="checkout-section-icon" aria-hidden="true">02</span>
                        <div>
                            <h3 id="summary-heading">Đơn hàng của bạn</h3>
                            <p>{cartItems.length} sản phẩm trong giỏ hàng</p>
                        </div>
                    </div>

                    <div className="mini-items">
                        {cartItems.map(item => (
                            <div key={item.cartKey ?? `${item.id}:${item.variantId ?? 0}`} className="mini-item">
                                <span className="mini-item-name">{item.name}{item.variantName ? ` (${item.variantName})` : ''}<small> x {item.quantity}</small></span>
                                <strong>{(item.price * item.quantity).toLocaleString()} đ</strong>
                            </div>
                        ))}
                    </div>

                    <div className="checkout-costs">
                        <div className="checkout-cost-row">
                            <span>Tạm tính</span>
                            <strong>{subtotal.toLocaleString()} đ</strong>
                        </div>
                        <div className="checkout-cost-row">
                            <span>Phí giao hàng</span>
                            <strong>{shippingFee.toLocaleString()} đ</strong>
                        </div>
                        {discount > 0 && (
                            <div className="checkout-cost-row checkout-cost-row--discount">
                                <span>Giảm giá ({voucherCode})</span>
                                <strong>-{discount.toLocaleString()} đ</strong>
                            </div>
                        )}
                    </div>

                    {currentUser && (
                        <div className="checkout-voucher">
                            <label htmlFor="checkout-voucher-select">Mã giảm giá</label>
                            <select
                                id="checkout-voucher-select"
                                value={voucherCode}
                                onChange={event => setVoucherCode(event.target.value)}
                            >
                                <option value="">
                                    {myVouchers.length === 0 ? 'Chưa có voucher trong ví' : 'Không dùng voucher'}
                                </option>
                                {myVouchers.map(item => (
                                    <option key={item.code} value={item.code}>
                                        {item.code} – {item.title}
                                    </option>
                                ))}
                            </select>
                            {voucherMessage && <small className="checkout-voucher-error">{voucherMessage}</small>}
                        </div>
                    )}

                    <fieldset className="payment-options">
                        <legend>Phương thức thanh toán</legend>
                        <label className={paymentMethod === 'COD' ? 'payment-option payment-option--selected' : 'payment-option'}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="COD"
                                checked={paymentMethod === 'COD'}
                                onChange={() => setPaymentMethod('COD')}
                            />
                            <span className="payment-option-copy">
                                <strong>Thanh toán khi nhận hàng</strong>
                                <small>Tiền mặt (COD)</small>
                            </span>
                            <span className="payment-option-icon" aria-hidden="true">▣</span>
                        </label>
                        <label className={paymentMethod === 'Transfer' ? 'payment-option payment-option--selected' : 'payment-option'}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="Transfer"
                                checked={paymentMethod === 'Transfer'}
                                onChange={() => setPaymentMethod('Transfer')}
                            />
                            <span className="payment-option-copy">
                                <strong>Chuyển khoản ngân hàng</strong>
                                <small>Quét mã QR trước khi hoàn tất đơn</small>
                            </span>
                            <span className="payment-option-icon" aria-hidden="true">↗</span>
                        </label>
                    </fieldset>

                    {paymentMethod === 'Transfer' && (
                        <div className="checkout-qr-notice">
                            <div className="checkout-qr-notice-header">
                                <span>🏦 Thông tin chuyển khoản VietQR</span>
                            </div>
                            <p>Ngân hàng: <strong>VietinBank ({VIETQR_CONFIG.bankId})</strong> · STK: <strong>{VIETQR_CONFIG.accountNo}</strong></p>
                            <p>Chủ tài khoản: <strong>{VIETQR_CONFIG.accountName}</strong></p>
                            <small>Bấm nút bên dưới để mở mã QR thanh toán <strong>{total.toLocaleString()} đ</strong>. Đơn hàng chỉ được tạo sau khi bạn xác nhận đã chuyển khoản.</small>
                        </div>
                    )}

                    <div className="summary-total">
                        <span>Tổng thanh toán</span>
                        <strong>{total.toLocaleString()} đ</strong>
                    </div>

                    {orderError && !pendingTransfer && <div className="checkout-order-error" role="alert">{orderError}</div>}

                    <button type="submit" className="btn-place-order" disabled={isSubmitting || locationStatus !== 'ready'}>
                        {isSubmitting
                            ? 'Đang xử lý đơn hàng...'
                            : paymentMethod === 'Transfer'
                                ? 'Tiếp tục thanh toán QR'
                                : 'Xác nhận đặt hàng'}
                        {!isSubmitting && <span aria-hidden="true">→</span>}
                    </button>
                    <p className="checkout-secure-note"><span aria-hidden="true">✓</span> Thông tin của bạn được bảo mật an toàn</p>
                </aside>
            </form>

            {/* BƯỚC 1 (VỚI CHUYỂN KHOẢN): POPUP QUÉT MÃ QR TRƯỚC KHI TẠO ĐƠN */}
            {pendingTransfer && (
                <div className="order-success-overlay" role="dialog" aria-modal="true" aria-labelledby="order-qr-modal-title">
                    <div className="order-success-modal">
                        <div className="order-qr-badge">CHỜ THANH TOÁN CHUYỂN KHOẢN</div>
                        <h3 id="order-qr-modal-title">Quét mã QR để thanh toán</h3>
                        <p className="order-success-sub">
                            Vui lòng hoàn tất chuyển khoản trước khi bấm <strong>Tôi đã chuyển khoản</strong>
                        </p>

                        <div className="order-qr-box">
                            <div className="order-qr-content">
                                <img
                                    className="order-qr-image"
                                    src={`https://img.vietqr.io/image/${VIETQR_CONFIG.bankId}-${VIETQR_CONFIG.accountNo}-${VIETQR_CONFIG.template}.png?amount=${Math.round(pendingTransfer.total)}&addInfo=${encodeURIComponent(pendingTransfer.transferContent)}&accountName=${encodeURIComponent(VIETQR_CONFIG.accountName)}`}
                                    alt="Mã QR thanh toán VietQR"
                                />
                                <div className="order-qr-details">
                                    <div><span>Ngân hàng:</span> <strong>VietinBank ({VIETQR_CONFIG.bankId})</strong></div>
                                    <div><span>Số tài khoản:</span> <strong>{VIETQR_CONFIG.accountNo}</strong></div>
                                    <div><span>Chủ tài khoản:</span> <strong>{VIETQR_CONFIG.accountName}</strong></div>
                                    <div><span>Số tiền:</span> <strong className="order-qr-amount">{pendingTransfer.total.toLocaleString()} đ</strong></div>
                                    <div><span>Nội dung CK:</span> <strong>{pendingTransfer.transferContent}</strong></div>
                                </div>
                            </div>
                        </div>

                        {orderError && <div className="checkout-order-error" role="alert" style={{ marginBottom: '12px' }}>{orderError}</div>}

                        <div className="order-qr-actions">
                            <button
                                type="button"
                                className="order-qr-cancel-btn"
                                disabled={isSubmitting}
                                onClick={() => {
                                    setOrderError('');
                                    setPendingTransfer(null);
                                }}
                            >
                                Quay lại
                            </button>
                            <button
                                type="button"
                                className="order-success-btn"
                                disabled={isSubmitting}
                                onClick={handleConfirmTransferPaid}
                                autoFocus
                            >
                                {isSubmitting ? 'Đang tạo đơn hàng...' : 'Tôi đã chuyển khoản'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BƯỚC 2: POPUP ĐẶT HÀNG THÀNH CÔNG (SAU KHI ĐÃ TẠO ĐƠN) */}
            {successInfo && (
                <div className="order-success-overlay" role="dialog" aria-modal="true" aria-labelledby="order-success-title">
                    <div className="order-success-modal">
                        <div className="order-success-icon" aria-hidden="true">✓</div>
                        <h3 id="order-success-title">Đặt hàng thành công!</h3>
                        <p className="order-success-sub">
                            {successInfo.paymentMethod === 'Transfer'
                                ? 'Cảm ơn bạn! VEGETABLE đã ghi nhận yêu cầu thanh toán chuyển khoản của bạn 🥬'
                                : 'Cảm ơn bạn đã mua sắm tại VEGETABLE 🥬'}
                        </p>

                        <div className="order-success-details">
                            <div>
                                <span>Mã đơn hàng</span>
                                <strong>#{successInfo.orderId}</strong>
                            </div>
                            <div>
                                <span>Phương thức</span>
                                <strong>{successInfo.paymentMethod === 'Transfer' ? 'Chuyển khoản VietQR' : 'Thanh toán khi nhận hàng (COD)'}</strong>
                            </div>
                            <div>
                                <span>Tổng thanh toán</span>
                                <strong>{successInfo.total.toLocaleString()} đ</strong>
                            </div>
                        </div>

                        {successInfo.email && (
                            <p className={successInfo.emailSent ? 'order-success-mail' : 'order-success-mail order-success-mail--warn'}>
                                {successInfo.emailSent
                                    ? `📧 Email xác nhận đã được gửi đến ${successInfo.email}`
                                    : '⚠️ Chưa gửi được email xác nhận, bạn vẫn có thể xem đơn trong mục đơn hàng.'}
                            </p>
                        )}

                        <button type="button" className="order-success-btn" onClick={handleCloseSuccess} autoFocus>
                            Hoàn tất
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}