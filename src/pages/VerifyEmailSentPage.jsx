import { useLocation, useNavigate } from 'react-router-dom';
import { FiMail, FiRefreshCw, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import api from '../api/services';
import { authAPI } from '../api/axios';

const VerifyEmailSentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const res = await api.post(`/auth/resend-verification?email=${encodeURIComponent(email)}`);
      setMessage(res.data?.message || 'Verification email resent successfully!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Poll verification status every 1 second and redirect when verified
  useEffect(() => {
    if (!email) return undefined;
    let mounted = true;
    const check = async () => {
      try {
        const res = await authAPI.checkVerification(email);
        const d = res?.data;
        let verified = false;
        if (d !== undefined) {
          if (typeof d === 'boolean') verified = d;
          else if (d.verified != null) verified = !!d.verified;
          else if (d.isVerified != null) verified = !!d.isVerified;
        }
        if (verified && mounted) {
          setMessage('Email verified — redirecting to login...');
          setTimeout(() => navigate('/login'), 500);
        }
      } catch (e) {
        // ignore errors while polling
      }
    };

    // run immediately, then every 1s
    check();
    const id = setInterval(check, 1000);
    return () => { mounted = false; clearInterval(id); };
  }, [email, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <FiMail className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Check Your Inbox</h1>
          <p className="text-gray-500 mt-2">We sent a verification link to</p>
          <p className="text-indigo-600 font-semibold text-lg mt-1">{email}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiMail className="text-4xl text-blue-500" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">Verify Your Email</h2>

          <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-3">📬 Next steps:</p>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Open your email inbox</li>
              <li>Find the email from <strong className="text-indigo-600">eKart</strong></li>
              <li>Click the <strong className="text-indigo-600">"Verify Email"</strong> button</li>
              <li>You'll be redirected back to login</li>
            </ol>
            <p className="text-xs text-gray-400 mt-3">
              💡 Check spam folder if you don't see it.
            </p>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm animate-fade-in flex items-center justify-center space-x-2">
              <FiCheckCircle className="text-green-500" />
              <span>{message}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="btn btn-primary btn-lg w-full disabled:opacity-50"
            >
              <FiRefreshCw className={resending ? 'animate-spin' : ''} />
              <span>{resending ? 'Sending...' : 'Resend Verification Email'}</span>
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-secondary btn-lg w-full"
            >
              <span>Go to Login</span>
              <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailSentPage;