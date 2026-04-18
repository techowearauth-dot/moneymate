import React, { useContext } from 'react';
import { View, StyleSheet, Platform, Pressable, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Design System & Contexts
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, GRADIENTS } from '../constants/theme';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import ActivityScreen from '../screens/ActivityScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Components
import Avatar from '../components/Avatar';

const Tab = createBottomTabNavigator();

const CustomTabButton = ({ children, onPress }) => (
    <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.customTabWrapper}
    >
        <View style={styles.glowContainer}>
            <LinearGradient
                colors={['rgba(99, 102, 241, 0.5)', 'transparent']}
                style={styles.outerGlow}
            />
            <LinearGradient
                colors={GRADIENTS.primary}
                style={styles.customTabGradient}
            >
                {children}
            </LinearGradient>
        </View>
    </TouchableOpacity>
);

export default function TabNavigator() {
    const { user } = useContext(AuthContext);
    const { theme, isDarkMode } = useTheme();
    const { t } = useLanguage();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: [
                    styles.tabBar, 
                    { 
                        backgroundColor: theme.colors.surface,
                        borderTopColor: theme.colors.border,
                        shadowColor: isDarkMode ? '#000' : theme.colors.primary 
                    }
                ],
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textHint,
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarHideOnKeyboard: true,
            }}
        >
            <Tab.Screen 
                name="Home" 
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
                    ),
                }}
            />

            <Tab.Screen
                name="Activity"
                component={ActivityScreen}
                options={{
                    tabBarLabel: 'Activity',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'time' : 'time-outline'} size={22} color={color} />
                    ),
                }}
            />

            <Tab.Screen 
                name="Pay" 
                component={PaymentsScreen}
                options={{
                    tabBarLabel: t('payments'),
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "wallet" : "wallet-outline"} size={22} color={color} />
                    ),
                }}
            />

            <Tab.Screen 
                name="Profile" 
                component={ProfileScreen}
                options={{
                    tabBarLabel: t('profile'),
                    tabBarIcon: ({ focused }) => (
                        <View style={[
                            styles.avatarTabIcon,
                            { borderColor: theme.colors.border, borderWidth: 1 },
                            focused && { borderColor: theme.colors.primary, borderWidth: 2 }
                        ]}>
                            <Avatar name={user?.name} size={24} imageUri={user?.avatar} />
                        </View>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        height: Platform.OS === 'ios' ? 88 : 68,
        borderTopWidth: 1,
        ...SHADOWS.soft,
        shadowOpacity: 0.1,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    tabBarLabel: {
        fontFamily: TYPOGRAPHY.fonts.bodyMedium,
        fontSize: 10,
        marginBottom: Platform.OS === 'ios' ? 0 : 10,
    },
    customTabWrapper: {
        top: -24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    glowContainer: {
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerGlow: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    customTabGradient: {
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.strong,
        elevation: 10,
    },
    avatarTabIcon: {
        borderRadius: 12,
        padding: 1,
        overflow: 'hidden'
    }
});
