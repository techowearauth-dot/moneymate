import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SHADOWS } from '../constants/theme';

export default function SummaryCard({ title, value, icon, colors }) {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={colors || ['#6C47FF', '#4F8EF7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.title}>{title}</Text>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: 110,
        marginHorizontal: 5,
        borderRadius: 20,
        overflow: 'hidden',
        ...SHADOWS.soft,
    },
    gradient: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    value: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 8,
    },
    title: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.8)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
