// routes/upload.js
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const db = require('../db/connection');
const verifyToken = require('../middleware/authMiddleware');
const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, 'students.csv');
  }
});

const upload = multer({ storage: storage });

// @route POST /upload/csv
router.post('/csv',verifyToken, upload.single('file'), (req, res) => {
  const results = [];

  fs.createReadStream(path.join(__dirname, '../uploads/students.csv'))
    .pipe(csv())
    .on('data', (data) => {
      // Convert to float
      const percent1 = (parseFloat(data.obtainedmarks_1) / parseFloat(data.totalmarks_1)) * 100;
      const percent2 = (parseFloat(data.obtainedmarks_2) / parseFloat(data.totalmarks_2)) * 100;
      const avg = ((percent1 + percent2) / 2).toFixed(2);

      results.push([
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
    .on('end', () => {
      // Insert into DB
      const sql = `
        INSERT INTO students (
          erpid, name, branch,
          obtainedmarks_1, totalmarks_1,
          obtainedmarks_2, totalmarks_2,
          avg_percent, pref_1, pref_2, pref_3, pref_4, pref_5
        ) VALUES ?`;

      db.query(sql, [results], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Database insertion failed' });
        }

        res.json({
          message: 'CSV uploaded and data inserted successfully',
          inserted: result.affectedRows
        });
      });
    });
});

module.exports = router;
