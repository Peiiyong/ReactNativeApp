import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { auth } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

export default function Splash() {
  const colors = useThemeColors();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setTimeout(() => {
        if (user) {
          router.replace("/home");
        } else {
          router.replace("/login");
        }
      }, 2000); 
    });

    return unsubscribe;
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text, fontFamily: "Righteous", marginBottom: 10 }}>
        Loading...
      </Text>
      <ActivityIndicator size="large" color={colors.text} />
    </View>
  );
}