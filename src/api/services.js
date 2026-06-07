import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'https://api-gateway-p817.onrender.com';

const api = axios.create({
  baseURL: GATEWAY_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 🔧 Handle 401 globally – but DON'T redirect on checkout/auth pages
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const isCheckout = path.includes('checkout');
      const isAuth = path.includes('login') || path.includes('register');
      
      if (!isCheckout && !isAuth) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ==================== AUTH API ====================
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (token) => api.get(`/auth/verify?token=${encodeURIComponent(token)}`),
  resendVerification: (email) => api.post(`/auth/resend-verification?email=${encodeURIComponent(email)}`),
  sendOtp: (phone) => api.post(`/auth/otp?phone=${encodeURIComponent(phone)}`),
  verifyOtp: (phone, otp) => api.post(`/auth/otp/verify?phone=${encodeURIComponent(phone)}&otp=${encodeURIComponent(otp)}`),
  forgotPassword: (email) => api.post(`/auth/forgot-password?email=${encodeURIComponent(email)}`),
  resetPassword: (token, newPassword) => api.post(`/auth/reset-password?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`),
  changePassword: (data) => api.post('/auth/change-password', null, {
    params: { oldPassword: data.oldPassword, newPassword: data.newPassword }
  }),
  googleLogin: (idToken) => api.post('/auth/google', { idToken }),
  checkVerification: (email) => api.get(`/auth/check-verification?email=${encodeURIComponent(email)}`),
  syncFirebase: (email, password) => api.post(`/auth/sync-firebase?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`),
  autoVerify: (email) => api.post(`/auth/auto-verify?email=${encodeURIComponent(email)}`),
  // Admin
  getUsers: () => api.get('/auth/users'),
  getUserByEmail: (email) => api.get(`/auth/user/${encodeURIComponent(email)}`),
  updateUserRole: async (email, role) => {
    const encodedEmail = encodeURIComponent(email);
    const encodedRole = encodeURIComponent(role);
    try {
      return await api.put(`/auth/users/${encodedEmail}/role?role=${encodedRole}`);
    } catch (err) {
      if (err.response?.status >= 500) {
        return api.put(`/auth/users/role?email=${encodedEmail}&role=${encodedRole}`);
      }
      throw err;
    }
  },
  deleteUser: async (email) => {
    const encodedEmail = encodeURIComponent(email);
    try {
      return await api.delete(`/auth/users/${encodedEmail}`);
    } catch (err) {
      if (err.response?.status >= 500) {
        return api.delete(`/auth/users?email=${encodedEmail}`);
      }
      throw err;
    }
  },
};

// ==================== PRODUCT API ====================
export const productAPI = {
  getProducts: (page = 0, size = 20, sortBy = 'createdAt', sortDir = 'desc') =>
    api.get('/api/v1/products', { params: { page, size, sortBy, sortDir } }),
  getProduct: (id) => api.get(`/api/v1/products/${id}`),
  createProduct: (data) => api.post('/api/v1/products', data),
  updateProduct: (id, data) => api.put(`/api/v1/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/api/v1/products/${id}`),
  searchProducts: (data) => api.post('/api/v1/products/search', data),
  getProductStock: (id) => api.get(`/api/v1/products/${id}/stock`),
  getCategories: () => api.get('/api/v1/categories'),
  getCategory: (id) => api.get(`/api/v1/categories/${id}`),
  createCategory: (data) => api.post('/api/v1/categories', data),
  updateCategory: (id, data) => api.put(`/api/v1/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/api/v1/categories/${id}`),
  getBrands: () => api.get('/api/v1/brands'),
  getBrand: (id) => api.get(`/api/v1/brands/${id}`),
  createBrand: (data) => api.post('/api/v1/brands', data),
  getReviews: (productId) => api.get(`/api/v1/products/${productId}/reviews`),
  createReview: (productId, data) => api.post(`/api/v1/products/${productId}/reviews`, data),
  deleteReview: (productId, reviewId) => api.delete(`/api/v1/products/${productId}/reviews/${reviewId}`),
  search: (data) => api.post('/api/v1/search', data),
};

// ==================== CART API ====================
export const cartAPI = {
  createCart: (data) => api.post('/api/v1/carts', data),
  getCart: (cartId) => api.get(`/api/v1/carts/${cartId}`),
  updateCartStatus: (cartId, status) => api.put(`/api/v1/carts/${cartId}/status?status=${status}`),
  deleteCart: (cartId) => api.delete(`/api/v1/carts/${cartId}`),
  mergeCart: (data) => api.post('/api/v1/carts/merge', data),
  getItems: (cartId) => api.get(`/api/v1/carts/${cartId}/items`),
  addItem: (cartId, data) => api.post(`/api/v1/carts/${cartId}/items`, data),
  updateItem: (cartId, itemId, data) => api.put(`/api/v1/carts/${cartId}/items/${itemId}`, data),
  removeItem: (cartId, itemId) => api.delete(`/api/v1/carts/${cartId}/items/${itemId}`),
  clearCart: (cartId) => api.delete(`/api/v1/carts/${cartId}/items`),
  checkout: (cartId, data) => api.post(`/api/v1/carts/${cartId}/checkout`, data),
  recoverCart: (cartId) => api.post(`/api/v1/carts/${cartId}/recover`),
};

// ==================== ORDER API ====================
export const orderAPI = {
  getOrders: (page = 0, size = 20, userId) => api.get('/api/v1/orders', { params: { page, size, userId } }),
  getOrder: (id) => api.get(`/api/v1/orders/${id}`),
  getOrderByNumber: (orderNumber) => api.get(`/api/v1/orders/number/${orderNumber}`),
  createOrder: (data) => api.post('/api/v1/orders', data),
  updateOrderStatus: (orderId, data) => api.put(`/api/v1/orders/${orderId}/status`, data),
  cancelOrder: (orderId) => api.put(`/api/v1/orders/${orderId}/cancel`),
};

// ==================== PAYMENT API ====================
export const paymentAPI = {
  processPayment: (data) => api.post('/api/v1/payments', data),
  getPayment: (paymentId) => api.get(`/api/v1/payments/${paymentId}`),
  verifyPayment: (orderId) => api.get(`/api/v1/payments/verify/${orderId}`),
  getUserPayments: (userId) => api.get(`/api/v1/payments/user/${userId}`),
  getOrderPayment: (orderId) => api.get(`/api/v1/payments/order/${orderId}`),
  refund: (paymentId, data) => api.post(`/api/v1/payments/${paymentId}/refund`, data),
};

// ==================== NOTIFICATION API ====================
export const notificationAPI = {
  sendEmail: (data) => api.post('/api/v1/email/send', data),
  sendOrderConfirmation: (data) => api.post('/api/v1/email/order-confirmation', data),
  sendOrderStatusUpdate: (data) => api.post('/api/v1/email/order-status', data),
  sendPaymentConfirmation: (data) => api.post('/api/v1/email/payment-confirmation', data),
  sendRefundEmail: (data) => api.post('/api/v1/email/refund', data),
};