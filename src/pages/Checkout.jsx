import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import './Checkout.css';

const LOCATION_API_URL = 'https://provinces.open-api.vn/api/v2/?depth=2';

const isVietnamesePhoneNumber = (phone) => {
    const normalizedPhone = phone.trim().replace(/[\s().-]/g, '');
    return /^(?:0(?:3|5|7|8|9)\d{8}|02\d{8,9}|\+84(?:3|5|7|8|9)\d{8}|\+842\d{8,9})$/.test(normalizedPhone);
};

export default function Checkout({ cartItems, currentUser, onOrderSuccess }) {
    const [formData, setFormData] = useState({
        fullName: currentUser ? currentUser.fullName : '',
        phone: '',
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
    const phoneInputRef = useRef(null);

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal > 0 ? 15000 : 0;
    const total = subtotal + shippingFee;
    const selectedProvince = provinces.find(province => String(province.code) === provinceCode);
    const wards = selectedProvince?.wards ?? [];
    const phoneError = useMemo(() => {
        if (!formData.phone.trim() || isVietnamesePhoneNumber(formData.phone)) return '';
        return 'Vui lòng nhập số điện thoại Việt Nam hợp lệ (ví dụ: 0912 345 678).';
    }, [formData.phone]);

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

    const handleSubmitOrder = async (event) => {
        event.preventDefault();
        setOrderError('');

        const form = event.currentTarget;
        const requiredTextFields = ['fullName', 'streetAddress'];
        let hasInvalidText = false;

        requiredTextFields.forEach(field => {
            const input = form.elements.namedItem(field);
            const isEmpty = !formData[field].trim();
            input.setCustomValidity(isEmpty ? 'Vui lòng điền thông tin này.' : '');
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
            phone: normalizedPhone,
            shippingAddress: [
                formData.streetAddress.trim(),
                wards.find(ward => String(ward.code) === wardCode)?.name,
                selectedProvince?.name
            ].filter(Boolean).join(', '),
            note: formData.note.trim(),
            paymentMethod,
            shippingFee,
            totalPrice: total,
            items: cartItems.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price
            }))
        };

        setIsSubmitting(true);
        try {
            await api.createOrder(orderData);
            alert('🎉 Đặt hàng thành công! Đơn hàng đã được ghi nhận.');
            onOrderSuccess();
        } catch (error) {
            setOrderError(error.response?.data?.message || error.message || 'Không thể đặt hàng. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="checkout-page">
            <header className="checkout-header">
                <div className="checkout-eyebrow">VƯỜN NHÀ · THANH TOÁN AN TOÀN</div>
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
                            <div key={item.id} className="mini-item">
                                <span className="mini-item-name">{item.name}<small> x {item.quantity}</small></span>
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
                    </div>

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
                                <small>Thanh toán trực tuyến</small>
                            </span>
                            <span className="payment-option-icon" aria-hidden="true">↗</span>
                        </label>
                    </fieldset>

                    <div className="summary-total">
                        <span>Tổng thanh toán</span>
                        <strong>{total.toLocaleString()} đ</strong>
                    </div>

                    {orderError && <div className="checkout-order-error" role="alert">{orderError}</div>}

                    <button type="submit" className="btn-place-order" disabled={isSubmitting || locationStatus !== 'ready'}>
                        {isSubmitting ? 'Đang xử lý đơn hàng...' : 'Xác nhận đặt hàng'}
                        {!isSubmitting && <span aria-hidden="true">→</span>}
                    </button>
                    <p className="checkout-secure-note"><span aria-hidden="true">✓</span> Thông tin của bạn được bảo mật an toàn</p>
                </aside>
            </form>
        </div>
    );
}
