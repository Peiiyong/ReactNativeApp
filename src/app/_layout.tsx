import { Baloo2_700Bold, useFonts } from "@expo-google-fonts/baloo-2";
import { Stack } from "expo-router";
import "../../global.css";
import { ThemeProvider } from "../theme/theme-provider";

export default function RootLayout() {
  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Baloo2: Baloo2_700Bold,
  });

  if (!fontsLoaded) return null;
  
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}