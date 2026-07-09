import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type AppHeaderProps = {
  title: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  onRightPress?: () => void;
};

export default function AppHeader({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
}: AppHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.header}>
      {/* Left Icon */}
      <View style={styles.side}>
        {
          leftIcon && (
            <Pressable onPress={onLeftPress}>
              <LinearGradient  colors={colors.activeIconBorder} style={styles.iconGradient}>
                <View style={[ styles.iconInner, { backgroundColor: colors.innerBackground[0] }]}>
                  <Ionicons
                    name={leftIcon}
                    size={20}
                    color={colors.text}
                  />
                </View>
              </LinearGradient>
            </Pressable>
        )}
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.title, { color: colors.text }]}
        >
          {title}
        </Text>
      </View>

      {/* Right Icon */}
      <View style={styles.side}>
        {
          rightIcon && (
            <Pressable onPress={onRightPress}>
              <LinearGradient colors={colors.activeIconBorder} style={styles.iconGradient} >
                <View
                  style={[ styles.iconInner, { backgroundColor: colors.innerBackground[0] }]}
                >
                  <Ionicons
                    name={rightIcon}
                    size={20}
                    color={colors.text}
                  />
                </View>
              </LinearGradient>
            </Pressable>
          )
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  side: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  iconGradient:{
    width:52,
    height:40,
    borderRadius:18,
    padding:2,
  },

  iconInner:{
    flex:1,
    borderRadius:16,
    alignItems:"center",
    justifyContent:"center",
  },

  titleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },

  title:{
    fontFamily:"Baloo2",
    fontSize:30,
    fontWeight:"600",
  },
});