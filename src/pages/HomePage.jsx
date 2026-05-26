import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { productAPI } from '../api/axios';
import {
  FiSearch, FiFilter, FiX, FiGrid, FiList,
  FiSliders, FiStar, FiTag, FiPackage, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// ---------- Hero slides with attractive background images ----------
const slides = [
  {
    id: 1,
    headline: 'Discover Premium Products',
    subline: 'Latest electronics, fashion & more – delivered to your doorstep.',
    bg: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
  },
  {
    id: 2,
    headline: 'New Summer Collection',
    subline: 'Up to 40% off on selected items. Limited time only.',
    bg: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
  },
  {
    id: 3,
    headline: 'Fast & Free Delivery',
    subline: 'Orders over ₹499 shipped free. Same day dispatch.',
    bg: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80',
  },
  {
    id: 4,
    headline: 'Top‑Rated Brands',
    subline: 'Shop from trusted brands with great reviews.',
    bg: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
  },
];

const HomePage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');

  // Hero slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  const pageSize = 20;

  // Auto‑advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Load categories & brands on mount
  useEffect(() => {
    loadCategories();
    loadBrands();
  }, []);

  // React to URL search changes (navbar sets ?search=...)
  useEffect(() => {
    const query = searchParams.get('search') || '';
    if (query !== searchQuery) {
      setSearchQuery(query);
      setCurrentPage(0);
    }
  }, [searchParams]);

  // Fetch products when filters, page or search change
  useEffect(() => {
    if (searchQuery || selectedCategory || selectedBrand || minPrice || maxPrice || minRating) {
      searchProducts();
    } else {
      loadProducts();
    }
  }, [currentPage, sortBy, sortDir, selectedCategory, selectedBrand, searchQuery, minPrice, maxPrice, minRating]);

  // ---------------- Data fetching (unchanged) ----------------
  const loadCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Categories load failed:', err);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await productAPI.getBrands();
      setBrands(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Brands load failed:', err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productAPI.getProducts(currentPage, pageSize, sortBy, sortDir);
      const data = response.data;
      if (data.products) {
        setProducts(data.products);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setProducts(data);
        setTotalPages(Math.ceil(data.length / pageSize));
        setTotalElements(data.length);
      }
    } catch (err) {
      setError('Failed to load products. Please try again.');
      console.error('Products load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productAPI.searchProducts({
        keyword: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
        brandId: selectedBrand || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        sortBy,
        sortDir,
        page: currentPage,
        size: pageSize,
      });
      const data = response.data;
      if (data.products) {
        setProducts(data.products);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(0);
    searchProducts();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setSortBy('createdAt');
    setSortDir('desc');
    setCurrentPage(0);
  };

  const activeFilterCount = [selectedCategory, selectedBrand, minPrice, maxPrice, minRating].filter(Boolean).length;

  const handleAddToCart = (product) => {
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
    toast.success(`${product.name} added to cart!`);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // ---------------- UI ----------------
  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-white">
      {/* ========== HERO SECTION (image slider, no search bar) ========== */}
      <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Dynamic background image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
          style={{ backgroundImage: `url(${slides[currentSlide].bg})` }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Animated blobs for extra depth */}
        <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-gradient-to-br from-blue-500/20 to-purple-500/10 rounded-full blur-3xl animate-pulse -z-5" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-gradient-to-tl from-emerald-500/10 to-cyan-500/20 rounded-full blur-3xl animate-pulse -z-5" />

        <div className="max-w-4xl mx-auto text-center px-4 py-16 relative z-10">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`transition-opacity duration-700 ${index === currentSlide ? 'opacity-100' : 'opacity-0 absolute inset-0 flex items-center justify-center pointer-events-none'
                }`}
              style={{ display: index === currentSlide ? 'block' : 'none' }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 leading-tight animate-fade-in-down">
                {slide.headline.split(' ').slice(0, -1).join(' ')}{' '}
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  {slide.headline.split(' ').pop()}
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-blue-100/80 mb-8 max-w-2xl mx-auto animate-fade-in-up">
                {slide.subline}
              </p>
            </div>
          ))}

          {/* Dot indicators */}
          <div className="flex justify-center space-x-2 mt-4">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentSlide ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ========== MAIN CONTENT (filters & product grid) ========== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toolbar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">
                {searchQuery || selectedCategory || selectedBrand ? 'Search Results' : 'All Products'}
              </h2>
              {totalElements > 0 && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {totalElements} products
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [by, dir] = e.target.value.split('-');
                  setSortBy(by);
                  setSortDir(dir);
                  setCurrentPage(0);
                }}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                <option value="createdAt-desc">🆕 Newest First</option>
                <option value="createdAt-asc">📅 Oldest First</option>
                <option value="sellingPrice-asc">💰 Price: Low to High</option>
                <option value="sellingPrice-desc">💎 Price: High to Low</option>
                <option value="name-asc">🔤 Name: A to Z</option>
                <option value="name-desc">🔤 Name: Z to A</option>
                <option value="averageRating-desc">⭐ Top Rated</option>
              </select>

              <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Grid view"
                >
                  <FiGrid className="text-sm" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="List view"
                >
                  <FiList className="text-sm" />
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${showFilters
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <FiSliders className="text-sm" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span
                    className={`ml-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${showFilters ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                      }`}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center space-x-1">
                    <FiTag className="text-xs" />
                    <span>Category</span>
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center space-x-1">
                    <FiPackage className="text-xs" />
                    <span>Brand</span>
                  </label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Brands</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>

                <div className="w-[120px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Min Price ₹</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="w-[120px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Max Price ₹</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="w-[140px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center space-x-1">
                    <FiStar className="text-xs" />
                    <span>Rating</span>
                  </label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4★ & above</option>
                    <option value="3">3★ & above</option>
                    <option value="2">2★ & above</option>
                    <option value="1">1★ & above</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleApplyFilters}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 whitespace-nowrap"
                  >
                    Apply
                  </button>
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center space-x-1"
                  >
                    <FiX className="text-xs" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedCategory && (
                    <span className="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      <span>{categories.find((c) => c.id === selectedCategory)?.name || 'Category'}</span>
                      <button onClick={() => setSelectedCategory('')} className="hover:text-blue-900">
                        <FiX className="text-xs" />
                      </button>
                    </span>
                  )}
                  {selectedBrand && (
                    <span className="inline-flex items-center space-x-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      <span>{brands.find((b) => b.id === selectedBrand)?.name || 'Brand'}</span>
                      <button onClick={() => setSelectedBrand('')} className="hover:text-purple-900">
                        <FiX className="text-xs" />
                      </button>
                    </span>
                  )}
                  {minPrice && (
                    <span className="inline-flex items-center space-x-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      <span>Min ₹{minPrice}</span>
                      <button onClick={() => setMinPrice('')} className="hover:text-green-900">
                        <FiX className="text-xs" />
                      </button>
                    </span>
                  )}
                  {maxPrice && (
                    <span className="inline-flex items-center space-x-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      <span>Max ₹{maxPrice}</span>
                      <button onClick={() => setMaxPrice('')} className="hover:text-green-900">
                        <FiX className="text-xs" />
                      </button>
                    </span>
                  )}
                  {minRating && (
                    <span className="inline-flex items-center space-x-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      <span>{minRating}★ & above</span>
                      <button onClick={() => setMinRating('')} className="hover:text-yellow-900">
                        <FiX className="text-xs" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading / Error / Products */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton rounded-2xl h-80"></div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button onClick={loadProducts} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {products.length === 0 ? (
              <div className="text-center py-20">
                <FiSearch className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                <button onClick={handleClearFilters} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children'
                    : 'space-y-4 stagger-children'
                }
              >
                {products.map((product) =>
                  viewMode === 'list' ? (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden flex animate-fade-in-up">
                      <img
                        src={product.thumbnailUrl || `https://placehold.co/200x200/E2E8F0/94A3B8?text=${encodeURIComponent(product.name || 'P')}`}
                        alt={product.name}
                        className="w-48 h-48 object-cover flex-shrink-0"
                        onError={(e) => { e.target.src = `https://placehold.co/200x200/E2E8F0/94A3B8?text=P`; }}
                      />
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            {product.categoryName && <span className="text-xs text-blue-600 font-medium">{product.categoryName}</span>}
                            {product.brandName && <span className="text-xs text-gray-400">• {product.brandName}</span>}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                          <div className="flex items-center space-x-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} className={`text-sm ${i < Math.round(product.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                            ))}
                            <span className="text-xs text-gray-500 ml-1">({product.reviewCount || 0})</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xl font-bold text-gray-900">₹{(product.sellingPrice || 0).toLocaleString()}</span>
                            {product.basePrice > product.sellingPrice && (
                              <span className="text-sm text-gray-400 line-through ml-2">₹{product.basePrice?.toLocaleString()}</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                  )
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8 pb-8">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <FiChevronLeft className="inline" /> Previous
                </button>
                <div className="flex space-x-1">
                  {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage > totalPages - 4) {
                      pageNum = totalPages - 7 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next <FiChevronRight className="inline" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;