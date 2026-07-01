import BottomNavBar from "@/components/BottomNavBar";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

export default function History() {
  const colors = useThemeColors();

  return (
    <LinearGradient
      colors={colors.innerBackground}
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Text style={{ color: "white", fontSize: 30 }}>
        History Page
      </Text>

      <BottomNavBar />
    </LinearGradient>
  );
}