import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { get, ref, set } from "firebase/database";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import AppButton from "../components/AppButton";
import AppInput from "../components/AppInput";
import { auth, database, storage } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

export default function Register() {
  const colors = useThemeColors();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      setIsError(true);
      setMessage("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match.");
      return;
    }

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
      
      console.log("Saving user profile to Realtime Database:", userRef.toString());
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
      
      console.log("User profile saved successfully for:", nextId);

      setIsError(false);
      setMessage("Registration successful!");
      router.replace("/home");
    } catch (error: any) {
      setIsError(true);
      console.log("Registration error:", error);
      switch (error.code) {
        case "auth/email-already-in-use":
          setMessage("Email is already in use.");
          break;
        case "auth/invalid-email":
          setMessage("Invalid email address.");
          break;
        case "auth/weak-password":
          setMessage("Password should be at least 6 characters.");
          break;
        default:
          setMessage(`Registration failed: ${error.message || error.code || "Unknown error"}`);
      }
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 10, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 50, fontWeight: "bold", color: colors.text, fontFamily: "Righteous", marginBottom: 30, textAlign: "center" }}>R E G I S T E R</Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={
            imageUri
              ? { uri: imageUri }
              : require("../../assets/images/default-profile.jpg")
          }
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            alignSelf: "center",
            borderWidth: 2,
            borderColor: "#ccc",
          }}
        />
      </TouchableOpacity>

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

      <AppButton
        title="REGISTER"
        icon="person-add-outline"
        onPress={register}
      />

      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 10, gap: 5 }}>
        <Text style={{ color: colors.text }}> Already have an account?{" "}</Text>

        <Text onPress={() => router.push("/login")} style={{ color: colors.text, fontWeight: "bold", }}>
          Login now!
        </Text>
      </View>

      {message !== "" && (
        <Text style={{ color: isError ? colors.errorMsg : colors.successMsg, textAlign: "center", fontWeight: "600", }}>
          {message}
        </Text>
      )}
    </View>
  );
}