import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type AppLoadingProps = {
  message?: string;
};

export default function AppLoading({
  message = "Loading...",
}: AppLoadingProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.text2} size="large"/>
      <Text style={[ styles.text,{ color: colors.text,},]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    minHeight: 280,
    justifyContent:"center",
    alignItems:"center",
    gap:12,
  },

  text:{
    fontSize:24,
    fontWeight:"600",
    fontFamily:"Baloo2",
  },
});