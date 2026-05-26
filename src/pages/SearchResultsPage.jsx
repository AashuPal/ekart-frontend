import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productAPI } from '../api/axios';
import ProductCard from '../components/ProductCard';
import { FiSearch, FiFilter, FiX, FiChevronLeft, FiChevronRight, FiSliders } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [keyword, setKeyword] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadResults();
  }, [keyword, selectedCategory, selectedBrand, minPrice, maxPrice, sortBy, sortDir, page]);

  const loadFilters = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        productAPI.getCategories(),
        productAPI.getBrands(),
      ]);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setBrands(Array.isArray(brandRes.data) ? brandRes.data : []);
    } catch (err) {
      console.error('Failed to load filters:', err);
    }
  };

  const loadResults = async () => {
    setLoading(true);
    try {
      const searchData = {
        keyword: keyword || undefined,
        categoryId: selectedCategory || undefined,
        brandId: selectedBrand || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sortBy,
        sortDir,
        page,
        size: 20,
      };
      Object.keys(searchData).forEach(key => {
        if (searchData[key] === undefined) delete searchData[key];
      });
      const res = await productAPI.searchProducts(searchData);
      const data = res.data;
      setProducts(data.products || data || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || (data.products?.length || data.length || 0));
    } catch (err) {
      console.error('Search failed:', err);
      toast.error('Failed to search products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    loadResults();
  };

  const clearAllFilters = () => {
    setKeyword('');
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt');
    setSortDir('desc');
    setPage(0);
  };

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
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success(`${product.name} added to cart!`);
  };

  const activeFilters = [
    keyword, selectedCategory, selectedBrand, minPrice, maxPrice
  ].filter(Boolean).length;

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            {keyword ? `Results for "${keyword}"` : 'Search Products'}
          </h1>
          {!loading && (
            <p className="text-gray-500">
              {totalElements} product{totalElements !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search for products, brands, categories..."
              className="input pl-11 text-lg"
            />
            {keyword && (
              <button type="button" onClick={() => setKeyword('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <FiX />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary btn-lg">
            <FiSearch />
            <span className="hidden sm:inline">Search</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              showFilters ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiSliders />
            <span>Filters</span>
            {activeFilters > 0 && (
              <span className={`ml-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                showFilters ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'
              }`}>
                {activeFilters}
              </span>
            )}
          </button>
          <select
            value={`${sortBy}-${sortDir}`}
            onChange={(e) => { const [by, dir] = e.target.value.split('-'); setSortBy(by); setSortDir(dir); }}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium cursor-pointer"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="sellingPrice-asc">Price: Low to High</option>
            <option value="sellingPrice-desc">Price: High to Low</option>
            <option value="name-asc">Name: A-Z</option>
            <option value="name-desc">Name: Z-A</option>
          </select>
        </div>

        {showFilters && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6 animate-slide-down">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input text-sm">
                  <option value="">All Categories</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Brand</label>
                <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="input text-sm">
                  <option value="">All Brands</option>
                  {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Min Price</label>
                <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Max Price</label>
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="input text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPage(0)} className="btn btn-primary btn-sm">Apply</button>
              <button onClick={clearAllFilters} className="btn btn-ghost btn-sm">Clear All</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton h-80 rounded-2xl"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state animate-fade-in-up">
            <FiSearch className="empty-state-icon" />
            <h2 className="empty-state-title">No products found</h2>
            <p className="empty-state-description">Try adjusting your search criteria.</p>
            <button onClick={clearAllFilters} className="btn btn-primary">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 stagger-children">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-10">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="p-3 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                  <FiChevronLeft />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setPage(i)}
                    className={`w-10 h-10 rounded-xl font-medium text-sm transition-all ${
                      i === page ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                  className="p-3 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                  <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;