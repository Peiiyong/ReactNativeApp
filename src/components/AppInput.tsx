import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
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
    <LinearGradient colors={colors.activeIconBorder} style={styles.gradient}>
      <View
        style={[ styles.container, { backgroundColor: colors.cardBackground[0]}]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={colors.text}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[ styles.input, { color: colors.text } ]}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient:{
    borderRadius:12,
    padding:1.5,
    marginBottom:10,
  },

  container:{
    flexDirection:"row",
    alignItems:"center",
    borderRadius:10,
    paddingHorizontal:12,
  },

  icon:{
    marginRight:10,
  },

  input:{
    fontFamily: "Baloo2",
    fontSize: 16,
    fontWeight:"600",
    flex:1,
    height:50,
  },
});