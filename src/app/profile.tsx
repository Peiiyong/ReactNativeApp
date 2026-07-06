import AppButton from "@/components/AppButton";
import BottomNavBar from "@/components/BottomNavBar";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
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
    <LinearGradient colors={colors.innerBackground} style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Profile</Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
            <ActivityIndicator color={colors.text} size="large" />
          </View>
        ) : (
          <View style={styles.content}>
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.text2 }]}>{avatarLetter}</Text>
              </View>

              <Text style={[styles.username, { color: colors.text }]}>{username}</Text>

              <Text style={[styles.email, { color: colors.navDefaultIcon }]}>{email}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Info</Text>

              <View style={styles.infoList}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.navDefaultIcon }]}>Username</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{username}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.navDefaultIcon }]}>Email</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{email}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.navDefaultIcon }]}>Registered</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{registeredAt}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingTextWrap}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Theme mode</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.navDefaultIcon }]}> 
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

            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Security Actions</Text>

              <Text style={[styles.sectionDescription, { color: colors.navDefaultIcon }]}> 
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 60,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    minHeight: 280,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    gap: 14,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  avatarText: {
    fontSize: 38,
    fontWeight: "bold",
  },
  username: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },
  email: {
    fontSize: 16,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  settingTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingSubtitle: {
    fontSize: 13,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
