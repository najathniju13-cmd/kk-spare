import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';
import { BASE } from '../api';

export default function Navigation() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    fetch(`${BASE}/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  return (
    <nav className="main-nav">
      <div className="container nav-container">
        <ul className="nav-list">
          {Array.isArray(categories) && categories.map((cat, idx) => (
            <li key={idx} className="nav-item">
              <NavLink to={`/category/${cat.name?.toLowerCase()}`}>{cat.name}</NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
