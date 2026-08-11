import React, { useState, useEffect } from 'react';
import './SidebarFilter.css';
import { BASE } from '../api';

export default function SidebarFilter({ 
  selectedCategory, 
  setSelectedCategory, 
  selectedBrandFilter, 
  setSelectedBrandFilter,
  priceRange,
  setPriceRange
}) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));

    fetch(`${BASE}/brands`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setBrands(Array.isArray(data) ? data.map(b => b.name) : []))
      .catch(() => setBrands([]));
  }, []);

  return (
    <aside className="sidebar">
      <div className="mobile-filter-toggle" onClick={() => setIsOpen(!isOpen)}>
        <span>Filters & Categories</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </div>
      <div className={`filter-content ${isOpen ? 'open' : ''}`}>
        <div className="filter-section">
          <h3 className="filter-title">Categories</h3>
          <ul className="filter-list">
          <li 
            className={`filter-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            <span>All Parts</span>
          </li>
          {Array.isArray(categories) && categories.map(cat => (
            <li 
              key={cat.name} 
              className={`filter-item ${selectedCategory === cat.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.name)}
            >
              <span>{cat.name}</span>
              <span className="count">({cat.part_count})</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="filter-section mt-4">
        <h3 className="filter-title">Filter by Brand</h3>
        <ul className="filter-list">
          <li 
            className={`filter-item ${!selectedBrandFilter ? 'active' : ''}`}
            onClick={() => setSelectedBrandFilter(null)}
          >
            <span>All Brands</span>
          </li>
          {Array.isArray(brands) && brands.map(brand => (
            <li 
              key={brand} 
              className={`filter-item ${selectedBrandFilter === brand ? 'active' : ''}`}
              onClick={() => setSelectedBrandFilter(brand)}
            >
              <span>{brand}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="filter-section mt-4">
        <h3 className="filter-title">Price Range (₹)</h3>
        <div className="price-filter-inputs">
          <input 
             type="number" 
             placeholder="Min" 
             value={priceRange?.min || ''} 
             onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
             className="price-input"
             min="0"
          />
          <span className="price-separator">-</span>
          <input 
             type="number" 
             placeholder="Max" 
             value={priceRange?.max || ''} 
             onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
             className="price-input"
             min="0"
          />
        </div>
      </div>

      <div className="promo-banner mt-4">
        <h4>Wholesale Orders</h4>
        <p>Get bulk discounts on OEM parts.</p>
        <button className="btn contact-sales-btn mt-2">Contact Sales</button>
      </div>

      
      <div className="promo-banner expert-chat mt-2">
        <h4>Need Help?</h4>
        <p>Chat with a mechanic.</p>
        <button className="btn btn-primary mt-2">Live Chat</button>
      </div>
      </div>
    </aside>
  );
}
