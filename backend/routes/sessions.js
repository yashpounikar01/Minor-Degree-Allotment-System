// routes/sessions.js
const express = require('express');
const db = require('../db/connection');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// GET /sessions — list all sessions
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM sessions ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /sessions/active — get current active session
router.get('/active', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM sessions WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No active session found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch active session' });
  }
});

// POST /sessions — create a new session (admin only)
router.post('/', verifyToken, async (req, res) => {
  const { session_name } = req.body;
  if (!session_name || !session_name.trim()) {
    return res.status(400).json({ error: 'session_name is required' });
  }
  try {
    // Create the session
    const [result] = await db.promise().query(
      'INSERT INTO sessions (session_name, is_active) VALUES (?, 0)',
      [session_name.trim()]
    );
    const newSessionId = result.insertId;

    // Auto-copy branch names from the most recent session that has branches
    // (seats default to 72, allotted reset to 0 — fresh start)
    const [sourceBranches] = await db.promise().query(`
      SELECT b.branch_name, b.total_seats
      FROM branches b
      INNER JOIN sessions s ON s.id = b.session_id
      WHERE b.session_id = (
        SELECT id FROM sessions
        WHERE id != ?
        ORDER BY created_at DESC
        LIMIT 1
      )
      ORDER BY b.branch_name ASC
    `, [newSessionId]);

    if (sourceBranches.length > 0) {
      const branchValues = sourceBranches.map(b => [newSessionId, b.branch_name, b.total_seats, 0]);
      await db.promise().query(
        'INSERT INTO branches (session_id, branch_name, total_seats, allotted_seats) VALUES ?',
        [branchValues]
      );
    }

    res.json({
      message: 'Session created',
      id: newSessionId,
      session_name: session_name.trim(),
      branches_copied: sourceBranches.length
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: `Session "${session_name}" already exists` });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PUT /sessions/:id/activate — set a session as active
router.put('/:id/activate', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Deactivate all, then activate selected
    await db.promise().query('UPDATE sessions SET is_active = 0');
    await db.promise().query('UPDATE sessions SET is_active = 1 WHERE id = ?', [id]);
    res.json({ message: 'Session activated', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to activate session' });
  }
});

// DELETE /sessions/:id — delete a session and all its data
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query('DELETE FROM allotments WHERE session_id = ?', [id]);
    await db.promise().query('DELETE FROM students WHERE session_id = ?', [id]);
    await db.promise().query('DELETE FROM branches WHERE session_id = ?', [id]);
    await db.promise().query('DELETE FROM sessions WHERE id = ?', [id]);
    res.json({ message: 'Session and all its data deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;