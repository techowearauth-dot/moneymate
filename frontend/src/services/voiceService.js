import api from './api';

export const voiceService = {
    /**
     * Sends recognized speech text to the backend for intent parsing and fulfillment.
     * @param {string} text - The speech-to-text string.
     * @returns {Promise} - Backend response with action and spoken message.
     */
    sendCommand: async (text) => {
        const response = await api.post('/voice/command', { text });
        return response.data;
    }
};
