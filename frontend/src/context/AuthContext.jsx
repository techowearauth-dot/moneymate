import React, { createContext, useState, useEffect } from 'react';
import { getAccessToken, getRefreshToken, saveToken, saveUser, clearTokens, clearUser, getUser } from '../utils/storage';
import { authService } from '../services/authService';

import { DeviceEventEmitter, Alert } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUserState] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('auth.logout', (data) => {
            if (data?.sessionExpired) {
                Alert.alert("Session Expired", "Please log in again to continue.");
            }
            logout();
        });
        checkInitialAuth();
        return () => sub.remove();
    }, []);

    const checkInitialAuth = async () => {
        try {
            const token = await getAccessToken();
            const storedUser = await getUser();

            if (token && storedUser) {
                // Try to get fresh profile data
                try {
                    // Requires setting token manually if interceptor hasn't caught up
                    const response = await authService.getMe();
                    setUserState(response.data.user);
                    await saveUser(response.data.user);
                    setAccessToken(token);
                } catch (error) {
                    // Interceptor will try to refresh. If absolutely fails, clear state
                    // We assume it's still fine if not explicitly 401 locally handled
                    if (error.response?.status !== 401) {
                        setUserState(storedUser);
                        setAccessToken(token);
                    } else {
                        await logout();
                    }
                }
            } else {
                setAccessToken(null);
                setUserState(null);
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (userData, accessToken, refreshToken = null) => {
        try {
            console.log('[AuthContext] Setting user state and tokens');
            setUserState(userData);
            setAccessToken(accessToken);
            
            await saveUser(userData);
            await saveToken(accessToken, refreshToken);
            
            console.log('[AuthContext] Login successful');
        } catch (error) {
            console.error('[AuthContext] Login error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            const refresh = await getRefreshToken();
            if (refresh) {
                await authService.logoutUser(refresh).catch(e => console.log('Server logout failed, ignoring local.'));
            }
        } finally {
            setUserState(null);
            setAccessToken(null);
            await clearTokens();
            await clearUser();
        }
    };

    const updateToken = (newToken) => {
        setAccessToken(newToken);
    };

    const updateUserProfile = async (updates) => {
        try {
            // 1. Sync with backend
            const response = await authService.updateProfile(updates);
            const freshUser = response.data?.user || { ...user, ...updates };

            // 2. Update local state & storage
            setUserState(freshUser);
            await saveUser(freshUser);
            
            console.log('[AuthContext] Profile synced with backend');
        } catch (error) {
            console.error('Failed to sync profile update with backend, following local-only fallback', error);
            
            // Local fallback
            const updatedUser = { ...user, ...updates };
            setUserState(updatedUser);
            await saveUser(updatedUser);
        }
    };

    const value = {
        user,
        accessToken,
        isLoading,
        login,
        logout,
        updateToken,
        updateUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
