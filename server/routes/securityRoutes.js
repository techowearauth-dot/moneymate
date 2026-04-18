const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // All security routes are protected

router.post('/analyze-sms', securityController.analyzeSms);
router.get('/status', securityController.getSecurityStatus);
router.post('/emergency', securityController.triggerEmergency);
router.get('/devices', securityController.getDevices);
router.delete('/devices/:deviceId', securityController.removeDevice);

module.exports = router;
