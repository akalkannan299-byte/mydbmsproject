export const money = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n || 0));

/**
 * Cart arithmetic done in paise (integers) so floating-point errors never show up on screen.
 * Mirrors the server: tax is rounded half-up to 2 decimals. The server remains the source of truth.
 * items: [{ food: { price }, quantity }]
 */
export function calcTotals(items, taxRate = 0.05) {
  const subtotalPaise = items.reduce(
    (sum, item) => sum + Math.round(Number(item.food.price) * 100) * item.quantity, 0);
  const taxPaise = Math.round(subtotalPaise * Number(taxRate));
  return {
    subtotal: subtotalPaise / 100,
    tax: taxPaise / 100,
    total: (subtotalPaise + taxPaise) / 100
  };
}
