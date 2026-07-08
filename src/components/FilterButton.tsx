import { Pressable, StyleSheet, Text } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type FilterButtonProps = {
  title:string;
  active:boolean;
  onPress:()=>void;
};

export default function FilterButton({
  title,
  active,
  onPress
}:FilterButtonProps){
  const colors = useThemeColors();

  return(
    <Pressable
      onPress={onPress}
      style={[ styles.button, { backgroundColor: active? colors.primary : colors.cardBackground[0]}]}
    >
      <Text style={[styles.text, { color:active ? colors.text2 : colors.text}]}>
        {title}
        </Text>
    </Pressable>
    )
}

const styles=StyleSheet.create({
  button:{
    paddingHorizontal:14,
    paddingVertical:8,
    borderRadius:20,
  },
  
  text:{
    fontSize:13,
    fontWeight:"600",
    fontFamily:"Baloo2",
  }
});