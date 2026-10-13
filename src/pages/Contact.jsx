import { useState } from 'react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: 'Hỏi về sản phẩm',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', text: '' });

    try {
      // Thay URL cổng chạy Backend của bạn (ví dụ https://localhost:7179/api/contact)
      const response = await fetch('https://localhost:7179/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          text: '🎉 Cảm ơn bạn! Tin nhắn đã được gửi thành công đến hòm thư của Vườn Nhà.'
        });
        setFormData({ fullName: '', email: '', phone: '', subject: 'Hỏi về sản phẩm', message: '' });
      } else {
        setStatus({
          type: 'error',
          text: `❌ Có lỗi xảy ra: ${data.message || 'Không thể gửi tin nhắn.'}`
        });
      }
    } catch (error) {
      console.error('Error sending contact:', error);
      setStatus({
        type: 'error',
        text: '❌ Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại server!'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero" aria-labelledby="contact-title">
        <div className="contact-hero-content">
          <span className="contact-badge">Đội ngũ Vườn Nhà luôn sẵn sàng hỗ trợ</span>
          <h1 id="contact-title">Chúng tôi luôn lắng nghe bạn</h1>
          <p>Cần hỗ trợ về đơn hàng, nông sản hay hợp tác? Hãy chọn cách liên hệ thuận tiện nhất hoặc gửi lời nhắn cho chúng tôi.</p>
        </div>
        <div className="contact-hero-note" aria-hidden="true">
          <span>🌿</span>
          <strong>Tươi ngon từ vườn,<br /> tận tâm từ trái tim.</strong>
        </div>
      </section>

      <div className="contact-container">
        <div className="contact-wrapper">
          <div className="contact-info-card">
            <span className="contact-eyebrow">KẾT NỐI VỚI VƯỜN NHÀ</span>
            <h2>Chúng tôi ở đây để giúp bạn</h2>
            <p className="info-desc">Liên hệ trực tiếp hoặc ghé thăm cửa hàng trong giờ hoạt động.</p>

            <div className="info-item">
              <div className="info-icon" aria-hidden="true">📍</div>
              <div>
                <h4>Địa chỉ cửa hàng</h4>
                <p>123 Đường Nông Sản Xanh, Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon" aria-hidden="true">📞</div>
              <div>
                <h4>Hotline đặt hàng</h4>
                <p><a href="tel:19006868"><strong>1900 6868</strong></a> (8:00 - 21:00)</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon" aria-hidden="true">✉️</div>
              <div>
                <h4>Email cửa hàng</h4>
                <p><a href="mailto:hotro@vuonnha.com.vn">hotro@vuonnha.com.vn</a></p>
              </div>
            </div>
            <div className="contact-response-note">
              <span aria-hidden="true">✳</span>
              <p>Đội ngũ hỗ trợ sẽ phản hồi bạn sớm nhất trong giờ làm việc.</p>
            </div>
          </div>

          <div className="contact-form-card">
            <span className="contact-eyebrow">CHÚNG TÔI SẼ PHẢN HỒI SỚM</span>
            <h2>Gửi lời nhắn cho chúng tôi</h2>
            <p className="form-desc">Vui lòng để lại thông tin và nội dung cần hỗ trợ. Các trường có dấu * là bắt buộc.</p>

            {status.text && (
              <div className={`status-alert ${status.type}`} role="status" aria-live="polite">
                {status.text}
              </div>
            )}

            <form onSubmit={handleSubmit} aria-busy={loading}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contact-full-name">Họ và tên <span>*</span></label>
                  <input 
                    type="text" 
                    id="contact-full-name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A" 
                    autoComplete="name"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-phone">Số điện thoại <span>*</span></label>
                  <input 
                    type="tel" 
                    id="contact-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0901 234 567" 
                    autoComplete="tel"
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contact-email">Địa chỉ Email <span>*</span></label>
                  <input 
                    type="email" 
                    id="contact-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@gmail.com" 
                    autoComplete="email"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-subject">Chủ đề liên hệ</label>
                  <select id="contact-subject" name="subject" value={formData.subject} onChange={handleChange}>
                    <option value="Hỏi về sản phẩm">Hỏi về sản phẩm/rau củ</option>
                    <option value="Kiểm tra đơn hàng">Kiểm tra trạng thái đơn hàng</option>
                    <option value="Góp ý dịch vụ">Góp ý chất lượng dịch vụ</option>
                    <option value="Hợp tác kinh doanh">Hợp tác cung cấp nông sản</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="contact-message">Nội dung tin nhắn <span>*</span></label>
                <textarea 
                  id="contact-message"
                  name="message"
                  rows="4" 
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Nhập nội dung bạn cần hỗ trợ chi tiết..." 
                  required
                ></textarea>
              </div>

              <button type="submit" className="send-btn" disabled={loading}>
                {loading ? 'Đang gửi tin nhắn...' : 'Gửi tin nhắn'}
                {!loading && <span aria-hidden="true">↗</span>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;