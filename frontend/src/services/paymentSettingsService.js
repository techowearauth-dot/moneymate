import api from './api';

export const paymentSettingsService = {
    // Payment Methods
    getMethods: () => api.get('/payment-settings/methods'),
    addMethod: (data) => api.post('/payment-settings/methods', data),
    setDefaultMethod: (id) => api.put(`/payment-settings/methods/${id}/default`),

    // Limits
    updateLimits: (data) => api.put('/payment-settings/limits', data),

    // Beneficiaries
    getBeneficiaries: () => api.get('/payment-settings/beneficiaries'),
    addBeneficiary: (data) => api.post('/payment-settings/beneficiaries', data),
    toggleTrust: (id) => api.put(`/payment-settings/beneficiaries/${id}/trust`),

    // Subscriptions
    getSubscriptions: () => api.get('/payment-settings/subscriptions'),
    toggleAutopay: (id) => api.put(`/payment-settings/subscriptions/${id}/autopay`)
};
