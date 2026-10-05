// Prices are integer minor units (same as the website). Adjust currency to match the web app.
const fmt = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });
export const formatMoney = (minor: number): string => fmt.format(minor / 100);
