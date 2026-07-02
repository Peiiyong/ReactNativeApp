import AppButton from "@/components/AppButton";
import BottomNavBar from "@/components/BottomNavBar";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Switch, Text, View } from "react-native";
import { auth } from "../firebase/firebase";
import { useAppTheme } from "../theme/theme-provider";
import { useThemeColors } from "../theme/useThemeColors";

function formatJoinedDate(dateString?: string | null) {
  if (!dateString) {
    return "Unknown";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function Profile() {
  const colors = useThemeColors();
  const { themeMode, toggleThemeMode } = useAppTheme();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [registeredAt, setRegisteredAt] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "No email available");
      setUsername(user.displayName ?? user.email?.split("@")[0] ?? "User");
      setRegisteredAt(formatJoinedDate(user.metadata.creationTime));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const confirmLogout = () => {
    Alert.alert("Log out?", "Are you sure you want to log out from this account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  };

  const avatarLetter = email.trim().charAt(0).toUpperCase() || "U";

  return (
    <LinearGradient
      colors={colors.innerBackground}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          paddingBottom: 120,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: "bold", marginBottom: 20, marginTop: 10, textAlign: "center" }}>
          Profile
        </Text>
        {loading ? (
          <View style={{ alignItems: "center", gap: 12 }}>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Loading profile...</Text>
            <ActivityIndicator color={colors.text} size="large" />
          </View>
        ) : (
          <View
          style={{
            width: "100%",
            gap: 14,
          }}
        >
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 28,
              padding: 24,
              alignItems: "center",
              gap: 14,
            }}
          >
            <View
              style={{
                width: 104,
                height: 104,
                borderRadius: 52,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.text2, fontSize: 38, fontWeight: "bold" }}>{avatarLetter}</Text>
            </View>

            <Text style={{ color: colors.text, fontSize: 30, fontWeight: "bold", textAlign: "center" }}>
              {username}
            </Text>

            <Text style={{ color: colors.navDefaultIcon, fontSize: 16 }}>
              {email}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 24,
              padding: 20,
              gap: 16,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
              Account Info
            </Text>

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
                <Text style={{ color: colors.navDefaultIcon, fontSize: 14 }}>Username</Text>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600", textAlign: "right", flex: 1 }}>
                  {username}
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
                <Text style={{ color: colors.navDefaultIcon, fontSize: 14 }}>Email</Text>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600", textAlign: "right", flex: 1 }}>
                  {email}
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
                <Text style={{ color: colors.navDefaultIcon, fontSize: 14 }}>Registered</Text>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600", textAlign: "right", flex: 1 }}>
                  {registeredAt}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 24,
              padding: 20,
              gap: 14,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
              Settings
            </Text>

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
          </View>

          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 24,
              padding: 20,
              gap: 14,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
              Security Actions
            </Text>

            <Text style={{ color: colors.navDefaultIcon, fontSize: 13, lineHeight: 18 }}>
              Use this area for account-level actions. Logging out will require confirmation.
            </Text>

            <AppButton title="L O G O U T" icon="log-out-outline" onPress={confirmLogout} />
          </View>
        </View>
        )}
      </ScrollView>

      <BottomNavBar />
    </LinearGradient>
  );
}