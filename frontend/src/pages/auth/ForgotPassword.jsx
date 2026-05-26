import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.requestPasswordReset(email);
      toast.success(response.message || 'Password reset link sent to your email');
      setSubmitted(true);
    } catch (error) {
      // Show generic message for security (don't reveal if email exists)
      toast.success('If an account exists with this email, a password reset link has been sent.');
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Check Your Email</h2>
            <p className="mt-2 text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>

          <div className="card p-8">
            <div className="space-y-4 text-center">
              <p className="text-gray-600">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="btn btn-secondary w-full"
              >
                Try Another Email
              </button>
              <Link to="/login" className="block text-red-600 hover:text-red-700 font-medium">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
          <p className="mt-2 text-gray-600">
            No worries, we'll send you reset instructions
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter your email"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Enter the email address associated with your account
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-lg py-3"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6">
            <Link
              to="/login"
              className="flex items-center justify-center text-red-600 hover:text-red-700 font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
