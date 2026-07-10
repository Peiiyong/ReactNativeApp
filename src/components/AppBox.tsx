import { StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type AppBoxProps = {
  label: string;
  value: string | number;
  flex?: number;
  backgroundColor?: string;
  borderColor?: string;
  labelColor?: string;
  valueColor?: string;
};
export default function AppBox({
  label,
  value,
  flex = 1,
  backgroundColor,
  borderColor,
  labelColor,
  valueColor,
}: AppBoxProps) {
  const colors = useThemeColors();

  return (
    <View style={[ styles.container, { flex, backgroundColor: backgroundColor ?? colors.primary, borderColor: borderColor ?? colors.text}]}>
      <Text style={[ styles.label, { color: labelColor ?? colors.textWhite }]}>{label}</Text>
      <Text style={[ styles.value, { color: valueColor ?? colors.textWhite }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },

  label: {
    fontSize: 12,
    fontFamily: "Baloo2",
    marginBottom: 4,
  },

  value: {
    fontSize: 20,
    fontFamily: "Baloo2",
    fontWeight: "600",
  },
});