import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppHeader from "@/components/AppHeader";
import AppInput from "@/components/AppInput";
import AppLoading from "@/components/AppLoading";
import Toast from "@/components/Toast";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { auth } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

export default function ChangePassword() {
  const colors = useThemeColors();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    visible:false,
    message:"",
    type:"success" as "success" | "error",
  });

  // Function to show toast message
  const showToast = (
    message:string,
    type:"success"|"error"="success"
  )=>{
    setToast({ visible:true, message, type, });
  };

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
    };
  }, []);

  const saveNewPassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill in all fields.", "error");
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

    if (currentPassword === newPassword) {
      showToast("New password cannot be the same as current password.", "error");
      return;
    }

    setSaving(true);

    try {
      const user = auth.currentUser;

      if (!user || !user.email) {
        showToast("Please sign in again.", "error");
        return;
      }

      // 1. Verify old password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(
        user,
        credential
      );

      // 2. Change password
      await updatePassword(
        user,
        newPassword
      );

      showToast( "Password changed successfully.", "success" );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => router.back(), 500);
    } catch (error:any) {
      console.warn("Change password failed", error);

      if(error.code === "auth/wrong-password"){
        showToast( "Current password is incorrect.", "error");
      } else if(error.code === "auth/requires-recent-login"){
        showToast("Please login again before changing password.","error");
      } else {
        showToast(error.message ?? "Password update failed.","error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={colors.innerBackground} style={styles.container}>
      <AppHeader 
        title="Password"
        leftIcon="arrow-back-outline"
        onLeftPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (<AppLoading />
        ) : (
          <>
            <Text style={[styles.subtitle, { color: colors.navDefaultIcon }]}>Use a strong password and keep it secure.</Text>

            <AppCard>
              <Text style={[styles.subtitle, { color: colors.text }]}>Current Password</Text>
              <AppInput 
                placeholder="Enter current password" 
                icon="shield-checkmark-outline" 
                secureTextEntry 
                value={currentPassword} 
                onChangeText={setCurrentPassword} 
              />

              <Text style={[styles.subtitle, { color: colors.text }]}>New Password</Text>
              <AppInput
                placeholder="Enter new password"
                icon="lock-closed-outline"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={[styles.subtitle, { color: colors.text }]}>Confirm password</Text>
              <AppInput
                placeholder="Enter confirm password"
                icon="lock-closed"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </AppCard>
            <AppButton title={saving ? "Saving..." : "Change Password"} icon="key-outline" onPress={saveNewPassword} />
          </>
        )}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() =>
          setToast(prev=>({
            ...prev,
            visible:false
          }))
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },

  subtitle: {
    fontSize: 14,
    fontFamily: "Baloo2",
  },
});