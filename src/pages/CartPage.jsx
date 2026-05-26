import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiArrowLeft, FiShoppingBag, FiHeart, FiShield, FiRotateCcw, FiCreditCard } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
    setLoading(false);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    const updated = cartItems.map(item =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );
    localStorage.setItem('cart', JSON.stringify(updated));
    setCartItems(updated);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (productId) => {
    const updated = cartItems.filter(item => item.productId !== productId);
    localStorage.setItem('cart', JSON.stringify(updated));
    setCartItems(updated);
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Item removed from cart');
  };

  const moveToWishlist = (item) => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (!wishlist.find(w => w.productId === item.productId)) {
      wishlist.push(item);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
    removeItem(item.productId);
    toast.success('Moved to wishlist');
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const shipping = subtotal > 500 ? 0 : 40;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  // Skeleton loading state
  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header skeleton */}
          <div className="skeleton h-9 w-60 rounded-lg mb-8 animate-fade-in"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items skeleton */}
            <div className="lg:col-span-2 space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 flex gap-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="skeleton w-32 h-32 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="skeleton h-5 w-3/4 rounded" />
                    <div className="skeleton h-4 w-1/4 rounded" />
                    <div className="flex justify-between items-end mt-4">
                      <div className="skeleton h-10 w-28 rounded-lg" />
                      <div className="skeleton h-6 w-20 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Summary skeleton */}
            <div className="bg-white rounded-2xl p-6 h-fit space-y-4 animate-fade-in">
              <div className="skeleton h-5 w-32 rounded" />
              <div className="space-y-2">
                <div className="flex justify-between"><div className="skeleton h-4 w-20 rounded" /><div className="skeleton h-4 w-16 rounded" /></div>
                <div className="flex justify-between"><div className="skeleton h-4 w-20 rounded" /><div className="skeleton h-4 w-16 rounded" /></div>
                <div className="flex justify-between"><div className="skeleton h-4 w-20 rounded" /><div className="skeleton h-4 w-16 rounded" /></div>
              </div>
              <div className="skeleton h-12 w-full rounded-xl mt-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="pt-16 min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="animate-float">
            <FiShoppingBag className="text-8xl text-gray-300 mx-auto mb-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Your cart is empty</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Looks like you haven't added any products to your cart yet. Explore our products and find something you love!
          </p>
          <Link
            to="/"
            className="btn btn-primary btn-lg inline-flex items-center space-x-2"
          >
            <FiArrowLeft />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-down">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Shopping Cart
            <span className="text-indigo-600 ml-2 text-lg font-medium">
              ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
            </span>
          </h1>
          <Link to="/" className="hidden sm:flex items-center space-x-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium">
            <FiArrowLeft />
            <span>Continue Shopping</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <div
                key={item.productId}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-all animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Link to={`/product/${item.productId}`} className="flex-shrink-0">
                  <img
                    src={item.imageUrl || 'https://placehold.co/150x150/E2E8F0/94A3B8?text=Product'}
                    alt={item.productName}
                    className="w-full sm:w-32 h-32 object-cover rounded-xl border border-gray-100 hover:scale-105 transition-transform"
                    onError={(e) => { e.target.src = 'https://placehold.co/150x150/E2E8F0/94A3B8?text=Product'; }}
                  />
                </Link>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <Link to={`/product/${item.productId}`} className="font-semibold text-gray-900 text-lg hover:text-indigo-600 transition-colors line-clamp-2">
                      {item.productName}
                    </Link>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all ml-2 flex-shrink-0"
                      title="Remove item"
                    >
                      <FiTrash2 className="text-lg" />
                    </button>
                  </div>
                  <p className="text-indigo-600 font-extrabold text-xl mt-2">
                    ₹{item.unitPrice?.toLocaleString('en-IN')}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-3">
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-2.5 hover:bg-gray-100 transition-colors text-gray-500"
                        disabled={item.quantity <= 1}
                      >
                        <FiMinus className="text-sm" />
                      </button>
                      <span className="px-4 py-2 font-bold text-gray-900 min-w-[3rem] text-center bg-gray-50">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-2.5 hover:bg-gray-100 transition-colors text-gray-500"
                      >
                        <FiPlus className="text-sm" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="font-extrabold text-gray-900 text-lg">
                        ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => moveToWishlist(item)}
                    className="mt-2 text-sm text-gray-400 hover:text-pink-500 flex items-center space-x-1.5 transition-colors w-fit"
                  >
                    <FiHeart className="text-sm" />
                    <span>Move to Wishlist</span>
                  </button>
                </div>
              </div>
            ))}

            <Link to="/" className="sm:hidden btn btn-secondary w-full mt-4">
              <FiArrowLeft />
              <span>Continue Shopping</span>
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
                Order Summary
              </h2>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-semibold' : 'font-semibold'}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (18%)</span>
                  <span className="font-semibold">₹{tax.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between text-lg font-extrabold">
                  <span>Total</span>
                  <span className="text-indigo-600">₹{total.toLocaleString('en-IN')}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-green-600 mt-2 bg-green-50 p-2.5 rounded-xl font-medium">
                    Add ₹{(500 - subtotal).toLocaleString('en-IN')} more for <strong>FREE</strong> shipping!
                  </p>
                )}
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3.5 rounded-xl font-bold mt-6 transition-all shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-300 flex items-center justify-center space-x-2"
              >
                <FiCreditCard />
                <span>Proceed to Checkout</span>
              </button>

              <div className="mt-5 space-y-3">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <FiShield className="text-green-500" />
                  <span>Secure checkout with SSL encryption</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <FiRotateCcw className="text-green-500" />
                  <span>Free returns within 30 days</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <FiCreditCard className="text-green-500" />
                  <span>Cash on delivery available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;