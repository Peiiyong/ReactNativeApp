import AppButton from "@/components/AppButton";
import BottomNavBar from "@/components/BottomNavBar";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { auth } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

export default function Profile() {
  const colors = useThemeColors();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "No email available");
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  return (
    <LinearGradient
      colors={colors.innerBackground}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}
    >
      {loading ? (
        <View style={{ alignItems: "center", gap: 12 }}>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Loading profile...</Text>
          <ActivityIndicator color={colors.text} size="large" />
        </View>
      ) : (
        <View
          style={{
            width: "100%",
            backgroundColor: "rgba(0,0,0,0.25)",
            borderRadius: 24,
            padding: 24,
            gap: 16,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 32, fontWeight: "bold", textAlign: "center" }}>
            Profile
          </Text>

          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.navDefaultIcon, fontSize: 14 }}>
              Email address
            </Text>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>
              {email}
            </Text>
          </View>

          <AppButton title="L O G O U T" icon="log-out-outline" onPress={logout} />
        </View>
      )}

      <BottomNavBar />
    </LinearGradient>
  );
}