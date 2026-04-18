import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, RADIUS } from '../constants/theme';

export default function PasswordStrengthBar({ password = '' }) {
    const [strength, setStrength] = useState(0); // 0-4
    const [label, setLabel] = useState('Too weak');
    const [color, setColor] = useState(COLORS.error);

    useEffect(() => {
        calculateStrength(password);
    }, [password]);

    const calculateStrength = (p) => {
        if (!p) {
            setStrength(0);
            setLabel('Too weak');
            setColor(COLORS.error);
            return;
        }

        let s = 0;
        if (p.length >= 8) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^a-zA-Z0-9]/.test(p)) s++;

        setStrength(s);

        switch (s) {
            case 0:
            case 1:
                setLabel('Weak');
                setColor(COLORS.error);
                break;
            case 2:
                setLabel('Fair');
                setColor(COLORS.warning);
                break;
            case 3:
                setLabel('Good');
                setColor(COLORS.primary);
                break;
            case 4:
                setLabel('Strong');
                setColor(COLORS.success);
                break;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <Text style={styles.title}>Password Strength</Text>
                <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
            </View>
            
            <View style={styles.barContainer}>
                {[1, 2, 3, 4].map((step) => (
                    <View 
                        key={step}
                        style={[
                            styles.bar,
                            { 
                                backgroundColor: step <= strength ? color : COLORS.disabled,
                                flex: 1,
                                height: 4,
                                marginHorizontal: 2,
                                borderRadius: 2
                            }
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 8,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    strengthLabel: {
        fontFamily: TYPOGRAPHY.fonts.bodyBold,
        fontSize: 12,
    },
    barContainer: {
        flexDirection: 'row',
        marginHorizontal: -2,
    },
});
