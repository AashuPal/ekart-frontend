// Application Constants

export const APP_NAME = 'eKart';
export const APP_DESCRIPTION = 'Your one-stop destination for all shopping needs';

// API Configuration – everything goes through the API Gateway
export const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY || 'http://localhost:8080';

// Optional: base URLs for individual services (for reference or direct debugging only)
export const API_BASE_URLS = {
  gateway: API_GATEWAY_URL,               // primary entry point for all services
  auth: API_GATEWAY_URL,
  product: API_GATEWAY_URL,
  cart: API_GATEWAY_URL,
  order: API_GATEWAY_URL,
  payment: API_GATEWAY_URL,
  notification: API_GATEWAY_URL,
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ORDER_STATUS.PROCESSING]: 'bg-blue-100 text-blue-800',
  [ORDER_STATUS.CONFIRMED]: 'bg-indigo-100 text-indigo-800',
  [ORDER_STATUS.SHIPPED]: 'bg-purple-100 text-purple-800',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'bg-orange-100 text-orange-800',
  [ORDER_STATUS.DELIVERED]: 'bg-green-100 text-green-800',
  [ORDER_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
  [ORDER_STATUS.RETURNED]: 'bg-gray-100 text-gray-800',
};

// Payment Methods
export const PAYMENT_METHODS = {
  COD: 'Cash on Delivery',
  CARD: 'Credit/Debit Card',
  UPI: 'UPI',
  NET_BANKING: 'Net Banking',
  WALLET: 'Wallet',
};

// Shipping
export const FREE_SHIPPING_THRESHOLD = 500;
export const STANDARD_SHIPPING_COST = 40;
export const TAX_PERCENTAGE = 18;

// Roles
export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  CART: 'cart',
  WISHLIST: 'wishlist',
  RECENTLY_VIEWED: 'recentlyViewed',
  COMPARE_LIST: 'compareList',
};