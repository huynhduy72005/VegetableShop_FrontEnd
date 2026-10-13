import { useState } from 'react';
import './Promotions.css';

const Promotions = ({ onBrowseProducts }) => {
  const [copyFeedback, setCopyFeedback] = useState('');

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyFeedback(`Đã sao chép mã ${code}`);
    } catch (error) {
      console.error('Không thể sao chép mã khuyến mãi:', error);
      setCopyFeedback(`Không thể sao chép. Vui lòng ghi lại mã ${code}`);
    }

    window.setTimeout(() => setCopyFeedback(''), 3000);
  };

  // Dữ liệu mã giảm giá (Vouchers)
  const vouchers = [
    {
      id: 1,
      code: 'VUONNHA10',
      discount: 'GIẢM 10%',
      condition: 'Đơn hàng tối thiểu từ 150.000đ',
      expiry: 'Hạn dùng: 30/10/2026',
      colorTheme: 'green'
    },
    {
      id: 2,
      code: 'FREESHIP',
      discount: 'MIỄN PHÍ SHIP',
      condition: 'Áp dụng cho mọi đơn hàng nội thành',
      expiry: 'Hạn dùng: 31/10/2026',
      colorTheme: 'orange'
    },
    {
      id: 3,
      code: 'RAUSACH20',
      discount: 'GIẢM 20K',
      condition: 'Đơn hàng mua rau củ quả từ 300.000đ',
      expiry: 'Hạn dùng: 15/11/2026',
      colorTheme: 'green'
    }
  ];

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
            từ Vườn Nhà.
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
        {copyFeedback && (
          <div className="copy-toast" role="status" aria-live="polite">
            <span aria-hidden="true">✓</span> {copyFeedback}
          </div>
        )}

        <section className="promo-section" id="promo-vouchers" aria-labelledby="voucher-title">
          <div className="section-title-box">
            <span className="promo-eyebrow">DÀNH RIÊNG CHO BẠN</span>
            <h2 id="voucher-title">Mã ưu đãi nổi bật</h2>
            <p>Chọn mã phù hợp và nhập tại bước thanh toán để nhận ưu đãi.</p>
          </div>

          <div className="voucher-grid">
            {vouchers.map((v) => (
              <article className={`voucher-card ${v.colorTheme}`} key={v.id}>
                <div className="voucher-left">
                  <span className="voucher-discount-text">{v.discount}</span>
                  <span className="voucher-brand">VƯỜN NHÀ</span>
                </div>
                <div className="voucher-right">
                  <div className="voucher-info">
                    <span className="voucher-code-label">MÃ ƯU ĐÃI</span>
                    <h3><code>{v.code}</code></h3>
                    <p>{v.condition}</p>
                    <span className="voucher-expiry">{v.expiry}</span>
                  </div>
                  <button
                    className="copy-btn"
                    type="button"
                    onClick={() => handleCopyCode(v.code)}
                    aria-label={`Sao chép mã ${v.code}`}
                  >
                    Sao chép mã
                  </button>
                </div>
              </article>
            ))}
          </div>
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
                  <span className="combo-kicker">COMBO VƯỜN NHÀ</span>
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
            <p>Tất cả nông sản tại Vườn Nhà đều được tuyển chọn kỹ lưỡng, giao đến bạn trong trạng thái tươi ngon mỗi ngày.</p>
          </div>
          <button className="promo-footer-button" type="button" onClick={onBrowseProducts}>Ghé cửa hàng <span aria-hidden="true">↗</span></button>
        </aside>
      </div>
    </div>
  );
};

export default Promotions;