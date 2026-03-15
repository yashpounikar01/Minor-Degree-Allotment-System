// routes/upload.js
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const db = require('../db/connection');
const verifyToken = require('../middleware/authMiddleware');
const router = express.Router();

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => cb(null, 'students.csv')
});
const upload = multer({ storage });

// @route POST /upload/csv
router.post('/csv', verifyToken, upload.single('file'), async (req, res) => {
  const session_id = req.body.session_id;
  if (!session_id) {
    return res.status(400).json({ message: 'session_id is required.' });
  }

  try {
    const [sessions] = await db.promise().query('SELECT id FROM sessions WHERE id = ?', [session_id]);
    if (sessions.length === 0) return res.status(404).json({ message: 'Session not found' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to verify session' });
  }

  const results = [];
  const branchSet = new Set(); // collect all unique branch names from preferences

  fs.createReadStream(path.join(__dirname, '../uploads/students.csv'))
    .pipe(csv())
    .on('data', (data) => {
      const percent1 = (parseFloat(data.obtainedmarks_1) / parseFloat(data.totalmarks_1)) * 100;
      const percent2 = (parseFloat(data.obtainedmarks_2) / parseFloat(data.totalmarks_2)) * 100;
      const avg = ((percent1 + percent2) / 2).toFixed(2);

      // Collect branch names from all preference columns
      ['pref_1','pref_2','pref_3','pref_4','pref_5'].forEach(p => {
        if (data[p] && data[p].trim()) branchSet.add(data[p].trim());
      });

      results.push([
        session_id,
        data.erpid,
        data.name,
        data.branch,
        data.obtainedmarks_1,
        data.totalmarks_1,
        data.obtainedmarks_2,
        data.totalmarks_2,
        avg,
        data.pref_1,
        data.pref_2,
        data.pref_3,
        data.pref_4,
        data.pref_5
      ]);
    })
    .on('end', async () => {
      try {
        // 1. Insert students
        const studentSql = `
          INSERT INTO students (
            session_id, erpid, name, branch,
            obtainedmarks_1, totalmarks_1,
            obtainedmarks_2, totalmarks_2,
            avg_percent, pref_1, pref_2, pref_3, pref_4, pref_5
          ) VALUES ?
          ON DUPLICATE KEY UPDATE
            name=VALUES(name), branch=VALUES(branch),
            obtainedmarks_1=VALUES(obtainedmarks_1), totalmarks_1=VALUES(totalmarks_1),
            obtainedmarks_2=VALUES(obtainedmarks_2), totalmarks_2=VALUES(totalmarks_2),
            avg_percent=VALUES(avg_percent),
            pref_1=VALUES(pref_1), pref_2=VALUES(pref_2), pref_3=VALUES(pref_3),
            pref_4=VALUES(pref_4), pref_5=VALUES(pref_5)`;

        const [studentResult] = await db.promise().query(studentSql, [results]);

        // 2. Auto-seed branches from CSV preferences (only insert if not already there)
        if (branchSet.size > 0) {
          const branchValues = Array.from(branchSet).map(name => [session_id, name, 72]);
          await db.promise().query(
            `INSERT INTO branches (session_id, branch_name, total_seats)
             VALUES ?
             ON DUPLICATE KEY UPDATE branch_name = branch_name`, // no-op on duplicate
            [branchValues]
          );
        }

        res.json({
          message: 'CSV uploaded successfully',
          inserted: studentResult.affectedRows,
          branches_seeded: branchSet.size,
          branches: Array.from(branchSet),
          session_id
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database insertion failed', error: err.message });
      }
    });
});

// GET /upload/branches — list branches for a session
router.get('/branches', verifyToken, async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });
  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM branches WHERE session_id = ? ORDER BY branch_name', [session_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// POST /upload/branches — manually set branch seats
router.post('/branches', verifyToken, async (req, res) => {
  const { session_id, branches } = req.body;
  if (!session_id || !branches || !Array.isArray(branches)) {
    return res.status(400).json({ error: 'session_id and branches array required' });
  }
  try {
    const values = branches.map(b => [session_id, b.branch_name, b.total_seats || 72]);
    await db.promise().query(
      `INSERT INTO branches (session_id, branch_name, total_seats) VALUES ?
       ON DUPLICATE KEY UPDATE total_seats = VALUES(total_seats)`,
      [values]
    );
    res.json({ message: 'Branches saved', count: branches.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save branches' });
  }
});

// DELETE /upload/branches — remove a branch from a session
router.delete('/branches', verifyToken, async (req, res) => {
  const { session_id, branch_name } = req.body;
  if (!session_id || !branch_name) {
    return res.status(400).json({ error: 'session_id and branch_name required' });
  }
  try {
    await db.promise().query(
      'DELETE FROM branches WHERE session_id = ? AND branch_name = ?',
      [session_id, branch_name]
    );
    res.json({ message: 'Branch deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

module.exports = router;