import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInput from "@/components/AppInput";
import BackHeader from "@/components/BackHeader";
import ProfileAvatar from "@/components/ProfileAvatar";
import Toast from "@/components/Toast";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth, database } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

export default function ProfileEdit() {
  const colors = useThemeColors();
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userKey, setUserKey] = useState<string | null>(null);
  const [originalProfileImage, setOriginalProfileImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

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
    // check if user is logged in or not
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      // Load user profile data from Firebase Realtime Database
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
              setProfileImage(userData.profilePicture ?? null);
              setOriginalProfileImage(userData.profilePicture ?? null);
              setUsername(displayName);
              setOriginalUsername(displayName);
            } else {
              const directRef = ref(database, `users/${user.uid}`);
              const directSnapshot = await get(directRef);
              if (directSnapshot.exists()) {
                const userData = directSnapshot.val();
                setUserKey(user.uid);
                const displayName = userData.userName ?? userData.username ?? "";
                setProfileImage(userData.profilePicture ?? null);
                setOriginalProfileImage(userData.profilePicture ?? null);
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
              setProfileImage(userData.profilePicture ?? null);
              setOriginalProfileImage(userData.profilePicture ?? null);
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

  const saveProfile = async () => {
    const trimmedName = username.trim();
    const noChanges =
        trimmedName === originalUsername.trim() &&
        profileImage === originalProfileImage;
    
    if (!trimmedName) {
      showToast("Username cannot be empty.", "error");
      return;
    }

    if (noChanges) {
      showToast("No changes detected.", "error");
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
      await update(userRef, { userName: trimmedName, profilePicture: profileImage ?? "", });
      await updateProfile(user, { displayName: trimmedName });
      setOriginalUsername(trimmedName);
      showToast("Profile updated successfully.", "success");
      setTimeout(() => router.back(), 500);
    } catch (error: any) {
      console.warn("Save Profile failed", error);
      showToast(error.message ?? "Update failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <LinearGradient colors={colors.innerBackground} style={styles.container}>
      <BackHeader title="Edit Profile" />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.text} size="large" />
        ) : (
          <>
           {/* Upload Avatar */}
          <View style={styles.avatarSection}>
            <ProfileAvatar
              imageUri={profileImage}
              username={username}
              size={104}
              onPress={pickImage}
              showEditIcon={true}
            />
            <Text style={[styles.username, { color:colors.text, }]}> {username} </Text>
            <Text style={[ styles.avatarDescription, { color:colors.navDefaultIcon}]}>
              Change your avatar to personalize your profile.
            </Text>
          </View>

          <AppCard>
           {/* Edit Username */}
            <Text style={[styles.subtitle, { color: colors.text }]}>Username</Text>
            <AppInput placeholder="Username" icon="person-outline" value={username} onChangeText={setUsername} />
          </AppCard>

          <AppButton title={saving ? "Saving..." : "Save Profile"} icon="checkmark-done-outline" onPress={saveProfile} />  
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

  avatarSection:{
   alignItems: "center",
   gap: 10,
   marginBottom: 20,
  },

  username:{
    fontSize: 28,
    fontFamily: "Baloo2",
    fontWeight: "600",
  },

  avatarDescription:{
    fontSize: 14,
    fontFamily: "Baloo2",
    textAlign: "center",
  },
});