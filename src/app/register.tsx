import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Text, View } from "react-native";
import AppButton from "../components/AppButton";
import AppInput from "../components/AppInput";
import { auth } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

export default function Register() {
  const colors = useThemeColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const register = async () => {
    if (!email || !password || !confirmPassword) {
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
      await createUserWithEmailAndPassword(auth, email, password);
      setIsError(false);
      setMessage("Login successful!");
      router.replace("/home");
    } catch (error: any) {
      setIsError(true);
      switch (error.code) {
        case "auth/email-already-in-use":
          setMessage("Email is already in use.");
          break;
        case "auth/invalid-email":
          setMessage("Invalid email address.");
          break;
        case "auth/weak-password":
          setMessage("Password should be at least 6 characters. ");
          break;
        default:
          setMessage("An error occurred during registration.");
      }
      console.log(error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 10, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 50, fontWeight: "bold", color: colors.text, fontFamily: "Righteous", marginBottom: 30, textAlign: "center" }}>R E G I S T E R</Text>

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
        title="R E G I S T E R"
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
        <Text style={{ color: isError ? colors.errorMsg : colors.successMsg, textAlign: "center", fontWeight: "600",}}>
          {message}
        </Text>
      )}
    </View>
  );
}