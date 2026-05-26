import { useState } from 'react';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const InsuranceQuote = ({ onClose }) => {
  const [insPrice, setInsPrice] = useState('');
  const [coverage, setCoverage] = useState('Comprehensive');
  const [ageBracket, setAgeBracket] = useState('25-60');
  const [riskFactor, setRiskFactor] = useState(1.0);

  const calculatePremium = () => {
    const price = Number(insPrice || 0);
    const base = coverage === 'Comprehensive' ? 0.025 : 0.015;
    const age = ageBracket === '<25' ? 1.2 : ageBracket === '>60' ? 1.1 : 1.0;
    const premium = price * base * age * riskFactor;
    return formatCurrency(Math.round(premium));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Insurance Quote</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Motorcycle Price</label>
            <input
              type="number"
              min="0"
              className="input w-full"
              placeholder="Enter price"
              value={insPrice}
              onChange={(e) => setInsPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Coverage</label>
            <select className="input w-full" value={coverage} onChange={(e) => setCoverage(e.target.value)}>
              <option value="Basic">Basic</option>
              <option value="Comprehensive">Comprehensive</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Age Bracket</label>
            <select className="input w-full" value={ageBracket} onChange={(e) => setAgeBracket(e.target.value)}>
              <option value="<25">Under 25</option>
              <option value="25-60">25–60</option>
              <option value=">60">Over 60</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Risk Factor</label>
            <input
              type="number"
              min="0.8"
              max="1.5"
              step="0.05"
              className="input w-full"
              value={riskFactor}
              onChange={(e) => setRiskFactor(Number(e.target.value))}
            />
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="font-semibold mb-2">Estimated Premium</div>
            <div className="text-2xl font-bold text-blue-700">
              {calculatePremium()}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Based on coverage, age, and risk multipliers
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

export default InsuranceQuote;
