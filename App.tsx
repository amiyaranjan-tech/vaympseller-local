/**
 * Vaymp Seller
 * @format
 */

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppNavigator } from './src/navigation/AppNavigator';
import { ToastProvider } from './src/components/feedback/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
});

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AppNavigator />
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
