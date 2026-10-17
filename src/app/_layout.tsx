import { Archivo_600SemiBold, Archivo_700Bold, Archivo_800ExtraBold } from '@expo-google-fonts/archivo';
import { CourierPrime_400Regular, CourierPrime_700Bold } from '@expo-google-fonts/courier-prime';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { initSounds } from '@/audio/sounds';
import { StoreProvider, useStore } from '@/state/store';
import { themeFor } from '@/theme';

initSounds();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    VT323_400Regular,
    CourierPrime_400Regular,
    CourierPrime_700Bold,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
  });
  return (
    <StoreProvider>
      <StatusBar style="light" />
      <Screens fontsLoaded={fontsLoaded} />
    </StoreProvider>
  );
}

function Screens({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready, settings } = useStore();
  const t = themeFor(settings.finish);
  // Hold on the desk colour until fonts and the saved tape are in, so nothing reflows on launch.
  if (!fontsLoaded || !ready) return <View style={{ flex: 1, backgroundColor: t.desk }} />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.desk } }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="settings"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.92],
          sheetGrabberVisible: true,
          sheetCornerRadius: 22,
          contentStyle: { backgroundColor: t.casing },
        }}
      />
    </Stack>
  );
}
