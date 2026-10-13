import { useState } from 'react';
import './KitchenTips.css';

const categories = [
  { key: 'all', label: 'Tất cả mẹo hay' },
  { key: 'storage', label: 'Bảo quản thực phẩm' },
  { key: 'prep', label: 'Sơ chế & làm sạch' },
  { key: 'nutrition', label: 'Dinh dưỡng' },
  { key: 'cooking', label: 'Món ngon mỗi ngày' },
];

const tipsData = [
  {
    id: 1,
    category: 'storage',
    title: 'Cách bảo quản rau xanh tươi lâu mà không bị úng và thối',
    excerpt: 'Rửa sạch rau, để khô hoàn toàn rồi cho vào túi có lỗ thoáng hoặc hộp có khăn giấy, giúp giữ độ giòn lâu hơn.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800',
    time: '3 phút đọc',
    tag: 'Bảo quản rau' 
  },
  {
    id: 2,
    category: 'prep',
    title: 'Mẹo làm sạch rau củ an toàn, sạch sâu và vẫn giữ được hương vị tự nhiên',
    excerpt: 'Ngâm rau trong nước muối pha loãng 10 phút rồi xả lại với nước lạnh, giúp loại bỏ bụi bẩn và dư lượng tốt hơn.',
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800',
    time: '5 phút đọc',
    tag: 'Sơ chế' 
  },
  {
    id: 3,
    category: 'storage',
    title: 'Bí quyết giữ khoai tây, hành tây và tỏi không bị mọc mầm',
    excerpt: 'Bảo quản ở nơi thoáng mát, khô ráo, tránh ánh nắng trực tiếp và không cất cùng các loại củ ẩm, dễ hư.',
    image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&q=80&w=800',
    time: '4 phút đọc',
    tag: 'Mẹo vặt' 
  },
  {
    id: 4,
    category: 'nutrition',
    title: 'Chọn trái cây ngọt, chắc và mang lại nhiều dưỡng chất cho gia đình',
    excerpt: 'Hãy nhấn nhẹ vào vỏ, kiểm tra phần cuống và cảm giác nặng tay để chọn được loại đúng mùa, ngọt và mọng nước.',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=800',
    time: '6 phút đọc',
    tag: 'Dinh dưỡng' 
  },
  {
    id: 5,
    category: 'cooking',
    title: 'Giữ màu xanh mướt cho rau luộc và nguyên liệu nấu ăn không bị xỉn màu',
    excerpt: 'Sau khi luộc, cho rau vào nước đá rồi để ráo để màu sắc giữ nguyên và vị giòn vẫn tuyệt vời.',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800',
    time: '3 phút đọc',
    tag: 'Hướng dẫn nấu' 
  },
  {
    id: 6,
    category: 'storage',
    title: 'Cách cấp đông nấm tươi lâu mà vẫn giữ nguyên độ giòn và hương vị',
    excerpt: 'Ngoài việc chần sơ, hãy để nấm nguội hẳn trước khi cho vào hộp và cất trong ngăn đông để tránh bị nhão.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
    time: '4 phút đọc',
    tag: 'Bảo quản' 
  },
];

const featureCards = [
  { icon: '🥬', title: 'Bảo quản đúng cách', text: 'Rau củ luôn giữ độ tươi, giòn và đẹp mắt hơn.' },
  { icon: '🧴', title: 'Làm sạch an toàn', text: 'Loại bỏ bụi, côn trùng và chất dư lượng hiệu quả.' },
  { icon: '🍽️', title: 'Nấu ăn tinh tế', text: 'Tạo món ngon nhưng vẫn giữ hương vị nguyên bản.' },
];

const KitchenTips = () => {
  const [activeTab, setActiveTab] = useState('all');

  const filteredTips = activeTab === 'all'
    ? tipsData
    : tipsData.filter(item => item.category === activeTab);

  return (
    <div className="kitchen-tips-page">
      <section className="tips-hero">
        <div className="tips-hero__content">
          <span className="tips-badge">🍳 Góc nội trợ thông thái</span>
          <h1>Mẹo hay nhà bếp cho bữa ăn ngon, khỏe và tiết kiệm.</h1>
          <p>
            Những bí quyết thực tế giúp bạn chọn đúng nguyên liệu, sơ chế an toàn và chế biến món ăn
            ngon hơn mỗi ngày từ nguồn thực phẩm sạch của Vườn Nhà.
          </p>

          <div className="tips-hero__stats">
            <div>
              <strong>1.200+</strong>
              <span>mẹo đã chia sẻ</span>
            </div>
            <div>
              <strong>4.8/5</strong>
              <span>đánh giá người dùng</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>thực phẩm an toàn</span>
            </div>
          </div>
        </div>
      </section>

      <div className="tips-container">
        <section className="feature-strip">
          {featureCards.map((card) => (
            <div key={card.title} className="feature-card">
              <div className="feature-icon">{card.icon}</div>
              <div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="tips-filter">
          <div className="section-header">
            <span className="section-tag">Bí quyết thực tế</span>
            <h2>Khám phá những mẹo hữu ích ngay hôm nay</h2>
          </div>

          <div className="filter-tabs">
            {categories.map((category) => (
              <button
                key={category.key}
                className={activeTab === category.key ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setActiveTab(category.key)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </section>

        <section className="tips-grid">
          {filteredTips.map((tip) => (
            <article key={tip.id} className="tip-card">
              <div className="tip-image-wrapper">
                <img src={tip.image} alt={tip.title} />
                <span className="tip-category-tag">{tip.tag}</span>
              </div>

              <div className="tip-content">
                <div className="tip-meta">
                  <span>⏱ {tip.time}</span>
                </div>
                <h3>{tip.title}</h3>
                <p>{tip.excerpt}</p>
                <button className="read-more-btn" type="button">Đọc tiếp →</button>
              </div>
            </article>
          ))}
        </section>

        <section className="tips-highlight">
          <div className="highlight-icon">💡</div>
          <div className="highlight-copy">
            <span className="section-tag light">Mẹo nổi bật</span>
            <h3>Ngâm tỏi trong nước ấm 5 phút trước khi bóc vỏ</h3>
            <p>
              Cách này giúp lớp vỏ bong dễ hơn, tỏi không bị bở và giữ được hương thơm nguyên bản khi nấu ăn.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default KitchenTips;