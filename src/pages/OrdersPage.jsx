import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../api/axios';
import { FiPackage, FiEye, FiTruck, FiClock, FiXCircle, FiCheckCircle, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Helper: generate a consistent UUID from email (required by backend for userId)
const emailToUUID = (email) => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0').slice(0, 12);
  return `00000000-0000-4000-8000-${hex}`;
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const email = userData.email || userData.emailId || 'guest@ekart.com';
      const userId = emailToUUID(email);  // generate UUID from email

      const res = await orderAPI.getOrders(0, 50, userId);
      const data = res.data.orders || res.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error('Could not load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      'PENDING': <FiClock className="text-yellow-500" />,
      'PROCESSING': <FiPackage className="text-blue-500" />,
      'CONFIRMED': <FiCheckCircle className="text-green-500" />,
      'SHIPPED': <FiTruck className="text-indigo-500" />,
      'OUT_FOR_DELIVERY': <FiTruck className="text-purple-500" />,
      'DELIVERED': <FiCheckCircle className="text-green-600" />,
      'CANCELLED': <FiXCircle className="text-red-500" />,
    };
    return icons[status] || <FiClock className="text-gray-400" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'DELIVERED': 'badge-success',
      'SHIPPED': 'bg-blue-100 text-blue-700',
      'OUT_FOR_DELIVERY': 'bg-purple-100 text-purple-700',
      'CONFIRMED': 'bg-teal-100 text-teal-700',
      'PROCESSING': 'bg-indigo-100 text-indigo-700',
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'CANCELLED': 'badge-danger',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="skeleton skeleton-title w-48 mb-8 rounded-lg"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-40 rounded-2xl" style={{ animationDelay: `${i * 0.1}s` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Header */}
        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="empty-state animate-fade-in-up">
            <FiPackage className="empty-state-icon" />
            <h2 className="empty-state-title">No orders yet</h2>
            <p className="empty-state-description">You haven't placed any orders yet. Start shopping and your orders will appear here.</p>
            <Link to="/" className="btn btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4 stagger-children">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all animate-fade-in-up">
                
                {/* Order Header */}
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-gray-50 to-white border-b">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <p className="font-bold text-gray-900">{order.orderNumber || order.id?.substring(0, 12)}</p>
                      <p className="text-xs text-gray-500">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'Date not available'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Order Items Preview */}
                <div className="p-5 sm:p-6">
                  <div className="space-y-3">
                    {order.items?.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.imageUrl || 'https://placehold.co/44x44/E2E8F0/94A3B8?text=P'}
                            alt={item.productName}
                            className="w-11 h-11 rounded-xl object-cover border border-gray-100"
                            onError={(e) => { e.target.src = 'https://placehold.co/44x44/E2E8F0/94A3B8?text=P'; e.target.onerror = null; }}
                          />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-sm">₹{(item.totalPrice || item.unitPrice * item.quantity)?.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-sm text-indigo-600 font-medium text-center">
                        +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Footer */}
                <div className="p-5 sm:p-6 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-3 border-t">
                  <div>
                    <span className="text-sm text-gray-500">Total: </span>
                    <span className="text-lg font-extrabold text-indigo-600">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <Link
                    to={`/order-tracking/${order.id}`}
                    className="btn btn-primary btn-sm group"
                  >
                    <FiEye />
                    <span>View Details</span>
                    <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;