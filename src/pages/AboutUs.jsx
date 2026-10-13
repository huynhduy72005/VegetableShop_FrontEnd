import './AboutUs.css';

const stats = [
  { value: '8+', label: 'năm đồng hành' },
  { value: '12k+', label: 'đơn hàng mỗi năm' },
  { value: '96%', label: 'khách hàng quay lại' },
];

const values = [
  {
    icon: '🌿',
    title: 'Nông sản sạch 100%',
    text: 'Tất cả thực phẩm đều được kiểm tra nguồn gốc, tuân thủ quy trình canh tác an toàn và không dùng hóa chất độc hại.',
  },
  {
    icon: '🚚',
    title: 'Giao hàng nhanh chóng',
    text: 'Hệ thống giao hàng nội thành và khu vực lân cận đảm bảo nguyên vẹn độ tươi ngon từ vườn đến tay khách hàng.',
  },
  {
    icon: '🤝',
    title: 'Đồng hành nông dân',
    text: 'Chúng tôi hợp tác trực tiếp với nhà vườn địa phương để tạo ra chuỗi cung ứng bền vững và minh bạch.',
  },
  {
    icon: '💚',
    title: 'Cam kết sức khỏe',
    text: 'Mỗi bữa ăn của bạn được bắt đầu từ nguồn nguyên liệu an toàn, đầy dinh dưỡng và thân thiện với môi trường.',
  },
];

const journey = [
  {
    step: '01',
    title: 'Chọn lựa nguyên liệu',
    text: 'Lựa chọn giống cây, đất trồng và nguồn nước đạt tiêu chuẩn, ưu tiên các vùng canh tác sạch, an toàn.',
  },
  {
    step: '02',
    title: 'Canh tác theo quy trình',
    text: 'Theo dõi từng giai đoạn trồng trọt, bón phân, tưới tiêu và kiểm soát sâu bệnh bằng cách làm thân thiện với môi trường.',
  },
  {
    step: '03',
    title: 'Thu hoạch và đóng gói',
    text: 'Sau khi thu hoạch, mỗi sản phẩm được kiểm tra chất lượng, đóng gói kín và bảo quản đúng tiêu chuẩn lạnh.',
  },
  {
    step: '04',
    title: 'Giao đến tận nhà',
    text: 'Vận chuyển nhanh chóng trong ngày để khách hàng luôn nhận được rau củ tươi ngon nhất, đúng thời điểm cần dùng.',
  },
];

const gallery = [
  'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?auto=format&fit=crop&q=80&w=800',
];

const AboutUs = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero__content">
          <span className="about-badge">🌱 Câu chuyện thương hiệu</span>
          <h1>Mang nông trại xanh đến từng bữa ăn của gia đình bạn.</h1>
          <p>
            Tại <strong>Vườn Nhà</strong>, chúng tôi tin rằng thực phẩm sạch không chỉ là nguồn dinh dưỡng,
            mà còn là sự chăm sóc, sự tin cậy và niềm yêu thương cho cả gia đình. Mỗi sản phẩm mà chúng tôi mang
            đến đều được lựa chọn cẩn thận từ nguồn trồng trọt an toàn, mang theo sự tươi ngon nguyên bản và giá trị cao.
          </p>

          <div className="about-hero__actions">
            <a href="#story" className="primary-btn">Khám phá câu chuyện</a>
            <a href="mailto:hello@vuonnha.vn" className="secondary-btn">Liên hệ tư vấn</a>
          </div>

          <div className="about-trust">
            {stats.map((item) => (
              <div key={item.label} className="trust-item">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="about-hero__visual">
          <div className="visual-panel">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"
              alt="Rau củ sạch và nông sản tươi" 
            />
          </div>
          <div className="floating-badge">
            <span className="badge-label">Cam kết</span>
            <strong>100% rau củ tươi</strong>
            <small>Thu hoạch mỗi ngày</small>
          </div>
        </div>
      </section>

      <section className="about-stats">
        <div className="section-heading">
          <span className="section-tag">Tại sao chọn Vườn Nhà</span>
          <h2>Chuỗi giá trị thực phẩm sạch, đúng chuẩn và đáng tin cậy.</h2>
        </div>
      </section>

      <section id="story" className="story-section">
        <div className="story-grid">
          <div className="story-card story-card--highlight">
            <span className="section-tag">Sứ mệnh</span>
            <h3>Đưa thực phẩm sạch trở thành phần thiết yếu của mỗi bữa ăn.</h3>
            <p>
              Chúng tôi muốn mỗi gia đình đều có thể truy cập nguồn rau củ, trái cây và thực phẩm tươi ngon từ môi trường an toàn,
              giá trị bền vững và quy trình đáng tin cậy.
            </p>
          </div>

          <div className="story-card">
            <span className="section-tag">Tầm nhìn</span>
            <h3>Trở thành thương hiệu nông sản sạch hàng đầu trong lòng người tiêu dùng Việt Nam.</h3>
            <p>
              Với sự kết nối chặt chẽ giữa nông dân, nhà sản xuất và khách hàng, Vườn Nhà hướng đến xây dựng hệ sinh thái thực phẩm sạch, minh bạch và bền vững.
            </p>
          </div>
        </div>
      </section>

      <section className="value-section">
        <div className="section-heading center">
          <span className="section-tag">Giá trị cốt lõi</span>
          <h2>Những tiêu chuẩn tạo nên sự khác biệt.</h2>
        </div>

        <div className="value-grid">
          {values.map((item) => (
            <div key={item.title} className="value-card">
              <div className="value-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="journey-section">
        <div className="journey-image">
          <img
            src="https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=800"
            alt="Quy trình chăm sóc rau củ"
          />
        </div>

        <div className="journey-content">
          <span className="section-tag">Quy trình khép kín</span>
          <h2>Hành trình từ nông trại tới bàn ăn của bạn.</h2>

          <div className="timeline">
            {journey.map((item) => (
              <div key={item.step} className="timeline-item">
                <span className="timeline-step">{item.step}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gallery-section">
        <div className="section-heading center">
          <span className="section-tag">Không gian Vườn Nhà</span>
          <h2>Thực phẩm sạch sống động ngay trong từng khoảnh khắc.</h2>
        </div>

        <div className="gallery-grid">
          {gallery.map((image, index) => (
            <div key={image + index} className="gallery-item">
              <img src={image} alt={`Hình ảnh nông sản và không gian cửa hàng ${index + 1}`} />
            </div>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <div className="cta-content">
          <span className="section-tag light">Vườn Nhà cam kết</span>
          <h2>Bữa ăn ngon, an toàn và giàu dinh dưỡng luôn bắt đầu từ nguồn gốc rõ ràng.</h2>
        </div>
        <a href="tel:19006868" className="primary-btn dark">Gọi ngay 1900 6868</a>
      </section>
    </div>
  );
};

export default AboutUs;