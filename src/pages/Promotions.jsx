import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './Promotions.css';

const Promotions = ({ currentUser, onNavigateToLogin, onBrowseProducts }) => {
  const [actionFeedback, setActionFeedback] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const [vouchersError, setVouchersError] = useState('');
  const [voucherRequestId, setVoucherRequestId] = useState(0);
  const [savedCodes, setSavedCodes] = useState(() => new Set());
  const [savingCode, setSavingCode] = useState('');
  const currentUserId = currentUser?.id;

  useEffect(() => {
    let isCurrentRequest = true;

    const loadVouchers = async () => {
      setVouchersLoading(true);
      setVouchersError('');

      try {
        const response = await api.getPublicVouchers();
        if (isCurrentRequest) {
          setVouchers(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Không thể tải danh sách voucher công khai:', error);
        if (isCurrentRequest) {
          setVouchersError('Không tải được ưu đãi. Vui lòng thử lại.');
        }
      } finally {
        if (isCurrentRequest) {
          setVouchersLoading(false);
        }
      }
    };

    loadVouchers();

    return () => {
      isCurrentRequest = false;
    };
  }, [voucherRequestId]);

  useEffect(() => {
    if (!currentUserId) return undefined;

    let isCurrentRequest = true;
    const loadWallet = async () => {
      try {
        const response = await api.getMyVouchers();
        if (isCurrentRequest) {
          const codes = (response.data?.myWallet || [])
            .map((voucher) => voucher.code?.toUpperCase())
            .filter(Boolean);
          setSavedCodes(new Set(codes));
        }
      } catch (error) {
        console.error('Không thể tải Ví Voucher:', error);
      }
    };

    loadWallet();
    return () => {
      isCurrentRequest = false;
    };
  }, [currentUserId]);

  const showActionFeedback = (text, isError = false) => {
    setActionFeedback({ text, isError });
    window.setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      showActionFeedback(`Đã sao chép mã ${code}`);
    } catch (error) {
      console.error('Không thể sao chép mã khuyến mãi:', error);
      showActionFeedback(`Không thể sao chép. Vui lòng ghi lại mã ${code}`, true);
    }
  };

  const handleSaveVoucher = async (voucher) => {
    if (!currentUser) {
      onNavigateToLogin?.();
      return;
    }

    const code = voucher.code.toUpperCase();
    if (savingCode || savedCodes.has(code)) return;

    setSavingCode(code);
    try {
      const response = await api.claimVoucher(voucher.code);
      setSavedCodes((currentCodes) => new Set([...currentCodes, code]));
      showActionFeedback(response.data?.message || `Đã lưu mã ${voucher.code} vào Ví Voucher!`);
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể lưu mã vào Ví Voucher. Vui lòng thử lại.';
      if (message.includes('đã có trong Ví Voucher')) {
        setSavedCodes((currentCodes) => new Set([...currentCodes, code]));
      }
      showActionFeedback(message, true);
    } finally {
      setSavingCode('');
    }
  };

  // Dữ liệu Combo siêu tiết kiệm
  const comboDeals = [
    {
      id: 101,
      name: 'Combo Bếp Xanh Gia Đình',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600',
      oldPrice: '180.000đ',
      newPrice: '135.000đ',
      discountTag: '-25%',
      desc: 'Bao gồm: Cải bó xôi hữu cơ, Cà rốt Đà Lạt, Rau muống sạch và Nấm đùi gà.'
    },
    {
      id: 102,
      name: 'Combo Trái Cây Đề kháng',
      image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=600',
      oldPrice: '250.000đ',
      newPrice: '199.000đ',
      discountTag: '-20%',
      desc: 'Bao gồm: Táo đỏ nhập khẩu, Cam sành mọng nước và Chuối ngự thơm ngon.'
    },
    {
      id: 103,
      name: 'Combo Nấm Sạch & Rau Củ',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600',
      oldPrice: '210.000đ',
      newPrice: '169.000đ',
      discountTag: '-20%',
      desc: 'Bao gồm: Nấm hương tươi, Nấm kim châm, hành lá và khoai tây tươi sạch.'
    }
  ];

  return (
    <div className="promotions-page">
      <section className="promo-hero" aria-labelledby="promo-title">
        <div className="promo-hero-content">
          <span className="promo-badge">Ưu đãi tươi ngon mỗi ngày</span>
          <h1 id="promo-title">Bữa ăn xanh, ưu đãi lành</h1>
          <p>
            Chọn thực phẩm tươi sạch cho gia đình và tận hưởng những ưu đãi dành riêng
            từ VEGETABLE.
          </p>
          <a className="promo-hero-button" href="#promo-vouchers">Khám phá ưu đãi <span aria-hidden="true">↓</span></a>
        </div>
        <div className="promo-hero-art" aria-hidden="true">
          <span className="promo-art-leaf">✳</span>
          <span className="promo-art-discount">ƯU ĐÃI<br /><strong>ĐẾN 25%</strong></span>
          <span className="promo-art-note">Tươi từ vườn<br />Ngon tận bếp</span>
        </div>
      </section>

      <div className="promo-container">
        {actionFeedback && (
          <div
            className={`copy-toast${actionFeedback.isError ? ' is-error' : ''}`}
            role={actionFeedback.isError ? 'alert' : 'status'}
            aria-live="polite"
          >
            <span aria-hidden="true">{actionFeedback.isError ? '!' : '✓'}</span> {actionFeedback.text}
          </div>
        )}

        <section className="promo-section" id="promo-vouchers" aria-labelledby="voucher-title">
          <div className="section-title-box">
            <span className="promo-eyebrow">DÀNH RIÊNG CHO BẠN</span>
            <h2 id="voucher-title">Mã ưu đãi nổi bật</h2>
            <p>Chọn mã phù hợp và nhập tại bước thanh toán để nhận ưu đãi.</p>
          </div>

          {vouchersLoading ? (
            <p className="voucher-state" role="status">Đang tải ưu đãi...</p>
          ) : vouchersError ? (
            <div className="voucher-state" role="alert">
              <p>{vouchersError}</p>
              <button
                className="voucher-retry-btn"
                type="button"
                onClick={() => setVoucherRequestId((requestId) => requestId + 1)}
              >
                Thử lại
              </button>
            </div>
          ) : vouchers.length === 0 ? (
            <p className="voucher-state">Hiện chưa có mã ưu đãi nào đang áp dụng.</p>
          ) : (
            <div className="voucher-grid">
              {vouchers.map((voucher) => {
                const isPercent = voucher.discountType?.toLowerCase() === 'percent';
                const discount = isPercent
                  ? `GIẢM ${voucher.discountValue}%`
                  : `GIẢM ${Number(voucher.discountValue || 0).toLocaleString('vi-VN')}đ`;
                const condition = [
                  voucher.description,
                  Number(voucher.minOrderValue) > 0
                    ? `Đơn tối thiểu ${Number(voucher.minOrderValue).toLocaleString('vi-VN')}đ`
                    : '',
                  Number(voucher.maxDiscountAmount) > 0
                    ? `Giảm tối đa ${Number(voucher.maxDiscountAmount).toLocaleString('vi-VN')}đ`
                    : ''
                ].filter(Boolean).join(' · ');
                const expiry = voucher.endDate
                  ? new Date(voucher.endDate).toLocaleDateString('vi-VN')
                  : '';

                return (
                  <article
                    className={`voucher-card ${isPercent ? 'green' : 'orange'}`}
                    key={voucher.id}
                  >
                    <div className="voucher-left">
                      <span className="voucher-discount-text">{discount}</span>
                      <span className="voucher-brand">VEGETABLE</span>
                    </div>
                    <div className="voucher-right">
                      <div className="voucher-info">
                        <span className="voucher-code-label">MÃ ƯU ĐÃI</span>
                        <h3><code>{voucher.code}</code></h3>
                        {voucher.title && <p className="voucher-title">{voucher.title}</p>}
                        {condition && <p className="voucher-condition">{condition}</p>}
                        {expiry && <span className="voucher-expiry">Hạn dùng: {expiry}</span>}
                      </div>
                      <div className="voucher-actions">
                        <button
                          className="copy-btn"
                          type="button"
                          onClick={() => handleCopyCode(voucher.code)}
                          aria-label={`Sao chép mã ${voucher.code}`}
                        >
                          Sao chép mã
                        </button>
                        <button
                          className="save-voucher-btn"
                          type="button"
                          onClick={() => handleSaveVoucher(voucher)}
                          disabled={Boolean(savingCode) || savedCodes.has(voucher.code.toUpperCase())}
                        >
                          {!currentUser
                            ? 'Đăng nhập để lưu'
                            : savedCodes.has(voucher.code.toUpperCase())
                              ? '✓ Đã lưu vào ví'
                              : savingCode === voucher.code.toUpperCase()
                                ? 'Đang lưu...'
                                : 'Lưu vào ví'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="promo-section" aria-labelledby="combo-title">
          <div className="section-title-box">
            <span className="promo-eyebrow">CHỌN NHANH, TIẾT KIỆM HƠN</span>
            <h2 id="combo-title">Combo tươi ngon cho cả nhà</h2>
            <p>Nông sản tuyển chọn, kết hợp tiện lợi cho những bữa ăn đủ đầy.</p>
          </div>

          <div className="combo-grid">
            {comboDeals.map((combo) => (
              <article className="combo-card" key={combo.id}>
                <div className="combo-img-wrap">
                  <img src={combo.image} alt={combo.name} loading="lazy" />
                  <span className="discount-badge">Tiết kiệm {combo.discountTag}</span>
                </div>
                <div className="combo-content">
                  <span className="combo-kicker">COMBO VEGETABLE</span>
                  <h3>{combo.name}</h3>
                  <p className="combo-desc">{combo.desc}</p>
                  <div className="combo-price-row">
                    <div className="price-box" aria-label={`Giá ưu đãi ${combo.newPrice}, giá gốc ${combo.oldPrice}`}>
                      <span className="new-price">{combo.newPrice}</span>
                      <span className="old-price">{combo.oldPrice}</span>
                    </div>
                    <button className="buy-combo-btn" type="button" onClick={onBrowseProducts}>
                      Khám phá <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="promo-footer-banner">
          <div className="footer-banner-icon" aria-hidden="true">✳</div>
          <div className="footer-banner-content">
            <span className="promo-eyebrow">AN TÂM CHỌN LỰA</span>
            <h2>Tươi sạch từ vườn, trọn vị trong bữa cơm</h2>
            <p>Tất cả nông sản tại VEGETABLE đều được tuyển chọn kỹ lưỡng, giao đến bạn trong trạng thái tươi ngon mỗi ngày.</p>
          </div>
          <button className="promo-footer-button" type="button" onClick={onBrowseProducts}>Ghé cửa hàng <span aria-hidden="true">↗</span></button>
        </aside>
      </div>
    </div>
  );
};

export default Promotions;