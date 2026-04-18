import React, { useContext } from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';

// Context
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants/colors';

// Navigators
import DrawerNavigator from './DrawerNavigator';

// Auth Screens
import GetStartedScreen from '../screens/GetStartedScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ScanScreen from '../screens/ScanScreen';
import SMSTestingScreen from '../screens/SMSTestingScreen';
import PaymentReceiptScreen from '../screens/PaymentReceiptScreen';


const Stack = createStackNavigator();

const VaultifyTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: COLORS.background,
    },
};

export default function AppNavigator() {
    const { accessToken, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const isAuthBranch = tokenExists(accessToken);

    return (
        <NavigationContainer theme={VaultifyTheme}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                }}
            >
                {isAuthBranch ? (
                    // Main App Flow
                    <>
                        <Stack.Screen name="Drawer" component={DrawerNavigator} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                        <Stack.Screen name="Scan" component={ScanScreen} />
                        <Stack.Screen name="SMSTesting" component={SMSTestingScreen} />
                        <Stack.Screen name="PaymentReceipt" component={PaymentReceiptScreen} />
                    </>
                ) : (
                    // Auth Flow
                    <>
                        <Stack.Screen name="GetStarted" component={GetStartedScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

// Token existence helper
const tokenExists = (token) => {
    return token !== null && token !== undefined && token !== '';
};
