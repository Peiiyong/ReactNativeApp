import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";
import AppLoading from "./AppLoading";
import AppModal from "./AppModal";

type GameConfig = {
  id:string;
  difficulty:string;
  point:number;
  targetDuration:number;
};

type GameModalProps = {
  visible:boolean;
  configs:GameConfig[];
  loading:boolean;
  onClose:()=>void;
  onSelect:(configId:string)=>void;
};

export default function GameModal({
  visible,
  configs,
  loading,
  onClose,
  onSelect
}:GameModalProps){
  const colors = useThemeColors();

  return(
    <AppModal
      visible={visible}
      title="Select Difficulty"
      description="Choose your challenge level"
      onClose={onClose}
    >
    { loading ? (
      <AppLoading />
      ):
        configs.map((config)=>(
          <TouchableOpacity
            key={config.id}
            onPress={()=>onSelect(config.id)}
          >
            <LinearGradient colors={colors.activeIconBorder} style={styles.gradientBorder}>
              <View style={[ styles.configButton, { backgroundColor: colors.cardBackground[0]}]}>
                <Text style={[styles.title,{color:colors.text}]}>{config.difficulty.toUpperCase()}</Text>
                <Text style={[styles.meta, {color:colors.navDefaultIcon}]}>Reward: {config.point} | Target: {config.targetDuration}s</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
    ))}
    </AppModal>
    );
}

const styles = StyleSheet.create({
  gradientBorder:{
    borderRadius:16,
    padding:2, 
  },

  configButton:{
    padding:16,
    borderRadius:16,
    gap:4,
  },

  title:{
    fontSize:16,
    fontWeight:"600",
    fontFamily:"Baloo2",
  },

    
  meta:{
    fontSize:13,
    fontFamily:"Baloo2",
  },
});