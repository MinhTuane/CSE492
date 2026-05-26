import { useState, useEffect, useCallback } from 'react';
import { Search, UserCheck, UserX, Shield } from 'lucide-react';
import adminService from '../../services/admin.service';
import { formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const loadUsers = useCallback(async () => {
    try {
      const roleParam = roleFilter !== 'ALL' ? roleFilter : null;
      const data = await adminService.getAllUsersAdmin(currentPage, 10, roleParam, searchTerm || null);
      setUsers(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalItems(data?.totalElements || 0);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, roleFilter, searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  

  const handleUpdateUserStatus = async (userId, next) => {
    try {
      if (!next) return;
      if (next === 'ACTIVE') {
        await adminService.activateUser(userId);
      } else if (next === 'INACTIVE') {
        await adminService.deactivateUser(userId);
      } else {
        return;
      }
      toast.success('User status updated');
      loadUsers();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('You do not have permission to update user status');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update user status');
      }
    }
  };
  const handleUpdateRole = async (userId, newRole) => {
    try {
      await adminService.changeUserRole(userId, newRole);
      toast.success('User role updated');
      loadUsers();
    } catch {
      toast.error('Failed to update user role');
    }
  };

  const filteredUsers = users;

  if (loading) {
    return <div className="py-8 text-center">Loading users...</div>;
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
          <p className="text-gray-600">{totalItems} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(0);
            }}
            className="input"
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.firstname?.[0]}{user.lastname?.[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstname} {user.lastname}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.phone || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{user.address || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      className="text-sm px-2 py-1 rounded border"
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="STAFF">Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(user.createAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.isActive ? 'ACTIVE' : 'INACTIVE'}
                      onChange={(e) => handleUpdateUserStatus(user.id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-3 py-1 ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, totalItems)} of {totalItems}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="btn btn-outline disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-10 h-10 rounded-lg ${
                    currentPage === i
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="btn btn-outline disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
