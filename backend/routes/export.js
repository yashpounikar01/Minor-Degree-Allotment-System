// routes/export.js
const express = require('express');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
} = require('docx');
const db = require('../db/connection');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const titleStyle = (text, size = 26) =>
  new Paragraph({
    spacing: { after: 100 },
    alignment: 'center',
    children: [
      new TextRun({
        text,
        bold: true,
        size: size,
        font: 'Times New Roman',
      }),
    ],
  });

const tableHeaders = ['Sr.No.', 'ERP ID', 'NAME OF STUDENT', 'BRANCH OF STUDENT', 'RANK'];

router.get('/docx', async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT a.erpid, s.name, s.branch AS student_branch, a.allotted_branch, a.rank
      FROM allotments a
      JOIN students s ON s.erpid = a.erpid
      ORDER BY a.rank ASC
    `);

    // Group by allotted_branch
    const grouped = {};
    for (const row of rows) {
      const branch = row.allotted_branch || 'Not Allotted';
      if (!grouped[branch]) grouped[branch] = [];
      grouped[branch].push(row);
    }

    // Create section array
    const sections = [];

    for (const branch in grouped) {
      const students = grouped[branch];

      const headers = [
        titleStyle('PRIYADARSHINI BHAGWATI COLLEGE OF ENGINEERING, NAGPUR'),
        titleStyle('An Autonomous Institute', 24),
        titleStyle('Minor Degree Allotment List', 26),
        titleStyle(`${branch} Engineering`, 24),
      ];

      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: tableHeaders.map((header) =>
              new TableCell({
                children: [new Paragraph({ text: header, bold: true })],
              })
            ),
          }),
          ...students.map((s, i) =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(`${i + 1}`)] }),
                new TableCell({ children: [new Paragraph(s.erpid)] }),
                new TableCell({ children: [new Paragraph(s.name)] }),
                new TableCell({ children: [new Paragraph(s.student_branch)] }),
                new TableCell({ children: [new Paragraph(`${s.rank}`)] }),
              ],
            })
          ),
        ],
      });

      sections.push({
        children: [...headers, table],
      });
    }

    // ✅ Create the Document with all sections
    const doc = new Document({
      creator: 'MDM Portal',
      title: 'Minor Degree Allotment List',
      description: 'Branch-wise merit-based allotment list',
      sections: sections,
    });

    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join(__dirname, '../exports/minor_allotment_list.docx');

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);

    res.download(outputPath);
  } catch (err) {
    console.error('❌ Failed to export:', err);
    res.status(500).json({ error: 'Failed to export document' });
  }
});

module.exports = router;
