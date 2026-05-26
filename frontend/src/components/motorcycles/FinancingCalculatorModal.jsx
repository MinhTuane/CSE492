import { useState } from 'react';
import { XCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const FinancingCalculatorModal = ({ price, onClose }) => {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [termMonths, setTermMonths] = useState(36);
  const [interestRate, setInterestRate] = useState(5.9);

  const downPayment = price * (downPaymentPercent / 100);
  const principal = price - downPayment;
  
  // Calculate monthly payment using standard amortization formula
  // M = P [ r(1 + r)^n ] / [ (1 + r)^n - 1 ]
  const monthlyRate = (interestRate / 100) / 12;
  const numPayments = termMonths;
  
  let monthlyPayment = 0;
  if (monthlyRate === 0) {
    monthlyPayment = principal / numPayments;
  } else {
    monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  const totalInterest = (monthlyPayment * numPayments) - principal;
  const totalCost = price + totalInterest;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
        <div className="border-b px-6 py-4 flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Financing Calculator</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Price Summary */}
          <div className="bg-red-50 p-4 rounded-lg flex justify-between items-center border border-red-100">
            <span className="text-red-900 font-medium">Vehicle Price</span>
            <span className="text-2xl font-bold text-red-700">{formatCurrency(price)}</span>
          </div>

          {/* Controls */}
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Down Payment ({downPaymentPercent}%)</label>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(downPayment)}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="80" 
                step="5"
                value={downPaymentPercent} 
                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term (Months)</label>
                <select 
                  className="input w-full"
                  value={termMonths}
                  onChange={(e) => setTermMonths(Number(e.target.value))}
                >
                  <option value={12}>12 Months</option>
                  <option value={24}>24 Months</option>
                  <option value={36}>36 Months</option>
                  <option value={48}>48 Months</option>
                  <option value={60}>60 Months</option>
                  <option value={72}>72 Months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="30"
                  className="input w-full"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="border-t pt-6 space-y-3">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Amount Financed</span>
              <span className="font-semibold text-gray-900">{formatCurrency(principal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Estimated Total Interest</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totalInterest)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Total Cost (Price + Interest)</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totalCost)}</span>
            </div>
            
            <div className="mt-4 p-4 bg-gray-900 text-white rounded-xl flex justify-between items-center shadow-inner">
              <span className="font-medium">Estimated Monthly Payment</span>
              <span className="text-3xl font-bold text-green-400">{formatCurrency(monthlyPayment)}</span>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              *This is an estimate. Actual rates and payments may vary based on credit approval and other factors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancingCalculatorModal;
