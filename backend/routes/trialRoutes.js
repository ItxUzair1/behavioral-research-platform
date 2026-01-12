const express = require('express');
const router = express.Router();
const controller = require('../controllers/trialController');

router.post('/', controller.logTrial);
router.get('/:participantId', controller.getTrials);

module.exports = router;
