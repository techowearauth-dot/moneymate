import api from './api';

export const paymentService = {
    getBalance: async () => {
        try {
            const response = await api.get('/payment/balance');
            return response.data;
        } catch (error) {
            console.error('[PaymentService] Get balance error:', error.message);
            throw error;
        }
    },

    getTransactions: async () => {
        try {
            const response = await api.get('/payment/transactions');
            return response.data;
        } catch (error) {
            console.error('[PaymentService] Get transactions error:', error.message);
            throw error;
        }
    },

    addTransaction: async (data) => {
        try {
            const response = await api.post('/payment/transaction', data);
            return response.data;
        } catch (error) {
            console.error('[PaymentService] Add transaction error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Simplified direct transfer (kept name 'createOrder' for UI compatibility)
    createOrder: async (paymentData) => {
        try {
            console.log('[PaymentService] Initiating direct transfer:', paymentData);
            const response = await api.post('/payment/transfer', paymentData);
            return response.data;
        } catch (error) {
            console.error('[PaymentService] Transfer error:', error.response?.data || error.message);
            throw error;
        }
    },

    deleteTransaction: async (id) => {
        try {
            const response = await api.delete(`/payment/transaction/${id}`);
            return response.data;
        } catch (error) {
            console.error('[PaymentService] Delete transaction error:', error.message);
            throw error;
        }
    },

    deleteBulkTransactions: async (ids) => {
        try {
            const response = await api.delete('/payment/transactions/bulk', {
                data: { ids } // axios delete with body requires 'data' key
            });
            return response.data;
        } catch (error) {
            console.error('[PaymentService] Bulk delete transaction error:', error.message);
            throw error;
        }
    }
};
