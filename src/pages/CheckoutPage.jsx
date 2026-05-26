import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiCreditCard, FiTruck, FiCheck, FiShield, FiRotateCcw, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { orderAPI, profileAddressAPI } from '../api/axios';   // <-- uses profile addresses
import AddressSelector from '../components/AddressSelector';
import AddressForm from '../components/AddressForm';

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

// Helper: remove any non‑ASCII characters from a string
const sanitise = (str) => (str || '').replace(/[^\x20-\x7E]/g, '');

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);

  // ====================== Address State ======================
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);  // for UI highlight
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Manual shipping form – pre‑filled from selected profile address or typed
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phoneNumber: user?.phoneNumber || '',
  });
  // ===========================================================

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardHolderName: '',
  });

  // Load cart and profile addresses
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
    if (cart.length === 0) {
      navigate('/cart');
    }
    fetchAddresses();
  }, [navigate]);

  const fetchAddresses = async () => {
    try {
      const res = await profileAddressAPI.getAll();   // Auth Service addresses
      const list = res.data || [];
      setAddresses(list);
      // Auto‑select the default address and pre‑fill the manual form
      const defaultAddr = list.find(a => a.isDefault);
      if (defaultAddr) {
        setShippingAddress({
          fullName: defaultAddr.fullName || '',
          addressLine1: defaultAddr.addressLine1 || '',
          addressLine2: defaultAddr.addressLine2 || '',
          city: defaultAddr.city || '',
          state: defaultAddr.state || '',
          postalCode: defaultAddr.postalCode || '',
          country: defaultAddr.country || 'India',
          phoneNumber: defaultAddr.phoneNumber || '',
        });
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (err) {
      console.error('Failed to load addresses', err);
      toast.error('Could not load saved addresses');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const shipping = subtotal > 500 ? 0 : 40;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  // ====================== Address Selection ======================
  const handleAddressSelect = (address) => {
    // Copy profile address into the manual form
    setShippingAddress({
      fullName: address.fullName || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'India',
      phoneNumber: address.phoneNumber || '',
    });
    setSelectedAddressId(address.id);   // for UI highlight
  };
  // ===============================================================

  // ====================== Place Order =============================
  const handlePlaceOrder = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }
    if (!cartItems || cartItems.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    // Validate manual form (filled from selection or typing)
    const isManualValid =
      shippingAddress.addressLine1 &&
      shippingAddress.city &&
      shippingAddress.postalCode;

    if (!isManualValid) {
      toast.error('Please fill in all required shipping details');
      setStep(1);
      return;
    }

    setProcessing(true);

    try {
      const email = user?.email || user?.emailId || 'customer@ekart.com';
      const userId = emailToUUID(email);

      // Always send the full manual address – NEVER an ID
      const manualAddress = {
        fullName: sanitise(shippingAddress.fullName),
        addressLine1: sanitise(shippingAddress.addressLine1),
        addressLine2: sanitise(shippingAddress.addressLine2),
        city: sanitise(shippingAddress.city),
        state: sanitise(shippingAddress.state),
        postalCode: sanitise(shippingAddress.postalCode),
        country: sanitise(shippingAddress.country),
        phoneNumber: sanitise(shippingAddress.phoneNumber),
        customerEmail: email,   // fixes the NOT NULL constraint
      };

      const orderData = {
        userId: userId,
        userEmail: email,
        email: email,            // Order Service may look for this
        userName: sanitise(shippingAddress.fullName) || user?.name || 'Customer',
        paymentMethod: paymentMethod,
        notes: '',
        items: cartItems.map(item => ({
          productId: item.productId,
          skuId: item.productId,
          productName: item.productName,
          imageUrl: item.imageUrl || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        })),
        subtotal: subtotal,
        discount: 0,
        tax: tax,
        shipping: shipping,
        totalAmount: total,
        shippingAddress: manualAddress,   // always sent
        // NO shippingAddressId
      };

      console.log('Order payload:', JSON.stringify(orderData));

      const response = await orderAPI.createOrder(orderData);

      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success('Order placed successfully!');

      const orderId = response.data.id || response.data.orderNumber;
      navigate(`/order-confirmation/${orderId}`);
    } catch (error) {
      console.error('Order failed:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };
  // =================================================================

  // ====================== Step Navigation ==========================
  const goToStep = (nextStep) => {
    if (nextStep === 2) {
      const isManualValid =
        shippingAddress.addressLine1 &&
        shippingAddress.city &&
        shippingAddress.postalCode;
      if (!isManualValid) {
        toast.error('Please fill in all required shipping details');
        return;
      }
    }
    setStep(nextStep);
  };
  // =================================================================

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= num ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > num ? <FiCheck /> : num}
                </div>
                {num < 3 && (
                  <div className={`w-20 h-1 mx-2 transition-all ${
                    step > num ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center text-sm mb-8 font-medium">
          <span className={step === 1 ? 'text-indigo-600' : 'text-gray-400'}>Shipping</span>
          <span className="mx-4 text-gray-300">→</span>
          <span className={step === 2 ? 'text-indigo-600' : 'text-gray-400'}>Payment</span>
          <span className="mx-4 text-gray-300">→</span>
          <span className={step === 3 ? 'text-indigo-600' : 'text-gray-400'}>Review</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form */}
          <div className="lg:col-span-2">
            
            {/* Step 1: Shipping Address */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8 animate-fade-in-up">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FiTruck className="text-indigo-600" />
                  </div>
                  <span>Shipping Address</span>
                </h2>

                {/* ====== SAVED ADDRESSES ====== */}
                {loadingAddresses ? (
                  <div className="space-y-4 mb-6">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="skeleton h-24 rounded-xl" />
                    ))}
                  </div>
                ) : addresses.length === 0 && !showAddressForm ? (
                  <div className="text-center py-6 mb-6">
                    <p className="text-gray-500 mb-4">No saved addresses. Add one or enter manually below.</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="btn btn-primary"
                    >
                      + Add New Address
                    </button>
                  </div>
                ) : (
                  <div className="mb-6">
                    <AddressSelector
                      addresses={addresses}
                      selectedId={selectedAddressId}
                      onSelect={handleAddressSelect}
                      onAddNew={() => setShowAddressForm(true)}
                      onSetDefault={(updatedAddresses) => setAddresses(updatedAddresses)}   // <-- default update
                    />
                  </div>
                )}

                {/* Inline address form */}
                {showAddressForm && (
                  <div className="mt-6 border-t pt-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Add New Address</h3>
                    <AddressForm
                      onSave={async (formData) => {
                        try {
                          const res = await profileAddressAPI.create(formData);
                          setAddresses(prev => [...prev, res.data]);
                          // Also fill the manual form with the new address
                          setShippingAddress({
                            fullName: res.data.fullName || '',
                            addressLine1: res.data.addressLine1 || '',
                            addressLine2: res.data.addressLine2 || '',
                            city: res.data.city || '',
                            state: res.data.state || '',
                            postalCode: res.data.postalCode || '',
                            country: res.data.country || 'India',
                            phoneNumber: res.data.phoneNumber || '',
                          });
                          setSelectedAddressId(res.data.id);
                          setShowAddressForm(false);
                          toast.success('Address added');
                        } catch (err) {
                          toast.error('Failed to save address');
                        }
                      }}
                      onCancel={() => setShowAddressForm(false)}
                    />
                  </div>
                )}

                {/* ====== MANUAL ADDRESS FORM (always visible) ====== */}
                <p className="text-sm text-gray-500 mb-4">Review or enter your shipping address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={shippingAddress.fullName}
                      onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                      className="input"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Address Line 1 *</label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => setShippingAddress({...shippingAddress, addressLine1: e.target.value})}
                      className="input"
                      placeholder="Street address, house number"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine2}
                      onChange={(e) => setShippingAddress({...shippingAddress, addressLine2: e.target.value})}
                      className="input"
                      placeholder="Apartment, landmark, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      className="input"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                      className="input"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Postal Code *</label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                      className="input"
                      placeholder="6-digit PIN code"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      value={shippingAddress.phoneNumber}
                      onChange={(e) => setShippingAddress({...shippingAddress, phoneNumber: e.target.value})}
                      className="input"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => goToStep(2)}
                  className="btn btn-primary w-full mt-6"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8 animate-fade-in-up">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FiCreditCard className="text-indigo-600" />
                  </div>
                  <span>Payment Method</span>
                </h2>
                
                <div className="space-y-4 mb-6">
                  {['COD', 'CARD', 'UPI'].map(method => (
                    <label key={method} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === method ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {method === 'COD' ? 'Cash on Delivery' : method === 'CARD' ? 'Credit / Debit Card' : 'UPI'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {method === 'COD' ? 'Pay when you receive your order' : method === 'CARD' ? 'Pay securely with your card' : 'Google Pay, PhonePe, Paytm'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {paymentMethod === 'CARD' && (
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardDetails.cardNumber}
                        onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
                        maxLength={16}
                        className="input"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry</label>
                        <input
                          type="text"
                          value={cardDetails.cardExpiry}
                          onChange={(e) => setCardDetails({...cardDetails, cardExpiry: e.target.value})}
                          className="input"
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">CVV</label>
                        <input
                          type="password"
                          value={cardDetails.cardCvv}
                          onChange={(e) => setCardDetails({...cardDetails, cardCvv: e.target.value})}
                          className="input"
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Card Holder Name</label>
                      <input
                        type="text"
                        value={cardDetails.cardHolderName}
                        onChange={(e) => setCardDetails({...cardDetails, cardHolderName: e.target.value})}
                        className="input"
                        placeholder="Name on card"
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button onClick={() => setStep(1)} className="btn btn-secondary flex-1">Back</button>
                  <button onClick={() => goToStep(3)} className="btn btn-primary flex-1">Review Order</button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Place Order */}
            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8 animate-fade-in-up">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Review Your Order</h2>
                
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <FiTruck className="text-indigo-500" /> <span>Shipping To:</span>
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm">
                    <p className="font-medium text-gray-900">{shippingAddress.fullName}</p>
                    <p className="text-gray-600">{shippingAddress.addressLine1}</p>
                    {shippingAddress.addressLine2 && <p className="text-gray-600">{shippingAddress.addressLine2}</p>}
                    <p className="text-gray-600">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                    <p className="text-gray-600">📞 {shippingAddress.phoneNumber}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <FiCreditCard className="text-indigo-500" /> <span>Payment Method:</span>
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm">
                    <p className="font-medium text-gray-900">
                      {paymentMethod === 'COD' ? 'Cash on Delivery' : paymentMethod === 'CARD' ? 'Credit/Debit Card' : 'UPI'}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Items ({cartItems.length}):</h3>
                  <div className="space-y-3">
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.imageUrl || `https://placehold.co/40x40/E2E8F0/94A3B8?text=P`}
                            alt={item.productName}
                            className="w-10 h-10 rounded-lg object-cover"
                            onError={(e) => { e.target.src = `https://placehold.co/40x40/E2E8F0/94A3B8?text=P`; }}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{item.productName}</p>
                            <p className="text-gray-500">Qty: {item.quantity} × ₹{item.unitPrice?.toLocaleString()}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900">₹{(item.unitPrice * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Total */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                        {shipping === 0 ? 'FREE' : `₹${shipping}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (18%)</span>
                      <span className="font-medium">₹{tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-indigo-600">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button onClick={() => setStep(2)} className="btn btn-secondary flex-1">Back</button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={processing}
                    className="btn bg-gradient-to-r from-green-600 to-emerald-600 text-white flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <FiCheck />
                        <span>Place Order</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border p-6 sticky top-24 animate-fade-in-up">
              <h3 className="font-bold text-gray-900 mb-4 pb-4 border-b">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (18%)</span>
                  <span>₹{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-3 border-t">
                  <span>Total</span>
                  <span className="text-indigo-600">₹{total.toLocaleString()}</span>
                </div>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-green-600 mt-3 bg-green-50 p-2.5 rounded-xl font-medium">
                  Add ₹{(500 - subtotal).toLocaleString()} more for <strong>FREE</strong> shipping!
                </p>
              )}
              <div className="mt-5 space-y-3">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <FiLock className="text-green-500" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <FiRotateCcw className="text-green-500" />
                  <span>Free 30-day returns</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <FiTruck className="text-green-500" />
                  <span>Fast delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;