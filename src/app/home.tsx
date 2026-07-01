import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { Button, Text, View } from "react-native";
import { auth } from "../firebase/firebase";

export default function Home() {
  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Home Page (Logged In)</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}