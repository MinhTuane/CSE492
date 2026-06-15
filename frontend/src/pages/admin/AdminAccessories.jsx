import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, Upload, Sparkles } from 'lucide-react';
import { accessoryService } from '../../services/accessory.service';
import { uploadService } from '../../services/upload.service';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminAccessories = () => {
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'Exhaust',
    price: 0,
    stock: 0,
    description: '',
    imageUrl: '',
    compatibleBikes: '',
    isActive: true
  });

  const categories = ['Exhaust', 'Crash Pad', 'Helmet', 'Mirror', 'Tires', 'Grips', 'Luggage', 'Electronics', 'Other'];
  const FALLBACK_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

  const loadAccessories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await accessoryService.searchPaged(
        searchTerm || null,
        currentPage,
        10
      );
      setAccessories(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalItems(data.totalElements || 0);
    } catch (error) {
      toast.error('Failed to load accessories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    loadAccessories();
  }, [loadAccessories]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const { url } = await uploadService.uploadSingle(file, 'accessories');
      setFormData(prev => ({
        ...prev,
        imageUrl: url
      }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.brand || formData.price === undefined || formData.stock === undefined) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (editingAccessory) {
        await accessoryService.update(editingAccessory.id, formData);
        toast.success('Accessory updated successfully');
      } else {
        await accessoryService.create(formData);
        toast.success('Accessory added successfully');
      }

      setShowModal(false);
      resetForm();
      loadAccessories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
      console.error(error);
    }
  };

  const handleEdit = (accessory) => {
    setEditingAccessory(accessory);
    setFormData({
      name: accessory.name,
      brand: accessory.brand,
      category: accessory.category || 'Exhaust',
      price: accessory.price || 0,
      stock: accessory.stock || 0,
      description: accessory.description || '',
      imageUrl: accessory.imageUrl || '',
      compatibleBikes: accessory.compatibleBikes || '',
      isActive: accessory.isActive !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this accessory?')) return;
    try {
      await accessoryService.delete(id);
      toast.success('Accessory deleted successfully');
      loadAccessories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete accessory');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      category: 'Exhaust',
      price: 0,
      stock: 0,
      description: '',
      imageUrl: '',
      compatibleBikes: '',
      isActive: true
    });
    setEditingAccessory(null);
  };

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-red-600 animate-pulse" />
            Manage Accessories
          </h1>
          <p className="text-gray-600">{totalItems} total accessories</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md border-0"
        >
          <Plus className="w-5 h-5" />
          Add Accessory
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search accessories by name, brand, category..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
              className="input pl-10 w-full focus:ring-red-200 focus:border-red-500 rounded-xl"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(0);
              }}
              className="btn btn-outline rounded-xl"
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-600 font-medium">Loading accessories...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Accessory</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accessories.map((accessory) => (
                    <tr key={accessory.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={getImageUrl(accessory.imageUrl) || FALLBACK_IMG}
                            alt={accessory.name}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                            onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
                          />
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{accessory.name}</div>
                            <div className="text-xs text-gray-500">{accessory.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{accessory.category}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {formatCurrency(accessory.price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-semibold">{accessory.stock}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold rounded-full px-2.5 py-1 ${
                          accessory.isActive 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {accessory.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(accessory)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(accessory.id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {accessories.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-400">No accessories found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, totalItems)} of {totalItems}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="btn btn-outline disabled:opacity-50 rounded-xl"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                        currentPage === i
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="btn btn-outline disabled:opacity-50 rounded-xl"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAccessory ? 'Edit Accessory' : 'Add Accessory'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Accessory Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input w-full rounded-xl focus:ring-red-200"
                    placeholder="e.g. Yoshimura R-77 Exhaust"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Brand *</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="input w-full rounded-xl focus:ring-red-200"
                    placeholder="e.g. Yoshimura"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="input w-full rounded-xl focus:ring-red-200"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price (VND) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="input w-full rounded-xl focus:ring-red-200"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Stock *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                    className="input w-full rounded-xl focus:ring-red-200"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Compatible Bikes</label>
                  <input
                    type="text"
                    value={formData.compatibleBikes}
                    onChange={(e) => setFormData({...formData, compatibleBikes: e.target.value})}
                    className="input w-full rounded-xl focus:ring-red-200"
                    placeholder="e.g. Honda CBR650R, Kawasaki Ninja 650"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input w-full rounded-xl focus:ring-red-200"
                  rows="3"
                  placeholder="Enter accessory features and specs..."
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Image</label>
                <div className="flex items-center gap-4">
                  <label className="btn btn-outline cursor-pointer flex items-center gap-2 rounded-xl">
                    <Upload className="w-5 h-5" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {formData.imageUrl && (
                    <div className="relative group">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, imageUrl: ''})}
                        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white p-0.5 rounded-full hover:bg-red-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">Active (Visible to customers)</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn btn-secondary rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-primary rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md border-0"
                >
                  <Save className="w-4 h-4 mr-1.5 inline" />
                  Save Accessory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccessories;
