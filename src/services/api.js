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
    updateProductInventory: (id, data) =>
        client.put(`${API_BASE_URL}/products/${id}/inventory`, data),
    deleteProduct: (id) => client.delete(`${API_BASE_URL}/products/${id}`),

    getCategories: () => client.get(`${API_BASE_URL}/categories`),
    
    // --- 3 HÀM QUẢN LÝ DANH MỤC ---
    createCategory: (data) => client.post(`${API_BASE_URL}/categories`, data),
    updateCategory: (id, data) => client.put(`${API_BASE_URL}/categories/${id}`, data),
    deleteCategory: (id) => client.delete(`${API_BASE_URL}/categories/${id}`),

    createOrder: (orderData) => client.post(`${API_BASE_URL}/orders`, orderData),
    getRevenue: () => client.get(`${API_BASE_URL}/orders/revenue`),

    getOrders: (params) => client.get(`${API_BASE_URL}/orders`, { params }),
    getPendingOrdersSummary: () => client.get(`${API_BASE_URL}/orders/pending-summary`),
    getOrderById: (id) => client.get(`${API_BASE_URL}/orders/${id}`),
    cancelOrder: (id) => client.put(`${API_BASE_URL}/orders/${id}/cancel`),
    updateOrderStatus: (id, status) => client.put(`${API_BASE_URL}/orders/${id}/status`, { status }),

    login: (credentials) => client.post(`${API_BASE_URL}/users/login`, credentials),
    register: (userData) => client.post(`${API_BASE_URL}/users/register`, userData),
    sendPasswordResetOtp: (email) =>
        client.post(`${API_BASE_URL}/users/password-reset/send-otp`, { email }),
    confirmPasswordReset: (data) =>
        client.post(`${API_BASE_URL}/users/password-reset/confirm`, data),
    changePassword: (id, passwordData) =>
        client.put(`${API_BASE_URL}/users/change-password/${id}`, passwordData),

    // Quản lý người dùng (Admin)
    getUsers: () => client.get(`${API_BASE_URL}/users`),
    updateUserRole: (id, roleData) => client.put(`${API_BASE_URL}/users/${id}/role`, roleData),
    deleteUser: (id) => client.delete(`${API_BASE_URL}/users/${id}`),
    restoreUser: (id) => client.put(`${API_BASE_URL}/users/${id}/restore`),

    updateProfile: (id, data) => client.put(`${API_BASE_URL}/users/profile/${id}`, data),
    
    // ========== QUẢN LÝ NHÂN VIÊN ==========
    getEmployees: () =>
        client.get(`${API_BASE_URL}/employees`),
    getEmployeeById: (id) =>
        client.get(`${API_BASE_URL}/employees/${id}`),
    createEmployee: (data) =>
        client.post(`${API_BASE_URL}/employees`, data),
    updateEmployee: (id, data) =>
        client.put(`${API_BASE_URL}/employees/${id}`, data),
    updateEmployeePermissions: (id, data) =>
        client.put(`${API_BASE_URL}/employees/${id}/permissions`, data),
    getEmployeeLogs: () =>
        client.get(`${API_BASE_URL}/employees/logs`),
    getMyEmployeeProfile: () =>
        client.get(`${API_BASE_URL}/employee-profile`),

    // ========== VOUCHER ==========
    getMyVouchers: () => client.get(`${API_BASE_URL}/vouchers/my`),
    getPublicVouchers: () => client.get(`${API_BASE_URL}/vouchers/public`),
    claimVoucher: (code) => client.post(`${API_BASE_URL}/vouchers/claim`, { code }),
    validateVoucher: (code, subtotal) => client.post(`${API_BASE_URL}/vouchers/validate`, { code, subtotal }),
    markVoucherUsed: (code, orderId) => client.post(`${API_BASE_URL}/vouchers/mark-used`, { code, orderId }),

    // Quản lý Voucher (Admin)
    getAdminVouchers: () => client.get(`${API_BASE_URL}/vouchers`),
    createVoucher: (data) => client.post(`${API_BASE_URL}/vouchers`, data),
    updateVoucher: (id, data) => client.put(`${API_BASE_URL}/vouchers/${id}`, data),
    deleteVoucher: (id) => client.delete(`${API_BASE_URL}/vouchers/${id}`),

    // ========== QUẢN LÝ NHÀ CUNG CẤP / NHÀ VƯỜN ==========
    getSuppliers: (params) =>
        client.get(`${API_BASE_URL}/Suppliers`, { params }),
    getSupplierById: (id) =>
        client.get(`${API_BASE_URL}/Suppliers/${id}`),
    createSupplier: (data) =>
        client.post(`${API_BASE_URL}/Suppliers`, data),
    updateSupplier: (id, data) =>
        client.put(`${API_BASE_URL}/Suppliers/${id}`, data),
    deleteSupplier: (id) =>
        client.delete(`${API_BASE_URL}/Suppliers/${id}`),

    // ========== QUẢN LÝ LÔ HÀNG & HẠN SỬ DỤNG ==========
    getBatchesByProduct: (productId) =>
        client.get(`${API_BASE_URL}/ProductBatches/product/${productId}`),
    getExpiringBatches: (days = 3) =>
        client.get(`${API_BASE_URL}/ProductBatches/alerts`, { params: { days } }),
    importProductBatch: (data) =>
        client.post(`${API_BASE_URL}/ProductBatches/import`, data),
    disposeProductBatch: (data) =>
        client.post(`${API_BASE_URL}/ProductBatches/dispose`, data),
    getBatchDisposalLogs: (productId) =>
        client.get(`${API_BASE_URL}/ProductBatches/disposals`, { params: productId ? { productId } : {} }),

    // ========== BÁO CÁO & THỐNG KÊ NÂNG CAO ==========
    getAnalyticsRevenue: (params) =>
        client.get(`${API_BASE_URL}/Analytics/revenue`, { params }),
    getAnalyticsTopProducts: (params) =>
        client.get(`${API_BASE_URL}/Analytics/top-products`, { params }),
    getAnalyticsCategoryShare: (params) =>
        client.get(`${API_BASE_URL}/Analytics/category-share`, { params }),
    getAnalyticsRates: (params) =>
        client.get(`${API_BASE_URL}/Analytics/rates`, { params }),

    // ========== MẸO HAY NHÀ BẾP ==========
    getKitchenTips: (params) =>
        client.get(`${API_BASE_URL}/KitchenTips`, { params }),
    getKitchenTipById: (id) =>
        client.get(`${API_BASE_URL}/KitchenTips/${id}`),
    getAdminKitchenTips: (params) =>
        client.get(`${API_BASE_URL}/KitchenTips/admin`, { params }),
    createKitchenTip: (data) =>
        client.post(`${API_BASE_URL}/KitchenTips`, data),
    updateKitchenTip: (id, data) =>
        client.put(`${API_BASE_URL}/KitchenTips/${id}`, data),
    deleteKitchenTip: (id) =>
        client.delete(`${API_BASE_URL}/KitchenTips/${id}`),

    // ========== ĐÁNH GIÁ SẢN PHẨM ==========
    getProductReviews: (productId) =>
        client.get(`${API_BASE_URL}/Reviews/product/${productId}`),
    createProductReview: (data) =>
        client.post(`${API_BASE_URL}/Reviews`, data),
    getAdminReviews: (params) =>
        client.get(`${API_BASE_URL}/Reviews/admin`, { params }),
    toggleReviewVisibility: (id, isHidden) =>
        client.put(`${API_BASE_URL}/Reviews/${id}/visibility`, { isHidden }),
    replyReview: (id, adminReply) =>
        client.put(`${API_BASE_URL}/Reviews/${id}/reply`, { adminReply }),
    deleteReview: (id) =>
        client.delete(`${API_BASE_URL}/Reviews/${id}`),

    // ========== LIÊN HỆ & KHIẾU NẠI ==========
    sendContactMessage: (data) =>
        client.post(`${API_BASE_URL}/Contact`, data),
    getContactMessages: (params) =>
        client.get(`${API_BASE_URL}/Contact`, { params }),
    updateContactStatus: (id, data) =>
        client.put(`${API_BASE_URL}/Contact/${id}/status`, data),
    deleteContactMessage: (id) =>
        client.delete(`${API_BASE_URL}/Contact/${id}`),
};