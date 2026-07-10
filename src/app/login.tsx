import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../components/AppButton";
import AppInput from "../components/AppInput";
import Toast from "../components/Toast";
import { auth } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

export default function Login() {
  const colors = useThemeColors();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Toast state — same pattern as Register / ProfileEdit
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

  const login = async () => {
    if (!email || !password) {
      showToast("Please complete all required fields.", "error");
      return;
    }

    setLoggingIn(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Login successful!", "success");
      setTimeout(() => router.replace("/home"), 500);
    } catch (error: any) {
      switch (error.code) {
        case "auth/invalid-email":
          showToast("Invalid email address.", "error");
          break;

        case "auth/invalid-credential":
          showToast("Incorrect email or password.", "error");
          break;

        case "auth/user-not-found":
          showToast("Account not found.", "error");
          break;

        case "auth/wrong-password":
          showToast("Incorrect password.", "error");
          break;

        default:
          showToast("Login failed.", "error");
      }
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.textWhite }]}>
      <Text style={[styles.title, { color: colors.textBlack }]}>
        L O G I N
      </Text>

      <AppInput
        placeholder="Enter Email"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
      />

      <AppInput
        placeholder="Enter Password"
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <AppButton
        title={loggingIn ? "Logging in..." : "LOGIN"}
        icon="log-in-outline"
        onPress={login}
      />

      <View style={styles.registerRow}>
        <Text style={[styles.registerText, { color: colors.textBlack }]}>
          Don't have an account?
        </Text>

        <Text
          onPress={() => router.push("/register")}
          style={[styles.registerLink, { color: colors.primary }]}
        >
          Create an Account!
        </Text>
      </View>

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
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 14,
  },

  title: {
    fontSize: 48,
    fontWeight: "600",
    fontFamily: "Baloo2",
    textAlign: "center",
    marginBottom: 30,
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 5,
    flexWrap: "wrap",
  },

  registerText: {
    fontSize: 15,
    fontFamily: "Baloo2",
  },

  registerLink: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Baloo2",
  },
});