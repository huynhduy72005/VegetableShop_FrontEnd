import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import './Admin.css';

export default function Admin() {
    const [products, setProducts] = useState([]);
    const [revenueStats, setRevenueStats] = useState({ totalRevenue: 0, totalOrders: 0, pendingOrders: 0 });
    
    // Form state cho Thêm / Sửa sản phẩm
    const [formData, setFormData] = useState({ id: null, name: '', price: '', quantity: '', unit: 'kg', image: '', description: '', categoryId: 1 });
    const [isEditing, setIsEditing] = useState(false);

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
            console.error("Lỗi tải dữ liệu Admin:", err);
        }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.updateProduct(formData.id, formData);
                alert("Cập nhật sản phẩm thành công!");
            } else {
                await api.createProduct(formData);
                alert("Thêm sản phẩm mới vào Database thành công!");
            }
            setFormData({ id: null, name: '', price: '', quantity: '', unit: 'kg', image: '', description: '', categoryId: 1 });
            setIsEditing(false);
            loadData();
        } catch (err) {
            alert("Lỗi khi lưu sản phẩm: " + (err.response?.data?.message || err.message));
        }
    };

    const handleEditClick = (product) => {
        setFormData(product);
        setIsEditing(true);
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

    return (
        <div className="admin-page">
            <h2>Trang Quản Trị Hệ Thống (Admin Dashboard)</h2>

            {/* Thống kê Doanh thu */}
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

            {/* Form Thêm / Sửa sản phẩm */}
            <div className="admin-form-box">
                <h3>{isEditing ? 'Sửa thông tin sản phẩm' : 'Thêm sản phẩm mới vào Database'}</h3>
                <form onSubmit={handleSaveProduct} className="product-form">
                    <input type="text" placeholder="Tên sản phẩm" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input type="number" placeholder="Giá tiền (VNĐ)" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    <input type="number" placeholder="Số lượng tồn kho" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                    <input type="text" placeholder="Đơn vị (kg, bó, quả...)" required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                    <input type="text" placeholder="Link hình ảnh sản phẩm" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                    <input type="text" placeholder="Mô tả sản phẩm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <button type="submit" className="btn-save">{isEditing ? 'Cập nhật sản phẩm' : 'Lưu vào Database'}</button>
                    {isEditing && <button type="button" onClick={() => { setIsEditing(false); setFormData({ id: null, name: '', price: '', quantity: '', unit: 'kg', image: '', description: '', categoryId: 1 }); }} className="btn-cancel">Hủy</button>}
                </form>
            </div>

            {/* Bảng danh sách sản phẩm */}
            <div className="admin-table-box">
                <h3>Danh sách sản phẩm trong cơ sở dữ liệu</h3>
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