import { useState } from 'react';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const TradeInEstimator = ({ onClose }) => {
  const [tradePrice, setTradePrice] = useState('');
  const [tradeCondition, setTradeCondition] = useState(0.85);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Trade-In Value</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target New Motorcycle Price</label>
            <input
              type="number"
              min="0"
              className="input w-full"
              placeholder="Enter price"
              value={tradePrice}
              onChange={(e) => setTradePrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Condition Factor</label>
            <select
              className="input w-full"
              value={tradeCondition}
              onChange={(e) => setTradeCondition(Number(e.target.value))}
            >
              <option value={0.5}>Poor (0.50)</option>
              <option value={0.7}>Fair (0.70)</option>
              <option value={0.85}>Good (0.85)</option>
              <option value={1.0}>Excellent (1.00)</option>
            </select>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="font-semibold mb-2">Estimated Trade-In Credit</div>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(Math.round((Number(tradePrice || 0) * 0.10) * tradeCondition))}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Calculated as 10% × condition × new motorcycle price
            </div>
          </div>
          <div className="text-right">
            <Link to="/contact" className="btn btn-primary">Proceed</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeInEstimator;
