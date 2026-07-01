import AppButton from "@/components/AppButton";
import BottomNavBar from "@/components/BottomNavBar";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { Text } from "react-native";
import { auth } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

export default function Home() {
  const colors = useThemeColors();
  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  return (
    <LinearGradient
      colors={colors.innerBackground}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "bold", color: "white", marginBottom: 10 }}> Home Page</Text>
      <AppButton
        title="L O G O U T"
        icon="log-out-outline"
        onPress={logout}
      />
      
      <BottomNavBar />
    </LinearGradient>
  );
}