// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/axios';
import { FiLoader } from 'react-icons/fi';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!token || !user) {
      setChecking(false);
      return () => { mounted = false; };
    }

    (async () => {
      try {
        const res = await authAPI.checkVerification(user.email || user.emailId);
        const d = res?.data;
        let isVerified = true;
        if (d !== undefined) {
          if (typeof d === 'boolean') isVerified = d;
          else if (d.verified != null) isVerified = !!d.verified;
          else if (d.isVerified != null) isVerified = !!d.isVerified;
        }
        if (mounted) setVerified(isVerified);
      } catch (e) {
        if (mounted) setVerified(true);
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => { mounted = false; };
  }, [token, user]);

  if (!token) return <Navigate to="/login" replace />;

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
            <FiLoader className="text-4xl text-yellow-500 animate-spin" />
          </div>
          <p className="text-gray-600">Checking account verification…</p>
        </div>
      </div>
    );
  }

  if (!verified) {
    const email = user?.email || user?.emailId || '';
    return <Navigate to="/verify-email-sent" state={{ email }} replace />;
  }

  return children;
};

export default ProtectedRoute;