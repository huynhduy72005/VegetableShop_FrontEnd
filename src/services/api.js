import axios from 'axios';

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || 'https://localhost:7179/api'
).replace(/\/+$/, '');
const client = axios.create();

client.interceptors.request.use(config => {
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = {
    getProducts: () => client.get(`${API_BASE_URL}/products`),
    getProductById: (id) => client.get(`${API_BASE_URL}/products/${id}`),
    createProduct: (productData) => client.post(`${API_BASE_URL}/products`, productData),
    updateProduct: (id, productData) => client.put(`${API_BASE_URL}/products/${id}`, productData),
    deleteProduct: (id) => client.delete(`${API_BASE_URL}/products/${id}`),

    getCategories: () => client.get(`${API_BASE_URL}/categories`),
    
    // --- 3 HÀM QUẢN LÝ DANH MỤC ĐƯỢC THÊM VÀO ĐÂY ---
    createCategory: (data) => client.post(`${API_BASE_URL}/categories`, data),
    updateCategory: (id, data) => client.put(`${API_BASE_URL}/categories/${id}`, data),
    deleteCategory: (id) => client.delete(`${API_BASE_URL}/categories/${id}`),
    // ------------------------------------------------

    createOrder: (orderData) => client.post(`${API_BASE_URL}/orders`, orderData),
    getRevenue: () => client.get(`${API_BASE_URL}/orders/revenue`),

    getOrders: (params) => client.get(`${API_BASE_URL}/orders`, { params }),
    getOrderById: (id) => client.get(`${API_BASE_URL}/orders/${id}`),
    cancelOrder: (id) => client.put(`${API_BASE_URL}/orders/${id}/cancel`),
    updateOrderStatus: (id, status) => client.put(`${API_BASE_URL}/orders/${id}/status`, { status }),

    login: (credentials) => client.post(`${API_BASE_URL}/users/login`, credentials),
    register: (userData) => client.post(`${API_BASE_URL}/users/register`, userData),
    checkPasswordResetEligibility: (email) =>
        client.post(`${API_BASE_URL}/users/password-reset-eligibility`, { email }),
    createPasswordResetRequest: (data) =>
        client.post(`${API_BASE_URL}/users/password-reset-requests`, data),
    getPasswordResetRequestStatus: (id) =>
        client.get(`${API_BASE_URL}/users/password-reset-requests/${id}/status`),
    getPasswordResetRequests: () =>
        client.get(`${API_BASE_URL}/users/password-reset-requests`),
    approvePasswordResetRequest: (id) =>
        client.post(`${API_BASE_URL}/users/password-reset-requests/${id}/approve`),
    rejectPasswordResetRequest: (id) =>
        client.post(`${API_BASE_URL}/users/password-reset-requests/${id}/reject`),
    changePassword: (id, passwordData) =>
        client.put(`${API_BASE_URL}/users/change-password/${id}`, passwordData),

    // Quản lý người dùng (Admin)
    getUsers: () => client.get(`${API_BASE_URL}/users`),
    updateUserRole: (id, roleData) => client.put(`${API_BASE_URL}/users/${id}/role`, roleData),
    deleteUser: (id) => client.delete(`${API_BASE_URL}/users/${id}`),

    updateProfile: (id, data) => client.put(`${API_BASE_URL}/users/profile/${id}`, data),
    
    // ========== QUẢN LÝ NHÂN VIÊN ==========

    // Lấy danh sách nhân viên
    getEmployees: () =>
        client.get(`${API_BASE_URL}/employees`),

    // Xem chi tiết một nhân viên
    getEmployeeById: (id) =>
        client.get(`${API_BASE_URL}/employees/${id}`),

    // Thêm nhân viên
    createEmployee: (data) =>
        client.post(`${API_BASE_URL}/employees`, data),

    // Chỉnh sửa thông tin nhân viên
    updateEmployee: (id, data) =>
        client.put(`${API_BASE_URL}/employees/${id}`, data),

    // Cập nhật quyền và trạng thái nhân viên
    updateEmployeePermissions: (id, data) =>
        client.put(`${API_BASE_URL}/employees/${id}/permissions`, data),

    // Xem nhật ký hoạt động
    getEmployeeLogs: () =>
        client.get(`${API_BASE_URL}/employees/logs`),

    // ======================================

};