import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type AppCardProps = {
  children: ReactNode;
  title?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onIconPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  gap?: number;
};

export default function AppCard({
  children,
  title,
  rightIcon,
  onIconPress,
  style,
  padding = 20,
  gap = 14,
}: AppCardProps) {

  const colors = useThemeColors();

  return (
    <LinearGradient 
      colors={ colors.cardBackground }      
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}

      style={[ styles.card, { padding, gap,}, style,]}
    >
      {/* Card Header */}
      {(title || rightIcon) && (
        <View style={styles.cardHeader}>
          {title && (<Text style={[ styles.sectionTitle, { color:colors.text, }]}>{title}</Text>)}

          {rightIcon && (
            <Pressable style={styles.iconButton} onPress={onIconPress}>
              <Ionicons
                name={rightIcon}
                size={20}
                color={colors.primary}
              />
            </Pressable>
          )}
        </View>
      )}
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card:{
    borderRadius:24,
    elevation:3,
    shadowColor:"#fff",
    shadowOffset:{
      width:2,
      height:2,
    },
    shadowOpacity:0.08,
    shadowRadius:8,
  },

  cardHeader:{
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between",
  },

  sectionTitle:{
    fontSize:18,
    fontWeight:"600",
    fontFamily:"Baloo2",
  },

  iconButton:{
    padding:6,
  },
});