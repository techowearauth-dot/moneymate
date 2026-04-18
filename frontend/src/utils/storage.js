import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveToken = async (accessToken, refreshToken) => {
    try {
        await AsyncStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
            await AsyncStorage.setItem('refreshToken', refreshToken);
        }
    } catch (e) {
        console.error('Error saving tokens', e);
    }
};

export const getAccessToken = async () => {
    try {
        return await AsyncStorage.getItem('accessToken');
    } catch (e) {
        console.error('Error getting access token', e);
        return null;
    }
};

export const getRefreshToken = async () => {
    try {
        return await AsyncStorage.getItem('refreshToken');
    } catch (e) {
        console.error('Error getting refresh token', e);
        return null;
    }
};

export const clearTokens = async () => {
    try {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
    } catch (e) {
        console.error('Error clearing tokens', e);
    }
};

export const saveUser = async (user) => {
    try {
        await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
        console.error('Error saving user', e);
    }
};

export const getUser = async () => {
    try {
        const user = await AsyncStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch (e) {
        console.error('Error getting user', e);
        return null;
    }
};

export const clearUser = async () => {
    try {
        await AsyncStorage.removeItem('user');
    } catch (e) {
        console.error('Error clearing user', e);
    }
};
