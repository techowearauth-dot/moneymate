import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Navigators
import TabNavigator from './TabNavigator';
import CustomDrawerContent from '../drawer/CustomDrawerContent';

// Drawer Screens
import { 
    SecuritySettingsScreen, 
    PaymentSettingsScreen, 
    FraudDetectionScreen,
    HelpSupportScreen, 
    AboutScreen,
    StockMarketScreen,
    LogsTransactionsScreen
} from '../drawer/DrawerScreens';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerType: 'slide',
                drawerStyle: {
                    width: 300,
                },
                overlayColor: 'rgba(0,0,0,0.4)',
            }}
        >
            <Drawer.Screen 
                name="MainTabs" 
                component={TabNavigator} 
                options={{ title: 'Home' }}
            />
            <Drawer.Screen 
                name="LogsTransactions" 
                component={LogsTransactionsScreen} 
            />
            <Drawer.Screen 
                name="SecuritySettings" 
                component={SecuritySettingsScreen} 
            />
            <Drawer.Screen 
                name="PaymentSettings" 
                component={PaymentSettingsScreen} 
            />
            <Drawer.Screen 
                name="FraudDetection" 
                component={FraudDetectionScreen} 
            />
            <Drawer.Screen 
                name="HelpSupport" 
                component={HelpSupportScreen} 
            />
            <Drawer.Screen 
                name="StockMarket" 
                component={StockMarketScreen} 
            />
            <Drawer.Screen 
                name="About" 
                component={AboutScreen} 
            />
        </Drawer.Navigator>
    );
}
