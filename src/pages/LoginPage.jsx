import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/services';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiPhone, FiKey, FiArrowRight } from 'react-icons/fi';

const LoginPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Email Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, ...user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Welcome back! 🎉');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Google Login
  const handleGoogleLogin = () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google OAuth client is not configured. Set VITE_GOOGLE_CLIENT_ID in your environment.');
      return;
    }

    const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=openid email profile&access_type=offline&prompt=consent`;
  };

  // Send OTP
  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post(`/auth/otp?phone=${encodeURIComponent('+91' + phone)}`);
      setOtpSent(true);
      toast.success('OTP sent!');
    } catch (err) {
      setError('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post(`/auth/otp/verify?phone=${encodeURIComponent('+91' + phone)}&otp=${otp}`);
      const { token, ...user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Welcome! 📱');
      navigate('/');
    } catch (err) {
      setError('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden pt-16">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60rem] h-[60rem] bg-gradient-to-br from-blue-400/20 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50rem] h-[50rem] bg-gradient-to-tl from-emerald-400/20 to-cyan-500/10 rounded-full blur-3xl animate-pulse" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="glass rounded-3xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-2xl">eK</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 mt-1">Sign in to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm animate-fade-in">
              {error}
            </div>
          )}

          {/* Tabs - Only 2 */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            <button onClick={() => { setTab('email'); setError(''); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                tab === 'email' ? 'bg-white shadow-lg text-blue-600' : 'text-gray-500'
              }`}>
              <FiMail className="text-sm" />
              <span>Email / Google</span>
            </button>
            <button onClick={() => { setTab('phone'); setError(''); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                tab === 'phone' ? 'bg-white shadow-lg text-blue-600' : 'text-gray-500'
              }`}>
              <FiPhone className="text-sm" />
              <span>Phone OTP</span>
            </button>
          </div>

          {/* Email / Google Tab */}
          {tab === 'email' && (
            <div className="space-y-5 animate-fade-in-up">
              {/* Google Button */}
              <button onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-200 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all group">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-semibold text-gray-700">Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/80 text-gray-500">or sign in with email</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="Email address" className="input pl-12" />
                </div>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Password" className="input pl-12" />
                </div>
                <button type="submit" disabled={loading}
                  className="btn btn-primary w-full py-3 disabled:opacity-50">
                  {loading ? 'Signing in...' : 'Sign In'}
                  <FiArrowRight />
                </button>
              </form>
            </div>
          )}

          {/* Phone OTP Tab */}
          {tab === 'phone' && (
            <div className="space-y-5 animate-fade-in-up">
              <div className="flex">
                <span className="inline-flex items-center px-4 bg-gray-100 border-2 border-r-0 rounded-xl rounded-r-none text-gray-600 font-semibold">+91</span>
                <input type="tel" placeholder="Enter phone number" value={phone} onChange={e => setPhone(e.target.value)}
                  className="input flex-1 rounded-l-none border-l-0" />
              </div>

              {!otpSent ? (
                <button onClick={handleSendOtp} disabled={loading}
                  className="btn btn-success w-full py-3 disabled:opacity-50">
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              ) : (
                <>
                  <div className="relative">
                    <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)}
                      maxLength={6} className="input pl-12 text-center text-lg tracking-[0.5em]" />
                  </div>
                  <button onClick={handleVerifyOtp} disabled={loading}
                    className="btn btn-primary w-full py-3 disabled:opacity-50">
                    {loading ? 'Verifying...' : 'Verify & Login'}
                    <FiArrowRight />
                  </button>
                  <button onClick={() => setOtpSent(false)} className="w-full text-sm text-blue-600 hover:underline">
                    ← Change phone number
                  </button>
                </>
              )}
            </div>
          )}

          <div className="mt-8 text-center text-sm text-gray-500 space-x-2">
            <Link to="/register" className="text-blue-600 hover:underline font-semibold">Create account</Link>
            <span>|</span>
            <Link to="/forgot-password" className="text-blue-600 hover:underline font-semibold">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;