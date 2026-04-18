import axios from 'axios';
import Constants from 'expo-constants';
import { getAccessToken, getRefreshToken, saveToken, clearTokens } from '../utils/storage';

import { Platform } from 'react-native';

const PORT = 5000;
// Dynamically resolve local network IP for Expo Go 
const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.debuggerHost || Constants?.manifest2?.extra?.expoGo?.debuggerHost;
const ip = hostUri ? hostUri.split(':')[0] : (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
const API_URL = `http://${ip}:${PORT}/api`;

console.log("📡 [Network] Calling API:", API_URL);

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Queue to handle multiple requests during a refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

// 2. REQUEST INTERCEPTOR
api.interceptors.request.use(
    async (config) => {
        const token = await getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. RESPONSE INTERCEPTOR
api.interceptors.response.use(
    (response) => {
        console.log(`✅ [API Response] ${response.config.url} - ${response.status}`);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Check if error is 401 and not a retry and has meant "Token expired"
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await getRefreshToken();
                console.log('🔄 [API] Attempting token refresh...');
                
                // Use a standard axios call for refresh to avoid interceptor loops
                const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                
                if (res.status === 200) {
                    const { accessToken, refreshToken: newRefreshToken } = res.data.data;
                    await saveToken(accessToken, newRefreshToken);
                    
                    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    
                    processQueue(null, accessToken);
                    console.log('✅ [API] Token refreshed & retrying request');
                    return api(originalRequest);
                }
            } catch (err) {
                console.error('🔥 [API] Refresh token failed or expired:', err.response?.data?.message || err.message);
                processQueue(err, null);
                await clearTokens();
                import('react-native').then(({ DeviceEventEmitter }) => {
                    DeviceEventEmitter.emit('auth.logout', { sessionExpired: true });
                });
            } finally {
                isRefreshing = false;
            }
        }

        // Detailed error logging
        if (!error.response) {
            console.error('🔥 [Network Error] Request failed to reach the server.');
        } else {
            console.error(`❌ [API Error] ${error.response.status} from ${error.config.url}`);
            console.error('   - Message:', error.response.data?.message || 'No message');
        }
        
        return Promise.reject(error);
    }
);

export default api;
export { API_URL };
