const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'shop.db');

let db;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }
  setupSchema();
  return db;
}

function save() {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function setupSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '📦'
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image TEXT DEFAULT 'https://placehold.co/300x200',
      category_id INTEGER,
      stock INTEGER DEFAULT 100
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      address TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      product_name TEXT,
      quantity INTEGER,
      price REAL
    );
  `);

  const catCount = queryOne('SELECT COUNT(*) as c FROM categories');
  if (!catCount || catCount.c === 0) seedData();
  save();
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows[0] || null;
}

function run(sql, params = []) {
  db.run(sql, params);
  save();
  return db;
}

function lastId() {
  return queryOne('SELECT last_insert_rowid() as id').id;
}

function seedData() {
  const cats = [
    ['Electronics', '💻'], ['Clothing', '👕'], ['Home & Kitchen', '🏠'],
    ['Sports', '⚽'], ['Books', '📚']
  ];
  cats.forEach(([name, icon]) => db.run('INSERT INTO categories (name, icon) VALUES (?, ?)', [name, icon]));

  const products = [
    ['Wireless Headphones', 'Premium sound quality', 2999, 'https://placehold.co/300x200/4f46e5/white?text=Headphones', 1],
    ['Smart Watch', 'Track your fitness', 4999, 'https://placehold.co/300x200/4f46e5/white?text=SmartWatch', 1],
    ['Laptop Stand', 'Ergonomic aluminum stand', 1499, 'https://placehold.co/300x200/4f46e5/white?text=LaptopStand', 1],
    ["Men's T-Shirt", 'Cotton casual wear', 599, 'https://placehold.co/300x200/10b981/white?text=T-Shirt', 2],
    ["Women's Jacket", 'Stylish winter jacket', 1999, 'https://placehold.co/300x200/10b981/white?text=Jacket', 2],
    ['Coffee Maker', 'Brew perfect coffee', 3499, 'https://placehold.co/300x200/f59e0b/white?text=CoffeeMaker', 3],
    ['Non-stick Pan', 'Premium cookware', 899, 'https://placehold.co/300x200/f59e0b/white?text=Pan', 3],
    ['Yoga Mat', 'Anti-slip exercise mat', 799, 'https://placehold.co/300x200/ef4444/white?text=YogaMat', 4],
    ['Dumbbells Set', '5kg pair', 1299, 'https://placehold.co/300x200/ef4444/white?text=Dumbbells', 4],
    ['JavaScript Guide', 'Complete JS reference', 499, 'https://placehold.co/300x200/8b5cf6/white?text=JS+Book', 5],
  ];
  products.forEach(p => db.run('INSERT INTO products (name, description, price, image, category_id) VALUES (?, ?, ?, ?, ?)', p));
}

module.exports = { getDb, query, queryOne, run, lastId, save };
