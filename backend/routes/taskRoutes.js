const express = require('express');
const router = express.Router();
const controller = require('../controllers/taskController');

router.get('/stimulus', controller.getStimulus);
router.post('/submit', controller.submitResult);
router.post('/start-task', controller.startTask);
router.get('/earnings', controller.getEarnings);

module.exports = router;
