import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import colors from "@/constants/colors";

interface HomeButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  badgeCount?: number;
  color?: string;
}

export function HomeButton({ icon, label, onPress, badgeCount, color }: HomeButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.pressable}
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={[styles.iconContainer, { backgroundColor: color || colors.light.primary }]}>
          {icon}
          {!!badgeCount && badgeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    minWidth: "45%",
    maxWidth: "48%",
  },
  container: {
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: "relative",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.light.foreground,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.light.destructive,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
