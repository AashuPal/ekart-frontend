import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FiHeart, FiShoppingCart, FiStar, FiUser, FiChevronLeft, FiMinus, FiPlus, FiTruck, FiShield, FiRotateCcw, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    loadProduct();
    loadReviews();
    window.scrollTo(0, 0);
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productAPI.getProduct(id);
      setProduct(response.data);
    } catch (err) {
      setError('Failed to load product details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await productAPI.getReviews(id);
      setReviews(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        skuId: product.sku || product.id,
        productName: product.name,
        imageUrl: product.thumbnailUrl,
        unitPrice: product.sellingPrice,
        quantity,
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success(`${product.name} added to cart!`);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  // Helper – place outside the component
  const emailToUUID = (email) => {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = ((hash << 5) - hash) + email.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(12, '0').slice(0, 12);
    return `00000000-0000-4000-8000-${hex}`;
  };

  // Inside the component
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to write a review');
      navigate('/login');
      return;
    }
    try {
      const userEmail = user.email || user.emailId || 'guest@ekart.com';
      const userId = emailToUUID(userEmail);   // proper UUID from email

      await productAPI.createReview(id, {
        userId: userId,                         // correct user UUID
        userName: user.name,
        ...reviewForm,
      });
      toast.success('Review submitted!');
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      loadReviews();
    } catch (err) {
      toast.error('Failed to submit review');
    }
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb skeleton */}
          <div className="skeleton h-4 w-48 rounded mb-6"></div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 sm:p-8">
              {/* Image skeleton */}
              <div>
                <div className="skeleton aspect-square w-full rounded-xl mb-4"></div>
                <div className="flex space-x-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton w-20 h-20 rounded-lg"></div>
                  ))}
                </div>
              </div>
              {/* Info skeleton */}
              <div className="space-y-4">
                <div className="skeleton h-4 w-24 rounded"></div>
                <div className="skeleton h-8 w-3/4 rounded"></div>
                <div className="skeleton h-5 w-32 rounded"></div>
                <div className="skeleton h-10 w-40 rounded"></div>
                <div className="skeleton h-20 w-full rounded"></div>
                <div className="skeleton h-10 w-32 rounded"></div>
                <div className="flex space-x-4">
                  <div className="skeleton h-12 flex-1 rounded-lg"></div>
                  <div className="skeleton h-12 flex-1 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="empty-state animate-fade-in-up">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="empty-state-title">Product Not Found</h2>
          <p className="empty-state-description">{error || 'The product you are looking for does not exist.'}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            <FiChevronLeft />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [product.thumbnailUrl || 'https://placehold.co/600x600/E2E8F0/94A3B8?text=Product'];
  const discount = product.discountPercentage ||
    (product.basePrice > product.sellingPrice ? Math.round(((product.basePrice - product.sellingPrice) / product.basePrice) * 100) : 0);

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6 animate-fade-in-down">
          <button onClick={() => navigate('/')} className="hover:text-indigo-600 transition-colors font-medium">Home</button>
          <span className="text-gray-300">/</span>
          {product.categoryName && (
            <>
              <span className="text-gray-400">{product.categoryName}</span>
              <span className="text-gray-300">/</span>
            </>
          )}
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 sm:p-8">

            {/* Product Images */}
            <div>
              <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-4 border border-gray-100">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = 'https://placehold.co/600x600/E2E8F0/94A3B8?text=Product'; }}
                />
              </div>
              {images.length > 1 && (
                <div className="flex space-x-3 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all hover:shadow-md ${selectedImage === index
                          ? 'border-indigo-600 shadow-md shadow-indigo-200'
                          : 'border-gray-200 opacity-60 hover:opacity-100'
                        }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              {/* Brand */}
              {product.brandName && (
                <span className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wider">
                  {product.brandName}
                </span>
              )}

              {/* Name */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`text-lg ${i < Math.round(product.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  ({product.reviewCount || 0} review{product.reviewCount !== 1 ? 's' : ''})
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline space-x-3 mb-6">
                <span className="text-4xl font-extrabold text-gray-900">
                  ₹{product.sellingPrice?.toLocaleString('en-IN')}
                </span>
                {product.basePrice > product.sellingPrice && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      ₹{product.basePrice?.toLocaleString('en-IN')}
                    </span>
                    <span className="badge badge-danger text-sm">{discount}% OFF</span>
                  </>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
              )}

              {/* Stock Status */}
              {product.stock && (
                <div className="mb-6">
                  {product.stock.availableQuantity > 10 ? (
                    <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="font-medium text-sm">
                        In Stock ({product.stock.availableQuantity} available)
                      </span>
                    </div>
                  ) : product.stock.availableQuantity > 0 ? (
                    <div className="inline-flex items-center space-x-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-xl">
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                      <span className="font-medium text-sm">
                        Only {product.stock.availableQuantity} left in stock!
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-2 bg-red-50 text-red-700 px-4 py-2 rounded-xl">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="font-medium text-sm">Out of Stock</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-gray-100 transition-colors text-gray-500"
                    disabled={quantity <= 1}
                  >
                    <FiMinus />
                  </button>
                  <span className="px-5 py-2 font-bold text-gray-900 min-w-[3rem] text-center bg-gray-50">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-gray-100 transition-colors text-gray-500"
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={handleAddToCart}
                  className="btn bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3.5 px-8 rounded-xl flex-1 flex items-center justify-center space-x-2 shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-300 transition-all"
                >
                  <FiShoppingCart />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  className="btn bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3.5 px-8 rounded-xl flex-1 shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 transition-all"
                >
                  Buy Now
                </button>
              </div>

              {/* Features */}
              <div className="border-t border-gray-100 pt-6 space-y-3 mt-auto">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FiTruck className="text-blue-600" />
                  </div>
                  <span>Free delivery on orders above ₹500</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <FiShield className="text-green-600" />
                  </div>
                  <span>1 Year Warranty</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <FiRotateCcw className="text-purple-600" />
                  </div>
                  <span>30 Days Return Policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mt-8 p-6 sm:p-8 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
              <p className="text-sm text-gray-500 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => {
                if (!user) {
                  toast.error('Please login to write a review');
                  navigate('/login');
                  return;
                }
                setShowReviewForm(!showReviewForm);
              }}
              className="btn btn-primary btn-sm"
            >
              <FiEdit2 />
              <span>Write a Review</span>
            </button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-2xl p-6 mb-8 animate-slide-down border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Share Your Experience</h3>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      <FiStar className={star <= reviewForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="input"
                  placeholder="Summary of your review"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Comment</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={4}
                  className="input"
                  placeholder="Share your experience with this product..."
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn btn-primary">Submit Review</button>
                <button type="button" onClick={() => setShowReviewForm(false)} className="btn btn-ghost border-2 border-gray-200">Cancel</button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <FiStar className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-bold text-sm">
                          {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{review.userName}</p>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`text-xs ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {review.title && (
                    <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                  )}
                  {review.comment && (
                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;