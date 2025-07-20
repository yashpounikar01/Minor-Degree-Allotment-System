// db/connection.js
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'minor_allotment'
});

db.connect((err) => {
  if (err) throw err;
  console.log('🟢 Connected to MySQL');
});

module.exports = db;
