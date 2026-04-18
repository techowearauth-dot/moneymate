import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const TABS = ['All', 'Alerts', 'Scans', 'Payments'];

export default function FilterTabs({ activeTab, onTabChange }) {
    return (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => onTabChange(tab)}
                        activeOpacity={0.8}
                        style={styles.tabWrapper}
                    >
                        {isActive ? (
                            <LinearGradient
                                colors={['#6C47FF', '#4F8EF7']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.activePill}
                            >
                                <Text style={styles.activeText}>{tab}</Text>
                            </LinearGradient>
                        ) : (
                            <View style={styles.inactivePill}>
                                <Text style={styles.inactiveText}>{tab}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}

// Since I'm using View inside conditional, I need to Import it
import { View } from 'react-native';

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 15,
        paddingVertical: 20,
        gap: 10,
    },
    tabWrapper: {
        marginRight: 5,
    },
    activePill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        elevation: 4,
        shadowColor: '#6C47FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    inactivePill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    inactiveText: {
        color: '#6B7280',
        fontWeight: '500',
        fontSize: 14,
    },
});
