import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
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
        style={{
          padding: 16,
          borderRadius: 20,
/*           borderWidth: 2,
          borderColor: "#000", */
          alignItems: "center",
/*           overflow: "hidden" */
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 15,}}>      
            <Text style={{ fontSize: 16, color: colors.text, fontWeight: "bold" }}>
            {title}
            </Text>
            {icon && (
            <Ionicons name={icon} size={20} color={colors.text} />
            )}  
        </View>
      </LinearGradient>
    </Pressable>
  );
}