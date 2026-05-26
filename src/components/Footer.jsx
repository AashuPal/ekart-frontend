import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiInstagram, FiTwitter, FiFacebook } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto relative">
      {/* Subtle top gradient border */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="animate-fade-in-up">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <span className="text-white font-bold text-xl">eK</span>
              </div>
              <span className="text-2xl font-extrabold text-white">eKart</span>
            </div>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              Your one‑stop destination for all shopping needs. Quality products, great prices, and fast delivery.
            </p>
            <div className="flex space-x-3">
              {[FiFacebook, FiTwitter, FiInstagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Home</Link></li>
              <li><Link to="/cart" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Cart</Link></li>
              <li><Link to="/wishlist" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Wishlist</Link></li>
              <li><Link to="/orders" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">My Orders</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-white font-semibold text-lg mb-4">Customer Service</h3>
            <ul className="space-y-2.5">
              <li><Link to="/profile" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">My Account</Link></li>
              <li><Link to="/orders" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Track Order</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Returns & Refunds</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Help Center</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:support@ekart.com" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-3">
                  <FiMail className="text-indigo-400 flex-shrink-0" />
                  <span>support@ekart.com</span>
                </a>
              </li>
              <li>
                <a href="tel:+919536969696" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-3">
                  <FiPhone className="text-indigo-400 flex-shrink-0" />
                  <span>+91 95369 69696</span>
                </a>
              </li>
              <li className="text-gray-400 text-sm flex items-start space-x-3">
                <FiMapPin className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>201003, Ghaziabad, Uttar Pradesh, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm">
          <p className="text-gray-500">
            © {new Date().getFullYear()} eKart. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link to="/privacy" className="text-gray-500 hover:text-white transition-colors duration-200">Privacy Policy</Link>
            <Link to="/terms" className="text-gray-500 hover:text-white transition-colors duration-200">Terms of Service</Link>
            <Link to="/shipping" className="text-gray-500 hover:text-white transition-colors duration-200">Shipping Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;