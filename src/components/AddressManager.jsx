import { useState, useEffect, useCallback } from 'react';
import { addressAPI } from '../api/axios';
import toast from 'react-hot-toast';
import AddressList from './AddressList';
import AddressForm from './AddressForm';

const AddressManager = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = list, object = edit, 'new' = add
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await addressAPI.getAll();
      setAddresses(res.data);
    } catch (err) {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses, refreshKey]);

  const handleSave = async (formData) => {
    try {
      if (editing === 'new') {
        await addressAPI.create(formData);
        toast.success('Address added');
      } else {
        await addressAPI.update(editing.id, formData);
        toast.success('Address updated');
      }
      setEditing(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressAPI.delete(id);
      toast.success('Address deleted');
      setRefreshKey(k => k + 1);
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressAPI.setDefault(id);
      toast.success('Default address updated');
      setRefreshKey(k => k + 1);
    } catch (err) {
      toast.error('Failed to set default address');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="bg-white rounded-2xl border p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {editing === 'new' ? 'Add New Address' : 'Edit Address'}
        </h3>
        <AddressForm
          existing={editing === 'new' ? null : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <AddressList
      addresses={addresses}
      onEdit={(addr) => setEditing(addr)}
      onDelete={handleDelete}
      onSetDefault={handleSetDefault}
      onAdd={() => setEditing('new')}
    />
  );
};

export default AddressManager;