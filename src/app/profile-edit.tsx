import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import Toast from "@/components/Toast";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth, database } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

export default function ProfileEdit() {
  const colors = useThemeColors();
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userKey, setUserKey] = useState<string | null>(null);

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
    };
  }, []);

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
          <View
            style={{
              width:48,
              height:36,
              borderRadius:16,
              borderWidth:1,
              borderColor:colors.activeIcon,
              backgroundColor:colors.activeIconBackground,
              alignItems:"center",
              justifyContent:"center",
            }}
          >
          <Ionicons name="arrow-back-outline" size={20} color={colors.text} />
          </View>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
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
});