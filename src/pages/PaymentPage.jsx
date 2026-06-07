import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentAPI, notificationAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FiCreditCard, FiPhone, FiCheckCircle, FiXCircle, FiLoader, FiShield, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Helper: generate a consistent UUID from email (required by backend for userId)
const emailToUUID = (email) => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0').slice(0, 12);
  return `00000000-0000-4000-8000-${hex}`;
};

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const orderId = searchParams.get('orderId') || '';
  const amount = searchParams.get('amount') || '0';

  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | 'success' | 'failed'

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    holderName: user?.name || '',
  });

  const [upiId, setUpiId] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const email = user?.email || user?.emailId || 'guest@ekart.com';
      const userId = emailToUUID(email);

      const paymentData = {
        orderId: orderId,
        userId: userId,                     // proper UUID
        amount: parseFloat(amount),
        currency: 'INR',
        paymentMethod: paymentMethod,
      };

      if (paymentMethod === 'CARD') {
        paymentData.cardLastFour = cardDetails.cardNumber.replace(/\s/g, '').slice(-4);
        paymentData.cardType = cardDetails.cardNumber.startsWith('4') ? 'Visa' : 'Mastercard';
      } else if (paymentMethod === 'UPI') {
        paymentData.upiId = upiId;
      }

      const response = await paymentAPI.processPayment(paymentData);
      
      setPaymentStatus('success');
      toast.success('Payment successful!');

      try {
        await notificationAPI.sendPaymentConfirmation({
          to: email,
          customerName: user?.name || 'Customer',
          orderNumber: orderId,
          orderTotal: amount,
          paymentMethod,
        });
      } catch (emailErr) {
        console.warn('Payment confirmation email failed', emailErr);
      }
      
      setTimeout(() => {
        navigate(`/order-confirmation/${orderId}`);
      }, 2000);
      
    } catch (err) {
      console.error('Payment failed:', err);
      setPaymentStatus('failed');
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-gray-500 hover:text-indigo-600 mb-6 transition-colors group"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 animate-fade-in-down">
          Secure Payment
        </h1>
        <p className="text-gray-500 mb-8 animate-fade-in-up">
          Amount:{' '}
          <span className="font-bold text-indigo-600 text-xl">
            ₹{parseFloat(amount).toLocaleString('en-IN')}
          </span>
        </p>

        {paymentStatus === 'success' ? (
          <div className="bg-white rounded-3xl shadow-lg border p-8 text-center animate-scale-in">
            <FiCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500">Redirecting to order confirmation...</p>
          </div>
        ) : paymentStatus === 'failed' ? (
          <div className="bg-white rounded-3xl shadow-lg border p-8 text-center animate-scale-in">
            <FiXCircle className="text-6xl text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-500 mb-6">Something went wrong. Please try again.</p>
            <button onClick={() => setPaymentStatus(null)} className="btn btn-primary btn-lg">
              Try Again
            </button>
          </div>
        ) : (
          <form onSubmit={handlePayment}>
            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6 animate-fade-in-up">
              <h3 className="font-bold text-gray-900 mb-4">Select Payment Method</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'CARD', label: 'Card', icon: FiCreditCard },
                  { value: 'UPI', label: 'UPI', icon: FiPhone },
                  { value: 'COD', label: 'Cash on Delivery', icon: FiShield },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === method.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <method.icon className="text-2xl mb-1" />
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Details */}
            {paymentMethod === 'CARD' && (
              <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6 animate-fade-in-up">
                <h3 className="font-bold text-gray-900 mb-4">Card Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number</label>
                    <input
                      type="text"
                      required
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: formatCardNumber(e.target.value) })}
                      maxLength={19}
                      placeholder="1234 5678 9012 3456"
                      className="input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry</label>
                      <input
                        type="text"
                        required
                        value={cardDetails.expiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '');
                          if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                          setCardDetails({ ...cardDetails, expiry: v });
                        }}
                        maxLength={5}
                        placeholder="MM/YY"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">CVV</label>
                      <input
                        type="password"
                        required
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/[^0-9]/g, '') })}
                        maxLength={4}
                        placeholder="123"
                        className="input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Card Holder Name</label>
                    <input
                      type="text"
                      required
                      value={cardDetails.holderName}
                      onChange={(e) => setCardDetails({ ...cardDetails, holderName: e.target.value })}
                      placeholder="Name on card"
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* UPI Details */}
            {paymentMethod === 'UPI' && (
              <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6 animate-fade-in-up">
                <h3 className="font-bold text-gray-900 mb-4">UPI Details</h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">UPI ID</label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="input"
                  />
                </div>
              </div>
            )}

            {/* COD Info */}
            {paymentMethod === 'COD' && (
              <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6 animate-fade-in-up">
                <div className="flex items-start space-x-3">
                  <FiShield className="text-2xl text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Cash on Delivery</h3>
                    <p className="text-sm text-gray-500">Pay when you receive your order. No additional charges.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pay Now Button */}
            <button
              type="submit"
              disabled={processing}
              className="btn btn-primary btn-lg w-full disabled:opacity-50 animate-fade-in-up"
            >
              {processing ? (
                <>
                  <FiLoader className="animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <FiShield />
                  <span>Pay ₹{parseFloat(amount).toLocaleString('en-IN')}</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center space-x-1">
              <FiShield />
              <span>Secured by SSL encryption. Your data is safe.</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;