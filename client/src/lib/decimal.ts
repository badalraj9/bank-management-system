import Decimal from "decimal.js";

// Configure Decimal.js for currency calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// Format currency with proper decimal places and thousands separators
export const formatCurrency = (amount: number | string | Decimal): string => {
  const decimal = new Decimal(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(decimal.toNumber());
};

// Parse currency string to Decimal
export const parseCurrency = (currencyString: string): Decimal => {
  // Remove all non-numeric characters except decimal point
  const numericString = currencyString.replace(/[^0-9.]/g, '');
  return new Decimal(numericString || 0);
};

// Add two currency values
export const addCurrency = (a: number | string | Decimal, b: number | string | Decimal): Decimal => {
  return new Decimal(a).plus(new Decimal(b));
};

// Subtract one currency value from another
export const subtractCurrency = (a: number | string | Decimal, b: number | string | Decimal): Decimal => {
  return new Decimal(a).minus(new Decimal(b));
};

// Multiply currency by a factor
export const multiplyCurrency = (amount: number | string | Decimal, factor: number | string | Decimal): Decimal => {
  return new Decimal(amount).times(new Decimal(factor));
};

// Divide currency by a divisor
export const divideCurrency = (amount: number | string | Decimal, divisor: number | string | Decimal): Decimal => {
  return new Decimal(amount).dividedBy(new Decimal(divisor));
};

// Round to 2 decimal places for display
export const roundCurrency = (amount: number | string | Decimal): Decimal => {
  return new Decimal(amount).toDecimalPlaces(2);
};

// Check if one amount is greater than another
export const isGreaterThan = (a: number | string | Decimal, b: number | string | Decimal): boolean => {
  return new Decimal(a).greaterThan(new Decimal(b));
};

// Check if one amount is less than another
export const isLessThan = (a: number | string | Decimal, b: number | string | Decimal): boolean => {
  return new Decimal(a).lessThan(new Decimal(b));
};

// Check if sufficient funds
export const hasSufficientFunds = (balance: number | string | Decimal, amount: number | string | Decimal): boolean => {
  return !isLessThan(balance, amount);
};

export default {
  formatCurrency,
  parseCurrency,
  addCurrency,
  subtractCurrency,
  multiplyCurrency,
  divideCurrency,
  roundCurrency,
  isGreaterThan,
  isLessThan,
  hasSufficientFunds
};
