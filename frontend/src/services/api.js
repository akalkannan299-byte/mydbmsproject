const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    // Merged after the spread so custom headers (e.g. X-Admin-Key) don't drop Content-Type.
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { const body = await response.json(); message = body.message || body.error || message; } catch { /* no JSON body */ }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  config: () => request('/config'),
  foods: () => request('/foods'),
  categories: () => request('/categories'),
  createOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  getOrder: (id) => request(`/orders/${id}`),
  myOrders: (phone) => request(`/orders/my-orders?phone=${encodeURIComponent(phone)}`),
  chat: (message, history) => request('/assistant/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  adminOrders: (key) => request('/admin/orders', { headers: { 'X-Admin-Key': key } }),
  updateStatus: (id, status, key) =>
    request(`/orders/${id}/status`, { method: 'PATCH', headers: { 'X-Admin-Key': key }, body: JSON.stringify({ status }) })
};
