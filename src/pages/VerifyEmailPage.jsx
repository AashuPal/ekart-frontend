import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FiMail, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api/services';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email') || '';
    setEmail(emailParam);

    if (!token) {
      setStatus('missing');
      setMessage('No verification token provided. Please request a new verification email.');
      return;
    }

    api.get(`/auth/verify?token=${token}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.data || 'Your email has been verified successfully!');
        setTimeout(() => navigate('/login'), 3000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification link is invalid or has expired.');
      });
  }, [searchParams, navigate]);

  const handleResendVerification = async (userEmail) => {
    if (!userEmail) {
      const promptEmail = prompt('Enter your email address to resend the verification link:');
      if (!promptEmail) return;
      userEmail = promptEmail;
      setEmail(userEmail);
    }

    setResending(true);
    try {
      const res = await api.post(`/auth/resend-verification?email=${encodeURIComponent(userEmail)}`);
      setStatus('resent');
      setMessage(res.data?.message || 'Verification email sent successfully! Check your inbox.');
      toast.success('Verification email sent!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to resend verification email.';
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <FiMail className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {status === 'verifying' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'resent' && 'Verification Sent!'}
            {(status === 'error' || status === 'missing') && 'Verification Needed'}
          </h1>
          <p className="text-gray-500 mt-2">
            {status === 'verifying' && 'Please wait while we verify your email address.'}
            {status === 'success' && 'Your account is now active.'}
            {status === 'resent' && 'Check your inbox for the verification link.'}
            {(status === 'error' || status === 'missing') && 'We need to verify your email address.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
          
          {/* Verifying State */}
          {status === 'verifying' && (
            <div className="animate-fade-in">
              <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Your Email</h2>
              <p className="text-gray-500">This will only take a moment...</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="animate-scale-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle className="text-4xl text-green-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-500 mb-6">{message}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
              <p className="text-sm text-gray-500 mb-4">Redirecting to login...</p>
              <button onClick={() => navigate('/login')} className="btn btn-primary btn-lg w-full">
                <span>Go to Login</span>
                <FiArrowRight />
              </button>
            </div>
          )}

          {/* Resent State */}
          {status === 'resent' && (
            <div className="animate-scale-in">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiMail className="text-4xl text-blue-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Verification Email Sent!</h2>
              <p className="text-gray-500 mb-2">{message}</p>
              <p className="text-sm text-gray-400 mb-6">
                Sent to: <strong className="text-indigo-600">{email}</strong>
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-gray-600 mb-1">📬 Check your inbox</p>
                <p className="text-xs text-gray-500">Click the verification link in the email to activate your account.</p>
                <p className="text-xs text-gray-400 mt-2">Didn't receive it? Check your spam folder.</p>
              </div>
              <button onClick={() => navigate('/login')} className="btn btn-secondary btn-lg w-full">
                Go to Login
              </button>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="animate-scale-in">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiAlertCircle className="text-4xl text-red-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Link Expired</h2>
              <p className="text-gray-500 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => handleResendVerification(email)}
                  disabled={resending}
                  className="btn btn-primary btn-lg w-full disabled:opacity-50"
                >
                  <FiRefreshCw className={resending ? 'animate-spin' : ''} />
                  <span>{resending ? 'Sending...' : email ? `Resend to ${email}` : 'Resend Verification Email'}</span>
                </button>
                <Link to="/login" className="btn btn-secondary btn-lg w-full">
                  Back to Login
                </Link>
              </div>
            </div>
          )}

          {/* Missing Token State */}
          {status === 'missing' && (
            <div className="animate-scale-in">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiMail className="text-4xl text-yellow-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">No Verification Token</h2>
              <p className="text-gray-500 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => handleResendVerification(email)}
                  disabled={resending}
                  className="btn btn-primary btn-lg w-full disabled:opacity-50"
                >
                  <FiRefreshCw className={resending ? 'animate-spin' : ''} />
                  <span>{resending ? 'Sending...' : 'Request New Verification Email'}</span>
                </button>
                <Link to="/login" className="btn btn-secondary btn-lg w-full">
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;