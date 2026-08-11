const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category, brand, model, year, type, badge, search, minPrice, maxPrice } = req.query;
    let query = `
      SELECT p.id, p.name, p.price, p.badge, p.image, p.type, p.stock, p.warranty, c.name AS category, 
             COALESCE(AVG(r.rating), 0) AS average_rating, COUNT(r.id) AS total_reviews 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      LEFT JOIN reviews r ON p.id = r.product_id
    `;
    const conditions = [];
    const params = [];
    if (brand || model || year) {
      query += ` JOIN product_compatibility pc ON p.id = pc.product_id JOIN brands b ON pc.brand_id = b.id JOIN models m ON pc.model_id = m.id JOIN years y ON pc.year_id = y.id`;
      if (brand) { conditions.push('b.name = ?'); params.push(brand); }
      if (model) { conditions.push('m.name = ?'); params.push(model); }
      if (year) { conditions.push('y.year = ?'); params.push(year); }
    }
    if (category) { conditions.push('c.name = ?'); params.push(category); }
    if (type) { conditions.push('p.type = ?'); params.push(type); }
    if (badge) { conditions.push('p.badge = ?'); params.push(badge); }
    if (search) { conditions.push('p.name LIKE ?'); params.push(`%${search}%`); }
    if (minPrice) { conditions.push('p.price >= ?'); params.push(minPrice); }
    if (maxPrice) { conditions.push('p.price <= ?'); params.push(maxPrice); }
    
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' GROUP BY p.id ORDER BY p.id';
    
    const [products] = await db.execute(query, params);
    
    // Format numeric values passed from SQL aggregate functions correctly
    products.forEach(p => {
      p.average_rating = parseFloat(p.average_rating);
    });
    
    res.json(products);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [products] = await db.execute(`SELECT p.*, c.name AS category FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?`, [req.params.id]);
    if (!products.length) return res.status(404).json({ message: 'Product not found' });
    const product = products[0];
    
    const [compat] = await db.execute(`SELECT b.name AS brand, m.name AS model, y.year FROM product_compatibility pc JOIN brands b ON pc.brand_id = b.id JOIN models m ON pc.model_id = m.id JOIN years y ON pc.year_id = y.id WHERE pc.product_id = ?`, [product.id]);
    const compatMap = {};
    for (const row of compat) {
      if (!compatMap[row.brand]) compatMap[row.brand] = { brand: row.brand, models: new Set(), years: new Set() };
      compatMap[row.brand].models.add(row.model);
      compatMap[row.brand].years.add(String(row.year));
    }
    product.compatibility = Object.values(compatMap).map(c => ({ brand: c.brand, models: [...c.models], years: [...c.years] }));
    
    const [related] = await db.execute(`SELECT p.id, p.name, p.price, p.image, p.badge FROM bought_together bt JOIN products p ON bt.related_product_id = p.id WHERE bt.product_id = ?`, [product.id]);
    product.boughtTogether = related;

    // Fetch reviews
    const [reviews] = await db.execute(`SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC`, [product.id]);
    product.reviews = reviews;
    product.average_rating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    product.total_reviews = reviews.length;

    res.json(product);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    await db.execute(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE rating=?, comment=?', 
      [req.user.id, req.params.id, rating, comment, rating, comment]
    );
    res.json({ message: 'Review saved' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, price, category_id, badge, image, type, stock, warranty } = req.body;
    const [result] = await db.execute(`INSERT INTO products (name, price, category_id, badge, image, type, stock, warranty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [name, price, category_id, badge || '', image, type, stock || 0, warranty || 'N/A']);
    res.status(201).json({ message: 'Product created', id: result.insertId });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, price, category_id, badge, image, type, stock, warranty } = req.body;
    await db.execute(`UPDATE products SET name=?, price=?, category_id=?, badge=?, image=?, type=?, stock=?, warranty=? WHERE id=?`, [name, price, category_id, badge || '', image, type, stock, warranty, req.params.id]);
    res.json({ message: 'Product updated' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/:id/compatibility', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { brand_id, model_id, year_id } = req.body;
    await db.execute('INSERT IGNORE INTO product_compatibility (product_id, brand_id, model_id, year_id) VALUES (?, ?, ?, ?)', [req.params.id, brand_id, model_id, year_id]);
    res.json({ message: 'Compatibility added' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error', error: err.message }); }
});

module.exports = router;