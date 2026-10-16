import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://localhost:7000/api/Orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://localhost:7000/api/Orders/${orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Hủy đơn hàng thành công!");
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || "Hủy đơn hàng thất bại!");
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case "Pending":
      case "0":
        return <span className="badge bg-warning text-dark">Chờ xác nhận</span>;
      case "Processing":
      case "1":
        return <span className="badge bg-info text-dark">Đang xử lý</span>;
      case "Shipping":
      case "2":
        return <span className="badge bg-primary">Đang giao hàng</span>;
      case "Completed":
      case "3":
        return <span className="badge bg-success">Đã hoàn thành</span>;
      case "Cancelled":
      case "4":
        return <span className="badge bg-danger">Đã hủy</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  if (loading) return <div className="text-center p-4">Đang tải lịch sử đơn hàng...</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Lịch sử đơn hàng</h2>
      {orders.length === 0 ? (
        <p>Bạn chưa có đơn hàng nào.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Mã đơn</th>
                <th>Ngày đặt</th>
                <th>Số lượng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((item) => (
                <tr key={item.id}>
                  <td><strong>#{item.id}</strong></td>
                  <td>{new Date(item.createdDate).toLocaleDateString('vi-VN')}</td>
                  <td>{item.totalItems} món</td>
                  <td>{item.totalAmount?.toLocaleString('vi-VN')} đ</td>
                  <td>{renderStatus(item.status)}</td>
                  <td>
                    {(item.status === "Pending" || item.status === "0") ? (
                      <button 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => handleCancel(item.id)}
                      >
                        Hủy đơn
                      </button>
                    ) : (
                      <span className="text-muted small">Không thể hủy</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;