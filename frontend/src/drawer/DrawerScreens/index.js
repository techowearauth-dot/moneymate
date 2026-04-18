import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/theme';
import BackButton from '../../components/BackButton';
import FraudDetectionScreen from '../../screens/FraudDetectionScreen';
import StockMarketScreen from '../../screens/StockMarketScreen';
import SecuritySettingsScreen from '../../screens/SecuritySettingsScreen';
import PaymentSettingsScreen from '../../screens/PaymentSettingsScreen';

const ScreenTemplate = ({ title }) => (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <BackButton />
            <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.content}>
            <Text style={styles.text}>This screen is under development.</Text>
        </View>
    </SafeAreaView>
);

export { SecuritySettingsScreen, PaymentSettingsScreen };
export const HelpSupportScreen = () => <ScreenTemplate title="Help & Support" />;
export const AboutScreen = () => <ScreenTemplate title="About Vaultify" />;

import LogsTransactionsScreen from '../../screens/LogsTransactionsScreen';

export { FraudDetectionScreen, StockMarketScreen, LogsTransactionsScreen };

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    title: { fontFamily: TYPOGRAPHY.fonts.heading, fontSize: 18, color: COLORS.textPrimary, marginLeft: 20 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: { fontFamily: TYPOGRAPHY.fonts.body, color: COLORS.textSecondary }
});
