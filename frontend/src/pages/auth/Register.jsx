import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const Register = () => {
  const [mode, setMode] = useState('email'); // email | username
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstname: '',
    lastname: '',
    phone: '',
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { register, registerWithUsername, loginWithGoogle } = useAuthStore();
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Password validation
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasLowercase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecial: /[@$!%*?&]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const idToken = credentialResponse?.credential;
      if (!idToken) {
        toast.error('Google registration failed: missing token. Kiểm tra VITE_GOOGLE_CLIENT_ID và Authorized JavaScript origins (ví dụ http://localhost:3001 cho Vite dev).');
        return;
      }
      await loginWithGoogle(idToken);
      toast.success('Successfully registered and logged in with Google!');
      navigate('/profile?setup=1');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password requirements
    if (!isPasswordValid) {
      toast.error('Password does not meet security requirements');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'username') {
        await registerWithUsername({ username: formData.username, password: formData.password });
        toast.success('Registration successful!');
        navigate('/profile?setup=1');
        return;
      }
      
      const { confirmPassword: _CONFIRM_PASSWORD, username: _USERNAME, ...registerData } = formData;
      await register(registerData);
      toast.success('Registration successful!');
      navigate('/profile?setup=1');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
      
      // Show specific error for rate limiting
      if (error.message && error.message.includes('Too many requests')) {
        toast.error(error.message, { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId || 'dummy_client_id'}>
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
          <p className="mt-2 text-gray-600">Join Motomarket today and start your journey</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('email')}
                className={`btn flex-1 ${mode === 'email' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Register with Email
              </button>
              <button
                type="button"
                onClick={() => setMode('username')}
                className={`btn flex-1 ${mode === 'username' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Register with Username
              </button>
            </div>

            {/* Name Fields */}
            {mode === 'email' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="firstname"
                        name="firstname"
                        type="text"
                        required
                        value={formData.firstname}
                        onChange={handleChange}
                        className="input pl-10"
                        placeholder="John"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="lastname"
                        name="lastname"
                        type="text"
                        required
                        value={formData.lastname}
                        onChange={handleChange}
                        className="input pl-10"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
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
                      value={formData.email}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="john.doe@example.com"
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'username' && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="your_username"
                  />
                </div>
              </div>
            )}

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
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
                    value={formData.password}
                    onChange={handleChange}
                    className="input pl-10 pr-10"
                    placeholder="Min. 6 characters"
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
                {formData.password && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-gray-700">Password must contain:</p>
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
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
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
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
            </div>

            {/* Phone */}
            {mode === 'email' && <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="0123456789"
                  pattern="[0-9]{10,11}"
                />
              </div>
            </div>}

            {/* Address */}
            {mode === 'email' && <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3 pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="address"
                  name="address"
                  rows="3"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Enter your address"
                />
              </div>
            </div>}

            {/* Terms */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="text-red-600 hover:text-red-700 font-medium">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-red-600 hover:text-red-700 font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (formData.password && !isPasswordValid)}
              className="btn btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Social Register */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google login failed')}
                useOneTap={false}
                theme="outline"
                size="large"
                text="signup_with"
                shape="rectangular"
              />
            </div>
            {import.meta.env.DEV && (
              <div className="mt-3 text-xs text-gray-400 break-all">
                <div>origin: {window.location.origin}</div>
                <div>googleClientId: {googleClientId || '(missing)'}</div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-red-600 hover:text-red-700 font-medium">
              Sign in instead →
            </Link>
          </div>
        </div>
      </div>
    </div>
    </GoogleOAuthProvider>
  );
};

const PasswordRequirement = ({ met, children }) => (
  <div className="flex items-center text-xs">
    {met ? (
      <CheckCircle className="h-3 w-3 text-green-600 mr-1.5 flex-shrink-0" />
    ) : (
      <XCircle className="h-3 w-3 text-gray-300 mr-1.5 flex-shrink-0" />
    )}
    <span className={met ? 'text-green-600' : 'text-gray-500'}>{children}</span>
  </div>
);

export default Register;
