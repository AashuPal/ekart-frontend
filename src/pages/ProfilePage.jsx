import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/axios';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AddressManager from '../components/AddressManager';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || user?.emailId || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
  });

  // Determine account type – needed for conditional editing
  const isPhoneUser =
    user?.provider === 'PHONE' ||
    (user?.email || user?.emailId || '').includes('@phone.ekart');

  const handleSave = async () => {
    setSaving(true);
    try {
      const userEmail = user?.email || user?.emailId || '';

      const requestData = {
        name: formData.name || user.name,
        phoneNumber: formData.phoneNumber || user.phoneNumber || '',
        address: formData.address || user.address || '',
      };

      // Only include verifiedEmail if the user is a phone‑only user and the email field is being changed
      if (isPhoneUser && formData.email) {
        requestData.verifiedEmail = formData.email;
      }

      await authAPI.updateProfile(requestData, userEmail);

      // Update local state and localStorage with the saved data
      const updatedUser = { ...user, ...formData };
      updateUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setFormData({
      name: user?.name || '',
      email: user?.email || user?.emailId || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
    });
    setEditing(false);
  };

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your personal information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-fade-in-up">

          {/* Avatar & Edit Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-white text-3xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                <span className="badge badge-primary text-xs mt-1">
                  {user?.role?.replace('ROLE_', '') || 'User'}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md shadow-green-200"
                  >
                    <FiSave />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn btn-ghost border-2 border-gray-200"
                  >
                    <FiX />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="btn btn-secondary"
                >
                  <FiEdit2 />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Info Fields */}
          <div className="space-y-5">
            {/* Name – always editable */}
            <div className="flex items-center space-x-4 p-5 bg-gray-50 rounded-2xl transition-all hover:bg-gray-100">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiUser className="text-indigo-600 text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</p>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input bg-white"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                )}
              </div>
            </div>

            {/* Email – editable only for phone accounts */}
            <div className="flex items-center space-x-4 p-5 bg-gray-50 rounded-2xl transition-all hover:bg-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiMail className="text-blue-600 text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address</p>
                {editing && isPhoneUser ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input bg-white"
                    placeholder="your@email.com"
                  />
                ) : (
                  <p className="font-semibold text-gray-900 truncate">
                    {user?.email || user?.emailId || <span className="text-gray-400 italic">Not provided</span>}
                  </p>
                )}
                {editing && !isPhoneUser && (
                  <p className="text-xs text-gray-400 mt-1">
                    {user?.provider === 'GOOGLE' ? 'Email is managed by Google' : 'Email cannot be changed'}
                  </p>
                )}
              </div>
            </div>

            {/* Phone – editable only for non‑phone accounts */}
            <div className="flex items-center space-x-4 p-5 bg-gray-50 rounded-2xl transition-all hover:bg-gray-100">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiPhone className="text-green-600 text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</p>
                {editing && !isPhoneUser ? (
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="input bg-white"
                    placeholder="10-digit mobile number"
                    maxLength={15}  // allow + and longer numbers
                  />
                ) : (
                  <p className="font-semibold text-gray-900">
                    {user?.phoneNumber || <span className="text-gray-400 italic">Not provided</span>}
                  </p>
                )}
                {editing && isPhoneUser && (
                  <p className="text-xs text-gray-400 mt-1">Phone number cannot be changed for this account</p>
                )}
              </div>
            </div>

            {/* Address – always editable */}
            <div className="flex items-start space-x-4 p-5 bg-gray-50 rounded-2xl transition-all hover:bg-gray-100">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <FiMapPin className="text-purple-600 text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</p>
                {editing ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="input bg-white resize-none"
                    placeholder="Enter your full address"
                  />
                ) : (
                  <p className="font-semibold text-gray-900">
                    {user?.address || <span className="text-gray-400 italic">Not provided</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Addresses Section – kept for profile address management */}
        <div className="mt-10 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <AddressManager />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;