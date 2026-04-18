import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import { securityService } from '../services/securityService';

/**
 * Hook to handle Emergency SOS functionality
 */
export const useEmergency = () => {
    const [isTriggering, setIsTriggering] = useState(false);

    const triggerEmergency = useCallback(async () => {
        setIsTriggering(true);
        console.log('[useEmergency] Triggering SOS protocol...');

        try {
            // 1. Request/Get Location
            let { status } = await Location.requestForegroundPermissionsAsync();
            let locationData = null;
            
            if (status !== 'granted') {
                console.warn('Location permission denied for SOS');
            } else {
                const loc = await Location.getCurrentPositionAsync({});
                locationData = {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    accuracy: loc.coords.accuracy
                };
            }

            // 2. Gather Device Info
            const deviceInfo = {
                platform: Platform.OS,
                version: Platform.Version,
                timestamp: new Date().toISOString()
            };

            // 3. Hit Backend Emergency Endpoint
            const response = await securityService.triggerEmergency(locationData, deviceInfo);

            if (response.success) {
                Alert.alert(
                    "EMERGENCY ACTIVATED",
                    `SOS alerts have been sent to your ${response.contactsNotified} emergency contact(s). Live location sharing is active.`,
                    [{ text: "OK" }]
                );
            }

            return response;
        } catch (error) {
            console.error('[useEmergency] SOS Failed:', error);
            Alert.alert("SOS Error", "Failed to reach emergency servers. Please call emergency services directly.");
            throw error;
        } finally {
            setIsTriggering(false);
        }
    }, []);

    return {
        triggerEmergency,
        isTriggering
    };
};
