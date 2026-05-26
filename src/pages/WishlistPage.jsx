import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
    window.addEventListener('wishlistUpdated', loadWishlist);
    return () => window.removeEventListener('wishlistUpdated', loadWishlist);
  }, []);

  const loadWishlist = () => {
    const items = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlist(items);
    setLoading(false);
  };

  const removeFromWishlist = (productId) => {
    const updated = wishlist.filter(item => item.productId !== productId);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    setWishlist(updated);
    window.dispatchEvent(new Event('wishlistUpdated'));
    toast.success('Removed from wishlist');
  };

  const moveToCart = (item) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(c => c.productId === item.productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    removeFromWishlist(item.productId);
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Moved to cart!');
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="skeleton skeleton-title w-48 mb-8 rounded-lg"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="skeleton aspect-square rounded-xl mb-4"></div>
                <div className="skeleton h-5 w-3/4 rounded mb-2"></div>
                <div className="skeleton h-4 w-16 rounded mb-4"></div>
                <div className="flex space-x-2">
                  <div className="skeleton h-10 flex-1 rounded-lg"></div>
                  <div className="skeleton h-10 w-10 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-down">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <FiHeart className="text-red-500 text-xl" />
            </div>
            <span>My Wishlist</span>
            <span className="text-lg font-medium text-gray-400 ml-2">
              ({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})
            </span>
          </h1>
          <Link to="/" className="hidden sm:flex items-center space-x-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium">
            <FiArrowLeft />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Empty State */}
        {wishlist.length === 0 ? (
          <div className="empty-state animate-fade-in-up">
            <div className="animate-float">
              <FiHeart className="empty-state-icon text-red-200" />
            </div>
            <h2 className="empty-state-title">Your wishlist is empty</h2>
            <p className="empty-state-description">
              Save items you love to your wishlist and they'll appear here. Start exploring our products!
            </p>
            <Link to="/" className="btn btn-primary btn-lg">
              <FiArrowLeft />
              <span>Browse Products</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {wishlist.map((item) => (
              <div key={item.productId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all animate-fade-in-up group">
                <Link to={`/product/${item.productId}`} className="block">
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={item.imageUrl || 'https://placehold.co/400x400/E2E8F0/94A3B8?text=Product'}
                      alt={item.productName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://placehold.co/400x400/E2E8F0/94A3B8?text=Product'; }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {item.productName}
                    </h3>
                    <p className="text-lg font-extrabold text-indigo-600">
                      ₹{item.unitPrice?.toLocaleString('en-IN')}
                    </p>
                  </div>
                </Link>
                <div className="px-4 pb-4 flex space-x-2">
                  <button
                    onClick={() => moveToCart(item)}
                    className="btn btn-primary flex-1 btn-sm"
                  >
                    <FiShoppingCart />
                    <span>Move to Cart</span>
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="btn btn-ghost p-2 border-2 border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 rounded-xl flex-shrink-0"
                    title="Remove from wishlist"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;