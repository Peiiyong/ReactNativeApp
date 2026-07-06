import { seedLevelConfig } from "@/firebase/level_config";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInRight } from "react-native-reanimated";
import { auth } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

export default function Splash() {
  const colors = useThemeColors();

  useEffect(() => {
    // save level config to firebase database if it doesn't exist
    const start = async () => {
      await seedLevelConfig();
    };

    start();

    // check if user is logged in or not
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setTimeout(() => {
        if (user) {
          router.replace("/home");
        } else {
          router.replace("/login");
        }
      }, 3500);
    });

    return unsubscribe;
  }, []);

  const title = "GAMEVERSE";
  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      exiting={FadeOut.duration(500)}
      style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", }}
    >
      <View style={{ flexDirection: "row" }}>
        {title.split("").map((letter, index) => (
          <Animated.Text
            key={index}
            entering={SlideInRight.delay(index * 120)}
            style={[{ fontSize:  50, fontFamily: "Baloo2", color: colors.titleText, textShadowColor: colors.titleTextShadow, textShadowRadius: 30, }]}
          >
            {letter}
          </Animated.Text>
        ))}
      </View>

      <Animated.Text
        entering={FadeIn.delay(2600)}
        style={[{ fontSize:  18, fontFamily: "Baloo2", marginTop: 40, color: colors.titleText }]}
      >
        Loading...
      </Animated.Text>
    </Animated.View>
  );
}