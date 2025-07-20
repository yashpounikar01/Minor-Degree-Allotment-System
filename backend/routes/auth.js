// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
require('dotenv').config();

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'supersecret';


router.post('/register', async (req, res) => {
  const { username, password, adminCode } = req.body;

  if (adminCode !== process.env.ADMIN_SECRET_CODE) {
    return res.status(403).json({ error: 'Invalid admin code' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const [existing] = await db.promise().query(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );
    if (existing.length > 0) return res.status(400).json({ error: 'User already exists' });

    await db.promise().query(
      'INSERT INTO admins (username, password) VALUES (?, ?)',
      [username, hashed]
    );
    res.json({ message: 'Admin registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});


// Login admin
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.promise().query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '2h' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
