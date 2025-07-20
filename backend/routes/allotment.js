// routes/allotment.js
const express = require('express');
const db = require('../db/connection');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// @route GET /allot/run
router.get('/run', verifyToken, async (req, res) => {
  try {
    // Reset previous allotments
    await db.promise().query('DELETE FROM allotments');
    await db.promise().query('UPDATE branches SET allotted_seats = 0');

    // Fetch students ordered by avg_percent descending
    const [students] = await db.promise().query(
      'SELECT * FROM students ORDER BY avg_percent DESC'
    );

    // Seat availability cache
    const [branches] = await db.promise().query('SELECT * FROM branches');
    const seatMap = {};
    branches.forEach(branch => {
      seatMap[branch.branch_name] = {
        total: branch.total_seats,
        allotted: 0
      };
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
        'INSERT INTO allotments (erpid, allotted_branch, `rank`) VALUES (?, ?, ?)',
        [student.erpid, allottedBranch || 'Not Allotted', i + 1]
      );
    }

    // ✅ ✅ ✅ Move this here, outside the loop
    const updateBranchPromises = Object.entries(seatMap).map(([branchName, seatInfo]) => {
      return db.promise().query(
        'UPDATE branches SET allotted_seats = ? WHERE branch_name = ?',
        [seatInfo.allotted, branchName]
      );
    });

    await Promise.all(updateBranchPromises);

    res.json({ message: '✅ Allotment complete & branch table updated!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Allotment failed' });
  }

  console.log("Final seatMap before DB update:", seatMap);

});




router.get('/result', async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT a.erpid, s.name, s.avg_percent, a.allotted_branch, a.rank
      FROM allotments a
      JOIN students s ON s.erpid = a.erpid
      ORDER BY a.rank ASC
    `);

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch allotment results' });
  }
});

router.get('/result/:erpid', async (req, res) => {
  const erpid = req.params.erpid;
  try {
    const [result] = await db.promise().query(`
      SELECT a.erpid, s.name, s.avg_percent, a.allotted_branch, a.rank
      FROM allotments a
      JOIN students s ON s.erpid = a.erpid
      WHERE a.erpid = ?
    `, [erpid]);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Student not found or not allotted' });
    }

    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});


module.exports = router;
