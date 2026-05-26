import { Link } from 'react-router-dom';
import { FiHome, FiSearch, FiAlertCircle } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center animate-fade-in-up px-4">
        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiAlertCircle className="text-5xl text-indigo-500" />
        </div>
        <h1 className="text-8xl font-extrabold text-gray-200 mb-4">404</h1>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/" className="btn btn-primary btn-lg">
            <FiHome />
            <span>Go Home</span>
          </Link>
          <Link to="/" className="btn btn-secondary btn-lg">
            <FiSearch />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;