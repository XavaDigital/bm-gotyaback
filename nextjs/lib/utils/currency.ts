/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (NZD, AUD, USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: 'NZD' | 'AUD' | 'USD' = 'NZD'
): string => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Get currency symbol
 * @param currency - The currency code
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currency: 'NZD' | 'AUD' | 'USD'): string => {
  const symbols: Record<string, string> = {
    NZD: 'NZ$',
    AUD: 'A$',
    USD: '$',
  };
  return symbols[currency] || '$';
};

