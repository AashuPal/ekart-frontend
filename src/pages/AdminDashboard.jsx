import { useState, useEffect } from 'react';
import { productAPI, orderAPI, authAPI, notificationAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from '../api/axios';
import API from '../api/axios';
import {
  FiPackage, FiGrid, FiTag, FiUsers, FiDollarSign,
  FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiEye, FiTruck, FiShoppingBag,
  FiUserCheck, FiClock, FiMapPin, FiTrendingUp, FiActivity, FiUser, FiMail
} from 'react-icons/fi';

// Helper: generate a consistent UUID from email (for userId where backend expects UUID)
const emailToUUID = (email) => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0').slice(0, 12);
  return `00000000-0000-4000-8000-${hex}`;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Order status modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // User role modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  // View user orders modal (new)
  const [userOrdersModal, setUserOrdersModal] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [viewingUser, setViewingUser] = useState(null);

  const isSuperAdmin =
    (user?.email === 'admin@ekart.com' || user?.emailId === 'admin@ekart.com') &&
    (user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN');

  // User detail modal (read‑only)
  const [userDetailModal, setUserDetailModal] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  // Product form
  const [productForm, setProductForm] = useState({
    name: '', description: '', sku: '', basePrice: '', sellingPrice: '',
    discountPercentage: '', categoryId: '', brandId: '', thumbnailUrl: '',
    initialStock: '', status: 'ACTIVE'
  });

  // Category form
  const [categoryForm, setCategoryForm] = useState({
    name: '', description: '', imageUrl: '', parentId: '', sortOrder: ''
  });

  // Brand form
  const [brandForm, setBrandForm] = useState({
    name: '', description: '', logoUrl: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, [currentPage]);

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'users') loadUsers();
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadProducts(), loadCategories(), loadBrands(), loadOrders()]);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await productAPI.getProducts(currentPage, 20);
      setProducts(res.data.products || res.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalProducts(data.totalElements || data.totalItems || productList.length);
    } catch (err) { console.error('Products:', err); }
  };

  const loadCategories = async () => {
    try {
      const res = await productAPI.getCategories();
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error('Categories:', err); }
  };

  const loadBrands = async () => {
    try {
      const res = await productAPI.getBrands();
      setBrands(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error('Brands:', err); }
  };

  const loadOrders = async () => {
    setTabLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const role = (storedUser.role || '').replace('ROLE_', '').toUpperCase();
      const isAdmin = role === 'ADMIN';

      let res;
      if (isAdmin) {
        // Admin → call getAllOrders (headers added automatically)
        res = await orderAPI.getAllOrders(0, 100);
      } else {
        // Regular user → use existing user-specific endpoint
        const email = storedUser.email || storedUser.emailId || '';
        const userId = emailToUUID(email);
        res = await orderAPI.getOrders(0, 100, userId);
      }

      // Extract orders (OrderListResponse.orders or plain array)
      let ordersList = [];
      if (res.data && Array.isArray(res.data.orders)) {
        ordersList = res.data.orders;
      } else if (Array.isArray(res.data)) {
        ordersList = res.data;
      } else if (res.data && Array.isArray(res.data.content)) {
        ordersList = res.data.content;
      }

      setOrders(ordersList);

      const revenue = ordersList
        .filter(o => o.status === 'DELIVERED' || o.status === 'CONFIRMED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      setTotalRevenue(revenue);
    } catch (err) {
      console.error('Orders load error', err);
      toast.error('Failed to load orders');
    } finally {
      setTabLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/auth/users', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Users:', err);
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      setUsers(stored ? [stored] : []);
    } finally {
      setTabLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchTerm('');
    if (tab !== 'dashboard') {
      setTabLoading(true);
      setTimeout(() => setTabLoading(false), 500);
    }
  };

  // ============ MODAL HANDLERS ============
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    if (type === 'product') {
      setProductForm(item ? {
        name: item.name || '', description: item.description || '', sku: item.sku || '',
        basePrice: item.basePrice || '', sellingPrice: item.sellingPrice || '',
        discountPercentage: item.discountPercentage || '', categoryId: item.categoryId || '',
        brandId: item.brandId || '', thumbnailUrl: item.thumbnailUrl || '',
        initialStock: '', status: item.status || 'ACTIVE',
      } : { name: '', description: '', sku: '', basePrice: '', sellingPrice: '', discountPercentage: '', categoryId: '', brandId: '', thumbnailUrl: '', initialStock: '', status: 'ACTIVE' });
    } else if (type === 'category') {
      setCategoryForm(item ? { name: item.name || '', description: item.description || '', imageUrl: item.imageUrl || '', parentId: item.parentId || '', sortOrder: item.sortOrder || '' } : { name: '', description: '', imageUrl: '', parentId: '', sortOrder: '' });
    } else if (type === 'brand') {
      setBrandForm(item ? { name: item.name || '', description: item.description || '', logoUrl: item.logoUrl || '' } : { name: '', description: '', logoUrl: '' });
    }
    setShowModal(true);
  };

  // ============ SAVE HANDLERS ============
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: productForm.name, description: productForm.description, sku: productForm.sku,
        basePrice: parseFloat(productForm.basePrice), sellingPrice: parseFloat(productForm.sellingPrice),
        discountPercentage: parseInt(productForm.discountPercentage) || 0,
        categoryId: productForm.categoryId || null, brandId: productForm.brandId || null,
        thumbnailUrl: productForm.thumbnailUrl || null, status: productForm.status || 'ACTIVE',
      };
      if (editingItem) {
        await productAPI.updateProduct(editingItem.id, data);
        toast.success('Product updated!');
      } else {
        data.initialStock = parseInt(productForm.initialStock) || 0;
        await productAPI.createProduct(data);
        toast.success('Product created!');
      }
      setShowModal(false); setEditingItem(null); loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const data = { ...categoryForm, sortOrder: parseInt(categoryForm.sortOrder) || 0, parentId: categoryForm.parentId || null };
      if (editingItem) {
        await productAPI.updateCategory(editingItem.id, data);
        toast.success('Category updated!');
      } else {
        await productAPI.createCategory(data);
        toast.success('Category created!');
      }
      setShowModal(false); loadCategories();
    } catch (err) { toast.error('Failed to save category'); }
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    try {
      await productAPI.createBrand(brandForm);
      toast.success('Brand created!');
      setShowModal(false); loadBrands();
    } catch (err) { toast.error('Failed to save brand'); }
  };

  // ============ DELETE HANDLER ============
  const handleDelete = async (type, id) => {
    try {
      if (type === 'product') await productAPI.deleteProduct(id);
      else if (type === 'category') await productAPI.deleteCategory(id);
      toast.success(`${type} deleted!`);
      setDeleteConfirm(null); loadDashboardData();
    } catch (err) { toast.error(`Failed to delete ${type}`); }
  };
  const handleDeleteBrand = async (brandId) => {
    if (!window.confirm('Delete this brand?')) return;
    try {
      await productAPI.deleteBrand(brandId);
      toast.success('Brand deleted');
      loadBrands(); // refresh list
    } catch (err) {
      toast.error('Failed to delete brand');
    }
  };

  // ============ ORDER HANDLERS (with email notification) ============
  const handleUpdateOrderStatus = async () => {
    try {
      await orderAPI.updateOrderStatus(selectedOrder.id, {
        status: newStatus,
        trackingNumber: trackingNumber || undefined
      });

      // Send email notification
      try {
        await notificationAPI.sendOrderStatusUpdate({
          to: selectedOrder.userEmail,
          customerName: selectedOrder.userName,
          orderNumber: selectedOrder.orderNumber,
          status: newStatus,
          trackingNumber: trackingNumber || ''
        });
      } catch (emailErr) {
        console.warn('Email notification failed', emailErr);
      }

      toast.success(`Order status updated to ${newStatus}!`);
      setShowStatusModal(false);
      loadOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await orderAPI.cancelOrder(orderId);
      toast.success('Order cancelled');
      loadOrders();
    } catch (err) { toast.error('Failed to cancel'); }
  };

  // ============ USER HANDLERS (role & view orders & details) ============
  const handleUpdateUserRole = async () => {
    const email = selectedUser.email || selectedUser.emailId;
    if (!email) return toast.error('Email not found');

    // Strip any accidental prefix (just in case)
    const plainRole = newRole.replace(/^ROLE_/, '');
    const roleToSend = `ROLE_${plainRole}`;
    const adminEmail = 'admin@ekart.com';   // match your working curl

    console.log('🔍 Role update debug:');
    console.log('Target email:', email);
    console.log('Current newRole state:', newRole);
    console.log('Plain role:', plainRole);
    console.log('Will send role:', roleToSend);
    console.log('Admin header email:', adminEmail);

    // Safety: if role isn't changing, warn user
    const currentUserRole = (selectedUser.role || '').replace(/^ROLE_/, '');
    if (plainRole === currentUserRole) {
      toast.error(`User already has role ${plainRole}. No change needed.`);
      return;
    }

    try {
      const res = await fetch(
        `/auth/users/${encodeURIComponent(email)}/role?role=${encodeURIComponent(roleToSend)}`,
        {
          method: 'PUT',
          headers: {
            'X-User-Email': adminEmail,
            'X-User-Role': 'ROLE_ADMIN',
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Response status:', res.status);
      const responseText = await res.text();
      console.log('Response body:', responseText);

      if (res.ok) {
        toast.success(`Role updated to ${plainRole}`);
        setShowRoleModal(false);
        loadUsers();

        // Reload if own role changed
        const currentEmail = (user?.email || user?.emailId || '').toLowerCase();
        const targetEmail = (selectedUser.email || selectedUser.emailId || '').toLowerCase();
        if (currentEmail === targetEmail) {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          storedUser.role = plainRole;
          localStorage.setItem('user', JSON.stringify(storedUser));
          window.dispatchEvent(new Event('storage'));
          toast.success('Your own role has changed. Reloading...');
          setTimeout(() => window.location.reload(), 2000);
        }
      } else {
        toast.error(`Failed: ${responseText || res.status}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error – see console');
    }
  };

  const viewUserOrders = async (usr) => {
    const email = usr.email || usr.emailId;
    if (!email) return toast.error('Email not available');
    const userId = emailToUUID(email);
    try {
      const res = await orderAPI.getOrders(0, 50, userId);
      setUserOrders(res.data.orders || []);
      setViewingUser(usr);
      setUserOrdersModal(true);
    } catch (err) {
      toast.error('Failed to load user orders');
    }
  };

  const viewUserDetails = async (usr) => {
    const email = usr.email || usr.emailId;
    if (!email) return;
    try {
      const res = await authAPI.getUserByEmail(email);
      setDetailUser(res.data);
    } catch {
      setDetailUser(usr); // fallback
    }
    setUserDetailModal(true);
  };
  const handleDeleteUser = async (usr) => {
    const email = usr.email || usr.emailId;
    if (!email) {
      toast.error('User email not available');
      return;
    }

    // Prevent self‑delete
    const currentEmail = (user?.email || user?.emailId || '').toLowerCase();
    if (email.toLowerCase() === currentEmail) {
      toast.error('You cannot delete your own account');
      return;
    }

    if (!window.confirm(`Delete user "${usr.name}"? This cannot be undone.`)) return;

    try {
      await authAPI.deleteUser(email);   // calls DELETE /auth/users/{email}
      toast.success('User deleted');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // ============ FILTERS ============
  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || u.emailId)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============ HELPERS ============
  const getStatusColor = (status) => {
    const colors = {
      'DELIVERED': 'bg-green-100 text-green-700', 'SHIPPED': 'bg-blue-100 text-blue-700',
      'OUT_FOR_DELIVERY': 'bg-indigo-100 text-indigo-700', 'CONFIRMED': 'bg-teal-100 text-teal-700',
      'PROCESSING': 'bg-yellow-100 text-yellow-700', 'PENDING': 'bg-orange-100 text-orange-700',
      'CANCELLED': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const stats = [
    { label: 'Products', value: products.length, icon: FiPackage, gradient: 'from-blue-500 to-blue-600' },
    { label: 'Categories', value: categories.length, icon: FiGrid, gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Brands', value: brands.length, icon: FiTag, gradient: 'from-violet-500 to-purple-600' },
    { label: 'Orders', value: orders.length, icon: FiShoppingBag, gradient: 'from-orange-500 to-amber-600' },
    { label: 'Users', value: users.length, icon: FiUsers, gradient: 'from-rose-500 to-pink-600' },
    { label: 'Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: FiDollarSign, gradient: 'from-cyan-500 to-sky-600' },
  ];

  // ============ SKELETON LOADER ============
  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 animate-fade-in">
            <div className="skeleton h-8 w-64 rounded-lg mb-2"></div>
            <div className="skeleton h-4 w-48 rounded-lg"></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" style={{ animationDelay: `${i * 0.05}s` }}></div>
            ))}
          </div>
          <div className="flex gap-2 mb-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-10 w-24 rounded-lg"></div>
            ))}
          </div>
          <div className="skeleton h-80 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 animate-fade-in-down">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Admin <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-gray-500 mt-1 flex items-center space-x-2">
              <FiActivity className="text-indigo-500" />
              <span>Manage products, orders, users & more</span>
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button onClick={loadDashboardData} className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium">
              <FiRefreshCw className="group-hover:animate-spin" />
              <span>Refresh</span>
            </button>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border shadow-sm">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-bold">{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">Admin</span>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8 stagger-children">
          {stats.map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.gradient} rounded-2xl shadow-lg p-5 text-white animate-fade-in-up group cursor-default`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/20`}>
                  <stat.icon className="text-white text-lg" />
                </div>
              </div>
              <p className="text-3xl font-extrabold">{stat.value}</p>
              <p className="text-white/80 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="flex flex-wrap gap-3 mb-8 animate-fade-in-up">
          <button onClick={() => openModal('product')} className="btn bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md">
            <FiPlus /><span>Add Product</span>
          </button>
          <button onClick={() => openModal('category')} className="btn bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md">
            <FiPlus /><span>Add Category</span>
          </button>
          <button onClick={() => openModal('brand')} className="btn bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md">
            <FiPlus /><span>Add Brand</span>
          </button>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-6 animate-fade-in-up">
          {[
            { key: 'dashboard', label: 'Overview', icon: FiTrendingUp },
            { key: 'products', label: 'Products', icon: FiPackage },
            { key: 'categories', label: 'Categories', icon: FiGrid },
            { key: 'brands', label: 'Brands', icon: FiTag },
            { key: 'orders', label: 'Orders', icon: FiShoppingBag },
            { key: 'users', label: 'Users', icon: FiUsers },
          ].map((tab) => (
            <button key={tab.key} onClick={() => switchTab(tab.key)}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'
                }`}>
              <tab.icon className="text-sm" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* SEARCH */}
        {activeTab !== 'dashboard' && (
          <div className="relative mb-6 max-w-md animate-fade-in-up">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="input pl-11"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FiX />
              </button>
            )}
          </div>
        )}

        {/* DASHBOARD TAB (unchanged) */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-900 mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {orders.slice(0, 6).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${order.status === 'DELIVERED' ? 'bg-green-500' :
                        order.status === 'CANCELLED' ? 'bg-red-500' : 'bg-blue-500'
                        }`}></div>
                      <div>
                        <p className="font-semibold text-sm">{order.orderNumber || order.id?.substring(0, 12)}</p>
                        <p className="text-xs text-gray-500">{order.userName} • ₹{order.totalAmount?.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-indigo-50 rounded-xl"><span className="text-sm text-indigo-700">Products</span><span className="font-bold">{products.length}</span></div>
                <div className="flex justify-between p-3 bg-emerald-50 rounded-xl"><span className="text-sm text-emerald-700">Categories</span><span className="font-bold">{categories.length}</span></div>
                <div className="flex justify-between p-3 bg-violet-50 rounded-xl"><span className="text-sm text-violet-700">Brands</span><span className="font-bold">{brands.length}</span></div>
                <div className="flex justify-between p-3 bg-orange-50 rounded-xl"><span className="text-sm text-orange-700">Orders</span><span className="font-bold">{orders.length}</span></div>
                <div className="flex justify-between p-3 bg-rose-50 rounded-xl"><span className="text-sm text-rose-700">Users</span><span className="font-bold">{users.length}</span></div>
                <div className="flex justify-between p-3 bg-cyan-50 rounded-xl"><span className="text-sm text-cyan-700">Revenue</span><span className="font-bold">₹{totalRevenue.toLocaleString('en-IN')}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB (unchanged but polished) */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden animate-fade-in-up">
            {tabLoading ? (
              <div className="p-6">
                <div className="skeleton h-10 w-full rounded-xl mb-4"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton h-16 w-full rounded-lg mb-2" style={{ animationDelay: `${i * 0.1}s` }}></div>
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 border-b">
                        <th className="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase">Product</th>
                        <th className="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase">SKU</th>
                        <th className="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase">Price</th>
                        <th className="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase hidden md:table-cell">Category</th>
                        <th className="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase">Status</th>
                        <th className="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase">Stock</th>
                        <th className="text-center py-4 px-5 font-semibold text-gray-500 text-xs uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center space-x-3">
                              <img src={product.thumbnailUrl || `https://placehold.co/44x44/E2E8F0/94A3B8?text=${encodeURIComponent(product.name?.charAt(0) || 'P')}`} alt="" className="w-11 h-11 rounded-xl object-cover border border-gray-100" onError={(e) => { e.target.src = 'https://placehold.co/44x44/E2E8F0/94A3B8?text=P'; }} />
                              <div>
                                <p className="font-semibold text-gray-900 max-w-[180px] truncate">{product.name}</p>
                                <p className="text-xs text-gray-400">{product.brandName || 'No brand'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-gray-500 font-mono text-xs">{product.sku || '—'}</td>
                          <td className="py-3.5 px-5"><span className="font-bold">₹{(product.sellingPrice || 0).toLocaleString()}</span></td>
                          <td className="py-3.5 px-5 text-gray-600 text-xs hidden md:table-cell">{product.categoryName || '—'}</td>
                          <td className="py-3.5 px-5"><span className={`badge text-[10px] ${product.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>{product.status || 'ACTIVE'}</span></td>
                          <td className="py-3.5 px-5"><span className={`font-semibold ${product.stock?.availableQuantity > 0 ? 'text-green-600' : 'text-red-500'}`}>{product.stock?.availableQuantity ?? '—'}</span></td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center justify-center space-x-1">
                              <button onClick={() => openModal('product', product)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><FiEdit2 className="text-sm" /></button>
                              <button onClick={() => setDeleteConfirm({ type: 'product', id: product.id, name: product.name })} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 className="text-sm" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredProducts.length === 0 && (
                  <div className="empty-state py-16"><FiPackage className="empty-state-icon" /><h3 className="empty-state-title">No products found</h3></div>
                )}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                    <p className="text-sm text-gray-600">Page {currentPage + 1} of {totalPages}</p>
                    <div className="flex space-x-2">
                      <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100"><FiChevronLeft /></button>
                      <button onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100"><FiChevronRight /></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CATEGORIES TAB (unchanged) */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl shadow-sm border p-4 hover:shadow-md transition-all animate-fade-in-up">
                <div className="flex justify-between items-start mb-3">
                  <img src={cat.imageUrl || `https://placehold.co/60x60/E2E8F0/94A3B8?text=${encodeURIComponent(cat.name?.charAt(0) || 'C')}`} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  <div className="flex space-x-1">
                    <button onClick={() => openModal('category', cat)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><FiEdit2 /></button>
                    <button onClick={() => setDeleteConfirm({ type: 'category', id: cat.id, name: cat.name })} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
                {cat.subCategories?.length > 0 && <p className="text-xs text-indigo-600 mt-2">{cat.subCategories.length} subcategories</p>}
              </div>
            ))}
            {categories.length === 0 && <div className="col-span-full empty-state py-16"><FiGrid className="empty-state-icon" /><h3 className="empty-state-title">No categories found</h3></div>}
          </div>
        )}

        {/* BRANDS TAB (unchanged) */}
        {activeTab === 'brands' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
            {brands.map((brand) => (
              <div key={brand.id} className="bg-white rounded-2xl shadow-sm border p-4 hover:shadow-md transition-all text-center animate-fade-in-up">
                <img src={brand.logoUrl || `https://placehold.co/80x80/E2E8F0/94A3B8?text=${encodeURIComponent(brand.name?.charAt(0) || 'B')}`} alt="" className="w-16 h-16 object-contain mx-auto mb-3 rounded-lg" />
                <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{brand.description}</p>
                <div className="flex justify-center space-x-1 mt-3">
                  <button onClick={() => openModal('brand', brand)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><FiEdit2 /></button>
                  <button onClick={() => handleDeleteBrand(brand.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 /></button>
                </div>
              </div>
            ))}
            {brands.length === 0 && <div className="col-span-full empty-state py-16"><FiTag className="empty-state-icon" /><h3 className="empty-state-title">No brands found</h3></div>}
          </div>
        )}

        {/* ORDERS TAB (with email notification) */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden animate-fade-in-up">
            {tabLoading ? (
              <div className="p-6">
                <div className="skeleton h-10 w-full rounded-xl mb-4"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton h-16 w-full rounded-lg mb-2" style={{ animationDelay: `${i * 0.1}s` }}></div>
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 border-b">
                        <th className="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase">Order #</th>
                        <th className="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase">Customer</th>
                        <th className="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase">Total</th>
                        <th className="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase">Status</th>
                        <th className="text-center py-4 px-5 font-semibold text-gray-500 text-xs uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-3.5 px-5 font-semibold text-indigo-600">{order.orderNumber || order.id?.substring(0, 8)}</td>
                          <td className="py-3.5 px-5">
                            <p className="font-medium">{order.userName}</p>
                            <p className="text-xs text-gray-400">{order.userEmail}</p>
                          </td>
                          <td className="py-3.5 px-5 font-bold">₹{(order.totalAmount || 0).toLocaleString()}</td>
                          <td className="py-3.5 px-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center justify-center space-x-1">
                              <button onClick={() => { setSelectedOrder(order); setNewStatus(order.status); setTrackingNumber(order.trackingNumber || ''); setShowStatusModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><FiEdit2 className="text-sm" /></button>
                              {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                                <button onClick={() => handleCancelOrder(order.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 className="text-sm" /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredOrders.length === 0 && <div className="empty-state py-16"><FiShoppingBag className="empty-state-icon" /><h3 className="empty-state-title">No orders found</h3></div>}
              </>
            )}
          </div>
        )}

        {/* USERS TAB (with view orders & details) */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden animate-fade-in-up">
            {tabLoading ? (
              <div className="p-6">
                <div className="skeleton h-10 w-full rounded-xl mb-4"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton h-16 w-full rounded-lg mb-2" style={{ animationDelay: `${i * 0.1}s` }}></div>
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 border-b">
                        <th className="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase">User</th>
                        <th className="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase">Email</th>
                        <th className="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase">Role</th>
                        <th className="text-center py-4 px-5 font-semibold text-gray-500 text-xs uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredUsers.map((u, i) => (
                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-600 text-xs font-bold">{u.name?.charAt(0)?.toUpperCase()}</span>
                              </div>
                              <span className="font-medium">{u.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-gray-600">{u.email || u.emailId}</td>
                          <td className="py-3.5 px-5">
                            <span className={`badge text-[10px] ${(u.role || '').toUpperCase() === 'ADMIN' ? 'badge-primary' : 'bg-gray-100 text-gray-600'}`}>{u.role || 'USER'}</span>
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center justify-center space-x-1">
                              {/* Change Role – only for super admin */}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    const plainRole = (u.role || 'USER').replace(/^ROLE_/, '');
                                    setNewRole(plainRole);
                                    setShowRoleModal(true);
                                  }}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                  title="Change Role"
                                >
                                  <FiUserCheck />
                                </button>
                              )}
                              {/* Delete User – only for super admin */}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                  title="Delete User"
                                >
                                  <FiTrash2 />
                                </button>
                              )}
                              <button onClick={() => viewUserOrders(u)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="View Orders"><FiShoppingBag /></button>
                              <button onClick={() => viewUserDetails(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="View Details"><FiUser /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && <div className="empty-state py-16"><FiUsers className="empty-state-icon" /><h3 className="empty-state-title">No users found</h3></div>}
              </>
            )}
          </div>
        )}
      </div>

      {/* ============ PRODUCT/CATEGORY/BRAND MODAL (unchanged) ============ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900">{editingItem ? 'Edit' : 'Add'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><FiX className="text-xl" /></button>
            </div>
            <form onSubmit={modalType === 'product' ? handleSaveProduct : modalType === 'category' ? handleSaveCategory : handleSaveBrand} className="p-6 space-y-4">
              {modalType === 'product' && (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label><input type="text" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label><input type="text" required value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={productForm.status} onChange={(e) => setProductForm({ ...productForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="DRAFT">Draft</option></select></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Base Price *</label><input type="number" required min="0.01" step="0.01" value={productForm.basePrice} onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label><input type="number" required min="0.01" step="0.01" value={productForm.sellingPrice} onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label><input type="number" min="0" max="100" value={productForm.discountPercentage} onChange={(e) => setProductForm({ ...productForm, discountPercentage: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"><option value="">Select</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand</label><select value={productForm.brandId} onChange={(e) => setProductForm({ ...productForm, brandId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"><option value="">Select</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label><input type="url" value={productForm.thumbnailUrl} onChange={(e) => setProductForm({ ...productForm, thumbnailUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                  {!editingItem && <div><label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label><input type="number" min="0" value={productForm.initialStock} onChange={(e) => setProductForm({ ...productForm, initialStock: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>}
                </>
              )}
              {modalType === 'category' && (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" required value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label><input type="url" value={categoryForm.imageUrl} onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label><select value={categoryForm.parentId} onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"><option value="">None</option>{categories.filter(c => c.id !== editingItem?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label><input type="number" value={categoryForm.sortOrder} onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                  </div>
                </>
              )}
              {modalType === 'brand' && (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label><input type="text" required value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={brandForm.description} onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label><input type="url" value={brandForm.logoUrl} onChange={(e) => setBrandForm({ ...brandForm, logoUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                </>
              )}
              <div className="flex space-x-3 pt-4 border-t">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">{editingItem ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ ORDER STATUS MODAL (unchanged) ============ */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Update Order Status</h3>
            <p className="text-sm text-gray-500 mb-4">Order: <strong>{selectedOrder?.orderNumber}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="PENDING">Pending</option><option value="PROCESSING">Processing</option>
                  <option value="CONFIRMED">Confirmed</option><option value="SHIPPED">Shipped</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option><option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="TRK123456789" />
              </div>
              <div className="flex space-x-3 pt-4">
                <button onClick={handleUpdateOrderStatus} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 text-sm">Update Status</button>
                <button onClick={() => setShowStatusModal(false)} className="flex-1 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ USER ROLE MODAL (unchanged) ============ */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Change User Role</h3>
            <p className="text-sm text-gray-500 mb-4">User: <strong>{selectedUser?.name}</strong> ({selectedUser?.email || selectedUser?.emailId})</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Role: <span className="font-semibold">{selectedUser?.role || 'USER'}</span></label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2">
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button onClick={handleUpdateUserRole} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 text-sm">Update Role</button>
                <button onClick={() => setShowRoleModal(false)} className="flex-1 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ DELETE CONFIRMATION MODAL (unchanged) ============ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><FiTrash2 className="text-red-600 text-2xl" /></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete {deleteConfirm.type}?</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button onClick={() => handleDelete(deleteConfirm.type, deleteConfirm.id)} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ USER ORDERS MODAL (NEW) ============ */}
      {userOrdersModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setUserOrdersModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Orders for {viewingUser?.name}</h3>
              <button onClick={() => setUserOrdersModal(false)}><FiX /></button>
            </div>
            {userOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders found.</p>
            ) : (
              <div className="space-y-2">
                {userOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">₹{order.totalAmount?.toLocaleString()} – {order.status}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ USER DETAILS MODAL (NEW, READ-ONLY) ============ */}
      {userDetailModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setUserDetailModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Customer Details</h3>
              <button onClick={() => setUserDetailModal(false)}><FiX /></button>
            </div>
            {detailUser && (
              <div className="space-y-3 text-sm">
                <p><strong>Name:</strong> {detailUser.name}</p>
                <p><strong>Email:</strong> {detailUser.email || detailUser.emailId}</p>
                <p><strong>Phone:</strong> {detailUser.phoneNumber || 'N/A'}</p>
                <p><strong>Address:</strong> {detailUser.address || 'N/A'}</p>
                <p><strong>Role:</strong> {detailUser.role || 'USER'}</p>
                <p><strong>Created:</strong> {detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;