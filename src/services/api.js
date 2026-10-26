import axios from 'axios';

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || 'https://localhost:7179/api'
).replace(/\/+$/, '');

export const api = {
    getProducts: () => axios.get(`${API_BASE_URL}/products`),
    getProductById: (id) => axios.get(`${API_BASE_URL}/products/${id}`),
    createProduct: (productData) => axios.post(`${API_BASE_URL}/products`, productData),
    updateProduct: (id, productData) => axios.put(`${API_BASE_URL}/products/${id}`, productData),
    deleteProduct: (id) => axios.delete(`${API_BASE_URL}/products/${id}`),

    getCategories: () => axios.get(`${API_BASE_URL}/categories`),
    
    // --- 3 HÀM QUẢN LÝ DANH MỤC ĐƯỢC THÊM VÀO ĐÂY ---
    createCategory: (data) => axios.post(`${API_BASE_URL}/categories`, data),
    updateCategory: (id, data) => axios.put(`${API_BASE_URL}/categories/${id}`, data),
    deleteCategory: (id) => axios.delete(`${API_BASE_URL}/categories/${id}`),
    // ------------------------------------------------

    createOrder: (orderData) => axios.post(`${API_BASE_URL}/orders`, orderData),
    getRevenue: () => axios.get(`${API_BASE_URL}/orders/revenue`),

    getOrders: (params) => axios.get(`${API_BASE_URL}/orders`, { params }),
    getOrderById: (id) => axios.get(`${API_BASE_URL}/orders/${id}`),
    cancelOrder: (id) => axios.put(`${API_BASE_URL}/orders/${id}/cancel`),
    updateOrderStatus: (id, status) => axios.put(`${API_BASE_URL}/orders/${id}/status`, { status }),

    login: (credentials) => axios.post(`${API_BASE_URL}/users/login`, credentials),
    register: (userData) => axios.post(`${API_BASE_URL}/users/register`, userData),

    // Quản lý người dùng (Admin)
    getUsers: () => axios.get(`${API_BASE_URL}/users`),
    updateUserRole: (id, roleData) => axios.put(`${API_BASE_URL}/users/${id}/role`, roleData),
    deleteUser: (id) => axios.delete(`${API_BASE_URL}/users/${id}`),

    updateProfile: (id, data) => axios.put(`${API_BASE_URL}/users/profile/${id}`, data),
};