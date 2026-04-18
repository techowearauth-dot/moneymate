const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentSettingsController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // Secure all routes

// Payment Methods
router.get('/methods', controller.getMethods);
router.post('/methods', controller.addMethod);
router.put('/methods/:methodId/default', controller.setDefaultMethod);

// Limits
router.put('/limits', controller.updateLimits);

// Beneficiaries
router.get('/beneficiaries', controller.getBeneficiaries);
router.post('/beneficiaries', controller.addBeneficiary);
router.put('/beneficiaries/:id/trust', controller.toggleBeneficiaryTrust);

// Subscriptions
router.get('/subscriptions', controller.getSubscriptions);
router.put('/subscriptions/:id/autopay', controller.toggleAutopay);

module.exports = router;
