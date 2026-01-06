
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'alliance-secret-key-2024';

// Database Configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// --- Auth Routes ---
app.post('/api/auth/login', async (req, res) => {
  const { pin } = req.body;
  try {
    const result = await pool.query(
      'SELECT s.*, r.permissions FROM staff s JOIN roles r ON s.role_id = r.id WHERE s.pin_hash = $1 AND s.is_active = true',
      [pin.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, role: user.role_name, is_root: user.is_root },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Log login audit
    await pool.query(
      'INSERT INTO audit_logs (action, actor_name, entity, details) VALUES ($1, $2, $3, $4)',
      ['LOGIN', user.full_name, 'AUTH', 'Successful PIN login']
    );

    res.json({ token, user: {
      id: user.id,
      full_name: user.full_name,
      role: user.role_name,
      permissions: user.permissions,
      is_root: user.is_root,
      ui_language: user.ui_language,
      ui_theme: user.ui_theme
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- Catalog Routes ---
app.get('/api/catalog', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM catalog ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/catalog', authenticateToken, async (req, res) => {
  const { sku, item_type, name, category, price_amount, stock_qty, track_stock } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO catalog (sku, item_type, name, category, price_amount, stock_qty, track_stock) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [sku, item_type, name, category, price_amount, stock_qty, track_stock]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- POS & Sales Routes ---
app.post('/api/pos/sale', authenticateToken, async (req, res) => {
  const { sale_no, total_amount, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Create Sale Record
    const saleResult = await client.query(
      'INSERT INTO sales (sale_no, total_amount, status, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
      [sale_no, total_amount, 'PAID', req.user.id]
    );
    const saleId = saleResult.rows[0].id;

    // 2. Add Sale Items & Update Inventory
    for (const item of items) {
      await client.query(
        'INSERT INTO sale_items (sale_id, item_id, name, qty, price_at_sale) VALUES ($1, $2, $3, $4, $5)',
        [saleId, item.id, item.name, item.qty, item.price_amount]
      );

      if (item.track_stock) {
        await client.query(
          'UPDATE catalog SET stock_qty = stock_qty - $1 WHERE id = $2',
          [item.qty, item.id]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, saleId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- Expenses Routes ---
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
  const { category, amount, description, date } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO expenses (category, amount, description, date, user_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [category, amount, description, date, req.user.full_name || 'System']
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Audit & Maintenance ---
app.get('/api/audit', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`ALLIANCE Backend running on port ${PORT}`);
});
