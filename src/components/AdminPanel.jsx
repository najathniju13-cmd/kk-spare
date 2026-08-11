import React, { useState, useEffect } from 'react';
import { getProducts, getCategories, getAllOrders, getAllUsers, addProduct, updateProduct, deleteProduct, updateOrderStatus } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './AdminPanel.css';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', price: '', category_id: '', badge: '', image: '', type: 'OEM', stock: '', warranty: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'dashboard') {
        const [p, c, o, u] = await Promise.all([
          getProducts().catch(() => []), 
          getCategories().catch(() => []), 
          getAllOrders().catch(() => []), 
          getAllUsers().catch(() => [])
        ]);
        setProducts(Array.isArray(p) ? p : []); 
        setCategories(Array.isArray(c) ? c : []); 
        setOrders(Array.isArray(o) ? o : []); 
        setUsers(Array.isArray(u) ? u : []);
      } else if (activeTab === 'products') {
        const [p, c] = await Promise.all([
          getProducts().catch(() => []), 
          getCategories().catch(() => [])
        ]);
        setProducts(Array.isArray(p) ? p : []); 
        setCategories(Array.isArray(c) ? c : []);
      } else if (activeTab === 'orders') {
        const o = await getAllOrders().catch(() => []);
        setOrders(Array.isArray(o) ? o : []);
      }
    } catch (e) {
      console.error('Failed to load admin data', e);
    }
  };

  const handleProductFormChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
      } else {
        await addProduct(productForm);
      }
      setShowProductModal(false);
      loadData();
    } catch (e) {
      alert('Failed to save product');
    }
  };

  const handleEditClick = (p) => {
    const cat = categories.find(c => c.name === p.category);
    setProductForm({
      name: p.name,
      price: p.price,
      category_id: cat ? cat.id : '',
      badge: p.badge || '',
      image: p.image || '',
      type: p.type || 'OEM',
      stock: p.stock || 0,
      warranty: p.warranty || 'N/A'
    });
    setEditingProduct(p);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        loadData();
      } catch (e) {
        alert('Failed to delete product');
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      loadData();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const renderDashboard = () => {
    // Analytics Calculations
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    
    // Status Data for Pie Chart
    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});
    
    const pieData = Object.keys(statusCounts).map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: statusCounts[status]
    }));
    const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#6366f1', '#ef4444'];

    // Revenue Timeline Data for Bar Chart
    const revenueByDate = validOrders.reduce((acc, o) => {
      const date = new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] || 0) + Number(o.total_amount);
      return acc;
    }, {});
    
    const barData = Object.keys(revenueByDate).map(date => ({
      date,
      revenue: revenueByDate[date]
    }));

    return (
      <div className="dashboard-grid-container">
        <div className="dashboard-grid">
          <div className="stat-card revenue-card">
            <h3>Total Revenue</h3>
            <div className="stat-value">₹{totalRevenue.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <h3>Total Orders</h3>
            <div className="stat-value">{orders.length}</div>
          </div>
          <div className="stat-card">
            <h3>Registered Users</h3>
            <div className="stat-value">{users.length}</div>
          </div>
          <div className="stat-card">
            <h3>Active Inventory</h3>
            <div className="stat-value">{products.length} Parts</div>
          </div>
        </div>
        
        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
          <div className="chart-box">
            <h3 className="chart-title">Revenue Timeline</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} tick={{ fill: 'var(--text-secondary)' }} />
                  <RechartsTooltip cursor={{fill: 'var(--bg-secondary)'}} formatter={(value) => [`₹${value}`, 'Revenue']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  <Bar dataKey="revenue" fill="#ff5e14" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="chart-box">
            <h3 className="chart-title">Orders by Status</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'var(--text-primary)' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProducts = () => (
    <div className="admin-table-container">
      <div className="admin-action-bar">
        <h3>Manage Products</h3>
        <button className="action-btn btn-add" onClick={() => {
          setEditingProduct(null);
          setProductForm({ name: '', price: '', category_id: categories[0]?.id || '', badge: '', image: '', type: 'OEM', stock: '', warranty: '' });
          setShowProductModal(true);
        }}>+ Add Product</button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Badge</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td><img src={p.image || 'https://via.placeholder.com/50'} alt={p.name} /></td>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>₹{p.price}</td>
              <td>{p.stock}</td>
              <td>{p.badge}</td>
              <td>{p.type}</td>
              <td>
                <button className="action-btn btn-edit" onClick={() => handleEditClick(p)}>Edit</button>
                <button className="action-btn btn-delete" onClick={() => handleDeleteProduct(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderOrders = () => (
    <div className="admin-table-container">
      <div className="admin-action-bar">
        <h3>Customer Orders</h3>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Total</th>
            <th>Date</th>
            <th>Method</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>#{o.id}</td>
              <td>{o.user_name}</td>
              <td>{o.user_email}</td>
              <td>₹{o.total_amount}</td>
              <td>{new Date(o.created_at).toLocaleDateString()}</td>
              <td>{o.payment_method}</td>
              <td>
                <select 
                  className="status-select"
                  value={o.status}
                  onChange={(e) => handleStatusChange(o.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="container admin-panel">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products</button>
        <button className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Orders</button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'orders' && renderOrders()}
      </div>

      {showProductModal && (
        <div className="auth-modal-overlay">
          <div className="auth-modal-content" style={{ maxWidth: '600px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="auth-close-btn" onClick={() => setShowProductModal(false)} style={{ color: 'var(--color-hash-dark)', position: 'relative', right: '0', top: '0', fontSize: '2rem' }}>&times;</button>
            </div>
            
            <form className="product-form" onSubmit={handleSaveProduct}>
              <div className="form-group full-width">
                <label>Product Name</label>
                <input type="text" name="name" required value={productForm.name} onChange={handleProductFormChange} />
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" step="0.01" name="price" required value={productForm.price} onChange={handleProductFormChange} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="category_id" required value={productForm.category_id} onChange={handleProductFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group full-width">
                <label>Image URL</label>
                <input type="text" name="image" value={productForm.image} onChange={handleProductFormChange} placeholder="http://..." />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input type="number" name="stock" required value={productForm.stock} onChange={handleProductFormChange} />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select name="type" required value={productForm.type} onChange={handleProductFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <option value="OEM">OEM</option>
                  <option value="Aftermarket">Aftermarket</option>
                </select>
              </div>
              <div className="form-group">
                <label>Badge</label>
                <input type="text" name="badge" value={productForm.badge} onChange={handleProductFormChange} placeholder="e.g. Best Seller" />
              </div>
              <div className="form-group">
                <label>Warranty</label>
                <input type="text" name="warranty" value={productForm.warranty} onChange={handleProductFormChange} placeholder="e.g. 1 Year" />
              </div>
              <button type="submit" className="auth-submit-btn full-width">Save Product</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
