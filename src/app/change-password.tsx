import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged, updatePassword } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

export default function ChangePassword() {
  const colors = useThemeColors();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setLoading(false);
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

  const saveNewPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast("Enter and confirm your new password.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        showToast("Please sign in again.", "error");
        return;
      }

      await updatePassword(user, newPassword);
      showToast("Password changed successfully.", "success");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => router.back(), 500);
    } catch (error: any) {
      console.warn("Change password failed", error);
      if (error.code === "auth/requires-recent-login") {
        showToast("Please sign in again before changing your password.", "error");
      } else {
        showToast(error.message ?? "Password update failed.", "error");
      }
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
        <Text style={[styles.title, { color: colors.text }]}>Change Password</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.text} size="large" />
        ) : (
          <>
            <Text style={[styles.subtitle, { color: colors.navDefaultIcon }]}>Use a strong password and keep it secure.</Text>
            <AppInput
              placeholder="New password"
              icon="lock-closed-outline"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <AppInput
              placeholder="Confirm password"
              icon="lock-closed-outline"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <AppButton title={saving ? "Saving..." : "Change Password"} icon="key-outline" onPress={saveNewPassword} />
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