import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import './Admin.css';

export default function Admin() {
    const [products, setProducts] = useState([]);
    const [revenueStats, setRevenueStats] = useState({ totalRevenue: 0, totalOrders: 0, pendingOrders: 0 });
    
    // Form state
    const [formData, setFormData] = useState({ id: null, name: '', price: '', quantity: '', unit: 'kg', image: '', description: '', categoryId: 1 });
    const [isEditing, setIsEditing] = useState(false); // Biến kiểm soát việc chuyển "trang"

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const prodRes = await api.getProducts();
            setProducts(prodRes.data);
            const revRes = await api.getRevenue();
            setRevenueStats(revRes.data);
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
        }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                price: Number(formData.price),
                quantity: Number(formData.quantity),
                categoryId: formData.categoryId || 1
            };

            if (isEditing) {
                await api.updateProduct(payload.id, payload);
                alert("Cập nhật sản phẩm thành công!");
            } else {
                const { id, ...postData } = payload; 
                await api.createProduct(postData);
                alert("Thêm sản phẩm mới thành công!");
            }

            // Đặt lại form và quay về trang danh sách
            setFormData({ id: null, name: '', price: '', quantity: '', unit: 'kg', image: '', description: '', categoryId: 1 });
            setIsEditing(false);
            loadData();
        } catch (err) {
            console.error(err.response?.data);
            alert("Lỗi khi lưu sản phẩm! Vui lòng kiểm tra Console (F12).");
        }
    };

    const handleEditClick = (product) => {
        setFormData(product);
        setIsEditing(true); // Bật chế độ sửa -> Tự động chuyển sang giao diện trang sửa
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
            try {
                await api.deleteProduct(id);
                alert("Xóa thành công!");
                loadData();
            } catch (err) {
                alert("Xóa thất bại!");
            }
        }
    };

    // =========================================================
    // GIAO DIỆN 1: TRANG CHỈNH SỬA SẢN PHẨM (MỞ RA KHI BẤM SỬA)
    // =========================================================
    if (isEditing) {
        return (
            <div className="admin-page">
                <button onClick={() => { setIsEditing(false); setFormData({ id: null, name: '', price: '', quantity: '', unit: 'kg', image: '', description: '', categoryId: 1 }); }} className="btn-back">
                    ← Quay lại danh sách
                </button>
                
                <h2 style={{ marginTop: '20px' }}>✏️ Cập nhật sản phẩm: <span style={{color: '#27ae60'}}>{formData.name}</span></h2>
                
                <div className="admin-form-box" style={{ marginTop: '20px' }}>
                    <form onSubmit={handleSaveProduct} className="product-form">
                        <input type="text" placeholder="Tên sản phẩm" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <input type="number" placeholder="Giá tiền (VNĐ)" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                        <input type="number" placeholder="Số lượng tồn kho" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                        <input type="text" placeholder="Đơn vị (kg, bó...)" required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                        <input type="text" placeholder="Link hình ảnh" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                        <input type="text" placeholder="Mô tả" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        <button type="submit" className="btn-save">Lưu thay đổi</button>
                    </form>
                </div>
            </div>
        );
    }

    // =========================================================
    // GIAO DIỆN 2: TRANG QUẢN TRỊ CHÍNH (MẶC ĐỊNH)
    // =========================================================
    return (
        <div className="admin-page">
            <h2>⚙️ Trang Quản Trị Hệ Thống (Admin Dashboard)</h2>

            {/* Thống kê */}
            <div className="stats-container">
                <div className="stat-card">
                    <h4>Tổng doanh thu</h4>
                    <p className="stat-number">{revenueStats.totalRevenue.toLocaleString()} đ</p>
                </div>
                <div className="stat-card">
                    <h4>Tổng đơn hàng</h4>
                    <p className="stat-number">{revenueStats.totalOrders}</p>
                </div>
                <div className="stat-card">
                    <h4>Đơn chờ xử lý</h4>
                    <p className="stat-number">{revenueStats.pendingOrders}</p>
                </div>
            </div>

            {/* Form Thêm Mới */}
            <div className="admin-form-box">
                <h3>Thêm sản phẩm mới</h3>
                <form onSubmit={handleSaveProduct} className="product-form">
                    <input type="text" placeholder="Tên sản phẩm" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input type="number" placeholder="Giá tiền (VNĐ)" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    <input type="number" placeholder="Số lượng tồn kho" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                    <input type="text" placeholder="Đơn vị (kg, bó...)" required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                    <input type="text" placeholder="Link hình ảnh" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                    <input type="text" placeholder="Mô tả" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <button type="submit" className="btn-save">Thêm vào Database</button>
                </form>
            </div>

            {/* Bảng Danh Sách */}
            <div className="admin-table-box">
                <h3>Danh sách sản phẩm</h3>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Hình ảnh</th>
                            <th>Tên sản phẩm</th>
                            <th>Giá</th>
                            <th>Tồn kho</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td><img src={p.image || 'https://via.placeholder.com/40'} alt="" width="40" height="40" style={{objectFit:'cover', borderRadius:'4px'}} /></td>
                                <td>{p.name}</td>
                                <td>{p.price.toLocaleString()} đ / {p.unit}</td>
                                <td>{p.quantity}</td>
                                <td>
                                    <button onClick={() => handleEditClick(p)} className="btn-edit">Sửa</button>
                                    <button onClick={() => handleDeleteClick(p.id)} className="btn-delete">Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}