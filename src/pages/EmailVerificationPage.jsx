import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../api/axios';
import { FiCheckCircle, FiXCircle, FiLoader, FiMail } from 'react-icons/fi';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('No verification token provided.');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      await authAPI.verifyEmail(token);
      setStatus('success');
      setMessage('Your email has been verified successfully!');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Email verification failed. The link may have expired.');
    }
  };

  const handleResend = async () => {
    try {
      setStatus('verifying');
      await authAPI.API.post('/auth/resend-verification');
      setStatus('success');
      setMessage('Verification email resent. Please check your inbox.');
    } catch (err) {
      setStatus('error');
      setMessage('Failed to resend verification email.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <div className="bg-white rounded-3xl shadow-xl border p-8">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            status === 'verifying' ? 'bg-yellow-100' :
            status === 'success' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {status === 'verifying' && <FiLoader className="text-4xl text-yellow-500 animate-spin" />}
            {status === 'success' && <FiCheckCircle className="text-4xl text-green-500" />}
            {status === 'error' && <FiXCircle className="text-4xl text-red-500" />}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">
            {status === 'verifying' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h1>

          {/* Message */}
          <p className="text-gray-500 mb-8">{message}</p>

          {/* Actions */}
          <div className="space-y-3">
            {status === 'success' && (
              <Link to="/login" className="btn btn-primary btn-lg w-full">
                Go to Login
              </Link>
            )}
            {status === 'error' && (
              <>
                <button onClick={handleResend} className="btn btn-primary btn-lg w-full">
                  <FiMail />
                  <span>Resend Verification Email</span>
                </button>
                <Link to="/login" className="btn btn-secondary btn-lg w-full">
                  Back to Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;