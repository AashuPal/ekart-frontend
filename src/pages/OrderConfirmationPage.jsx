import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../api/axios';
import { FiCheckCircle, FiPackage, FiTruck, FiArrowRight, FiHome, FiClock, FiChevronRight } from 'react-icons/fi';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await orderAPI.getOrder(orderId);
      setOrder(res.data);
    } catch (err) {
      // Try by order number
      try {
        const res = await orderAPI.getOrderByNumber(orderId);
        setOrder(res.data);
      } catch (err2) {
        console.error('Failed to load order:', err2);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="skeleton w-20 h-20 rounded-full mx-auto mb-6"></div>
          <div className="skeleton skeleton-title w-64 mx-auto mb-4"></div>
          <div className="skeleton skeleton-text w-48 mx-auto mb-8"></div>
          <div className="skeleton w-full max-w-md h-64 rounded-2xl mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="empty-state animate-fade-in-up">
          <FiPackage className="empty-state-icon" />
          <h2 className="empty-state-title">Order Not Found</h2>
          <p className="empty-state-description">We couldn't find this order. It may have been removed or the link is invalid.</p>
          <Link to="/orders" className="btn btn-primary">View All Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        
        {/* Success Header */}
        <div className="text-center mb-10 animate-fade-in-down">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200 animate-scale-in">
            <FiCheckCircle className="text-5xl text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-500 text-lg">Thank you for your purchase</p>
        </div>

        {/* Order Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in-up">
          
          {/* Order Number & Status */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Order Number</p>
                <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{order.orderNumber || order.id}</p>
              </div>
              <span className="badge badge-success text-sm px-4 py-2">
                <FiCheckCircle className="mr-1" /> {order.status || 'CONFIRMED'}
              </span>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="p-6 sm:p-8 border-b">
            <div className="flex items-center justify-between">
              {[
                { label: 'Confirmed', icon: FiCheckCircle, done: true },
                { label: 'Processing', icon: FiPackage, done: true },
                { label: 'Shipped', icon: FiTruck, done: false },
                { label: 'Delivered', icon: FiCheckCircle, done: false },
              ].map((step, i) => (
                <div key={step.label} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${
                    step.done
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-200'
                      : 'bg-gray-100 text-gray-300'
                  }`}>
                    <step.icon />
                  </div>
                  <span className={`text-xs mt-2 font-medium ${step.done ? 'text-green-600' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            {/* Progress Bar */}
            <div className="relative mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full w-1/2 transition-all duration-700"></div>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-6 sm:p-8 border-b">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <FiPackage className="text-indigo-500" />
              <span>Order Items ({order.items?.length || 0})</span>
            </h3>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.imageUrl || 'https://placehold.co/56x56/E2E8F0/94A3B8?text=P'}
                      alt={item.productName}
                      className="w-14 h-14 rounded-xl object-cover border border-gray-100 shadow-sm"
                      onError={(e) => { e.target.src = 'https://placehold.co/56x56/E2E8F0/94A3B8?text=P'; e.target.onerror = null; }}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity} × ₹{item.unitPrice?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900">
                    ₹{(item.totalPrice || item.unitPrice * item.quantity)?.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-6 sm:p-8 bg-gray-50">
            <div className="space-y-2 text-sm max-w-sm ml-auto">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">₹{(order.subtotal || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium text-green-600">FREE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax (18%)</span>
                <span className="font-medium">₹{(order.tax || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200">
                <span>Total</span>
                <span className="text-indigo-600">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payment & Delivery Info */}
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-50 rounded-2xl text-center">
              <p className="text-xs text-indigo-500 font-semibold mb-1">Payment Method</p>
              <p className="text-indigo-700 font-bold">{order.paymentMethod || 'COD'}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl text-center">
              <p className="text-xs text-purple-500 font-semibold mb-1">Tracking</p>
              <p className="text-purple-700 font-bold">{order.trackingNumber || 'Pending'}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-2xl text-center">
              <p className="text-xs text-green-500 font-semibold mb-1">Est. Delivery</p>
              <p className="text-green-700 font-bold">3-5 Business Days</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 animate-fade-in-up">
          <Link to={`/order-tracking/${order.id}`} className="btn btn-primary btn-lg">
            <FiTruck />
            <span>Track Order</span>
            <FiArrowRight />
          </Link>
          <Link to="/orders" className="btn btn-secondary btn-lg">
            <FiClock />
            <span>My Orders</span>
          </Link>
          <Link to="/" className="btn btn-ghost btn-lg">
            <FiHome />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;