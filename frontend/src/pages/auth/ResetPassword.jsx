import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  // Password validation
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[@$!%*?&]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      setVerifying(false);
      return;
    }

    // Verify token
    authService.verifyResetToken(token)
      .then(() => {
        setTokenValid(true);
        setVerifying(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Invalid or expired reset link');
        setVerifying(false);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(token, password);
      toast.success(response.message || 'Password reset successful!');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (error && !tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Invalid Link</h2>
            <p className="mt-2 text-gray-600">{error}</p>
          </div>

          <div className="card p-8 text-center">
            <p className="text-gray-600 mb-6">
              The password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/forgot-password" className="btn btn-primary w-full">
              Request New Reset Link
            </Link>
            <Link to="/login" className="block mt-4 text-red-600 hover:text-red-700 font-medium">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Password Reset!</h2>
            <p className="mt-2 text-gray-600">
              Your password has been successfully reset
            </p>
          </div>

          <div className="card p-8 text-center">
            <p className="text-gray-600 mb-6">
              Redirecting to login page...
            </p>
            <Link to="/login" className="btn btn-primary w-full">
              Go to Login
            </Link>
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
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-gray-600">Enter your new password</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">Password must contain:</p>
                <div className="space-y-1">
                  <PasswordRequirement met={passwordRequirements.minLength}>
                    At least 8 characters
                  </PasswordRequirement>
                  <PasswordRequirement met={passwordRequirements.hasUppercase}>
                    One uppercase letter
                  </PasswordRequirement>
                  <PasswordRequirement met={passwordRequirements.hasLowercase}>
                    One lowercase letter
                  </PasswordRequirement>
                  <PasswordRequirement met={passwordRequirements.hasNumber}>
                    One number
                  </PasswordRequirement>
                  <PasswordRequirement met={passwordRequirements.hasSpecial}>
                    One special character (@$!%*?&)
                  </PasswordRequirement>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="Confirm new password"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isPasswordValid || password !== confirmPassword}
              className="btn btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-red-600 hover:text-red-700 font-medium">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const PasswordRequirement = ({ met, children }) => (
  <div className="flex items-center text-sm">
    {met ? (
      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-300 mr-2" />
    )}
    <span className={met ? 'text-green-600' : 'text-gray-500'}>{children}</span>
  </div>
);

export default ResetPassword;
