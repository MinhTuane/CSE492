import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, loginWithGoogle, loginWithFacebook } = useAuthStore();
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // Initialize Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId      : import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie     : true,
        xfbml      : true,
        version    : 'v18.0'
      });
    };

    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(formData);
      toast.success('Successfully logged in!');
      const isPlaceholderEmail = typeof u?.email === 'string' && u.email.endsWith('@mbservices.local');
      const hasLocal = u?.authProvider === 'LOCAL' || u?.hasLocalCredentials === true;
      const hasName = !!u?.firstname && !!u?.lastname;
      const hasPhone = typeof u?.phone === 'string' && /^[0-9]{10,11}$/.test(u.phone);
      const hasAddress = typeof u?.address === 'string' && u.address.trim().length > 0;
      const hasUsername = typeof u?.username === 'string' && u.username.trim().length > 0;
      const needsSetup = !hasUsername || isPlaceholderEmail || !hasName || !hasPhone || !hasAddress || !hasLocal;
      navigate(needsSetup ? '/profile?setup=1' : '/');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to login';
      toast.error(errorMsg);
      
      // Show specific error for rate limiting
      if (error.message && error.message.includes('Too many requests')) {
        toast.error(error.message, { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const idToken = credentialResponse?.credential;
      if (!idToken) {
        toast.error('Google login failed: missing token. Check VITE_GOOGLE_CLIENT_ID and Authorized JavaScript origins (e.g. http://localhost:3001 for Vite dev).');
        return;
      }
      await loginWithGoogle(idToken);
      toast.success('Successfully logged in with Google!');
      navigate('/profile?setup=1');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      toast.error('Facebook SDK not loaded yet');
      return;
    }
    
    setLoading(true);
    window.FB.login(function(response) {
      if (response.authResponse) {
        loginWithFacebook(response.authResponse.accessToken)
          .then(() => {
            toast.success('Successfully logged in with Facebook!');
                    navigate('/profile?setup=1');
          })
          .catch((error) => {
            toast.error(error.response?.data?.message || 'Facebook login failed');
            setLoading(false);
          });
      } else {
        toast.error('Facebook login cancelled');
        setLoading(false);
      }
    }, { scope: 'email,public_profile' });
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId || 'dummy_client_id'}>
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">MB</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                Email or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  value={formData.identifier}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Email or username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
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
                  placeholder="Enter your password"
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
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="text-sm text-red-600 hover:text-red-700 font-medium">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-lg py-3"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 items-center">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google login failed')}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="signin"
                  shape="rectangular"
                  uxMode="popup"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  disabled={loading}
                  className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-2">Facebook</span>
                </button>
              </div>
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
                <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <Link to="/register" className="text-red-600 hover:text-red-700 font-medium">
              Create a new account →
            </Link>
          </div>
        </div>
      </div>
    </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
