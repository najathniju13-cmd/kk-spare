import React, { useState, useEffect } from 'react';
import { FaMotorcycle, FaSearch } from 'react-icons/fa';
import './BikeModelSelector.css';
import { BASE } from '../api';

export default function BikeModelSelector({ onFindParts, onReset }) {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const YEARS = ['2015','2016','2017','2018','2019','2020','2021','2022','2023','2024'];

  useEffect(() => {
    fetch(`${BASE}/brands`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setBrands(Array.isArray(data) ? data.map(b => b.name) : []))
      .catch(() => setBrands([]));
  }, []);

  const handleBrandChange = (e) => {
    const selected = e.target.value;
    setBrand(selected);
    setModel('');
    setYear('');
    if (selected) {
      fetch(`${BASE}/brands/${selected}/models`)
        .then(r => r.ok ? r.json() : [])
        .then(data => setModels(Array.isArray(data) ? data.map(m => m.name) : []))
        .catch(() => setModels([]));
    } else {
      setModels([]);
    }
  };

  const handleModelChange = (e) => {
    setModel(e.target.value);
    setYear('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (brand && model && year) {
      onFindParts({ brand, model, year });
    }
  };

  const handleResetFilters = () => {
    setBrand('');
    setModel('');
    setYear('');
    setModels([]);
    if (onReset) onReset();
  };

  return (
    <div className="bike-selector-container">
      <div className="bike-selector-header">
        <FaMotorcycle size={24} className="icon-accent" />
        <h2>Find Parts For Your Bike</h2>
      </div>
      <form onSubmit={handleSubmit} className="bike-selector-form">
        <div className="select-group">
          <label>1. Select Brand</label>
          <select value={brand} onChange={handleBrandChange} required>
            <option value="">Choose Brand...</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="select-group">
          <label>2. Select Model</label>
          <select value={model} onChange={handleModelChange} disabled={!brand} required>
            <option value="">Choose Model...</option>
            {brand && models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="select-group">
          <label>3. Select Year</label>
          <select value={year} onChange={(e) => setYear(e.target.value)} disabled={!model} required>
            <option value="">Choose Year...</option>
            {model && YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="button-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
          <button type="button" className="btn" onClick={handleResetFilters} style={{ backgroundColor: '#e2e8f0', color: '#1f2937' }}>
            Reset
          </button>
          <button type="submit" className="btn btn-primary" disabled={!brand || !model || !year}>
            <FaSearch /> Find My Parts
          </button>
        </div>
      </form>
    </div>
  );
}
