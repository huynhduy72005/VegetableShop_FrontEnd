import { useState } from 'react';
import './Reviews.css';

const Reviews = () => {
  // Trạng thái bộ lọc theo số sao
  const [filterStar, setFilterStar] = useState('all');

  // Trạng thái modal hoặc form gửi đánh giá mới
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: '5', comment: '', product: 'Rau xanh hữu cơ' });
  const [successMsg, setSuccessMsg] = useState(false);

  // Danh sách đánh giá mẫu
  const [reviewsData, setReviewsData] = useState([
    {
      id: 1,
      name: 'Chị Nguyễn Thị Lan',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      date: '12/10/2026',
      productName: 'Combo Bếp Xanh Gia Đình',
      comment: 'Rau giao đến vẫn còn tươi nguyên giọt sương, đóng gói sạch sẽ và gọn gàng. Nấu canh ngọt nước lắm, cả nhà mình ai cũng khen. Sẽ ủng hộ shop dài dài!',
      verified: true
    },
    {
      id: 2,
      name: 'Anh Trần Minh Hoàng',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      date: '10/10/2026',
      productName: 'Táo đỏ nhập khẩu & Trái cây',
      comment: 'Trái cây giòn, ngọt và rất tươi. Đặt hàng chiều hôm trước thì sáng hôm sau nhận được luôn. Nhân viên giao hàng thân thiện.',
      verified: true
    },
    {
      id: 3,
      name: 'Chị Lê Hoài Thương',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      rating: 4,
      date: '08/10/2026',
      productName: 'Nấm đùi gà & Nấm hương tươi',
      comment: 'Nấm tươi ngon, chế biến lẩu rất hợp. Chỉ tiếc là hôm nay một số loại rau ăn lá hơi bị dập nhẹ do vận chuyển xa, mong shop rút kinh nghiệm bọc kỹ hơn.',
      verified: true
    },
    {
      id: 4,
      name: 'Anh Phạm Văn Đức',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      date: '05/10/2026',
      productName: 'Cải bó xôi hữu cơ',
      comment: 'An tâm tuyệt đối khi mua hàng ở Vườn Nhà. Rau đúng chuẩn hữu cơ sạch, giá cả lại hợp lý hơn siêu thị lớn.',
      verified: true
    }
  ]);

  // Xử lý khi lọc theo sao
  const filteredReviews = filterStar === 'all'
    ? reviewsData
    : reviewsData.filter(item => item.rating === parseInt(filterStar));

  // Xử lý gửi đánh giá mới
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return;

    const newItem = {
      id: Date.now(),
      name: newReview.name,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      rating: parseInt(newReview.rating),
      date: new Date().toLocaleDateString('vi-VN'),
      productName: newReview.product,
      comment: newReview.comment,
      verified: true
    };

    setReviewsData([newItem, ...reviewsData]);
    setNewReview({ name: '', rating: '5', comment: '', product: 'Rau xanh hữu cơ' });
    setShowForm(false);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div className="reviews-page">
      {/* 1. Hero Banner */}
      <div className="reviews-hero">
        <div className="reviews-hero-content">
          <span className="reviews-badge">⭐ Đánh giá từ khách hàng</span>
          <h1>Niềm Tin Từ Sự Chất Lượng</h1>
          <p>Lắng nghe những chia sẻ thực tế từ hàng nghìn khách hàng đã tin tưởng chọn lựa nông sản Vườn Nhà.</p>
        </div>
      </div>

      <div className="reviews-container">
        {/* Toast thành công */}
        {successMsg && (
          <div className="review-toast">
            🎉 Cảm ơn bạn đã gửi đánh giá! Ý kiến của bạn rất quan trọng với Vườn Nhà.
          </div>
        )}

        {/* 2. Tổng quan đánh giá (Rating Overview Box) */}
        <div className="rating-overview-card">
          <div className="rating-score-box">
            <h2>4.9</h2>
            <div className="stars-lg">★★★★★</div>
            <p>Dựa trên <strong>1,280+</strong> lượt mua sắm</p>
          </div>
          <div className="rating-breakdown">
            <div className="bar-row"><span>5 sao</span><div className="bar"><div className="fill" style={{width: '92%'}}></div></div><span className="percent">92%</span></div>
            <div className="bar-row"><span>4 sao</span><div className="bar"><div className="fill" style={{width: '6%'}}></div></div><span className="percent">6%</span></div>
            <div className="bar-row"><span>3 sao</span><div className="bar"><div className="fill" style={{width: '2%'}}></div></div><span className="percent">2%</span></div>
            <div className="bar-row"><span>2 sao</span><div className="bar"><div className="fill" style={{width: '0%'}}></div></div><span className="percent">0%</span></div>
            <div className="bar-row"><span>1 sao</span><div className="bar"><div className="fill" style={{width: '0%'}}></div></div><span className="percent">0%</span></div>
          </div>
          <div className="rating-action-box">
            <p>Bạn đã trải nghiệm sản phẩm của Vườn Nhà?</p>
            <button className="write-review-btn" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Đóng form' : '✍️ Viết đánh giá của bạn'}
            </button>
          </div>
        </div>

        {/* Form viết đánh giá (Ẩn/Hiện linh hoạt) */}
        {showForm && (
          <form className="review-form" onSubmit={handleSubmitReview}>
            <h3>Chia sẻ trải nghiệm mua sắm của bạn</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Họ và tên của bạn:</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Nguyễn Văn A" 
                  value={newReview.name}
                  onChange={(e) => setNewReview({...newReview, name: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Mức độ hài lòng:</label>
                <select 
                  value={newReview.rating}
                  onChange={(e) => setNewReview({...newReview, rating: e.target.value})}
                >
                  <option value="5">⭐⭐⭐⭐⭐ (Tuyệt vời)</option>
                  <option value="4">⭐⭐⭐⭐ (Hài lòng)</option>
                  <option value="3">⭐⭐⭐ (Bình thường)</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Sản phẩm đã mua:</label>
              <input 
                type="text" 
                placeholder="Ví dụ: Combo Bếp Xanh Gia Đình" 
                value={newReview.product}
                onChange={(e) => setNewReview({...newReview, product: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Cảm nhận / Nhận xét chi tiết:</label>
              <textarea 
                rows="4" 
                placeholder="Sản phẩm tươi ngon, giao hàng nhanh..."
                value={newReview.comment}
                onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                required
              ></textarea>
            </div>
            <button type="submit" className="submit-btn">Gửi Đánh Giá Ngay</button>
          </form>
        )}

        {/* 3. Bộ lọc đánh giá theo sao */}
        <div className="filter-review-tabs">
          <button className={filterStar === 'all' ? 'filter-btn active' : 'filter-btn'} onClick={() => setFilterStar('all')}>Tất cả</button>
          <button className={filterStar === '5' ? 'filter-btn active' : 'filter-btn'} onClick={() => setFilterStar('5')}>⭐ 5 Sao</button>
          <button className={filterStar === '4' ? 'filter-btn active' : 'filter-btn'} onClick={() => setFilterStar('4')}>⭐ 4 Sao</button>
          <button className={filterStar === '3' ? 'filter-btn active' : 'filter-btn'} onClick={() => setFilterStar('3')}>⭐ 3 Sao</button>
        </div>

        {/* 4. Danh sách các thẻ đánh giá */}
        <div className="reviews-grid">
          {filteredReviews.map((rev) => (
            <div className="review-card" key={rev.id}>
              <div className="review-header">
                <img src={rev.avatar} alt={rev.name} className="reviewer-avatar" />
                <div>
                  <h4>{rev.name}</h4>
                  <span className="verified-badge">✓ Đã mua hàng tại Vườn Nhà</span>
                </div>
                <span className="review-date">{rev.date}</span>
              </div>
              <div className="review-rating">
                {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
              </div>
              <p className="product-tag-used">Sản phẩm: <strong>{rev.productName}</strong></p>
              <p className="review-comment">"{rev.comment}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reviews;