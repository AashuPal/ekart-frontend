import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiLoader, FiArrowLeft } from 'react-icons/fi';

const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setStatus('error');
      setErrorMsg('No authorization code received.');
      return;
    }

    // Use relative URL – Vite proxy will forward to the backend
    fetch('/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Google login failed');
        }
        return res.json();
      })
      .then((data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          email: data.email,
          name: data.name,
          phoneNumber: data.phoneNumber,
          role: data.role,
        }));
        setStatus('success');
        setTimeout(() => navigate('/'), 0);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.message);
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 pt-20">
      <div className="max-w-md w-full animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-3xl">eK</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
          {status === 'processing' && (
            <>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiLoader className="text-4xl text-yellow-500 animate-spin" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Signing you in…</h2>
              <p className="text-gray-500">Please wait while we complete your Google sign-in.</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle className="text-4xl text-green-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Successfully Signed In!</h2>
              <p className="text-gray-500">Redirecting to homepage…</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiXCircle className="text-4xl text-red-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Sign In Failed</h2>
              <p className="text-gray-500 mb-6">{errorMsg}</p>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary btn-lg w-full"
              >
                <FiArrowLeft />
                <span>Back to Login</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleCallbackPage;