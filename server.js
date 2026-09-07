const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb, query, queryOne, run, lastId } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB before handling requests
getDb().then(() => {
  console.log('✅ Database ready');
}).catch(err => {
  console.error('❌ DB init failed:', err);
  process.exit(1);
});

// ── Categories ──────────────────────────────────────────────
app.get('/api/categories', async (req, res) => {
  await getDb();
  res.json(query('SELECT * FROM categories'));
});

// ── Products ─────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  await getDb();
  const { category, search } = req.query;
  let sql = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
  const params = [];
  if (category) { sql += ' AND p.category_id = ?'; params.push(Number(category)); }
  if (search)   { sql += ' AND p.name LIKE ?'; params.push(`%${search}%`); }
  res.json(query(sql, params));
});

app.get('/api/products/:id', async (req, res) => {
  await getDb();
  const product = queryOne('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [req.params.id]);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

app.post('/api/products', async (req, res) => {
  await getDb();
  const { name, description, price, image, category_id, stock } = req.body;
  run('INSERT INTO products (name, description, price, image, category_id, stock) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, price, image || 'https://placehold.co/300x200', category_id, stock || 100]);
  res.json({ id: lastId() });
});

app.put('/api/products/:id', async (req, res) => {
  await getDb();
  const { name, description, price, image, category_id, stock } = req.body;
  run('UPDATE products SET name=?, description=?, price=?, image=?, category_id=?, stock=? WHERE id=?',
    [name, description, price, image, category_id, stock, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/products/:id', async (req, res) => {
  await getDb();
  run('DELETE FROM products WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// ── Orders ───────────────────────────────────────────────────
app.post('/api/orders', async (req, res) => {
  await getDb();
  const { customer_name, customer_email, customer_phone, address, items } = req.body;
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  run('INSERT INTO orders (customer_name, customer_email, customer_phone, address, total) VALUES (?, ?, ?, ?, ?)',
    [customer_name, customer_email, customer_phone, address, total]);
  const orderId = lastId();
  items.forEach(i => run('INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)',
    [orderId, i.id, i.name, i.quantity, i.price]));
  res.json({ orderId });
});

app.get('/api/orders', async (req, res) => {
  await getDb();
  res.json(query('SELECT * FROM orders ORDER BY created_at DESC'));
});

app.get('/api/orders/:id', async (req, res) => {
  await getDb();
  const order = queryOne('SELECT * FROM orders WHERE id=?', [req.params.id]);
  if (!order) return res.status(404).json({ error: 'Not found' });
  order.items = query('SELECT * FROM order_items WHERE order_id=?', [req.params.id]);
  res.json(order);
});

app.put('/api/orders/:id/status', async (req, res) => {
  await getDb();
  run('UPDATE orders SET status=? WHERE id=?', [req.body.status, req.params.id]);
  res.json({ success: true });
});

// ── Admin Stats ──────────────────────────────────────────────
app.get('/api/admin/stats', async (req, res) => {
  await getDb();
  res.json({
    totalOrders: queryOne('SELECT COUNT(*) as c FROM orders').c,
    totalRevenue: queryOne('SELECT SUM(total) as s FROM orders').s || 0,
    totalProducts: queryOne('SELECT COUNT(*) as c FROM products').c,
    pendingOrders: queryOne("SELECT COUNT(*) as c FROM orders WHERE status='pending'").c,
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
