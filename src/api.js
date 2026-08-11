export const BASE = import.meta.env.VITE_API_URL || 'https://kk-spare.onrender.com/api';
console.log("VITE_API_URL:", BASE);

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

const safeFetchArray = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`API Fetch Error [${url}]:`, err);
    return [];
  }
};

const safeFetchJson = async (url, options = {}, fallback = {}) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return fallback;
    const data = await res.json();
    return data || fallback;
  } catch (err) {
    console.error(`API Fetch Error [${url}]:`, err);
    return fallback;
  }
};

export const getCart = () => safeFetchJson(`${BASE}/cart`, { headers: authHeaders() }, { items: [], total: 0 });
export const addToCart = (product_id, quantity = 1) => safeFetchJson(`${BASE}/cart`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ product_id, quantity }) });
export const updateCart = (product_id, quantity) => safeFetchJson(`${BASE}/cart/${product_id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ quantity }) });
export const removeFromCart = (product_id) => safeFetchJson(`${BASE}/cart/${product_id}`, { method: 'DELETE', headers: authHeaders() });
export const clearCart = () => safeFetchJson(`${BASE}/cart`, { method: 'DELETE', headers: authHeaders() });
export const placeOrder = (payment_method = 'COD') => safeFetchJson(`${BASE}/orders`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ payment_method }) });
export const getOrders = () => safeFetchArray(`${BASE}/orders`, { headers: authHeaders() });

// Admin Endpoints
export const getProducts = () => safeFetchArray(`${BASE}/products`);
export const getAllOrders = () => safeFetchArray(`${BASE}/orders/all`, { headers: authHeaders() });
export const getAllUsers = () => safeFetchArray(`${BASE}/auth/users`, { headers: authHeaders() });
export const addProduct = (data) => safeFetchJson(`${BASE}/products`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
export const updateProduct = (id, data) => safeFetchJson(`${BASE}/products/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
export const deleteProduct = (id) => safeFetchJson(`${BASE}/products/${id}`, { method: 'DELETE', headers: authHeaders() });
export const updateOrderStatus = (id, status) => safeFetchJson(`${BASE}/orders/${id}/status`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }) });
export const getCategories = () => safeFetchArray(`${BASE}/categories`);

