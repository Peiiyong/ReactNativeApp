import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type AppButtonProps = {
  title: string;
  onPress: () => void;
  icon?: IoniconName;
};

export default function AppButton({ title, onPress, icon }: AppButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={colors.buttonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        <View style={styles.content}>
          <Text style={[ styles.text,{ color: colors.textWhite }]}> {title} </Text>

          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={colors.textWhite}
            />
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button:{
    padding:10,
    borderRadius:20,
    alignItems:"center",
  },

  content:{
    flexDirection:"row",
    alignItems:"center",
    gap:10,
  },

  text:{
    fontFamily: "Baloo2",
    fontSize:20,
    fontWeight:"600",
  },
});