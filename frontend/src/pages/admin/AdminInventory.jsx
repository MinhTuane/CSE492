import { useState, useEffect, useCallback } from 'react';
import { Store, Search, Save, Package } from 'lucide-react';
import adminService from '../../services/admin.service';
import { motorcycleService } from '../../services/motorcycle.service';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/helpers';

const AdminInventory = () => {
  const [stores, setStores] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Track modified stocks: { motorcycleId: newStock }
  const [modifiedStocks, setModifiedStocks] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all stores and all motorcycles
      const [storesData, motorcyclesData] = await Promise.all([
        adminService.getAllStores(),
        motorcycleService.getAll() // Assuming this returns all motorcycles without pagination or we can use searchPaged
      ]);
      setStores(storesData);
      setMotorcycles(motorcyclesData);
      
      if (storesData.length > 0) {
        setSelectedStoreId(storesData[0].id);
      }
    } catch (error) {
      toast.error('Failed to load initial data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadInventory = useCallback(async (storeId) => {
    if (!storeId) return;
    try {
      setLoading(true);
      const data = await adminService.getStoreInventory(storeId);
      setInventory(data);
      setModifiedStocks({}); // Reset modifications when changing store
    } catch {
      toast.error('Failed to load store inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      loadInventory(selectedStoreId);
    }
  }, [selectedStoreId, loadInventory]);

  const handleStockChange = (motorcycleId, value) => {
    const stock = parseInt(value, 10);
    if (isNaN(stock) || stock < 0) return;
    
    setModifiedStocks(prev => ({
      ...prev,
      [motorcycleId]: stock
    }));
  };

  const getStockForMotorcycle = (motorcycleId) => {
    if (modifiedStocks[motorcycleId] !== undefined) {
      return modifiedStocks[motorcycleId];
    }
    const invRecord = inventory.find(inv => inv.motorcycle.id === motorcycleId);
    return invRecord ? invRecord.stock : 0;
  };

  const handleSave = async () => {
    const keys = Object.keys(modifiedStocks);
    if (keys.length === 0) {
      toast.error('No changes to save');
      return;
    }
    
    setSaving(true);
    try {
      // Save each modified stock
      const promises = keys.map(motorcycleId => {
        return adminService.updateStoreInventory(
          selectedStoreId,
          motorcycleId,
          modifiedStocks[motorcycleId]
        );
      });
      
      await Promise.all(promises);
      toast.success('Inventory updated successfully');
      setModifiedStocks({});
      loadInventory(selectedStoreId); // Reload to reflect saved changes
    } catch (error) {
      toast.error('Failed to update some inventory records');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const filteredMotorcycles = motorcycles.filter(m => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (m.brand && m.brand.toLowerCase().includes(term)) ||
      (m.model && m.model.toLowerCase().includes(term))
    );
  });

  if (loading && stores.length === 0) {
    return <div className="py-8 text-center">Loading inventory...</div>;
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Package className="w-8 h-8 text-red-600" />
            Branch Inventory
          </h1>
          <p className="text-gray-600">Manage stock allocation per dealership branch</p>
        </div>
        <button
          onClick={handleSave}
          disabled={Object.keys(modifiedStocks).length === 0 || saving}
          className="btn btn-primary flex items-center gap-2"
        >
          {saving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-6">
        {/* Store Selector */}
        <div className="bg-white rounded-xl shadow-md p-6 col-span-1 border border-gray-100">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-gray-500" />
            Select Store
          </h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => setSelectedStoreId(store.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedStoreId === store.id
                    ? 'bg-red-50 border-red-500 text-red-700 font-semibold'
                    : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{store.name}</div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-1" title={store.address}>
                  {store.address}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Inventory List */}
        <div className="bg-white rounded-xl shadow-md p-6 col-span-3 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">
              Inventory for: {stores.find(s => s.id === selectedStoreId)?.name || 'Loading...'}
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search motorcycles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-9 text-sm py-2"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="p-3 text-gray-600 font-semibold w-16">Image</th>
                  <th className="p-3 text-gray-600 font-semibold">Motorcycle</th>
                  <th className="p-3 text-gray-600 font-semibold w-32">Category</th>
                  <th className="p-3 text-gray-600 font-semibold w-32">Global Stock</th>
                  <th className="p-3 text-gray-600 font-semibold w-32">Store Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && inventory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">Loading branch inventory...</td>
                  </tr>
                ) : filteredMotorcycles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">No motorcycles found</td>
                  </tr>
                ) : (
                  filteredMotorcycles.map(moto => {
                    const currentStock = getStockForMotorcycle(moto.id);
                    const isModified = modifiedStocks[moto.id] !== undefined;
                    
                    return (
                      <tr key={moto.id} className={isModified ? 'bg-orange-50/50' : 'hover:bg-gray-50'}>
                        <td className="p-3">
                          <img
                            src={getImageUrl(moto.images?.[0])}
                            alt={moto.model}
                            className="w-12 h-12 rounded object-cover border border-gray-200"
                            onError={(e) => {
                              e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=100';
                            }}
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-gray-900">{moto.brand} {moto.model}</div>
                          <div className="text-xs text-gray-500">{moto.id.substring(0, 8)}...</div>
                        </td>
                        <td className="p-3 text-sm text-gray-600">{moto.category}</td>
                        <td className="p-3 text-sm">
                          <span className={`px-2 py-1 rounded-full ${moto.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {moto.stock || 0}
                          </span>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            value={currentStock}
                            onChange={(e) => handleStockChange(moto.id, e.target.value)}
                            className={`w-20 p-2 border rounded-md text-center focus:outline-none focus:ring-2 ${
                              isModified 
                                ? 'border-orange-400 focus:ring-orange-200 bg-white' 
                                : 'border-gray-300 focus:ring-red-200'
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInventory;