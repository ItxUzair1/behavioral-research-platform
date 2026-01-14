const express = require('express');
const router = express.Router();
const controller = require('../controllers/taskController');

router.get('/stimulus', controller.getStimulus);
router.post('/submit', controller.submitResult);

module.exports = router;
