import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type SectionHeaderProps = {
  title: string;
  buttonText?: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

export default function SectionHeader({
  title,
  buttonText,
  onPress,
  icon,
}: SectionHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {onPress && (
        <Pressable onPress={onPress}>
            <LinearGradient
                colors={colors.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
            >
            {icon && (
                <Ionicons
                name={icon}
                size={15}
                color={colors.text2}
                style={{ marginRight: 4 }}
                />
            )}

            {buttonText && (
                <Text style={[styles.buttonText, { color: colors.text2 }]} >{buttonText}</Text>
            )}
            </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "600",
    fontFamily: "Baloo2",
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },

  buttonText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Baloo2",
  },
});