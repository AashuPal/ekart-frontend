import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
          
          const tokenData = parseJwt(storedToken);
          if (tokenData && tokenData.exp * 1000 < Date.now()) {
            logout();
            toast.error('Session expired. Please login again.');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const login = useCallback(async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: newToken, ...userData } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);

      const guestCart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (guestCart.length > 0) {
        const userCartKey = `cart_${userData.email || userData.emailId}`;
        const userCart = JSON.parse(localStorage.getItem(userCartKey) || '[]');
        guestCart.forEach(guestItem => {
          const existing = userCart.find(item => item.productId === guestItem.productId);
          if (existing) {
            existing.quantity += guestItem.quantity;
          } else {
            userCart.push(guestItem);
          }
        });
        localStorage.setItem(userCartKey, JSON.stringify(userCart));
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cartUpdated'));
      }

      toast.success(`Welcome back, ${userData.name}!`);

      // After login, check whether email is verified. If not verified, inform caller.
      let verified = true;
      try {
        const checkRes = await authAPI.checkVerification(userData.email || userData.emailId);
        const d = checkRes?.data;
        if (d !== undefined) {
          if (typeof d === 'boolean') verified = d;
          else if (d.verified != null) verified = !!d.verified;
          else if (d.isVerified != null) verified = !!d.isVerified;
          else if (d.status != null) verified = String(d.status).toLowerCase() === 'verified';
        }
      } catch (e) {
        // if check fails, assume verified so we don't block login flow; backend should enforce protections
        verified = true;
      }

      // If email is not verified, attempt to resend verification email automatically
      if (!verified) {
        try {
          await authAPI.resendVerification(userData.email || userData.emailId);
          toast.success('Verification email resent. Check your inbox.');
        } catch (e) {
          // ignore resend errors; user can manually resend from the verification page
        }
      }

      return { success: true, verified };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Login failed. Please try again.';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      await authAPI.register(userData);
      toast.success('Registration successful! Please login.');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(() => {
    if (user) {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (cart.length > 0) {
        localStorage.setItem(`cart_${user.email || user.emailId}`, JSON.stringify(cart));
      }
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Logged out successfully');
  }, [user]);

  const updateUser = useCallback((updatedData) => {
    const newUserData = { ...user, ...updatedData };
    localStorage.setItem('user', JSON.stringify(newUserData));
    setUser(newUserData);
  }, [user]);

  // UPDATED: Flexible admin check
  const isAdmin = useCallback(() => {
    if (!user) return false;
    
    const role = user.role?.toUpperCase() || '';
    const email = (user.email || user.emailId || '').toLowerCase();
    
    // Check by role
    if (role === 'ROLE_ADMIN' || role === 'SUPER_ADMIN' || role === 'SUPER ADMIN') {
      return true;
    }
    
    // Check by email (fallback)
    if (email === 'admin@ekart.com' || email.includes('admin')) {
      return true;
    }
    
    return false;
  }, [user]);

  const isAuthenticated = useCallback(() => {
    return !!token && !!user;
  }, [token, user]);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAdmin,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};