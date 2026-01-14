const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const participantRoutes = require('./routes/participantRoutes');
const trialRoutes = require('./routes/trialRoutes');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/behavioral_platform';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/participants', participantRoutes);
app.use('/api/trials', trialRoutes);
app.use('/api/tasks', require('./routes/taskRoutes'));

// Health Check
app.get('/', (req, res) => {
    res.send('Behavioral Research Platform API is running');
});

module.exports = app;
