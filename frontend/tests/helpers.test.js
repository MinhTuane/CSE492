import { describe, it, expect } from 'vitest';
import { formatCurrency, calculateFinancing } from '../src/utils/helpers';

describe('Helper Functions', () => {
  
  describe('formatCurrency', () => {
    it('should format number to VND currency string correctly', () => {
      const result = formatCurrency(1500000);
      // Since Intl.NumberFormat might return non-breaking spaces or different representations depending on environment,
      // we check for the value and the currency symbol.
      expect(result).toMatch(/1[.,\s]*500[.,\s]*000/);
      expect(result).toContain('₫');
    });

    it('should handle zero value', () => {
      const result = formatCurrency(0);
      expect(result).toMatch(/0/);
      expect(result).toContain('₫');
    });

    it('should return empty string for null or undefined', () => {
      expect(formatCurrency(null)).toBe('');
      expect(formatCurrency(undefined)).toBe('');
    });
  });

  describe('calculateFinancing', () => {
    it('should calculate monthly payment correctly', () => {
      // Principal = 100M, Down = 20M -> Loan = 80M
      // Interest = 5% per year, Terms = 12 months
      // Monthly interest = 0.05 / 12
      // Formula: P * [ r * (1+r)^n ] / [ (1+r)^n - 1 ]
      const principal = 100000000;
      const downPayment = 20000000;
      const months = 12;
      const annualRate = 5;

      const monthlyPayment = calculateFinancing(principal, downPayment, months, annualRate);
      
      // Rough estimate for 80M at 5% over 12 months is ~6.8M
      expect(monthlyPayment).toBeGreaterThan(6000000);
      expect(monthlyPayment).toBeLessThan(7000000);
    });

    it('should handle 0% interest rate', () => {
      const principal = 12000000;
      const downPayment = 0;
      const months = 12;
      const annualRate = 0;

      const monthlyPayment = calculateFinancing(principal, downPayment, months, annualRate);
      
      // 12M / 12 months = 1M/month exactly
      expect(monthlyPayment).toBe(1000000);
    });
  });
});