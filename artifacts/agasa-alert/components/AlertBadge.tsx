import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DangerLevel, DANGER_COLORS } from "@/constants/types";

interface AlertBadgeProps {
  level: DangerLevel;
  size?: "sm" | "md";
}

const LABELS: Record<DangerLevel, string> = {
  high: "DANGER",
  medium: "MOYEN",
  low: "FAIBLE",
};

export function AlertBadge({ level, size = "md" }: AlertBadgeProps) {
  const color = DANGER_COLORS[level];
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color + "20", borderColor: color },
        isSmall && styles.badgeSm,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }, isSmall && styles.labelSm]}>
        {LABELS[level]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    gap: 5,
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  labelSm: {
    fontSize: 9,
  },
});
