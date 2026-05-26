import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Filter, X, Save, Upload } from 'lucide-react';
import adminService from '../../services/admin.service';
import { uploadService } from '../../services/upload.service';
import { motorcycleService } from '../../services/motorcycle.service';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminMotorcycles = () => {
  const [motorcycles, setMotorcycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingMotorcycle, setEditingMotorcycle] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'Sport',
    price: 0,
    discountPercentage: 0,
    description: '',
    engineType: '',
    displacement: 0,
    power: 0,
    torque: 0,
    weight: 0,
    topSpeed: 0,
    fuelCapacity: 0,
    stock: 0,
    images: [],
    features: [],
    color: ''
  });

  const brands = ['YAMAHA', 'HONDA', 'KAWASAKI', 'DUCATI', 'SUZUKI', 'BMW', 'HARLEY-DAVIDSON'];
  const categories = ['Sport', 'Naked', 'Cruiser', 'Adventure', 'Sport Touring'];
  const statuses = ['AVAILABLE', 'OUT_OF_STOCK', 'SOLD'];
  const FALLBACK_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

  const loadMotorcycles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllMotorcyclesAdmin(
        currentPage,
        10,
        brandFilter || null,
        statusFilter || null,
        searchTerm || null
      );
      const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
      setMotorcycles(content);
      setTotalPages(typeof data?.totalPages === 'number' ? data.totalPages : 0);
      setTotalItems(typeof data?.totalItems === 'number' ? data.totalItems : content.length);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load motorcycles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, brandFilter, statusFilter, searchTerm]);
 
  useEffect(() => {
    loadMotorcycles();
  }, [loadMotorcycles]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      if (editingMotorcycle) {
        const updated = await motorcycleService.addImages(editingMotorcycle.id, [file]);
        setFormData(prev => ({
          ...prev,
          images: updated.images || []
        }));
        toast.success('Image added');
      } else {
        const { url } = await uploadService.uploadSingle(file, 'motorcycles');
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, url]
        }));
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to upload image');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate
      if (!formData.brand || !formData.model || !formData.price) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (editingMotorcycle) {
        // Update
        await adminService.updateMotorcycle(editingMotorcycle.id, formData);
        toast.success('Motorcycle updated successfully');
      } else {
        // Create
        await adminService.addMotorcycle(formData);
        toast.success('Motorcycle added successfully');
      }

      setShowModal(false);
      resetForm();
      loadMotorcycles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
      console.error(error);
    }
  };

  const handleEdit = (motorcycle) => {
    setEditingMotorcycle(motorcycle);
    setFormData({
      brand: motorcycle.brand,
      model: motorcycle.model,
      year: motorcycle.year,
      category: motorcycle.category,
      price: motorcycle.price,
      discountPercentage: motorcycle.discountPercentage || 0,
      description: motorcycle.description,
      engineType: motorcycle.engineType,
      displacement: motorcycle.displacement,
      power: motorcycle.power,
      torque: motorcycle.torque,
      weight: motorcycle.weight,
      topSpeed: motorcycle.topSpeed,
      fuelCapacity: motorcycle.fuelCapacity,
      stock: motorcycle.stock,
      images: motorcycle.images || [],
      features: motorcycle.features || [],
      color: motorcycle.color
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this motorcycle?')) return;

    try {
      await adminService.deleteMotorcycle(id);
      toast.success('Motorcycle deleted successfully');
      loadMotorcycles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete motorcycle');
      console.error(error);
    }
  };

  const handleStockUpdate = async (id, newStock) => {
    try {
      await adminService.updateMotorcycleStock(id, newStock);
      toast.success('Stock updated successfully');
      loadMotorcycles();
    } catch (error) {
      toast.error('Failed to update stock');
      console.error(error);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await adminService.updateMotorcycleStatus(id, newStatus);
      toast.success('Status updated successfully');
      loadMotorcycles();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      category: 'Sport',
      price: 0,
      discountPercentage: 0,
      description: '',
      engineType: '',
      displacement: 0,
      power: 0,
      torque: 0,
      weight: 0,
      topSpeed: 0,
      fuelCapacity: 0,
      stock: 0,
      images: [],
      features: [],
      color: ''
    });
    setEditingMotorcycle(null);
  };

  const handleAddFeature = () => {
    const feature = prompt('Enter feature:');
    if (feature) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveImage = async (index) => {
    try {
      const url = formData.images[index];
      if (editingMotorcycle && url) {
        const updated = await motorcycleService.removeImage(editingMotorcycle.id, url);
        setFormData(prev => ({
          ...prev,
          images: updated.images || []
        }));
        toast.success('Image removed');
      } else {
        setFormData(prev => ({
          ...prev,
          images: prev.images.filter((_, i) => i !== index)
        }));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to remove image');
      console.error(error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'OUT_OF_STOCK': return 'bg-red-100 text-red-800';
      case 'SOLD': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Motorcycles</h1>
          <p className="text-gray-600">{totalItems} total motorcycles</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                toast.loading('Migrating images...', { id: 'migrate' });
                const res = await adminService.migrateImages();
                const mc = res?.motorcycles?.migratedImages ?? 0;
                const rv = res?.reviews?.migratedImages ?? 0;
                toast.success(`Migrated ${mc} motorcycle images, ${rv} review images`, { id: 'migrate' });
                loadMotorcycles();
              } catch (e) {
                toast.error(e?.response?.data?.message || 'Migration failed', { id: 'migrate' });
              }
            }}
            className="btn btn-outline flex items-center gap-2"
            title="Upload local image paths to Cloudinary"
          >
            <Upload className="w-5 h-5" />
            Migrate Images
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Motorcycle
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search motorcycles..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
              className="input pl-10 w-full"
            />
          </div>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setCurrentPage(0);
            }}
            className="input"
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(0);
            }}
            className="input"
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setBrandFilter('');
              setStatusFilter('');
              setCurrentPage(0);
            }}
            className="btn btn-outline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-600">Loading motorcycles...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Motorcycle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {motorcycles.map((motorcycle) => (
                    <tr key={motorcycle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={getImageUrl(motorcycle.images?.[0]) || FALLBACK_IMG}
                            alt={motorcycle.model}
                            className="w-16 h-16 rounded-lg object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {motorcycle.brand} {motorcycle.model}
                            </div>
                            <div className="text-sm text-gray-500">{motorcycle.year}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{motorcycle.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(motorcycle.price)}
                        </span>
                        {motorcycle.discountPercentage > 0 && (
                          <span className="ml-2 text-xs font-bold text-white bg-red-500 px-2 py-1 rounded-full">
                            -{motorcycle.discountPercentage}%
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={motorcycle.stock}
                          onChange={(e) => handleStockUpdate(motorcycle.id, parseInt(e.target.value))}
                          className="input w-20 text-sm"
                          min="0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={motorcycle.status}
                          onChange={(e) => handleStatusUpdate(motorcycle.id, e.target.value)}
                          className={`text-xs font-semibold rounded-full px-3 py-1 ${getStatusColor(motorcycle.status)}`}
                        >
                          {statuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(motorcycle)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(motorcycle.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {editingMotorcycle ? 'Edit Motorcycle' : 'Add Motorcycle'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Brand *</label>
                    <select
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      className="input w-full"
                      required
                    >
                      <option value="">Select Brand</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Model *</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Year *</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      className="input w-full"
                      min="2000"
                      max="2030"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="input w-full"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Price (VND) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                      className="input w-full"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Discount (%)</label>
                    <input
                      type="number"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({...formData, discountPercentage: parseFloat(e.target.value)})}
                      className="input w-full"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Stock *</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                      className="input w-full"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Color</label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="input w-full"
                      placeholder="e.g., Black/Red"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input w-full"
                    rows="3"
                  />
                </div>
              </div>

              {/* Engine Specs */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Engine Specifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Engine Type</label>
                    <input
                      type="text"
                      value={formData.engineType}
                      onChange={(e) => setFormData({...formData, engineType: e.target.value})}
                      className="input w-full"
                      placeholder="e.g., 998cc Inline-4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Displacement (cc)</label>
                    <input
                      type="number"
                      value={formData.displacement}
                      onChange={(e) => setFormData({...formData, displacement: parseInt(e.target.value)})}
                      className="input w-full"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Power (hp)</label>
                    <input
                      type="number"
                      value={formData.power}
                      onChange={(e) => setFormData({...formData, power: parseFloat(e.target.value)})}
                      className="input w-full"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Torque (Nm)</label>
                    <input
                      type="number"
                      value={formData.torque}
                      onChange={(e) => setFormData({...formData, torque: parseFloat(e.target.value)})}
                      className="input w-full"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value)})}
                      className="input w-full"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Top Speed (km/h)</label>
                    <input
                      type="number"
                      value={formData.topSpeed}
                      onChange={(e) => setFormData({...formData, topSpeed: parseFloat(e.target.value)})}
                      className="input w-full"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Fuel Capacity (L)</label>
                    <input
                      type="number"
                      value={formData.fuelCapacity}
                      onChange={(e) => setFormData({...formData, fuelCapacity: parseFloat(e.target.value)})}
                      className="input w-full"
                      step="0.1"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Images</h3>
                <div className="space-y-4">
                  <div>
                    <label className="btn btn-outline cursor-pointer flex items-center gap-2 w-fit">
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
                  </div>

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Features</h3>
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="btn btn-outline mb-4"
                >
                  Add Feature
                </button>

                {formData.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6 border-t">
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  {editingMotorcycle ? 'Update Motorcycle' : 'Add Motorcycle'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMotorcycles;
