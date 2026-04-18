import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SHADOWS, RADIUS } from '../constants/theme';

export default function ActivityCard({ item, onPress }) {
    const getIconInfo = () => {
        switch (item.type) {
            case 'Scan': return { name: 'qr-code-outline', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' };
            case 'Alert': return { name: 'shield-outline', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
            case 'Payment': return { name: 'card-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
            default: return { name: 'document-text-outline', color: '#6C47FF', bg: 'rgba(108, 71, 255, 0.1)' };
        }
    };

    const getStatusInfo = () => {
        switch (item.status) {
            case 'SAFE': return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
            case 'WARNING': return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
            case 'RISK': return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
            default: return { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' };
        }
    };

    const icon = getIconInfo();
    const status = getStatusInfo();

    return (
        <TouchableOpacity 
            style={styles.container} 
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
                <Ionicons name={icon.name} size={24} color={icon.color} />
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.time} • {item.description}</Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{item.status}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 20,
        ...SHADOWS.subtle,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    subtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
