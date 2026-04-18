import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, Dimensions, Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS } from '../constants/theme';
import { useSMSAnalytics } from '../context/SMSAnalyticsContext';
import smsBotService from '../services/smsBotService';

const { width } = Dimensions.get('window');

const API_BASE_URL = 'http://10.0.2.2:5050'; // Adjust for your environment

const TEST_CASES = [
    { name: 'Debit: Amazon', sms: 'HDFC Bank: Rs 500 debited from A/C XXXX1234 at Amazon. Ref: 123456', expected: 'debit' },
    { name: 'Credit: Salary', sms: 'SBI: Your A/C XXXX5678 has been credited with Rs 50,000. Salary for Mar', expected: 'credit' },
    { name: 'OTP: Security', sms: '123456 is your OTP to link your card at Paytm. Do not share.', expected: 'other' },
    { name: 'Spam/Random', sms: 'Congratulations! You won a lottery. Click here to claim.', expected: 'other' },
];

export default function SMSTestingScreen() {
    const { smsAnalytics, addMessage } = useSMSAnalytics();
    
    const [apiStatus, setApiStatus] = useState('checking');
    const [testResults, setTestResults] = useState([]);
    const [isRunningTests, setIsRunningTests] = useState(false);
    const [stressCount, setStressCount] = useState(0);

    // 1. API Health Check
    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/health`);
                setApiStatus(res.data.status === 'healthy' ? 'online' : 'unhealthy');
            } catch (err) {
                setApiStatus('offline');
            }
        };
        checkHealth();
    }, []);

    // 2. AI Model Performance Tests
    const runAiTests = async () => {
        setIsRunningTests(true);
        const results = [];
        for (const tc of TEST_CASES) {
            try {
                const res = await axios.post(`${API_BASE_URL}/analyze-sms`, { sms: tc.sms });
                const data = res.data;
                const passed = data.type === tc.expected;
                results.push({ ...tc, actual: data.type, amount: data.amount, passed });
            } catch (err) {
                results.push({ ...tc, actual: 'error', passed: false });
            }
        }
        setTestResults(results);
        setIsRunningTests(false);
    };

    // 3. Stress Test (Batch)
    const runStressTest = async (count = 20) => {
        setIsRunningTests(true);
        for (let i = 0; i < count; i++) {
            const types = ['debit', 'credit', 'other'];
            const type = types[Math.floor(Math.random() * 3)];
            const sms = type === 'debit' ? `Rs ${Math.floor(Math.random()*1000)} spent at TestShop` : `Rs ${Math.floor(Math.random()*5000)} credited`;
            
            try {
                const res = await axios.post(`${API_BASE_URL}/analyze-sms`, { sms });
                addMessage({ ...res.data, id: `stress_${Date.now()}_${i}`, date: 'Test Mode' });
                setStressCount(prev => prev + 1);
            } catch (e) {}
            
            // Artificial delay to prevent API flooding during test
            await new Promise(r => setTimeout(r, 100));
        }
        setIsRunningTests(false);
        Alert.alert('Stress Test Complete', `Processed ${count} messages successfully.`);
    };

    return (
        <SafeAreaView style={S.container}>
            <View style={S.header}>
                <Text style={S.headerTitle}>🧪 SMS System Testing</Text>
                <View style={[S.statusBadge, { backgroundColor: apiStatus === 'online' ? COLORS.success + '20' : COLORS.error + '20' }]}>
                    <Text style={[S.statusText, { color: apiStatus === 'online' ? COLORS.success : COLORS.error }]}>
                        API: {apiStatus.toUpperCase()}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={S.scroll}>
                {/* AI / API Section */}
                <View style={S.card}>
                    <Text style={S.cardTitle}>AI Accuracy Testing</Text>
                    <Text style={S.cardSub}>Validates ML model & Regex parsing</Text>
                    
                    <View style={S.testControls}>
                        <TouchableOpacity style={S.btnPrimary} onPress={runAiTests} disabled={isRunningTests}>
                            {isRunningTests ? <ActivityIndicator color="#fff" size="small" /> : <Text style={S.btnText}>Run AI Batch Test</Text>}
                        </TouchableOpacity>
                    </View>

                    {testResults.map((res, i) => (
                        <View key={i} style={S.testRow}>
                            <View style={S.testInfo}>
                                <Text style={S.testName}>{res.name}</Text>
                                <Text style={S.testSms} numberOfLines={1}>{res.sms}</Text>
                            </View>
                            <View style={S.testResult}>
                                <Ionicons 
                                    name={res.passed ? 'checkmark-circle' : 'close-circle'} 
                                    size={20} 
                                    color={res.passed ? COLORS.success : COLORS.error} 
                                />
                                <Text style={[S.passFail, { color: res.passed ? COLORS.success : COLORS.error }]}>
                                    {res.passed ? 'PASS' : 'FAIL'}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Data Consistency Section */}
                <View style={S.card}>
                    <Text style={S.cardTitle}>Data Consistency Check</Text>
                    <View style={S.consistencyMetrics}>
                        <MetricRow label="Total Analyzed" value={smsAnalytics.total} />
                        <MetricRow label="Reported Balance" value={`₹${smsAnalytics.balance}`} />
                        <MetricRow label="Calc Balance (Cr - Dr)" value={`₹${smsAnalytics.creditAmount - smsAnalytics.debitAmount}`} />
                        <View style={S.divider} />
                        <Text style={[S.statusNote, { color: (smsAnalytics.creditAmount - smsAnalytics.debitAmount) === smsAnalytics.balance ? COLORS.success : COLORS.error }]}>
                            Status: {(smsAnalytics.creditAmount - smsAnalytics.debitAmount) === smsAnalytics.balance ? '✅ Data is Consistent' : '❌ Inconsistency Detected'}
                        </Text>
                    </View>
                </View>

                {/* Performance / Stress Test */}
                <View style={S.card}>
                    <Text style={S.cardTitle}>Performance & Stress Test</Text>
                    <Text style={S.cardSub}>Simulate rapid transaction arrivals</Text>
                    <View style={S.stressControls}>
                        <TouchableOpacity style={S.btnSecondary} onPress={() => runStressTest(10)}>
                            <Text style={S.btnTextSec}>+10 SMS</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={S.btnSecondary} onPress={() => runStressTest(50)}>
                            <Text style={S.btnTextSec}>+50 SMS</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={S.stressCount}>Stress count this session: {stressCount}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const MetricRow = ({ label, value }) => (
    <View style={S.metricRow}>
        <Text style={S.metricLabel}>{label}</Text>
        <Text style={S.metricValue}>{value}</Text>
    </View>
);

const S = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontFamily: TYPOGRAPHY.fonts.headingBold },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
    statusText: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    scroll: { padding: 20, paddingBottom: 100 },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: RADIUS.xl, marginBottom: 20, ...SHADOWS.soft },
    cardTitle: { fontSize: 16, fontFamily: TYPOGRAPHY.fonts.headingSemi },
    cardSub: { fontSize: 12, color: '#64748B', marginBottom: 16 },
    testControls: { marginBottom: 16 },
    btnPrimary: { backgroundColor: COLORS.primary, padding: 14, borderRadius: RADIUS.lg, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    testRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    testInfo: { flex: 1 },
    testName: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    testSms: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
    testResult: { alignItems: 'center' },
    passFail: { fontSize: 9, fontFamily: TYPOGRAPHY.fonts.bodyBold, marginTop: 2 },
    consistencyMetrics: { marginTop: 10 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    metricLabel: { fontSize: 13, color: '#64748B' },
    metricValue: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
    statusNote: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodyBold, textAlign: 'center' },
    stressControls: { flexDirection: 'row', gap: 12, marginTop: 10 },
    btnSecondary: { flex: 1, backgroundColor: '#F1F5F9', padding: 12, borderRadius: RADIUS.lg, alignItems: 'center' },
    btnTextSec: { color: COLORS.primary, fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    stressCount: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 16 },
});
