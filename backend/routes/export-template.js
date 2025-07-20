const express = require('express');
const db = require('../db/connection');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const router = express.Router();

router.get('/docx-template', async (req, res) => {
  try {
    console.log('=== Starting Combined DOCX Template Generation ===');
    
    // Fetch allotments with student details
    const [rows] = await db.promise().query(`
      SELECT a.erpid, s.name, s.branch AS student_branch, a.allotted_branch, a.rank
      FROM allotments a
      JOIN students s ON s.erpid = a.erpid
      ORDER BY a.allotted_branch ASC, a.rank ASC
    `);

    console.log(`Database query returned ${rows.length} rows`);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No allotment data found' });
    }

    // Group by allotted_branch
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.allotted_branch]) {
        grouped[row.allotted_branch] = [];
      }
      grouped[row.allotted_branch].push({
        erpid: row.erpid,
        name: row.name,
        branch: row.student_branch,
        rank: row.rank
      });
    }

    console.log('Grouped data by branch:', Object.keys(grouped));

    try {
      const templatePath = path.join(__dirname, '../templates/template.docx');
      console.log('Looking for template at:', templatePath);
      
      // Check if template file exists
      if (!fs.existsSync(templatePath)) {
        console.error(`❌ Template file not found at: ${templatePath}`);
        throw new Error(`Template file not found at: ${templatePath}`);
      }

      console.log('✅ Template file found');
      const content = fs.readFileSync(templatePath, 'binary');

      // Create combined template data with all branches
      const allBranches = [];
      for (const [branchName, students] of Object.entries(grouped)) {
        // Add index to each student for the template loop
        const studentsWithIndex = students.map((student, index) => ({
          ...student,
          index: index + 1
        }));

        allBranches.push({
          branch: branchName,
          students: studentsWithIndex
        });
      }

      console.log('Combined template data structure:', allBranches.map(b => ({
        branch: b.branch,
        studentCount: b.students.length
      })));

      // Log the actual data being passed to template for debugging
      console.log('Full template data:', JSON.stringify({
        branches: allBranches.slice(0, 1), // Log first branch only to avoid clutter
        totalStudents: rows.length,
        generatedDate: new Date().toLocaleDateString()
      }, null, 2));

      const zip = new PizZip(content);
      
      // Enhanced error handling for Docxtemplater
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '{{',
          end: '}}'
        },
        // Add error handler
        parser: function(tag) {
          return {
            get: tag === '.' ? function(s) { return s; } : function(s) {
              return s[tag];
            }
          };
        }
      });

      // Set template data for combined document
      const templateData = {
        branches: allBranches,
        totalStudents: rows.length,
        generatedDate: new Date().toLocaleDateString()
      };

      console.log('Setting combined template data...');
      doc.setData(templateData);

      // Render the document with enhanced error catching
      try {
        console.log('Attempting to render document...');
        doc.render();
        console.log('✅ Document rendered successfully');
      } catch (renderError) {
        console.error('❌ Docxtemplater render error:', renderError);
        
        // Enhanced error logging
        if (renderError.properties) {
          console.error('Error properties:', renderError.properties);
          
          if (renderError.properties.errors && Array.isArray(renderError.properties.errors)) {
            console.error('Template errors:');
            renderError.properties.errors.forEach(function (error, index) {
              console.error(`  Error ${index + 1}:`, {
                message: error.message,
                name: error.name,
                stack: error.stack,
                properties: error.properties
              });
            });
          }
          
          // Log specific error details
          if (renderError.properties.id) {
            console.error('Error ID:', renderError.properties.id);
          }
          if (renderError.properties.explanation) {
            console.error('Error explanation:', renderError.properties.explanation);
          }
        }
        
        // Return more specific error information
        return res.status(500).json({
          error: 'Template processing failed',
          details: renderError.message,
          errorType: renderError.name || 'Unknown',
          templateErrors: renderError.properties?.errors?.map(e => ({
            message: e.message,
            name: e.name
          })) || []
        });
      }

      // Generate the document buffer
      console.log('Generating document buffer...');
      const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE'
      });
      console.log('✅ Document buffer generated, size:', buf.length, 'bytes');

      // Create output directory if it doesn't exist
      const exportDir = path.join(__dirname, '../exports');
      if (!fs.existsSync(exportDir)) {
        console.log('Creating export directory...');
        fs.mkdirSync(exportDir, { recursive: true });
      }

      // Save the combined file
      const filename = `combined_minor_allotment_${new Date().toISOString().split('T')[0]}.docx`;
      const filePath = path.join(exportDir, filename);
      console.log('Saving combined file to:', filePath);

      fs.writeFileSync(filePath, buf);
      console.log('✅ Combined file saved successfully');

      // Set proper headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Length', buf.length);

      console.log('Sending file for download...');
      
      // Send the buffer directly for download
      res.send(buf);

    } catch (templateError) {
      console.error('❌ Template processing error:', templateError);
      console.error('Error stack:', templateError.stack);
      
      // More detailed error response
      res.status(500).json({
        error: 'Template processing failed',
        details: templateError.message,
        stack: process.env.NODE_ENV === 'development' ? templateError.stack : undefined
      });
    }

  } catch (err) {
    console.error('❌ Database or general error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      error: 'Template export failed',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Test route to validate template data structure
router.get('/test-template-data', async (req, res) => {
  try {
    console.log('=== Testing Template Data Structure ===');
    
    // Fetch allotments with student details
    const [rows] = await db.promise().query(`
      SELECT a.erpid, s.name, s.branch AS student_branch, a.allotted_branch, a.rank
      FROM allotments a
      JOIN students s ON s.erpid = a.erpid
      ORDER BY a.allotted_branch ASC, a.rank ASC
      LIMIT 5
    `);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No allotment data found' });
    }

    // Group by allotted_branch
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.allotted_branch]) {
        grouped[row.allotted_branch] = [];
      }
      grouped[row.allotted_branch].push({
        erpid: row.erpid,
        name: row.name,
        branch: row.student_branch,
        rank: row.rank
      });
    }

    // Create template data structure
    const allBranches = [];
    for (const [branchName, students] of Object.entries(grouped)) {
      const studentsWithIndex = students.map((student, index) => ({
        ...student,
        index: index + 1
      }));

      allBranches.push({
        branch: branchName,
        students: studentsWithIndex
      });
    }

    const templateData = {
      branches: allBranches,
      totalStudents: rows.length,
      generatedDate: new Date().toLocaleDateString()
    };

    // Return the data structure for inspection
    res.json({
      message: 'Template data structure (limited to 5 records for testing)',
      data: templateData,
      summary: {
        totalBranches: allBranches.length,
        totalStudents: rows.length,
        branchNames: Object.keys(grouped)
      }
    });

  } catch (err) {
    console.error('❌ Test data error:', err);
    res.status(500).json({
      error: 'Failed to generate test data',
      details: err.message
    });
  }
});

module.exports = router;