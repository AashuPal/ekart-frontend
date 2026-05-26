import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FiLock, FiCheckCircle, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import api from '../api/services';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in both fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post(
        `/auth/reset-password?token=${token}&newPassword=${encodeURIComponent(newPassword)}`
      );
      setMessage({ type: 'success', text: res.data.message || 'Password reset successfully!' });
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to reset password.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <FiLock className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 mt-2">Choose a new password for your account.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-start space-x-3 ${
                message.type === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-green-50 border border-green-200'
              } animate-fade-in`}
            >
              {message.type === 'success' ? (
                <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <FiAlertCircle className="text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm text-gray-700">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input pl-12"
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pl-12"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !token}
              className="btn btn-primary btn-lg w-full disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors font-medium"
            >
              <FiArrowLeft />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;