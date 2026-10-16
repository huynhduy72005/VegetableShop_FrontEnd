// import axios from 'axios';

// // Đảm bảo cổng 7179 khớp với Backend .NET Core của bạn
// const API_BASE_URL = 'https://localhost:7179/api';

// export const api = {
//     // Sản phẩm
//     getProducts: () => axios.get(`${API_BASE_URL}/products`),
//     getProductById: (id) => axios.get(`${API_BASE_URL}/products/${id}`),

//     // Danh mục
//     getCategories: () => axios.get(`${API_BASE_URL}/categories`),

//     // Đơn hàng
//     createOrder: (orderData) => axios.post(`${API_BASE_URL}/orders`, orderData),

//     // Tài khoản
//     login: (credentials) => axios.post(`${API_BASE_URL}/users/login`, credentials),
//     register: (userData) => axios.post(`${API_BASE_URL}/users/register`, userData),
// };

import axios from 'axios';

const API_BASE_URL = 'https://localhost:7179/api';

export const api = {
    getProducts: () => axios.get(`${API_BASE_URL}/products`),
    getProductById: (id) => axios.get(`${API_BASE_URL}/products/${id}`),
    createProduct: (productData) => axios.post(`${API_BASE_URL}/products`, productData),
    updateProduct: (id, productData) => axios.put(`${API_BASE_URL}/products/${id}`, productData),
    deleteProduct: (id) => axios.delete(`${API_BASE_URL}/products/${id}`),

    getCategories: () => axios.get(`${API_BASE_URL}/categories`),
    

    createOrder: (orderData) => axios.post(`${API_BASE_URL}/orders`, orderData),
    getRevenue: () => axios.get(`${API_BASE_URL}/orders/revenue`),

    getOrders: () => axios.get(`${API_BASE_URL}/orders`),
    getOrderById: (id) => axios.get(`${API_BASE_URL}/orders/${id}`),

    login: (credentials) => axios.post(`${API_BASE_URL}/users/login`, credentials),
    register: (userData) => axios.post(`${API_BASE_URL}/users/register`, userData),

    // Quản lý người dùng (Admin)
    getUsers: () => axios.get(`${API_BASE_URL}/users`),
    updateUserRole: (id, roleData) => axios.put(`${API_BASE_URL}/users/${id}/role`, roleData),
    deleteUser: (id) => axios.delete(`${API_BASE_URL}/users/${id}`),

    updateProfile: (id, data) => axios.put(`${API_URL}/users/profile/${id}`, data),
};
