import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_GATEWAY_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

const NOTIFICATION_API = axios.create({
  baseURL: import.meta.env.VITE_GATEWAY_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Keep Authorization header for notification endpoints.
// Some backends require admin/user auth; removing it can lead to 403.
NOTIFICATION_API.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);


// Request interceptor for auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - don't auto-redirect on checkout page
API.interceptors.response.use(
  (response) => response,
  (error) => {
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
export default API;

// ==================== AUTH API ====================
export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  verifyEmail: (token) => API.get(`/auth/verify?token=${encodeURIComponent(token)}`),
  resendVerification: (email) => API.post(`/auth/resend-verification?email=${encodeURIComponent(email)}`),
  sendOtp: (phone) => API.post(`/auth/otp?phone=${encodeURIComponent(phone)}`),
  verifyOtp: (phone, otp) => API.post(`/auth/otp/verify?phone=${encodeURIComponent(phone)}&otp=${encodeURIComponent(otp)}`),
  forgotPassword: (email) => API.post(`/auth/forgot-password?email=${encodeURIComponent(email)}`),
  resetPassword: (token, newPassword) => API.post(`/auth/reset-password?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`),
  changePassword: (data) => API.post('/auth/change-password', null, {
    params: { oldPassword: data.oldPassword, newPassword: data.newPassword }
  }),
  updateProfile: (data) => API.put('/auth/profile', data),
  googleLogin: (idToken) => API.post('/auth/google', { idToken }),
  checkVerification: (email) => API.get(`/auth/check-verification?email=${encodeURIComponent(email)}`),
  syncFirebase: (email, password) => API.post(`/auth/sync-firebase?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`),
  autoVerify: (email) => API.post(`/auth/auto-verify?email=${encodeURIComponent(email)}`),
  // Admin user management
  getUsers: () => API.get('/auth/users'),
  getUserByEmail: (email) => API.get(`/auth/user/${encodeURIComponent(email)}`),
  // Swagger-compatible admin endpoints
  // PUT /auth/users/{email}/role?role=ROLE_X
  updateUserRole: async (email, role) => {
    const encodedEmail = encodeURIComponent(email);
    const encodedRole = encodeURIComponent(role);
    return API.put(`/auth/users/${encodedEmail}/role?role=${encodedRole}`);
  },
  // DELETE /auth/users/{email}
  deleteUser: async (email) => {
    const encodedEmail = encodeURIComponent(email);
    return API.delete(`/auth/users/${encodedEmail}`);
  },
};

// ==================== PRODUCT API ====================
export const productAPI = {
  getProducts: (page = 0, size = 20, sortBy = 'createdAt', sortDir = 'desc') =>
    API.get('/api/v1/products', { params: { page, size, sortBy, sortDir } }),
  getProduct: (id) => API.get(`/api/v1/products/${id}`),
  createProduct: (data) => API.post('/api/v1/products', data),
  updateProduct: (id, data) => API.put(`/api/v1/products/${id}`, data),
  deleteProduct: (id) => API.delete(`/api/v1/products/${id}`),
  searchProducts: (data) => API.post('/api/v1/products/search', data),
  getProductStock: (id) => API.get(`/api/v1/products/${id}/stock`),
  getCategories: () => API.get('/api/v1/categories'),
  getCategory: (id) => API.get(`/api/v1/categories/${id}`),
  createCategory: (data) => API.post('/api/v1/categories', data),
  updateCategory: (id, data) => API.put(`/api/v1/categories/${id}`, data),
  deleteCategory: (id) => API.delete(`/api/v1/categories/${id}`),
  getBrands: () => API.get('/api/v1/brands'),
  getBrand: (id) => API.get(`/api/v1/brands/${id}`),
  deleteBrand: (id) => API.delete(`/api/v1/brands/${id}`),
  createBrand: (data) => API.post('/api/v1/brands', data),
  getReviews: (productId) => API.get(`/api/v1/products/${productId}/reviews`),
  createReview: (productId, data) => API.post(`/api/v1/products/${productId}/reviews`, data),
  deleteReview: (productId, reviewId) => API.delete(`/api/v1/products/${productId}/reviews/${reviewId}`),
  search: (data) => API.post('/api/v1/search', data),
};

// ==================== CART API ====================
export const cartAPI = {
  createCart: (data) => API.post('/api/v1/carts', data),
  getCart: (cartId) => API.get(`/api/v1/carts/${cartId}`),
  updateCartStatus: (cartId, status) => API.put(`/api/v1/carts/${cartId}/status?status=${status}`),
  deleteCart: (cartId) => API.delete(`/api/v1/carts/${cartId}`),
  mergeCart: (data) => API.post('/api/v1/carts/merge', data),
  getItems: (cartId) => API.get(`/api/v1/carts/${cartId}/items`),
  addItem: (cartId, data) => API.post(`/api/v1/carts/${cartId}/items`, data),
  updateItem: (cartId, itemId, data) => API.put(`/api/v1/carts/${cartId}/items/${itemId}`, data),
  removeItem: (cartId, itemId) => API.delete(`/api/v1/carts/${cartId}/items/${itemId}`),
  clearCart: (cartId) => API.delete(`/api/v1/carts/${cartId}/items`),
  checkout: (cartId, data) => API.post(`/api/v1/carts/${cartId}/checkout`, data),
  recoverCart: (cartId) => API.post(`/api/v1/carts/${cartId}/recover`),
};

// ==================== ORDER API ====================
export const orderAPI = {
  getOrders: (page = 0, size = 20, userId) => API.get('/api/v1/orders', { params: { page, size, userId } }),
  getOrder: (id) => API.get(`/api/v1/orders/${id}`),
  getOrderByNumber: (orderNumber) => API.get(`/api/v1/orders/number/${orderNumber}`),
  createOrder: (data) => API.post('/api/v1/orders', data),
  updateOrderStatus: (orderId, data) => API.put(`/api/v1/orders/${orderId}/status`, data),
  cancelOrder: (orderId) => API.put(`/api/v1/orders/${orderId}/cancel`),
  getAllOrders: (page, size) => API.get('/api/v1/orders', { params: { page, size } }),
};

// ==================== PAYMENT API ====================
export const paymentAPI = {
  processPayment: (data) => API.post('/api/v1/payments', data),
  getPayment: (paymentId) => API.get(`/api/v1/payments/${paymentId}`),
  verifyPayment: (orderId) => API.get(`/api/v1/payments/verify/${orderId}`),  // orderId used in path
  getUserPayments: (userId) => API.get(`/api/v1/payments/user/${userId}`),
  getOrderPayment: (orderId) => API.get(`/api/v1/payments/order/${orderId}`),
  refund: (paymentId, data) => API.post(`/api/v1/payments/${paymentId}/refund`, data),
};

// ==================== NOTIFICATION API ====================
// export const notificationAPI = {
//   sendEmail: (data) => NOTIFICATION_API.post('/api/v1/email/send', data),
//   sendOrderConfirmation: (data) => NOTIFICATION_API.post('/api/v1/email/order-confirmation', data),
//   sendOrderStatusUpdate: (data) => NOTIFICATION_API.post('/api/v1/email/order-status', data),
//   sendPaymentConfirmation: (data) => NOTIFICATION_API.post('/api/v1/email/payment-confirmation', data),
//   sendRefundEmail: (data) => NOTIFICATION_API.post('/api/v1/email/refund', data),
// };
export const notificationAPI = {
  sendEmail: (data) => API.post('/api/v1/email/send', data),
  sendOrderConfirmation: (data) => API.post('/api/v1/email/order-confirmation', data),
  sendOrderStatusUpdate: (data) => API.post('/api/v1/email/order-status', data),
  sendPaymentConfirmation: (data) => API.post('/api/v1/email/payment-confirmation', data),
  sendRefundEmail: (data) => API.post('/api/v1/email/refund', data),
};

export const addressAPI = {
  getAll: () => API.get('/api/addresses'),
  create: (data) => API.post('/api/addresses', data),
  update: (id, data) => API.put(`/api/addresses/${id}`, data),
  delete: (id) => API.delete(`/api/addresses/${id}`),
  setDefault: (id) => API.patch(`/api/addresses/${id}/default`),
};
export const profileAddressAPI = {
  getAll: () => API.get('/api/auth/addresses'),
  create: (data) => API.post('/api/auth/addresses', data),
  update: (id, data) => API.put(`/api/auth/addresses/${id}`, data),
  delete: (id) => API.delete(`/api/auth/addresses/${id}`),
  setDefault: (id) => API.patch(`/api/auth/addresses/${id}/default`),
};