import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ProductCard = ({ product, onAddToCart, onToggleWishlist, isWishlisted, loading = false }) => {
  // Internal wishlist state when no prop is passed
  const [internalWishlisted, setInternalWishlisted] = useState(false);

  // Sync internal state with localStorage (and respond to external updates)
  useEffect(() => {
    const checkWishlist = () => {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setInternalWishlisted(wishlist.some(item => item.productId === product.id));
    };
    checkWishlist();
    window.addEventListener('wishlistUpdated', checkWishlist);
    return () => window.removeEventListener('wishlistUpdated', checkWishlist);
  }, [product.id]);

  // Use the prop if explicitly provided, otherwise the auto‑detected state
  const displayWishlisted = isWishlisted !== undefined ? isWishlisted : internalWishlisted;

  // Skeleton loading state
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in">
        <div className="skeleton aspect-square w-full" />
        <div className="p-4 space-y-2">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-5 w-full rounded" />
          <div className="skeleton h-4 w-16 rounded" />
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-4 w-4 rounded-full" />
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <div className="skeleton h-6 w-24 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItem = cart.find(item => item.productId === product.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          productId: product.id,
          skuId: product.sku || product.id,
          productName: product.name,
          imageUrl: product.thumbnailUrl,
          unitPrice: product.sellingPrice,
          quantity: 1,
        });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success(`${product.name} added to cart!`);
    }
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product);
    } else {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const existingIndex = wishlist.findIndex(item => item.productId === product.id);
      if (existingIndex >= 0) {
        wishlist.splice(existingIndex, 1);
        toast.success('Removed from wishlist');
        setInternalWishlisted(false);        // instant red → grey
      } else {
        wishlist.push({
          productId: product.id,
          skuId: product.sku || product.id,
          productName: product.name,
          imageUrl: product.thumbnailUrl,
          unitPrice: product.sellingPrice,
        });
        toast.success('Added to wishlist!');
        setInternalWishlisted(true);         // instant grey → red
      }
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      window.dispatchEvent(new Event('wishlistUpdated'));
    }
  };

  const discount = product.basePrice > product.sellingPrice
    ? Math.round(((product.basePrice - product.sellingPrice) / product.basePrice) * 100)
    : product.discountPercentage || 0;

  return (
    <Link
      to={`/product/${product.id}`}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden aspect-square bg-gray-100">
        <img
          src={product.thumbnailUrl || `https://placehold.co/400x400/EEE/999?text=${encodeURIComponent(product.name || 'Product')}`}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.src = `https://placehold.co/400x400/EEE/999?text=${encodeURIComponent(product.name || 'No Image')}`;
            e.target.onerror = null;
          }}
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
            {discount}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all ${displayWishlisted
              ? 'bg-red-500 text-white'
              : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white'
            }`}
          aria-label={displayWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <FiHeart className={`${displayWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Add to Cart Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            className="w-full bg-white text-gray-900 py-2.5 rounded-xl font-semibold hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center space-x-2 text-sm shadow-md"
          >
            <FiShoppingCart />
            <span>Add to Cart</span>
          </button>
        </div>

        {/* Stock Status */}
        {product.stock && (
          <div className="absolute bottom-3 left-3">
            {product.stock.availableQuantity > 10 ? (
              <span className="bg-green-500/90 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                In Stock
              </span>
            ) : product.stock.availableQuantity > 0 ? (
              <span className="bg-orange-500/90 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                Only {product.stock.availableQuantity} left!
              </span>
            ) : (
              <span className="bg-red-500/90 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                Out of Stock
              </span>
            )}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Category */}
        {product.categoryName && (
          <span className="text-xs text-indigo-600 font-semibold mb-1 uppercase tracking-wide">
            {product.categoryName}
          </span>
        )}

        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem] text-sm sm:text-base group-hover:text-indigo-600 transition-colors">
          {product.name}
        </h3>

        {/* Brand */}
        {product.brandName && (
          <p className="text-xs text-gray-400 mb-2">{product.brandName}</p>
        )}

        {/* Rating */}
        <div className="flex items-center space-x-1 mb-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <FiStar
                key={i}
                className={`text-xs sm:text-sm ${i < Math.round(product.averageRating || 0)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                  }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            ({product.reviewCount || 0})
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto flex items-center space-x-2">
          <span className="text-lg sm:text-xl font-extrabold text-gray-900">
            ₹{(product.sellingPrice || 0).toLocaleString('en-IN')}
          </span>
          {product.basePrice > product.sellingPrice && (
            <span className="text-sm text-gray-400 line-through">
              ₹{(product.basePrice || 0).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Mobile Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="mt-3 sm:hidden w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 text-sm shadow-md shadow-indigo-200"
        >
          <FiShoppingCart />
          <span>Add to Cart</span>
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;