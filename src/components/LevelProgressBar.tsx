import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type LevelProgressBarProps = {
  level: number;
  currentExp: number;
  nextLevelExp: number;
  width?: number | `${number}%`;
};

export default function LevelProgressBar({
  level,
  currentExp,
  nextLevelExp,
  width = "70%",
}: LevelProgressBarProps) {
  const colors = useThemeColors();
  // Calculate current progress percentage
  const progress = Math.min((currentExp / nextLevelExp) * 100, 100);

  return (
    <View style={[ styles.progressContainer,{ width, backgroundColor: colors.progressBarColorGrey}]}>
      {/* Progress fill */}
      <LinearGradient
        colors={ colors.buttonGradient }
        style={[ styles.progressFill, { width:`${progress}%` }]}
      />

      {/* Text inside progress bar */}
      <View style={ styles.progressTextContainer }>
        <Text style={[ styles.progressText, { color: colors.textWhite }]}>
            Lv.{level}
        </Text>
        <Text style={[ styles.progressText, { color: progress >= 70 ? colors.textWhite : colors.textBlack }]}>
            {currentExp}/{nextLevelExp} EXP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer:{
    height:28,
    borderRadius:14,
    overflow:"hidden",
    justifyContent:"center",
  },

  progressFill:{
    position:"absolute",
    left:0,
    top:0,
    bottom:0,
    borderRadius:14,
  },

  progressTextContainer:{
    flexDirection:"row",
    justifyContent:"space-between",
    paddingHorizontal:12,
  },

  progressText:{
    fontWeight:"600",
    fontFamily:"Baloo2",
    textShadowColor:"rgba(0,0,0,0.3)",
    textShadowOffset:{
      width:0,
      height:1,
    },
    textShadowRadius:2,
  },
});