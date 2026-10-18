export const CURRENCIES = {
  USD: { code: "USD", label: "US Dollar ($)", symbol: "$", decimals: 2 },
  NGN: { code: "NGN", label: "Nigerian Naira (₦)", symbol: "₦", decimals: 2 },
  KWD: { code: "KWD", label: "Kuwaiti Dinar (KD)", symbol: "KD ", decimals: 3 },
};

export function formatMoney(amount, code = "USD") {
  const currency = CURRENCIES[code] || CURRENCIES.USD;
  const number = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: code === "KWD" ? 3 : 2,
    maximumFractionDigits: currency.decimals,
  }).format(Math.abs(amount));
  return `${amount < 0 ? "-" : ""}${currency.symbol}${number}`;
}

export function formatAxis(value, code = "USD") {
  const currency = CURRENCIES[code] || CURRENCIES.USD;
  return Math.abs(value) >= 1000 ? `${currency.symbol}${value / 1000}k` : `${currency.symbol}${value}`;
}
