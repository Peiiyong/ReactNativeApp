import AppButton from "@/components/AppButton";
import BottomNavBar from "@/components/BottomNavBar";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { get, ref } from "firebase/database";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { auth, database } from "../firebase/firebase";
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
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastVisible, setToastVisible] = useState(false);
  const [userKey, setUserKey] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadUserProfile = useCallback(async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    try {
      setEmail(user.email ?? "No email available");
      setRegisteredAt(formatJoinedDate(user.metadata.creationTime));
      setUsername(user.displayName ?? user.email?.split("@")[0] ?? "User");

      const usersRef = ref(database, "users");
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const users = snapshot.val();
        const matchingKey = Object.keys(users).find((key) => users[key]?.authUid === user.uid);

        if (matchingKey) {
          const userData = users[matchingKey];
          setUserKey(matchingKey);
          setUsername(userData.userName ?? userData.username ?? user.displayName ?? user.email?.split("@")[0] ?? "User");
          setLevel(userData.level ?? 1);
          setExp(userData.exp ?? 0);
          setProfilePictureUrl(userData.profilePicture || user.photoURL || null);
          setEmail(userData.email ?? user.email ?? "No email available");
          if (userData.createdAt) {
            setRegisteredAt(formatJoinedDate(String(userData.createdAt)));
          }
        } else {
          const directRef = ref(database, `users/${user.uid}`);
          const directSnapshot = await get(directRef);
          if (directSnapshot.exists()) {
            const userData = directSnapshot.val();

            setUserKey(user.uid);
            setUsername(userData.userName ?? userData.username ?? user.displayName ?? user.email?.split("@")[0] ?? "User");
            setLevel(userData.level ?? 1);
            setExp(userData.exp ?? 0);
            setProfilePictureUrl(userData.profilePicture || user.photoURL || null);
            setEmail(userData.email ?? user.email ?? "No email available");
            if (userData.createdAt) {
              setRegisteredAt(formatJoinedDate(String(userData.createdAt)));
            }
          } else {
            setProfilePictureUrl(user.photoURL ?? null);
          }
        }
      } else {
        const directRef = ref(database, `users/${user.uid}`);
        const directSnapshot = await get(directRef);
        if (directSnapshot.exists()) {
          const userData = directSnapshot.val();

          setUserKey(user.uid);
          setUsername(userData.userName ?? userData.username ?? user.displayName ?? user.email?.split("@")[0] ?? "User");
          setLevel(userData.level ?? 1);
          setExp(userData.exp ?? 0);
          setProfilePictureUrl(userData.profilePicture || user.photoURL || null);
          setEmail(userData.email ?? user.email ?? "No email available");
          if (userData.createdAt) {
            setRegisteredAt(formatJoinedDate(String(userData.createdAt)));
          }
        } else {
          setProfilePictureUrl(user.photoURL ?? null);
        }
      }
    } catch (error) {
      console.warn("Failed to load profile data:", error);
      showToast("Failed to load profile info.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      loadUserProfile();
    });

    return () => {
      unsubscribe();
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [loadUserProfile]);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [loadUserProfile])
  );

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 5000);
  };

  const handleEditUsername = () => {
    router.push("/profile-edit");
  };

  const handleChangePassword = () => {
    router.push("/change-password");
  };

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
              {profilePictureUrl ? (
                <Image source={{ uri: profilePictureUrl }} style={styles.profileImage} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}> 
                  <Text style={[styles.avatarText, { color: colors.text2 }]}>{avatarLetter}</Text>
                </View>
              )}

              <Text style={[styles.username, { color: colors.text }]}>{username}</Text>
              <Text style={[styles.email, { color: colors.navDefaultIcon }]}>{email}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}> 
              <View style={styles.cardHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Info</Text>
                <Pressable style={styles.iconButton} onPress={handleEditUsername}>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </Pressable>
              </View>
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
                <View style={styles.statsRow}>
                  <View style={styles.statsItem}>
                    <Text style={[styles.statsLabel, { color: colors.navDefaultIcon }]}>Level</Text>
                    <Text style={[styles.statsValue, { color: colors.text }]}>{level}</Text>
                  </View>
                  <View style={styles.statsItem}>
                    <Text style={[styles.statsLabel, { color: colors.navDefaultIcon }]}>Exp</Text>
                    <Text style={[styles.statsValue, { color: colors.text }]}>{exp}</Text>
                  </View>
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
              <View style={styles.cardHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
                <Pressable style={styles.iconButton} onPress={handleChangePassword}>
                  <Ionicons name="key-outline" size={20} color={colors.primary} />
                </Pressable>
              </View>
              <Text style={[styles.sectionDescription, { color: colors.navDefaultIcon }]}>Change your password from a dedicated screen.</Text>
              <AppButton title="LOGOUT" icon="log-out-outline" onPress={confirmLogout} />
            </View>
          </View>
        )}
      </ScrollView>

      {toastVisible && (
        <View style={[styles.toast, toastType === "error" ? styles.toastError : styles.toastSuccess]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

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
  profileImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
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
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
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
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
  },
  statsItem: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statsLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    padding: 6,
  },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 40,
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  toastSuccess: {
    backgroundColor: "#22c55e",
  },
  toastError: {
    backgroundColor: "#ef4444",
  },
  toastText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  messageText: {
    marginTop: 10,
    textAlign: "center",
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
});
