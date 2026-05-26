import { FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { profileAddressAPI } from '../api/axios';

const AddressSelector = ({ addresses, selectedId, onSelect, onAddNew, onSetDefault }) => {
  const handleSetDefault = async (id) => {
    try {
      await profileAddressAPI.setDefault(id);
      // Update local state: mark this address as default, remove from others
      const updated = addresses.map(addr => ({
        ...addr,
        default: addr.id === id,
      }));
      // Notify parent component about the change
      if (onSetDefault) onSetDefault(updated);
      toast.success('Default address updated');
    } catch (err) {
      toast.error('Failed to set default address');
    }
  };

  if (!addresses || addresses.length === 0) return null;

  return (
    <div className="space-y-4">
      {addresses.map(addr => (
        <label
          key={addr.id}
          className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
            selectedId === addr.id
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="shippingAddress"
            checked={selectedId === addr.id}
            onChange={() => onSelect(addr)}
            className="mt-1 mr-3"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{addr.fullName}</p>
              {addr.default && (
                <span className="badge badge-primary text-xs">Default</span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {addr.addressLine1}
              {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
            </p>
            <p className="text-sm text-gray-600">
              {addr.city}, {addr.state} – {addr.postalCode}
            </p>
            <p className="text-sm text-gray-500 mt-1">📞 {addr.phoneNumber}</p>
          </div>
          {!addr.default && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleSetDefault(addr.id);
              }}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Set as Default"
            >
              <FiCheckCircle />
            </button>
          )}
        </label>
      ))}
      <button onClick={onAddNew} className="btn btn-secondary w-full mt-4">
        + Add New Address
      </button>
    </div>
  );
};

export default AddressSelector;