import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="report" />
      <Stack.Screen name="map" />
      <Stack.Screen name="alerts" />
      <Stack.Screen name="info" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}
