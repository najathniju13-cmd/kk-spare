import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { BASE } from '../api';

export default function WishlistPage({ user, onAddToCart, onViewDetails, wishlistItemIds, onToggleWishlist }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const token = localStorage.getItem('token');
      fetch(`${BASE}/wishlist`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : [])
        .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
        .catch(err => { console.error(err); setProducts([]); setLoading(false); });
    }
  }, [user, wishlistItemIds]);

  if (!user) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}><h2>Please log in to view your wishlist.</h2></div>;

  return (
    <div className="container" style={{ padding: '4rem 1rem', minHeight: '60vh' }}>
      <h2 style={{ marginBottom: '2rem' }}>My Wishlist</h2>
      {loading ? <p>Loading...</p> : products.length === 0 ? <p style={{ color: 'var(--color-hash-light)' }}>Your wishlist is empty. Start adding some parts!</p> : (
        <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
          {products.map(p => (
            <ProductCard 
              key={p.id} 
              product={p} 
              onAddToCart={onAddToCart} 
              onViewDetails={onViewDetails} 
              isWishlisted={wishlistItemIds.includes(p.id)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
}
