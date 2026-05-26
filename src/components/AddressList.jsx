// components/AddressList.jsx
const AddressList = ({ addresses, onEdit, onDelete, onSetDefault, onAdd }) => {
  if (!addresses.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No saved addresses yet.</p>
        <button onClick={onAdd} className="btn-primary">Add New Address</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Shipping Addresses</h3>
        <button onClick={onAdd} className="btn-primary">Add New</button>
      </div>
      <div className="space-y-4">
        {addresses.map(addr => (
          <div key={addr.id} className="border rounded-2xl p-4 relative">
            {addr.isDefault && (
              <span className="absolute top-3 right-3 bg-green-100 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Default
              </span>
            )}
            <p className="font-semibold text-gray-900">{addr.fullName}</p>
            <p className="text-gray-600 text-sm mt-1">
              {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
            </p>
            <p className="text-gray-600 text-sm">
              {addr.city}, {addr.state} {addr.postalCode}
            </p>
            <p className="text-gray-600 text-sm">{addr.country}</p>
            <p className="text-gray-500 text-sm mt-1">{addr.phoneNumber}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => onEdit(addr)} className="btn-sm btn-outline">Edit</button>
              <button onClick={() => onDelete(addr.id)} className="btn-sm btn-outline text-red-600 border-red-200">Delete</button>
              {!addr.isDefault && (
                <button onClick={() => onSetDefault(addr.id)} className="btn-sm btn-outline">Set as Default</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddressList;