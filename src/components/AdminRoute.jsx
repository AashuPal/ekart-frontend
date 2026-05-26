// src/components/AdminRoute.jsx
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // Normalise role: remove ROLE_ prefix, uppercase
  const role = (user.role || '').toUpperCase().replace('ROLE_', '');
  
  if (role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default AdminRoute;