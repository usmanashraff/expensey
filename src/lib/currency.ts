export const CURRENCIES = {
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  SAR: { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
} as const

export type CurrencyCode = keyof typeof CURRENCIES

export function getCurrencySymbol(currency: string): string {
  return CURRENCIES[currency as CurrencyCode]?.symbol || currency
}

export function formatCurrency(amount: number, currency: string, showCode = true): string {
  const currencyInfo = CURRENCIES[currency as CurrencyCode]
  
  if (!currencyInfo) {
    return `${currency} ${amount.toFixed(2)}`
  }
  
  if (showCode) {
    return `${currency} ${amount.toFixed(0)}`
  }
  
  return `${currencyInfo.symbol}${amount.toFixed(0)}`
}

export function formatCurrencyWithMask(showAmounts: boolean, amount: number, currency: string): string {
  if (showAmounts) {
    return formatCurrency(amount, currency)
  }
  return `${currency} ****`
}

export function getCurrencyList() {
  return Object.values(CURRENCIES).map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name}`,
    symbol: currency.symbol
  }))
}

export function getDefaultCurrency(): CurrencyCode {
  return 'PKR'
}