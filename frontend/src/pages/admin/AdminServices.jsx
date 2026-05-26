import { useState, useEffect, useCallback } from 'react';
import { Wrench, Plus, Search, Edit, Trash2, X, Save } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  getAllServiceOfferings,
  createServiceOffering,
  updateServiceOffering,
  deleteServiceOffering,
  setServiceOfferingActive
} from '../../services/admin.service';

const AdminServices = () => {
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editOffering, setEditOffering] = useState(null);
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [featuresInput, setFeaturesInput] = useState('');
  const [features, setFeatures] = useState([]);
  const [active, setActive] = useState(true);

  const loadOfferings = useCallback(async () => {
    try {
      const data = await getAllServiceOfferings(0, 100, searchTerm || null);
      setOfferings(data?.content || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load service catalog');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  const addFeatureFromInput = () => {
    const f = featuresInput.trim();
    if (!f) return;
    setFeatures((prev) => [...prev, f]);
    setFeaturesInput('');
  };

  const openCreate = () => {
    setIsCreateOpen(true);
    setName('');
    setSubtitle('');
    setDescription('');
    setPrice('');
    setFeatures([]);
    setFeaturesInput('');
    setActive(true);
  };

  const openEdit = (off) => {
    setEditOffering(off);
    setName(off.name || '');
    setSubtitle(off.subtitle || '');
    setDescription(off.description || '');
    setPrice(off.price != null ? String(off.price) : '');
    setFeatures(off.features || []);
    setActive(off.active ?? true);
    setIsEditOpen(true);
  };

  const handleCreate = async () => {
    try {
      if (!name || !price) {
        toast.error('Name and price are required');
        return;
      }
      const payload = {
        name,
        subtitle: subtitle || null,
        description: description || null,
        price: Number(price),
        features,
        active,
      };
      const res = await createServiceOffering(payload);
      if (res?.id) {
        toast.success('Service saved');
        setIsCreateOpen(false);
        loadOfferings();
      } else {
        toast.error('Failed to save service');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save service');
    }
  };

  const handleEdit = async () => {
    try {
      if (!editOffering?.id) return;
      const payload = {
        name,
        subtitle: subtitle || null,
        description: description || null,
        price: Number(price),
        features,
        active,
      };
      await updateServiceOffering(editOffering.id, payload);
      toast.success('Service updated');
      setIsEditOpen(false);
      setEditOffering(null);
      loadOfferings();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update service');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteServiceOffering(id);
      toast.success('Service deleted');
      loadOfferings();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete service');
    }
  };

  const handleToggleActive = async (id, newActive) => {
    try {
      await setServiceOfferingActive(id, newActive);
      toast.success('Visibility updated');
      loadOfferings();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update visibility');
    }
  };

  const filteredOfferings = (offerings || []).filter((o) => {
    const term = searchTerm.toLowerCase();
    return (
      (o.name || '').toLowerCase().includes(term) ||
      (o.subtitle || '').toLowerCase().includes(term) ||
      (o.description || '').toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <div className="py-8 text-center">Loading service catalog...</div>;
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Service Catalog</h1>
          <p className="text-gray-600">{offerings.length} total services</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Service
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, subtitle or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtitle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOfferings.map((off) => (
                <tr key={off.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{off.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[24rem]">{off.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{off.subtitle || '—'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {off.price != null ? formatCurrency(off.price) : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${off.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {off.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(off)}
                        className="btn btn-outline px-3 py-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(off.id, !off.active)}
                        className={`btn btn-outline px-3 py-1 ${off.active ? 'text-green-700' : 'text-gray-600'}`}
                      >
                        {off.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(off.id)}
                        className="btn btn-outline px-3 py-1 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOfferings.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-600">No services found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                New Service
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="btn btn-ghost">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="mb-2 text-sm font-semibold">Name</div>
                <input
                  type="text"
                  placeholder="Service name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold">Subtitle</div>
                <input
                  type="text"
                  placeholder="Short subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold">Price</div>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold">Active</div>
                <select value={active ? 'true' : 'false'} onChange={(e) => setActive(e.target.value === 'true')} className="input w-full">
                  <option value="true">Active</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="mb-2 text-sm font-semibold">Description</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input w-full h-24"
                />
              </div>
              <div className="md:col-span-2">
                <div className="mb-2 text-sm font-semibold">Features</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add feature and press Add"
                    value={featuresInput}
                    onChange={(e) => setFeaturesInput(e.target.value)}
                    className="input w-full"
                  />
                  <button type="button" onClick={addFeatureFromInput} className="btn btn-outline">Add</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {features.map((f, idx) => (
                    <span key={`${f}-${idx}`} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {f}
                      <button
                        className="ml-2 text-red-600"
                        onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsCreateOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={handleCreate} className="btn btn-primary flex items-center gap-2">
                <Save className="w-5 h-5" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Service
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="btn btn-ghost">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="mb-2 text-sm font-semibold">Name</div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold">Subtitle</div>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div className="md:col-span-2">
                <div className="mb-2 text-sm font-semibold">Description</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input w-full h-24"
                />
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold">Price</div>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold">Active</div>
                <select value={active ? 'true' : 'false'} onChange={(e) => setActive(e.target.value === 'true')} className="input w-full">
                  <option value="true">Active</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="mb-2 text-sm font-semibold">Features</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add feature and press Add"
                    value={featuresInput}
                    onChange={(e) => setFeaturesInput(e.target.value)}
                    className="input w-full"
                  />
                  <button type="button" onClick={addFeatureFromInput} className="btn btn-outline">Add</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {features.map((f, idx) => (
                    <span key={`${f}-${idx}`} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {f}
                      <button
                        className="ml-2 text-red-600"
                        onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setEditOffering(null);
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button onClick={handleEdit} className="btn btn-primary flex items-center gap-2">
                <Save className="w-5 h-5" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
