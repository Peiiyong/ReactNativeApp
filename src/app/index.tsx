import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import "../../global.css";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>My App</Text>
      <Text>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 32,
    fontWeight: "bold",
  },
});