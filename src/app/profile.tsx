import AppButton from "@/components/AppButton";
import BottomNavBar from "@/components/BottomNavBar";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Switch, Text, View } from "react-native";
import { auth } from "../firebase/firebase";
import { useAppTheme } from "../theme/theme-provider";
import { useThemeColors } from "../theme/useThemeColors";

export default function Profile() {
  const colors = useThemeColors();
  const { themeMode, toggleThemeMode } = useAppTheme();
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

  const avatarLetter = email.trim().charAt(0).toUpperCase() || "U";

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
            backgroundColor: colors.cardBackground,
            borderRadius: 24,
            padding: 24,
            gap: 16,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 32, fontWeight: "bold" }}> Profile </Text>
          <View style={{ alignItems: "center", gap: 14 }}>
            <View
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.text2, fontSize: 36, fontWeight: "bold" }}>{avatarLetter}</Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.navDefaultIcon, fontSize: 14 }}>
              Email address
            </Text>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>
              {email}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 8,
            }}
          >
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>Theme mode</Text>
              <Text style={{ color: colors.navDefaultIcon, fontSize: 13 }}>
                {themeMode === "dark" ? "Dark mode enabled" : "Light mode enabled"}
              </Text>
            </View>

            <Switch
              value={themeMode === "dark"}
              onValueChange={toggleThemeMode}
              trackColor={{ false: "#94A3B8", true: colors.primary }}
              thumbColor={themeMode === "dark" ? "#FFFFFF" : "#F8FAFC"}
            />
          </View>

          <AppButton title="L O G O U T" icon="log-out-outline" onPress={logout} />
        </View>
      )}

      <BottomNavBar />
    </LinearGradient>
  );
}