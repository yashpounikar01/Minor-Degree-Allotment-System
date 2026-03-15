// routes/allotment.js
const express = require('express');
const db = require('../db/connection');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// Helper: get active session id
async function getActiveSessionId() {
  const [rows] = await db.promise().query(
    'SELECT id FROM sessions WHERE is_active = 1 LIMIT 1'
  );
  return rows.length > 0 ? rows[0].id : null;
}

// @route GET /allot/run?session_id=X
router.get('/run', verifyToken, async (req, res) => {
  try {
    const session_id = req.query.session_id || await getActiveSessionId();
    if (!session_id) return res.status(400).json({ error: 'No session_id provided and no active session found' });

    // Reset previous allotments for this session only
    await db.promise().query('DELETE FROM allotments WHERE session_id = ?', [session_id]);
    await db.promise().query('UPDATE branches SET allotted_seats = 0 WHERE session_id = ?', [session_id]);

    // Fetch students for this session ordered by avg_percent DESC
    const [students] = await db.promise().query(
      'SELECT * FROM students WHERE session_id = ? ORDER BY avg_percent DESC',
      [session_id]
    );

    if (students.length === 0) {
      return res.status(400).json({ error: 'No students found for this session. Upload CSV first.' });
    }

    // Seat availability cache
    const [branches] = await db.promise().query(
      'SELECT * FROM branches WHERE session_id = ?', [session_id]
    );
    const seatMap = {};
    branches.forEach(branch => {
      seatMap[branch.branch_name] = { total: branch.total_seats, allotted: 0 };
    });

    // Allotment process
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      let allottedBranch = null;

      for (let p = 1; p <= 5; p++) {
        const prefBranch = student[`pref_${p}`];
        if (
          prefBranch &&
          seatMap[prefBranch] &&
          seatMap[prefBranch].allotted < seatMap[prefBranch].total
        ) {
          allottedBranch = prefBranch;
          seatMap[prefBranch].allotted += 1;
          break;
        }
      }

      await db.promise().query(
        'INSERT INTO allotments (session_id, erpid, allotted_branch, `rank`) VALUES (?, ?, ?, ?)',
        [session_id, student.erpid, allottedBranch || 'Not Allotted', i + 1]
      );
    }

    // Update branch seat counts
    const updateBranchPromises = Object.entries(seatMap).map(([branchName, seatInfo]) => {
      return db.promise().query(
        'UPDATE branches SET allotted_seats = ? WHERE branch_name = ? AND session_id = ?',
        [seatInfo.allotted, branchName, session_id]
      );
    });
    await Promise.all(updateBranchPromises);

    res.json({ message: '✅ Allotment complete & branch table updated!', session_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Allotment failed', details: err.message });
  }
});

// @route GET /allot/result?session_id=X
router.get('/result', async (req, res) => {
  try {
    const session_id = req.query.session_id || await getActiveSessionId();
    if (!session_id) return res.status(400).json({ error: 'No session_id and no active session' });

    const [results] = await db.promise().query(`
      SELECT a.erpid, s.name, s.avg_percent, a.allotted_branch, a.rank
      FROM allotments a
      JOIN students s ON s.erpid = a.erpid AND s.session_id = a.session_id
      WHERE a.session_id = ?
      ORDER BY a.rank ASC
    `, [session_id]);

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch allotment results' });
  }
});

// @route GET /allot/result/:erpid?session_id=X
router.get('/result/:erpid', async (req, res) => {
  const erpid = req.params.erpid;
  try {
    const session_id = req.query.session_id || await getActiveSessionId();
    if (!session_id) return res.status(400).json({ error: 'No session_id and no active session' });

    const [result] = await db.promise().query(`
      SELECT a.erpid, s.name, s.avg_percent, a.allotted_branch, a.rank
      FROM allotments a
      JOIN students s ON s.erpid = a.erpid AND s.session_id = a.session_id
      WHERE a.erpid = ? AND a.session_id = ?
    `, [erpid, session_id]);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Student not found or not allotted' });
    }
    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

// @route GET /allot/merit-list?session_id=X
// Returns all students sorted by avg_percent DESC (before/regardless of allotment)
router.get('/merit-list', async (req, res) => {
  try {
    const session_id = req.query.session_id || await getActiveSessionId();
    if (!session_id) return res.status(400).json({ error: 'No session_id and no active session' });

    const [results] = await db.promise().query(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY avg_percent DESC) AS merit_rank,
        erpid, name, branch, avg_percent,
        pref_1, pref_2, pref_3, pref_4, pref_5
      FROM students
      WHERE session_id = ?
      ORDER BY avg_percent DESC
    `, [session_id]);

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch merit list' });
  }
});

// @route GET /allot/rank-list?session_id=X
// Returns allotment results grouped by branch, sorted by rank
router.get('/rank-list', async (req, res) => {
  try {
    const session_id = req.query.session_id || await getActiveSessionId();
    if (!session_id) return res.status(400).json({ error: 'No session_id and no active session' });

    const [results] = await db.promise().query(`
      SELECT a.rank, a.erpid, s.name, s.branch AS student_branch, s.avg_percent, a.allotted_branch
      FROM allotments a
      JOIN students s ON s.erpid = a.erpid AND s.session_id = a.session_id
      WHERE a.session_id = ?
      ORDER BY a.allotted_branch ASC, a.rank ASC
    `, [session_id]);

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rank list' });
  }
});

module.exports = router;