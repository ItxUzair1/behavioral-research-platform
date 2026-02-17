const express = require('express');
const router = express.Router();
const controller = require('../controllers/participantController');

router.post('/', controller.createParticipant);
router.get('/:participantId', controller.getParticipant);
router.patch('/:participantId', controller.updateParticipant);
router.post('/:participantId/payout', controller.submitPayoutDetails);
router.post('/validate', controller.validateParticipant);

module.exports = router;
