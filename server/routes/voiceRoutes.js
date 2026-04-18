const express = require('express');
const router = express.Router();
const controller = require('../controllers/voiceController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // Secure voice commands

router.post('/command', controller.processVoiceCommand);

module.exports = router;
