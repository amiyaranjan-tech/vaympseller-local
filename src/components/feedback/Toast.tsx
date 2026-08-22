import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '../../store/themeStore';
import { Radius, Spacing } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VISIBLE_MS = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (options: ToastOptions) => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
      setToast(options);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, VISIBLE_MS);
    },
    [opacity],
  );

  const toneColors: Record<ToastType, string> = {
    success: colors.success,
    error: colors.error,
    info: colors.info,
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.container,
            {
              top: insets.top + Spacing.sm,
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.stripe,
              { backgroundColor: toneColors[toast.type ?? 'info'] },
            ]}
          />
          <Animated.View style={styles.textBlock}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {toast.title}
            </Text>
            {toast.message ? (
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {toast.message}
              </Text>
            ) : null}
          </Animated.View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 4,
  },
  stripe: {
    width: 4,
  },
  textBlock: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  message: {
    marginTop: 2,
    fontSize: FontSize.xs,
  },
});
