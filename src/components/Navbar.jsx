import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiShoppingCart, FiUser, FiHeart, FiMenu, FiX, FiSearch,
  FiLogOut, FiPackage, FiShield, FiChevronDown
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0));
    };

    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('storage', updateCartCount);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ✅ Search – navigates to HomePage with ?search= keyword
  // The HomePage already passes this keyword to the backend search API.
  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/');
    }
    setSearchQuery('');
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
    setShowUserDropdown(false);
    toast.success('Logged out successfully');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'shadow-2xl backdrop-blur-xl border-b border-white/10'
          : 'backdrop-blur-lg border-b border-transparent'
        }`}
      style={{
        background: isScrolled
          ? 'rgba(17, 24, 39, 0.85)'   // navy gray with high opacity when scrolled
          : 'rgba(17, 24, 39, 0.75)',   // slightly more transparent at top
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0 group">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-bold text-xl">eK</span>
            </div>
            <span className="text-2xl font-extrabold text-white hidden sm:block">
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                eKart
              </span>
            </span>
          </Link>

          {/* Search Bar – Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8">
            <div className="relative w-full group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands and more..."
                className="w-full px-4 py-2.5 pl-11 pr-4 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-white/50 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all text-sm backdrop-blur-sm"
              />
              <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-white/60 group-hover:text-white transition-colors" />
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2.5 text-white/80 hover:text-red-400 rounded-xl hover:bg-white/10 transition-all"
              title="Wishlist"
            >
              <FiHeart className="text-xl lg:text-2xl" />
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2.5 text-white/80 hover:text-indigo-400 rounded-xl hover:bg-white/10 transition-all"
              title="Cart"
            >
              <FiShoppingCart className="text-xl lg:text-2xl" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg animate-scale-in">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* User Menu or Login */}
            {user ? (
              <div className="relative user-dropdown">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-1.5 lg:space-x-2 text-white/90 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold hidden lg:block max-w-[80px] truncate">
                    {user.name?.split(' ')[0]}
                  </span>
                  <FiChevronDown
                    className={`text-xs transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {/* Dropdown */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 animate-scale-in overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email || user.emailId}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FiUser className="mr-3 text-gray-400" /> My Profile
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FiPackage className="mr-3 text-gray-400" /> My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FiHeart className="mr-3 text-gray-400" /> Wishlist
                      </Link>
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center px-4 py-2.5 text-sm text-indigo-700 hover:bg-indigo-50 font-medium transition-colors"
                        >
                          <FiShield className="mr-3 text-indigo-500" /> Admin Dashboard
                        </Link>
                      )}
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FiLogOut className="mr-3" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-white/20"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden animate-slide-down">
          <div
            className="px-4 py-4 space-y-4 border-t border-white/10"
            style={{ background: 'rgba(17, 24, 39, 0.95)' }}
          >
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2.5 pl-10 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-white/50 focus:border-indigo-400 focus:outline-none text-sm backdrop-blur-sm"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
            </form>

            <div className="space-y-1">
              <Link
                to="/cart"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 text-white/90 py-3 px-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <FiShoppingCart className="text-xl" />
                <span className="font-medium">Cart</span>
                {cartCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 text-white/90 py-3 px-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <FiHeart className="text-xl" />
                <span className="font-medium">Wishlist</span>
              </Link>
              <Link
                to="/orders"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 text-white/90 py-3 px-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <FiPackage className="text-xl" />
                <span className="font-medium">Orders</span>
              </Link>
            </div>

            <hr className="border-white/10" />

            {user ? (
              <div className="space-y-1">
                <div className="flex items-center space-x-3 py-3 px-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-white/70">{user.email || user.emailId}</p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 text-white/90 py-3 px-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <FiUser className="text-lg" />
                  <span>My Profile</span>
                </Link>
                {isAdmin() && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 text-indigo-300 py-3 px-2 rounded-lg hover:bg-white/10 font-medium transition-colors"
                  >
                    <FiShield className="text-lg" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 text-red-400 py-3 px-2 rounded-lg hover:bg-white/10 font-medium transition-colors"
                >
                  <FiLogOut className="text-lg" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full text-center bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Login / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;