import { useState, useEffect, useCallback } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Shield, Save, X, KeyRound, ShoppingCart, Bike, Wrench, Star, MoreHorizontal, Award } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { userService } from '../../services/user.service';
import { getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    address: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    password: '',
  });
  const [usernameForm, setUsernameForm] = useState({
    username: '',
    password: '',
  });
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showEmailSection, setShowEmailSection] = useState(false);
  const [showUsernameSection, setShowUsernameSection] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [setupDone, setSetupDone] = useState(false);
  

  const loadProfile = useCallback(async () => {
    try {
      const data = await userService.getProfile(user.id);
      setProfile(data);
      setFormData({
        firstname: data.firstname || '',
        lastname: data.lastname || '',
        phone: data.phone || '',
        address: data.address || '',
      });
      setUsernameForm((prev) => ({ ...prev, username: data.username || '' }));
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user.id]);
  
  const loadStats = useCallback(async () => {
    try {
      const data = await userService.getStats(user.id);
      setStats(data);
    } catch {
      toast.error('Failed to load stats');
    }
  }, [user.id]);
  
  useEffect(() => {
    loadProfile();
    loadStats();
  }, [loadProfile, loadStats]);
  
  const isPlaceholderEmail = (email) => typeof email === 'string' && email.endsWith('@mbservices.local');
  const isSocial = profile?.authProvider && profile.authProvider !== 'LOCAL';
  const hasLocalCredentials = !isSocial || profile?.hasLocalCredentials === true;
  const isLocalProvider = !profile?.authProvider || profile.authProvider === 'LOCAL';
  const needsUsername = !!profile && !profile.username;
  const needsEmail = !!profile && isPlaceholderEmail(profile.email);
  const needsPassword = !!profile && isSocial && !hasLocalCredentials;
  const needsPersonal = !!profile && (
    !profile.firstname ||
    !profile.lastname ||
    !(typeof profile.phone === 'string' && /^[0-9]{10,11}$/.test(profile.phone)) ||
    !profile.address
  );
  const showSetupWizard = !!profile && !setupDone && (needsUsername || needsEmail || needsPassword || needsPersonal);
  const isRedirectedFromCheckout = new URLSearchParams(location.search).get('next')?.includes('/checkout');
  
  const getMissingFields = () => {
    const list = [];
    if (!profile) return list;
    if (!profile.username) list.push({ field: 'username', label: 'Tên đăng nhập (Username) còn thiếu' });
    if (isPlaceholderEmail(profile.email)) list.push({ field: 'email', label: 'Email thật chưa được cập nhật' });
    if (isSocial && !hasLocalCredentials) list.push({ field: 'password', label: 'Mật khẩu chưa được thiết lập' });
    if (!profile.firstname) list.push({ field: 'firstname', label: 'Họ và tên đệm còn thiếu' });
    if (!profile.lastname) list.push({ field: 'lastname', label: 'Tên còn thiếu' });
    if (!profile.phone) {
      list.push({ field: 'phone', label: 'Số điện thoại còn thiếu' });
    } else if (!/^[0-9]{10,11}$/.test(profile.phone)) {
      list.push({ field: 'phone', label: 'Số điện thoại không đúng định dạng (phải gồm 10-11 chữ số)' });
    }
    if (!profile.address) list.push({ field: 'address', label: 'Địa chỉ nhận hàng còn thiếu' });
    return list;
  };
  const missingFields = getMissingFields();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const updated = await userService.updateProfile(user.id, formData);
      setProfile(updated);
      setEditing(false);
      updateUser({ ...user, firstname: updated.firstname, lastname: updated.lastname, phone: updated.phone, address: updated.address });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
        toast.error('Please fill all password fields');
        return;
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      
      if (needsPassword) {
        await userService.setPassword(user.id, passwordForm.newPassword);
        toast.success('Password set successfully');
      } else {
        if (!passwordForm.oldPassword) {
          toast.error('Please fill all password fields');
          return;
        }
        await userService.changePassword(user.id, passwordForm.oldPassword, passwordForm.newPassword);
        toast.success('Password changed successfully');
      }
      
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };
  
  const handleSetupContinue = async () => {
    try {
      if (setupStep === 1) {
        if (needsUsername) {
          if (!usernameForm.username) {
            toast.error('Please enter a username');
            return;
          }
          const availability = await userService.checkUsernameAvailability(usernameForm.username, user.id);
          if (availability && availability.available === false) {
            toast.error('Username is already in use');
            return;
          }
          await userService.setUsername(user.id, usernameForm.username, usernameForm.password);
        }
        
        if (needsEmail) {
          if (!emailForm.newEmail || !emailForm.password) {
            toast.error('Please enter email and password');
            return;
          }
          const availability = await userService.checkEmailAvailability(emailForm.newEmail, user.id);
          if (availability && availability.available === false) {
            toast.error('Email is already in use');
            return;
          }
          await userService.updateEmail(user.id, emailForm.newEmail, emailForm.password);
        }
        
        if (needsPassword) {
          if (!passwordForm.newPassword || passwordForm.newPassword.length < 6 || passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Please enter matching passwords');
            return;
          }
          await userService.setPassword(user.id, passwordForm.newPassword);
        }
        
        await loadProfile();
        setSetupStep(2);
        return;
      }
      
      const phoneOk = typeof formData.phone === 'string' && /^[0-9]{10,11}$/.test(formData.phone);
      if (!formData.firstname || !formData.lastname || !phoneOk || !formData.address) {
        toast.error('Please fill firstname, lastname, phone (10-11 digits), and address');
        return;
      }
      const updated = await userService.updateProfile(user.id, formData);
      setProfile(updated);
      updateUser({ ...user, firstname: updated.firstname, lastname: updated.lastname, phone: updated.phone, address: updated.address, username: updated.username, email: updated.email, authProvider: updated.authProvider, hasLocalCredentials: updated.hasLocalCredentials });
      setSetupDone(true);
      toast.success('Profile setup completed');
      const next = new URLSearchParams(location.search).get('next');
      if (next) {
        navigate(decodeURIComponent(next), { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete setup');
    }
  };
  
  const handleSetUsername = async () => {
    try {
      if (!usernameForm.username) {
        toast.error('Please enter a username');
        return;
      }
      const availability = await userService.checkUsernameAvailability(usernameForm.username, user.id);
      if (availability && availability.available === false) {
        toast.error('Username is already in use');
        return;
      }
      const updated = await userService.setUsername(user.id, usernameForm.username, usernameForm.password);
      setProfile(updated);
      updateUser({ ...user, username: updated.username });
      toast.success('Username updated successfully');
      setShowUsernameSection(false);
      setUsernameForm((prev) => ({ ...prev, password: '' }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update username');
    }
  };

  const handleUpdateEmail = async () => {
    try {
      if (!emailForm.newEmail || !emailForm.password) {
        toast.error('Please fill all email fields');
        return;
      }
      const availability = await userService.checkEmailAvailability(emailForm.newEmail, user.id);
      if (availability && availability.available === false) {
        toast.error('Email is already in use');
        return;
      }
      const updated = await userService.updateEmail(user.id, emailForm.newEmail, emailForm.password);
      setProfile(updated);
      updateUser({ ...user, email: updated.email });
      setEmailForm({ newEmail: '', password: '' });
      toast.success('Email updated successfully');
      setShowEmailSection(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update email');
    }
  };

  const handleDeactivate = async () => {
    try {
      if (!deactivatePassword) {
        toast.error('Please enter your current password');
        return;
      }
      await userService.deactivateAccount(user.id, deactivatePassword);
      toast.success('Account deactivated');
      logout();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to deactivate account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="card p-8 animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <button
            onClick={() => setEditing((prev) => !prev)}
            className="p-2 rounded-lg hover:bg-gray-100"
            title={editing ? 'Cancel edit' : 'Edit'}
          >
            {editing ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
          </button>
        </div>
        
        {showSetupWizard && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Complete Your Profile</h2>
                <div className="text-sm text-gray-600 font-medium">
                  Required to place orders
                </div>
              </div>
              
              {missingFields.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
                  <div className="font-bold flex items-center gap-2 mb-1.5 text-red-900">
                    <span>⚠️</span> 
                    {isRedirectedFromCheckout 
                      ? "Vui lòng cập nhật đầy đủ thông tin để tiến hành mua xe và thanh toán:"
                      : "Tài khoản của bạn còn thiếu một số thông tin bắt buộc:"}
                  </div>
                  <ul className="list-disc list-inside text-xs text-red-700 space-y-1 font-medium">
                    {missingFields.map((err, i) => (
                      <li key={i}>{err.label}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm mb-6">
                <div className={`px-3 py-1 rounded-full ${setupStep === 1 ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}>1. Account</div>
                <div className={`px-3 py-1 rounded-full ${setupStep === 2 ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}>2. Personal</div>
              </div>
              
              {setupStep === 1 && (
                <div className="space-y-4">
                  {needsUsername && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                      <input
                        type="text"
                        value={usernameForm.username}
                        onChange={(e) => setUsernameForm((prev) => ({ ...prev, username: e.target.value }))}
                        className={`input w-full ${!usernameForm.username ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''}`}
                        placeholder="your_username"
                      />
                      {isLocalProvider && (
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mt-4">Current Password</label>
                        <input
                          type="password"
                          value={usernameForm.password}
                          onChange={(e) => setUsernameForm((prev) => ({ ...prev, password: e.target.value }))}
                          className={`input w-full mt-3 ${!usernameForm.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''}`}
                          placeholder="Confirm current password"
                        />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {needsEmail && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={emailForm.newEmail}
                        onChange={(e) => setEmailForm((prev) => ({ ...prev, newEmail: e.target.value }))}
                        className={`input w-full ${(!emailForm.newEmail || isPlaceholderEmail(emailForm.newEmail)) ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''}`}
                        placeholder="you@example.com"
                      />
                      <input
                        type="password"
                        value={emailForm.password}
                        onChange={(e) => setEmailForm((prev) => ({ ...prev, password: e.target.value }))}
                        className={`input w-full mt-3 ${!emailForm.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''}`}
                        placeholder="Confirm password"
                      />
                    </div>
                  )}
                  
                  {needsPassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Create Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        className={`input w-full ${(!passwordForm.newPassword || passwordForm.newPassword.length < 6) ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''}`}
                        placeholder="New password"
                      />
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className={`input w-full mt-3 ${(!passwordForm.confirmPassword || passwordForm.confirmPassword !== passwordForm.newPassword) ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''}`}
                        placeholder="Confirm new password"
                      />
                    </div>
                  )}
                </div>
              )}
              
              {setupStep === 2 && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={formData.firstname}
                      onChange={(e) => setFormData((prev) => ({ ...prev, firstname: e.target.value }))}
                      className={`input w-full ${!formData.firstname ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''}`}
                      placeholder="First name"
                    />
                    <input
                      type="text"
                      value={formData.lastname}
                      onChange={(e) => setFormData((prev) => ({ ...prev, lastname: e.target.value }))}
                      className={`input w-full ${!formData.lastname ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''}`}
                      placeholder="Last name"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      className={`input w-full ${(!formData.phone || !/^[0-9]{10,11}$/.test(formData.phone)) ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''}`}
                      placeholder="Phone (10-11 digits)"
                    />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                      className={`input w-full ${!formData.address ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''}`}
                      placeholder="Address"
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-end gap-3">
                {setupStep === 2 && (
                  <button type="button" className="btn btn-secondary" onClick={() => setSetupStep(1)}>
                    Back
                  </button>
                )}
                <button type="button" className="btn btn-primary" onClick={handleSetupContinue}>
                  {setupStep === 1 ? 'Continue' : 'Finish'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="card p-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {getInitials(`${profile?.firstname || ''} ${profile?.lastname || ''}`)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{profile?.firstname} {profile?.lastname}</h2>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                      {profile?.role}
                    </span>
                  </div>
                  <div className="text-gray-600">{needsEmail ? 'Not set' : profile?.email}</div>
                </div>
              </div>

              {!editing ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span>{profile?.phone || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span>{profile?.address || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                    <Award className={`w-5 h-5 ${
                      profile?.membershipTier === 'PLATINUM' ? 'text-gray-800' :
                      profile?.membershipTier === 'GOLD' ? 'text-yellow-500' :
                      profile?.membershipTier === 'SILVER' ? 'text-gray-400' :
                      'text-orange-400'
                    }`} />
                    <span className="font-bold text-gray-900">
                      Tier: {profile?.membershipTier || 'BRONZE'}
                    </span>
                    <span className="font-semibold text-gray-900 ml-4">
                      Loyalty Points: {profile?.loyaltyPoints || 0} pts
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({profile?.membershipTier === 'PLATINUM' ? '10% Discount' :
                        profile?.membershipTier === 'GOLD' ? '5% Discount' :
                        profile?.membershipTier === 'SILVER' ? '2% Discount' :
                        '0% Discount'})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleChange}
                      placeholder="First name"
                      className="input w-full"
                    />
                    <input
                      type="text"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleChange}
                      placeholder="Last name"
                      className="input w-full"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone (10-11 digits)"
                      className="input w-full"
                    />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Address"
                      className="input w-full"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleSave} className="btn btn-primary flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button onClick={() => setEditing(false)} className="btn btn-secondary flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="card p-8">
              <h3 className="text-xl font-bold mb-4">Security</h3>
              {!showPasswordSection ? (
                <button
                  onClick={() => setShowPasswordSection(true)}
                  className="btn btn-outline flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  {needsPassword ? 'Set Password' : 'Change Password'}
                </button>
              ) : (
                <>
                  <div className={`grid gap-4 ${needsPassword ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                    {!needsPassword && (
                      <input
                        type="password"
                        placeholder="Current password"
                        value={passwordForm.oldPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                        className="input w-full"
                      />
                    )}
                    <input
                      type="password"
                      placeholder="New password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="input w-full"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="input w-full"
                    />
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button onClick={handleChangePassword} className="btn btn-primary">
                      Save Password
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordSection(false);
                        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <div className="card p-8">
              <h3 className="text-xl font-bold mb-4">Username</h3>
              <div className="text-sm text-gray-600 mb-4">
                {profile?.username ? `@${profile.username}` : 'Not set'}
              </div>
              {!showUsernameSection ? (
                <button
                  onClick={() => setShowUsernameSection(true)}
                  className="btn btn-outline flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  {profile?.username ? 'Change Username' : 'Set Username'}
                </button>
              ) : (
                <>
                  <div className={`grid gap-4 ${profile?.authProvider === 'LOCAL' ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                    <input
                      type="text"
                      placeholder="Username (3-20, letters/numbers/_)"
                      value={usernameForm.username}
                      onChange={(e) => setUsernameForm(prev => ({ ...prev, username: e.target.value }))}
                      className="input w-full"
                    />
                    {profile?.authProvider === 'LOCAL' && (
                      <input
                        type="password"
                        placeholder="Confirm current password"
                        value={usernameForm.password}
                        onChange={(e) => setUsernameForm(prev => ({ ...prev, password: e.target.value }))}
                        className="input w-full"
                      />
                    )}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button onClick={handleSetUsername} className="btn btn-primary">
                      Save Username
                    </button>
                    <button
                      onClick={() => {
                        setShowUsernameSection(false);
                        setUsernameForm((prev) => ({ ...prev, password: '' }));
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="card p-8">
              <h3 className="text-xl font-bold mb-4">{needsEmail ? 'Add Email' : 'Update Email'}</h3>
              {!showEmailSection ? (
                <button
                  onClick={() => setShowEmailSection(true)}
                  className="btn btn-outline flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {needsEmail ? 'Add Email' : 'Update Email'}
                </button>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="email"
                      placeholder="New email"
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                      className="input w-full"
                    />
                    <input
                      type="password"
                      placeholder="Current password"
                      value={emailForm.password}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                      className="input w-full"
                    />
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button onClick={handleUpdateEmail} className="btn btn-primary">
                      Save Email
                    </button>
                    <button
                      onClick={() => {
                        setShowEmailSection(false);
                        setEmailForm({ newEmail: '', password: '' });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="card p-8">
              <h3 className="text-xl font-bold mb-4">Your Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Orders</div>
                    <div className="text-lg font-semibold">{stats?.totalOrders ?? 0}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Bike className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Test Rides</div>
                    <div className="text-lg font-semibold">{stats?.totalTestRides ?? 0}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Wrench className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Services</div>
                    <div className="text-lg font-semibold">{stats?.totalServices ?? 0}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Star className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Reviews</div>
                    <div className="text-lg font-semibold">{stats?.totalReviews ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card p-8">
              <h3 className="text-xl font-bold mb-4">Account</h3>
              <div className="flex items-center gap-2 text-gray-700 mb-4">
                <Shield className="w-5 h-5" />
                <span>Status: {profile?.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 mb-4">
                <Calendar className="w-5 h-5" />
                <span>Member since: {new Date(profile?.createAt).toLocaleDateString('en-US')}</span>
              </div>
              <input
                type="password"
                placeholder="Current password to deactivate"
                value={deactivatePassword}
                onChange={(e) => setDeactivatePassword(e.target.value)}
                className="input w-full mb-4"
              />
              <button
                onClick={handleDeactivate}
                className="btn btn-secondary w-full"
              >
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
