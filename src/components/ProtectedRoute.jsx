// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/axios';

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

  if (checking) return null;

  if (!verified) {
    const email = user?.email || user?.emailId || '';
    return <Navigate to="/verify-email-sent" state={{ email }} replace />;
  }

  return children;
};

export default ProtectedRoute;