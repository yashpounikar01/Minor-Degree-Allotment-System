// routes/export-template.js
const express = require('express');
const db = require('../db/connection');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const router = express.Router();

// Helper: get active session id
async function getActiveSessionId() {
  const [rows] = await db.promise().query(
    'SELECT id FROM sessions WHERE is_active = 1 LIMIT 1'
  );
  return rows.length > 0 ? rows[0].id : null;
}

// Helper: escape CSV field
function csvField(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper: build CSV string from rows and headers
function buildCSV(headers, rows) {
  const headerLine = headers.map(csvField).join(',');
  const dataLines = rows.map(row => headers.map(h => csvField(row[h])).join(','));
  return [headerLine, ...dataLines].join('\r\n');
}

// ---------------------------------------------------------------
// GET /export/merit-list-csv?session_id=X
// Download merit list as CSV
// ---------------------------------------------------------------
router.get('/merit-list-csv', async (req, res) => {
  try {
    const session_id = req.query.session_id || await getActiveSessionId();
    if (!session_id) return res.status(400).json({ error: 'No session_id and no active session' });

    const [sessionInfo] = await db.promise().query('SELECT session_name FROM sessions WHERE id = ?', [session_id]);
    const sessionName = sessionInfo[0]?.session_name || session_id;

    const [rows] = await db.promise().query(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY avg_percent DESC) AS merit_rank,
        erpid, name, branch, avg_percent,
        pref_1, pref_2, pref_3, pref_4, pref_5
      FROM students
      WHERE session_id = ?
      ORDER BY avg_percent DESC
    `, [session_id]);

    if (rows.length === 0) return res.status(404).json({ error: 'No students found for this session' });

    const headers = ['merit_rank', 'erpid', 'name', 'branch', 'avg_percent', 'pref_1', 'pref_2', 'pref_3', 'pref_4', 'pref_5'];
    const csv = buildCSV(headers, rows);
    const filename = `merit_list_${sessionName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Merit list CSV export failed', details: err.message });
  }
});

// ---------------------------------------------------------------
// GET /export/rank-list-csv?session_id=X
// Download rank/allotment list as CSV
// ---------------------------------------------------------------
router.get('/rank-list-csv', async (req, res) => {
  try {
    const session_id = req.query.session_id || await getActiveSessionId();
    if (!session_id) return res.status(400).json({ error: 'No session_id and no active session' });

    const [sessionInfo] = await db.promise().query('SELECT session_name FROM sessions WHERE id = ?', [session_id]);
    const sessionName = sessionInfo[0]?.session_name || session_id;

    const [rows] = await db.promise().query(`
      SELECT a.rank, a.erpid, s.name, s.branch AS student_branch, s.avg_percent, a.allotted_branch
      FROM allotments a
      JOIN students s ON s.erpid = a.erpid AND s.session_id = a.session_id
      WHERE a.session_id = ?
      ORDER BY a.rank ASC
    `, [session_id]);

    if (rows.length === 0) return res.status(404).json({ error: 'No allotment data found. Run allotment first.' });

    const headers = ['rank', 'erpid', 'name', 'student_branch', 'avg_percent', 'allotted_branch'];
    const csv = buildCSV(headers, rows);
    const filename = `rank_list_${sessionName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Rank list CSV export failed', details: err.message });
  }
});

// ---------------------------------------------------------------
// GET /export/docx-template?session_id=X
// Download combined allotment DOCX
// ---------------------------------------------------------------
router.get('/docx-template', async (req, res) => {
  try {
    const session_id = req.query.session_id || await getActiveSessionId();
    if (!session_id) return res.status(400).json({ error: 'No session_id and no active session' });

    const [sessionInfo] = await db.promise().query('SELECT session_name FROM sessions WHERE id = ?', [session_id]);
    const sessionName = sessionInfo[0]?.session_name || String(session_id);

    const [rows] = await db.promise().query(`
      SELECT a.erpid, s.name, s.branch AS student_branch, a.allotted_branch, a.rank
      FROM allotments a
      JOIN students s ON s.erpid = a.erpid AND s.session_id = a.session_id
      WHERE a.session_id = ?
      ORDER BY a.allotted_branch ASC, a.rank ASC
    `, [session_id]);

    if (rows.length === 0) return res.status(404).json({ error: 'No allotment data found' });

    // Group by allotted_branch
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.allotted_branch]) grouped[row.allotted_branch] = [];
      grouped[row.allotted_branch].push({
        erpid: row.erpid, name: row.name,
        branch: row.student_branch, rank: row.rank
      });
    }

    const templatePath = path.join(__dirname, '../templates/template.docx');
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: `Template file not found at: ${templatePath}` });
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const allBranches = Object.entries(grouped).map(([branchName, students]) => ({
      branch: branchName,
      students: students.map((s, idx) => ({ ...s, index: idx + 1 }))
    }));

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
      parser: (tag) => ({
        get: tag === '.' ? (s) => s : (s) => s[tag]
      })
    });

    doc.setData({
      branches: allBranches,
      sessionName,
      totalStudents: rows.length,
      generatedDate: new Date().toLocaleDateString()
    });

    try {
      doc.render();
    } catch (renderError) {
      console.error('Render error:', renderError);
      return res.status(500).json({
        error: 'Template processing failed',
        details: renderError.message,
        templateErrors: renderError.properties?.errors?.map(e => ({ message: e.message, name: e.name })) || []
      });
    }

    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const filename = `allotment_${sessionName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
    fs.writeFileSync(path.join(exportDir, filename), buf);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Length', buf.length);
    res.send(buf);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Template export failed', details: err.message });
  }
});

module.exports = router;