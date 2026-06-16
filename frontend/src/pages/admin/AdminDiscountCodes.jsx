import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminDiscountCodes = () => {
  const [discountCodes, setDiscountCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: 0,
    maxDiscountAmount: '',
    validFrom: '',
    validTo: '',
    maxUsages: '',
    isActive: true
  });
  const fetchDiscountCodes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/discount-codes');
      setDiscountCodes(res.data);
    } catch {
      toast.error('Failed to fetch discount codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscountCodes();
  }, []);

  const resetForm = () => {
    setFormData({
      code: '',
      discountPercentage: 0,
      maxDiscountAmount: '',
      validFrom: '',
      validTo: '',
      maxUsages: '',
      isActive: true
    });
    setEditingCode(null);
  };

  const handleEdit = (code) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discountPercentage: code.discountPercentage,
      maxDiscountAmount: code.maxDiscountAmount || '',
      validFrom: code.validFrom ? code.validFrom.slice(0, 16) : '',
      validTo: code.validTo ? code.validTo.slice(0, 16) : '',
      maxUsages: code.maxUsages || '',
      isActive: code.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discount code?')) return;
    try {
      await api.delete(`/discount-codes/${id}`);
      toast.success('Discount code deleted');
      fetchDiscountCodes();
    } catch {
      toast.error('Failed to delete discount code');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        maxUsages: formData.maxUsages ? parseInt(formData.maxUsages) : null,
        validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : null,
        validTo: formData.validTo ? new Date(formData.validTo).toISOString() : null
      };

      if (editingCode) {
        await api.put(`/discount-codes/${editingCode.id}`, payload);
        toast.success('Discount code updated');
      } else {
        await api.post('/discount-codes', payload);
        toast.success('Discount code created');
      }
      setShowModal(false);
      resetForm();
      fetchDiscountCodes();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <div className="py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Discount Codes</h1>
          <p className="text-gray-600">Manage promotional codes for checkout</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Code
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {discountCodes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-900">{code.code}</td>
                  <td className="px-6 py-4 text-red-600 font-semibold">{code.discountPercentage}%</td>
                  <td className="px-6 py-4">{code.maxDiscountAmount ? formatCurrency(code.maxDiscountAmount) : 'No Limit'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>From: {code.validFrom ? new Date(code.validFrom).toLocaleDateString() : 'Always'}</div>
                    <div>To: {code.validTo ? new Date(code.validTo).toLocaleDateString() : 'Forever'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {code.currentUsages} / {code.maxUsages || '∞'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${code.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {code.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(code)} className="text-blue-600 hover:text-blue-900"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(code.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {discountCodes.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No discount codes found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingCode ? 'Edit Code' : 'Create Code'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Code *</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="input w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount % *</label>
                  <input type="number" value={formData.discountPercentage} onChange={e => setFormData({...formData, discountPercentage: parseFloat(e.target.value)})} className="input w-full" min="0" max="100" step="0.1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Discount Amount (VND)</label>
                  <input type="number" value={formData.maxDiscountAmount} onChange={e => setFormData({...formData, maxDiscountAmount: e.target.value})} className="input w-full" min="0" placeholder="No limit" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Usages</label>
                  <input type="number" value={formData.maxUsages} onChange={e => setFormData({...formData, maxUsages: e.target.value})} className="input w-full" min="1" placeholder="Unlimited" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valid From</label>
                  <input type="datetime-local" value={formData.validFrom} onChange={e => setFormData({...formData, validFrom: e.target.value})} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valid To</label>
                  <input type="datetime-local" value={formData.validTo} onChange={e => setFormData({...formData, validTo: e.target.value})} className="input w-full" />
                </div>
                <div className="col-span-2 flex items-center gap-2 mt-2">
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-red-600 rounded border-gray-300" />
                  <label htmlFor="isActive" className="text-sm font-medium">Active (can be used)</label>
                </div>
              </div>
              <div className="flex gap-4 pt-4 border-t">
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDiscountCodes;
