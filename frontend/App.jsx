import React from 'react';
import { Buffer } from 'buffer';
global.Buffer = Buffer;
import { LogBox, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { 
  useFonts, 
  DMSans_400Regular, 
  DMSans_500Medium, 
  DMSans_700Bold 
} from '@expo-google-fonts/dm-sans';
import { 
  Sora_400Regular, 
  Sora_600SemiBold, 
  Sora_700Bold, 
  Sora_800ExtraBold 
} from '@expo-google-fonts/sora';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { SMSAnalyticsProvider } from './src/context/SMSAnalyticsContext';
import { FinanceProvider } from './src/context/FinanceContext';
import TransactionNotification from './src/components/TransactionNotification';

// Ignore specific warnings if necessary
LogBox.ignoreLogs(['Warning: ...']);

// ── Error Boundary ──
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error("[CRITICAL] App Crash Caught:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 20 }}>
                    <Text style={{ fontSize: 44 }}>⚠️</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>Something went wrong</Text>
                    <Text style={{ fontSize: 14, color: '#64748B', marginTop: 8, textAlign: 'center' }}>Please restart the application</Text>
                </View>
            );
        }
        return this.props.children;
    }
}

export default function App() {
  console.log("[App] Starting launch sequence...");
  
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  console.log("[App] State - fontsLoaded:", fontsLoaded);

  // LOGIC: Even if fonts fail, we MUST render to avoid black screen.
  // We will use system fonts as fallback.

  console.log("[App] Rendering Root Providers...");

  return (
    <ErrorBoundary>
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <SafeAreaProvider style={{ flex: 1 }}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <SMSAnalyticsProvider>
                  <FinanceProvider>
                    <AppNavigator />
                    <TransactionNotification />
                  </FinanceProvider>
                </SMSAnalyticsProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </View>
    </ErrorBoundary>
  );
}
