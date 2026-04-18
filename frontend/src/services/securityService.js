import api from './api';

export const securityService = {
    /**
     * Send SMS text to backend for fraud analysis
     */
    analyzeSms: async (text) => {
        try {
            const response = await api.post('/security/analyze-sms', { text });
            return response.data;
        } catch (error) {
            console.error('[SecurityService] Analyze SMS error:', error);
            throw error;
        }
    },

    /**
     * Get security status (score, alerts)
     */
    getSecurityStatus: async () => {
        try {
            const response = await api.get('/security/status');
            return response.data;
        } catch (error) {
            console.error('[SecurityService] Get status error:', error);
            throw error;
        }
    },

    /**
     * Trigger emergency mode
     */
    triggerEmergency: async (location, deviceInfo) => {
        try {
            const response = await api.post('/security/emergency', { location, deviceInfo });
            return response.data;
        } catch (error) {
            console.error('[SecurityService] Emergency trigger error:', error);
            throw error;
        }
    },

    /**
     * Manage trusted devices
     */
    getDevices: async () => {
        try {
            const response = await api.get('/security/devices');
            return response.data;
        } catch (error) {
            console.error('[SecurityService] Get devices error:', error);
            throw error;
        }
    },

    removeDevice: async (deviceId) => {
        try {
            const response = await api.delete(`/security/devices/${deviceId}`);
            return response.data;
        } catch (error) {
            console.error('[SecurityService] Remove device error:', error);
            throw error;
        }
    }
};
