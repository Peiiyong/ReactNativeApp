import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth, database } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

export default function ProfileEdit() {
  const colors = useThemeColors();
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [userKey, setUserKey] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      const loadProfile = async () => {
        try {
          const usersRef = ref(database, "users");
          const snapshot = await get(usersRef);

          if (snapshot.exists()) {
            const users = snapshot.val();
            const matchingKey = Object.keys(users).find((key) => users[key]?.authUid === user.uid);

            if (matchingKey) {
              const userData = users[matchingKey];
              setUserKey(matchingKey);
              const displayName = userData.userName ?? userData.username ?? "";
              setUsername(displayName);
              setOriginalUsername(displayName);
            } else {
              const directRef = ref(database, `users/${user.uid}`);
              const directSnapshot = await get(directRef);
              if (directSnapshot.exists()) {
                const userData = directSnapshot.val();
                setUserKey(user.uid);
                const displayName = userData.userName ?? userData.username ?? "";
                setUsername(displayName);
                setOriginalUsername(displayName);
              } else {
                const displayName = user.displayName ?? user.email?.split("@")[0] ?? "";
                setUsername(displayName);
                setOriginalUsername(displayName);
              }
            }
          } else {
            const directRef = ref(database, `users/${user.uid}`);
            const directSnapshot = await get(directRef);
            if (directSnapshot.exists()) {
              const userData = directSnapshot.val();
              setUserKey(user.uid);
              const displayName = userData.userName ?? userData.username ?? "";
              setUsername(displayName);
              setOriginalUsername(displayName);
            } else {
              const displayName = user.displayName ?? user.email?.split("@")[0] ?? "";
              setUsername(displayName);
              setOriginalUsername(displayName);
            }
          }
        } catch (error) {
          console.warn("Profile edit load failed", error);
          showToast("Unable to load your profile.", "error");
        } finally {
          setLoading(false);
        }
      };

      loadProfile();
    });

    return () => {
      unsubscribe();
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 5000);
  };

  const saveUsername = async () => {
    const trimmedName = username.trim();
    if (!trimmedName) {
      showToast("Username cannot be empty.", "error");
      return;
    }

    if (trimmedName === originalUsername.trim()) {
      showToast("No changes detected.", "success");
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        showToast("Please sign in again.", "error");
        return;
      }

      const recordKey = userKey ?? user.uid;
      const userRef = ref(database, `users/${recordKey}`);
      await update(userRef, { userName: trimmedName });
      await updateProfile(user, { displayName: trimmedName });
      setOriginalUsername(trimmedName);
      showToast("Username updated successfully.", "success");
      setTimeout(() => router.back(), 500);
    } catch (error: any) {
      console.warn("Save username failed", error);
      showToast(error.message ?? "Update failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={colors.innerBackground} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Edit Username</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.text} size="large" />
        ) : (
          <>
            <Text style={[styles.subtitle, { color: colors.navDefaultIcon }]}>Enter the username you want to use in your profile.</Text>
            <AppInput placeholder="Username" icon="person-outline" value={username} onChangeText={setUsername} />
            <AppButton title={saving ? "Saving..." : "Save Username"} icon="checkmark-done-outline" onPress={saveUsername} />
          </>
        )}
      </ScrollView>

      {toastVisible && (
        <View style={[styles.toast, toastType === "error" ? styles.toastError : styles.toastSuccess]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },
  subtitle: {
    fontSize: 14,
  },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 40,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  toastSuccess: {
    backgroundColor: "#22c55e",
  },
  toastError: {
    backgroundColor: "#ef4444",
  },
});