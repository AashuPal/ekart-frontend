import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../api/axios';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiArrowLeft, FiMapPin, FiCalendar } from 'react-icons/fi';

const OrderTrackingPage = () => {
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

  const steps = [
    { key: 'PENDING', label: 'Order Placed', icon: FiClock, desc: 'Your order has been placed' },
    { key: 'CONFIRMED', label: 'Confirmed', icon: FiCheckCircle, desc: 'Order confirmed by seller' },
    { key: 'PROCESSING', label: 'Processing', icon: FiPackage, desc: 'Preparing your items' },
    { key: 'SHIPPED', label: 'Shipped', icon: FiTruck, desc: 'Package is on the way' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: FiTruck, desc: 'Package arriving today' },
    { key: 'DELIVERED', label: 'Delivered', icon: FiCheckCircle, desc: 'Package delivered successfully' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order?.status);
  const isCancelled = order?.status === 'CANCELLED';

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="skeleton skeleton-text w-48 mb-8 rounded-lg"></div>
          <div className="skeleton h-96 rounded-2xl mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="skeleton h-48 rounded-2xl"></div>
            <div className="skeleton h-48 rounded-2xl"></div>
          </div>
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
          <Link to="/orders" className="btn btn-primary">Back to Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Back Link */}
        <Link
          to="/orders"
          className="inline-flex items-center space-x-2 text-gray-500 hover:text-indigo-600 mb-6 transition-colors group"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Orders</span>
        </Link>

        {/* Header */}
        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Track Order</h1>
          <p className="text-gray-500 mt-1">
            {order.orderNumber || order.id} • <span className={isCancelled ? 'text-red-500' : 'text-indigo-600'}>{order.status}</span>
          </p>
        </div>

        {/* Cancelled Alert */}
        {isCancelled && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPackage className="text-3xl text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-2">Order Cancelled</h3>
            <p className="text-red-500">This order has been cancelled. The amount will be refunded if already paid.</p>
          </div>
        )}

        {/* Tracking Timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8 mb-8 animate-fade-in-up">
            <h3 className="font-bold text-gray-900 mb-8 flex items-center space-x-2">
              <FiTruck className="text-indigo-500" />
              <span>Delivery Timeline</span>
            </h3>

            <div className="space-y-0">
              {steps.map((step, i) => {
                const isCompleted = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;

                return (
                  <div key={step.key} className="flex items-start space-x-4">
                    {/* Timeline Dot & Line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted
                          ? isCurrent
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 animate-pulse-glow'
                            : 'bg-gradient-to-br from-green-400 to-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-300'
                        }`}>
                        <step.icon className="text-sm" />
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`w-0.5 h-10 ${isCompleted && i < currentStepIndex ? 'bg-green-400' : 'bg-gray-200'
                          }`}></div>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className={`pb-8 flex-1 ${isCompleted ? '' : 'opacity-50'}`}>
                      <p className={`font-semibold ${isCurrent ? 'text-indigo-600 text-lg' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                      {isCurrent && (
                        <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold animate-pulse">
                          Current Status
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">

          {/* Order Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center space-x-2">
              <FiCalendar className="text-indigo-500" />
              <span>Order Information</span>
            </h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Order Number', value: order.orderNumber || order.id },
                { label: 'Status', value: order.status, color: 'text-indigo-600 font-semibold' },
                { label: 'Payment Method', value: order.paymentMethod || 'N/A' },
                { label: 'Tracking Number', value: order.trackingNumber || 'Pending' },
                { label: 'Order Date', value: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={`font-medium ${item.color || 'text-gray-900'}`}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Delivery Address Section (NEW) */}
            {order.shippingAddress && (
              <>
                <hr className="my-4" />
                <h4 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <FiMapPin className="text-indigo-500" />
                  <span>Delivery Address</span>
                </h4>
                <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
                  <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.postalCode}</p>
                  {order.shippingAddress.phoneNumber && <p className="mt-1">📞 {order.shippingAddress.phoneNumber}</p>}
                </div>
              </>
            )}
          </div>

          {/* Items Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center space-x-2">
              <FiPackage className="text-indigo-500" />
              <span>Items ({order.items?.length || 0})</span>
            </h3>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.imageUrl || 'https://placehold.co/40x40/E2E8F0/94A3B8?text=P'}
                      alt={item.productName}
                      className="w-10 h-10 rounded-lg object-cover"
                      onError={(e) => { e.target.src = 'https://placehold.co/40x40/E2E8F0/94A3B8?text=P'; e.target.onerror = null; }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                      <p className="text-xs text-gray-500">×{item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm">₹{(item.totalPrice || item.unitPrice * item.quantity)?.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-extrabold text-indigo-600">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Tracking Info */}
        {order.trackingNumber && !isCancelled && (
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 text-center animate-fade-in-up">
            <FiMapPin className="text-3xl text-indigo-500 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Tracking Number</h3>
            <p className="text-2xl font-extrabold text-indigo-600 tracking-wider">{order.trackingNumber}</p>
            <p className="text-sm text-gray-500 mt-2">Use this number to track your package on the courier's website</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;