/**
 * Formats a number to Indonesian Rupiah (IDR) currency format
 * @param {number|string} amount - The amount to format
 * @param {boolean} includePrefix - Whether to include "Rp" prefix
 * @returns {string} Formatted currency string
 */
export const formatIDR = (amount, includePrefix = true) => {
  if (amount === undefined || amount === null || amount === '') return '';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, "")) : amount;
  
  if (isNaN(numericAmount)) return '';

  const formatted = new Intl.NumberFormat('id-ID', {
    style: includePrefix ? 'currency' : 'decimal',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);

  // If style is currency, it already includes Rp. If not, we might need to handle it.
  return formatted;
};

/**
 * Parses a currency string back to a number
 * @param {string} value - The currency string to parse
 * @returns {number} The numeric value
 */
export const parseIDR = (value) => {
  if (!value) return 0;
  return parseFloat(value.replace(/[^0-9]/g, "")) || 0;
};
