import api from './api';
import { saveToken, getRefreshToken, clearTokens } from '../utils/storage';

const API_URL = '/auth';

console.log('[AuthService] API URL:', API_URL);

// Custom interceptor logic removed as it's now handled in api.js or can be added to the shared instance if needed.
// However, authService might need specific refresh logic.
// I'll keep the specialized api instance in authService if it needs different interceptors, 
// OR I can just use the shared one.
// Let's use the shared one for simplicity as it already handles tokens.

export const authService = {
    registerUser: async (name, email, password) => {
        try {
            console.log('[AuthService] Registering user:', { name, email, url: API_URL });
            const response = await api.post('/auth/register', { name, email, password });
            console.log('[AuthService] Registration successful:', response.data);
            return response.data;
        } catch (error) {
            console.error('[AuthService] Registration error:', {
                status: error.response?.status,
                message: error.response?.data?.message,
                errors: error.response?.data?.errors,
                url: error.config?.baseURL,
                fullError: error.message
            });
            throw error; // Re-throw for proper error handling at component level
        }
    },
    
    loginUser: async (email, password) => {
        try {
            console.log('[AuthService] Logging in user:', { email });
            const response = await api.post('/auth/login', { email, password });
            console.log('[AuthService] Login successful');
            if (response.data.data?.accessToken) {
                await saveToken(response.data.data.accessToken, response.data.data.refreshToken);
            }
            return response.data;
        } catch (error) {
            console.error('[AuthService] Login error:', error.response?.data || error.message);
            throw error;
        }
    },
    
    logoutUser: async (refreshToken) => {
        try {
            const response = await api.post('/auth/logout', { refreshToken });
            return response.data;
        } catch (error) {
            console.error('[AuthService] Logout error:', error.message);
            // Don't throw - continue logout even if server fails
            return { success: true };
        }
    },
    
    forgotPassword: async (email) => {
        try {
            const response = await api.post('/auth/forgot-password', { email });
            return response.data;
        } catch (error) {
            console.error('[AuthService] Forgot password error:', error.response?.data || error.message);
            throw error;
        }
    },
    
    resetPassword: async (token, password) => {
        try {
            const response = await api.post(`/auth/reset-password/${token}`, { password });
            return response.data;
        } catch (error) {
            console.error('[AuthService] Reset password error:', error.response?.data || error.message);
            throw error;
        }
    },
    
    getMe: async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            console.error('[AuthService] Get user error:', error.response?.status);
            throw error;
        }
    },
    
    updateProfile: async (updates) => {
        try {
            console.log('[AuthService] Updating profile:', updates);
            const response = await api.patch('/auth/profile', updates);
            return response.data;
        } catch (error) {
            console.error('[AuthService] Update profile error:', error.response?.data || error.message);
            throw error;
        }
    }
};
