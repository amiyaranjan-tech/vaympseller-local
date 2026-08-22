import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '../../store/themeStore';
import { Radius, Spacing } from '../../theme/spacing';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const DISMISS_THRESHOLD = 80;

// Dependency-free bottom sheet — plain Modal + Animated + PanResponder,
// matching the Consumer app's "no extra sheet library" convention instead
// of pulling in @gorhom/bottom-sheet for what a drag handle and a slide
// animation already cover.
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(400);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    }
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderMove: (_evt, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dy > DISMISS_THRESHOLD) {
          Animated.timing(translateY, {
            toValue: 600,
            duration: 180,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.sheetBackground,
            paddingBottom: insets.bottom + Spacing.lg,
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.handle, { backgroundColor: colors.sheetHandle }]} />
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
  },
});
