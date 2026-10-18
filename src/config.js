// Shown to clients whose trial has ended, and on the landing page.
export const OWNER_CONTACT = "WhatsApp +965 9921 4970";
export const OWNER_WHATSAPP_LINK = "https://wa.me/96599214970";

// Landing page prices, one per currency. Edit the text here to change them.
export const PRICES = {
  NGN: { symbol: "₦", amount: "6,500", tab: "₦ Naira" },
  USD: { symbol: "$", amount: "5", tab: "$ Dollar" },
  KWD: { symbol: "KD", amount: "1.5", tab: "KD Dinar" },
};
export const PRICE_PERIOD = "per month";

// How clients can pay you. Edit these to change the payment details shown on the site.
export const PAYMENT_METHODS = [
  { code: "KWD", title: "Kuwait (KD)", method: "Wamd", detail: "+965 9921 4970", note: "Send your payment through Wamd to this number, then tell us on WhatsApp." },
  { code: "NGN", title: "Nigeria (₦)", method: "Opay", detail: "+234 803 957 3143", note: "Send your payment to this Opay number, then tell us on WhatsApp." },
  { code: "USD", title: "Dollars ($)", method: "WhatsApp", detail: "Message us", note: "Message us on WhatsApp and we will agree the easiest way to pay in dollars." },
];
