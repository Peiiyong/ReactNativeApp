import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type ToastProps = {
  message: string;
  visible: boolean;
  type?: "success" | "error";
  duration?: number;
  onHide?: () => void;
};

export default function Toast({
  message,
  visible,
  type = "success",
  duration = 3000,
  onHide,
}: ToastProps) {
  const colors = useThemeColors();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        onHide?.();
      }, duration);
    }

    return () => {
      if(timerRef.current){
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, duration, onHide]);

  if (!visible) return null;

  return (
    <View
      style={[
        styles.toast,
        { backgroundColor: type === "error" ? colors.errorMsg : colors.successMsg },
        { shadowColor: colors.text}
      ]}
    >
      <Text style={[ styles.toastText, { color: colors.textWhite }]}> {message} </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast:{
    position:"absolute",
    left:20,
    right:20,
    bottom:40,
    padding:12,
    borderRadius:16,
    shadowOffset:{
      width:0,
      height:4,
    },
    shadowOpacity:0.15,
    shadowRadius:10,
    elevation:8,
    zIndex:10,
  },
  toastText:{
    textAlign:"center",
    fontWeight:"600",
    fontSize: 16,
    fontFamily: "Baloo2",
  }
});