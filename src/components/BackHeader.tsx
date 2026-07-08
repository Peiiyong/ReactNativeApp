import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type BackHeaderProps = {
  title: string;
  showBack?: boolean;
};

export default function BackHeader({
  title,
  showBack = true,
}: BackHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.header}>
      { showBack && (
        <Pressable onPress={() => router.back()}>
          <LinearGradient colors={colors.activeIconBorder} style={styles.backGradient}>
            <View style={[ styles.backInner, { backgroundColor: colors.innerBackground[0]}]}>
              <Ionicons
                name="arrow-back-outline"
                size={20}
                color={colors.text}
              />
            </View>
          </LinearGradient>
        </Pressable>
      )}

      <Text style={[styles.title, { color: colors.text }]} > {title} </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header:{
    flexDirection:"row",
    alignItems:"center",
    gap:40,
    paddingTop:60,
    paddingHorizontal:20,
    paddingBottom:20,
  },

  backGradient:{
    width:52,
    height:40,
    borderRadius:18,
    padding:2,
  },

  backInner:{
    flex:1,
    borderRadius:16,
    alignItems:"center",
    justifyContent:"center",
  },

  title:{
    fontFamily:"Baloo2",
    fontSize:30,
    fontWeight:"600",
  },
});