import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type AppCardProps = {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
  gap?: number;
};

export default function AppCard({
  children,
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
});