import './Footer.css';

const footerColumns = [
    {
        title: 'Khám phá',
        items: ['Sản phẩm mới', 'Rau củ sạch', 'Trái cây theo mùa', 'Combo gia đình'],
    },
    {
        title: 'Thông tin',
        items: ['Về chúng tôi', 'Mẹo hay nhà bếp', 'Chính sách giao hàng', 'Hướng dẫn mua hàng'],
    },
    {
        title: 'Hỗ trợ',
        items: ['Liên hệ', 'Tư vấn dinh dưỡng', 'FAQ', 'Tài khoản'],
    },
];

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <div className="footer-logo">🌿 Vườn Nhà</div>
                    <p>
                        Mang nông trại xanh đến bữa ăn của bạn với thực phẩm sạch, tươi ngon
                        và dịch vụ tận tâm mỗi ngày.
                    </p>

                    <div className="footer-contact">
                        <p>📍 56 Nguyễn Đức Cảnh, Q.7, TP.HCM</p>
                        <p>📞 1900 6868</p>
                        <p>✉️ hello@vuonnha.vn</p>
                    </div>
                </div>

                <div className="footer-links">
                    {footerColumns.map(column => (
                        <div key={column.title} className="footer-col">
                            <h4>{column.title}</h4>
                            <ul>
                                {column.items.map(item => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="footer-newsletter">
                    <h4>Đăng ký nhận ưu đãi</h4>
                    <p>Nhận thông tin khuyến mãi, mẹo nấu ăn và sản phẩm mới mỗi tuần.</p>
                    <div className="newsletter-box">
                        <input type="email" placeholder="Email của bạn" />
                        <button type="button">Đăng ký</button>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>© 2026 Vườn Nhà. Mọi quyền được bảo lưu.</p>
                <p>Thực phẩm tươi sạch • Minh bạch • Bền vững</p>
            </div>
        </footer>
    );
}