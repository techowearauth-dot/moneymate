import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translations = {
    en: {
        profile: 'Profile',
        settings: 'Settings',
        security: 'Security',
        payments: 'Payments',
        logout: 'Logout',
        editProfile: 'Edit Profile',
        changePassword: 'Change Password',
        language: 'Language',
        theme: 'Dark Mode',
        biometrics: 'Biometric Login',
        twoFactor: 'Two-Factor Auth',
        save: 'Save Changes',
        scanned: 'Scanned',
        threats: 'Threats',
        sent: 'Sent',
        personalInfo: 'Personal Information',
        securitySettings: 'Security Settings',
        appSettings: 'App Settings',
        english: 'English',
        hindi: 'Hindi',
        success: 'Success',
        error: 'Error',
        profileUpdated: 'Profile updated successfully',
        passwordChanged: 'Password changed successfully',
    },
    hi: {
        profile: 'प्रोफ़ाइल',
        settings: 'सेटिंग्स',
        security: 'सुरक्षा',
        payments: 'भुगतान',
        logout: 'लॉग आउट',
        editProfile: 'प्रोफ़ाइल संपादित करें',
        changePassword: 'पासवर्ड बदलें',
        language: 'भाषा',
        theme: 'डार्क मोड',
        biometrics: 'बायोमेट्रिक लॉगिन',
        twoFactor: 'टू-फैक्टर ऑथ',
        save: 'परिवर्तन सहेजें',
        scanned: 'स्कैन किया गया',
        threats: 'खतरे',
        sent: 'भेजा गया',
        personalInfo: 'व्यक्तिगत जानकारी',
        securitySettings: 'सुरक्षा सेटिंग्स',
        appSettings: 'ऐप सेटिंग्स',
        english: 'अंग्रेज़ी',
        hindi: 'हिंदी',
        success: 'सफलता',
        error: 'त्रुटि',
        profileUpdated: 'प्रोफ़ाइल सफलतापूर्वक अपडेट की गई',
        passwordChanged: 'पासवर्ड सफलतापूर्वक बदल गया',
    }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLang = await AsyncStorage.getItem('user_language');
            if (savedLang !== null) {
                setLanguage(savedLang);
            }
        } catch (error) {
            console.error('Failed to load language', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleLanguage = async (newLang) => {
        try {
            setLanguage(newLang);
            await AsyncStorage.setItem('user_language', newLang);
        } catch (error) {
            console.error('Failed to save language', error);
        }
    };

    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t, isLoading }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
