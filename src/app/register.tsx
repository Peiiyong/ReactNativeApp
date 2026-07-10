import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import ProfileAvatar from "@/components/ProfileAvatar";
import Toast from "@/components/Toast";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { get, ref, set } from "firebase/database";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { auth, database, storage } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

export default function Register() {
  const colors = useThemeColors();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  // Toast state — same pattern as ProfileEdit
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ visible: true, message, type });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string, userId: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const fileRef = storageRef(storage, `profilePictures/${userId}.jpg`);

    await uploadBytes(fileRef, blob);

    return await getDownloadURL(fileRef);
  };

  const register = async () => {
    if (!email || !password || !confirmPassword || !username) {
      showToast("Please complete all required fields.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setRegistering(true);

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      let profileUrl = "";
      if (imageUri) {
        try {
          profileUrl = await uploadImage(imageUri, user.uid);
        } catch (uploadError) {
          console.warn("Profile image upload failed, continuing without image:", uploadError);
        }
      }

      const usersRef = ref(database, "users");
      const snapshot = await get(usersRef);
      let nextId = "U00001"; // 默认第一个用户

      if (snapshot.exists()) {
        const userData = snapshot.val();
        const keys = Object.keys(userData).filter(key => key.startsWith("U"));
        if (keys.length > 0) {
          keys.sort();
          const lastKey = keys[keys.length - 1];
          const lastNum = parseInt(lastKey.substring(1), 10);
          nextId = `U${String(lastNum + 1).padStart(5, '0')}`;
        }
      }

      // 2. Create User Profile in Realtime Database
      const userRef = ref(database, `users/${nextId}`);

      await set(userRef, {
        userId: nextId,
        authUid: user.uid,        // save the Firebase Auth UID for reference
        email,
        userName: username,
        profilePicture: profileUrl,
        level: 1,
        exp: 0,
        currentPoints: 0,
        createdAt: Date.now(),
      });

      showToast("Registration successful!", "success");
      setTimeout(() => router.replace("/home"), 500);
    } catch (error: any) {
      console.log("Registration error:", error);
      switch (error.code) {
        case "auth/email-already-in-use":
          showToast("Email is already in use.", "error");
          break;
        case "auth/invalid-email":
          showToast("Invalid email address.", "error");
          break;
        case "auth/weak-password":
          showToast("Password should be at least 6 characters.", "error");
          break;
        default:
          showToast(`Registration failed: ${error.message || error.code || "Unknown error"}`, "error");
      }
    } finally {
      setRegistering(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.textWhite }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.textBlack }]}>R E G I S T E R</Text>

        {/* Upload Avatar — same pattern as ProfileEdit */}
        <View style={styles.avatarSection}>
          <ProfileAvatar
            imageUri={imageUri}
            username={username || "New Player"}
            size={140}
            onPress={pickImage}
            badgeIcon="camera"
          />
          <Text style={[styles.avatarDescription, { color: colors.navDefaultIcon }]}>
            Tap to add a profile picture.
          </Text>
        </View>

        <View style={styles.form}>
          <AppInput
            placeholder="Username"
            icon="person-outline"
            value={username}
            onChangeText={setUsername}
          />

          <AppInput
            placeholder="Email"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
          />

          <AppInput
            placeholder="Password"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <AppInput
            placeholder="Confirm Password"
            icon="lock-closed-outline"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <AppButton
          title={registering ? "Registering..." : "REGISTER"}
          icon="person-add-outline"
          onPress={register}
        />

        <View style={styles.loginRow}>
          <Text style={[styles.loginLink, { color: colors.textBlack }]}>Already have an account? </Text>
          <Text
            onPress={() => router.push("/login")}
            style={[styles.loginLink, { color: colors.primary }]}
          >
            Login now!
          </Text>
        </View>
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() =>
          setToast((prev) => ({
            ...prev,
            visible: false,
          }))
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
    gap: 16,
  },

  title: {
    fontSize: 42,
    fontWeight: "600",
    fontFamily: "Baloo2",
    textAlign: "center",
    marginBottom: 10,
  },

  avatarSection: {
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },

  avatarDescription: {
    fontSize: 13,
    fontFamily: "Baloo2",
    textAlign: "center",
  },

  form: {
    gap: 10,
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  loginLink: {
    fontWeight: "600",
    fontFamily: "Baloo2",
  },
});