import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Text, View } from "react-native";
import AppButton from "../components/AppButton";
import AppInput from "../components/AppInput";
import { auth } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

export default function Login() {
  const colors = useThemeColors();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const login = async () => {
    try {
    if (!email || !password ) {
      setIsError(true);
      setMessage("Please complete all required fields.");
      return;
    }
      await signInWithEmailAndPassword(auth, email, password);
      setIsError(false);
      setMessage("Login successful!");
      router.replace("/home");
    } catch (error: any) {
      setIsError(true);
      switch (error.code) {
        case "auth/invalid-email":
          setMessage("Invalid email address.");
          break;

        case "auth/invalid-credential":
          setMessage("Incorrect email or password.");
          break;

        case "auth/user-not-found":
          setMessage("Account not found.");
          break;

        case "auth/wrong-password":
          setMessage("Incorrect password.");
          break;

        default:
          setMessage("Login failed.");
      }
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 10, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 50, fontWeight: "bold", color: colors.text, fontFamily: "Baloo2", marginBottom: 30, textAlign: "center" }}>L O G I N</Text>

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

      <AppButton
        title="LOGIN"
        icon="log-in-outline"
        onPress={login}
      />

      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 10, gap: 5 }}>
        <Text style={{ color: colors.text }}> Don't have an account?{" "}</Text>

        <Text onPress={() => router.push("/register")} style={{ color: colors.text, fontWeight: "bold", }}>
          Create an Account!
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