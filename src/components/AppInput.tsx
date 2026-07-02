import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type AppInputProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

export default function AppInput({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  icon,
}: AppInputProps) {
  const colors = useThemeColors();
  const [hidePassword, setHidePassword] = useState(secureTextEntry);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.text,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 10,
      }}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={colors.text}
          style={{ marginRight: 10 }}
        />
      )}

      <TextInput
        style={{
          flex: 1,
          height: 50,
          color: colors.text,
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.navDefaultIcon}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={hidePassword}
      />

      {secureTextEntry && (
        <Pressable onPress={() => setHidePassword(!hidePassword)}>
            <Ionicons
            name={hidePassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={colors.text}
            />
        </Pressable>
        )}
    </View>
  );
}