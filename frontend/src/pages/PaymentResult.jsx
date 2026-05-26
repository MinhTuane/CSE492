import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { orderService } from '../services/order.service';
import toast from 'react-hot-toast';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, failed

  useEffect(() => {
    const processPaymentResult = async () => {
      const paramsObj = Object.fromEntries([...searchParams.entries()]);
      // VNPay Params
      const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
      const vnp_TxnRef = searchParams.get('vnp_TxnRef');

      // ZaloPay Params
      const apptransid = searchParams.get('apptransid');
      const status_param = searchParams.get('status');

      // Momo Params
      const momoOrderId = searchParams.get('orderId');
      const resultCode = searchParams.get('resultCode');

      if (vnp_ResponseCode) {
        // VNPay Callback Handling
        if (vnp_ResponseCode === '00') {
          try {
            await orderService.verifyVNPay(paramsObj);
            setStatus('success');
            toast.success('Payment successful!');
          } catch (error) {
            setStatus('failed');
            toast.error('Failed to update order status');
          }
        } else {
          setStatus('failed');
          toast.error('Payment was cancelled or failed');
        }
      } else if (apptransid) {
        // ZaloPay Callback Handling
        if (status_param === '1') {
          try {
            await orderService.verifyZaloPay(apptransid);
            setStatus('success');
            toast.success('Payment successful!');
          } catch (error) {
            setStatus('failed');
            toast.error('Failed to update order status');
          }
        } else {
          setStatus('failed');
          toast.error('Payment was cancelled or failed');
        }
      } else if (momoOrderId && resultCode !== null) {
        // Momo Callback Handling
        if (resultCode === '0') {
          try {
            let tries = 0;
            while (tries < 10) {
              const order = await orderService.getById(momoOrderId);
              if (order?.status === 'PAID') {
                setStatus('success');
                toast.success('Payment successful!');
                return;
              }
              tries += 1;
              await new Promise((r) => setTimeout(r, 1000));
            }
            setStatus('failed');
            toast.error('Payment is pending confirmation');
          } catch (error) {
            setStatus('failed');
            toast.error('Failed to update order status');
          }
        } else {
          setStatus('failed');
          toast.error('Payment was cancelled or failed');
        }
      } else {
        setStatus('failed');
        toast.error('No payment information found');
      }
    };

    processPaymentResult();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl text-center animate-slide-in-up">
        {status === 'processing' && (
          <div className="flex flex-col items-center">
            <Loader className="w-16 h-16 text-blue-500 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Processing Payment...</h2>
            <p className="text-gray-500 mt-2">Please wait while we confirm your transaction.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-float">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-8">Thank you for your purchase. Your order has been confirmed.</p>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => navigate('/my-orders')}
                className="btn btn-primary flex-1 text-lg"
              >
                View Orders
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn btn-outline flex-1 text-lg"
              >
                Go Home
              </button>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-float">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-8">Your payment could not be processed or was cancelled.</p>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => navigate('/my-orders')}
                className="btn btn-primary flex-1 text-lg"
              >
                View Orders
              </button>
              <button
                onClick={() => navigate('/cart')}
                className="btn btn-outline flex-1 text-lg"
              >
                Back to Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;
