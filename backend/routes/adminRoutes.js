const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Middleware to protect admin routes
const requireAdmin = (req, res, next) => {
    // Check for custom header with base64 encoded password
    // Also check query param fallback for direct downloads
    const authHeader = req.headers['x-admin-auth'] || req.query.auth_token_param_hack;

    // Decode if it looks like base64 info we sent or just check direct match
    // For robust "login" flow simulation:
    // Client sends base64(password) as token

    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Missing credentials' });
    }

    let token = authHeader;
    try {
        // Try decoding
        const decoded = Buffer.from(authHeader, 'base64').toString('utf-8');
        // Check if decoded is the password OR if the header itself was the password
        if (decoded === 'admin@123' || authHeader === 'admin@123') {
            return next();
        }
    } catch (e) {
        // ignore
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
};

// Public Route (Login)
router.post('/login', adminController.login);

// Protected Routes
router.get('/participants', requireAdmin, adminController.getParticipants);
router.get('/export/full', requireAdmin, adminController.getFullExport);
router.get('/export/:participantId', requireAdmin, adminController.getParticipantExport);

module.exports = router;
