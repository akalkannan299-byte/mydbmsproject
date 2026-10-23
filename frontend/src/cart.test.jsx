import { describe, it, expect } from 'vitest';
import { calcTotals, money } from './utils.js';

describe('cart money arithmetic', () => {
  const items = [
    { food: { price: 60 }, quantity: 2 },
    { food: { price: 30 }, quantity: 3 },
    { food: { price: 50 }, quantity: 2 }
  ];

  it('calculates subtotal, 5% tax and total', () => {
    expect(calcTotals(items, 0.05)).toEqual({ subtotal: 310, tax: 15.5, total: 325.5 });
  });

  it('honours a different server tax rate', () => {
    expect(calcTotals(items, 0.18).tax).toBe(55.8);
  });

  it('handles string prices from the API and avoids float drift', () => {
    const t = calcTotals([{ food: { price: '0.10' }, quantity: 3 }], 0);
    expect(t.subtotal).toBe(0.3);
  });

  it('returns zeros for an empty cart', () => {
    expect(calcTotals([], 0.05)).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });

  it('formats rupees', () => {
    expect(money(325.5)).toContain('325.50');
  });
});
