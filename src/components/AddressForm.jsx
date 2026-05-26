// components/AddressForm.jsx
import { useState, useEffect } from 'react';

const initialForm = {
  fullName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phoneNumber: '',
  isDefault: false
};

const AddressForm = ({ existing, onSave, onCancel }) => {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (existing) {
      setForm({ ...initialForm, ...existing });
    }
  }, [existing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name *" required className="input" />
      <input name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="Address Line 1 *" required className="input" />
      <input name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Address Line 2" className="input" />
      <div className="grid grid-cols-2 gap-4">
        <input name="city" value={form.city} onChange={handleChange} placeholder="City *" required className="input" />
        <input name="state" value={form.state} onChange={handleChange} placeholder="State *" required className="input" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="Postal Code *" required className="input" />
        <input name="country" value={form.country} onChange={handleChange} placeholder="Country *" required className="input" />
      </div>
      <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="Phone" className="input" />
      <label className="flex items-center gap-2">
        <input name="isDefault" type="checkbox" checked={form.isDefault} onChange={handleChange} />
        Set as default address
      </label>
      <div className="flex gap-3">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
};

export default AddressForm;