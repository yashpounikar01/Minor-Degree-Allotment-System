// app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE;

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/upload', require('./routes/upload'));
app.use('/allot', require('./routes/allotment'));
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);
// app.use('/export', require('./routes/export'));
app.use('/export', require('./routes/export-template'));


// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
