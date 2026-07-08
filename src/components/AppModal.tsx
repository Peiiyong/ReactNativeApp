import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type AppModalProps={
 visible:boolean;
 title:string;
 description?:string;
 children?:ReactNode;
 onClose:()=>void;
};

export default function AppModal({
 visible,
 title,
 description,
 children,
 onClose
}:AppModalProps){
 const colors=useThemeColors();

 return (
   <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
     <Pressable style={styles.overlay} onPress={onClose}>
     <Pressable
      style={[ styles.container, { backgroundColor: colors.cardBackground[0]}]}
      onPress={(e) => e.stopPropagation()}
    >
      <View style={styles.header}>
        <Text style={[ styles.title,{ color: colors.text }]}>{title}</Text>
        <Pressable onPress={onClose}>
          <Ionicons
            name="close-circle-outline"
            size={26}
            color={colors.navDefaultIcon}
          />
        </Pressable>
      </View>

      {description && (
        <Text style={[ styles.description,{color: colors.navDefaultIcon}]}>
          {description}
        </Text>
      )}
      {children}
    </Pressable>
  </Pressable>
</Modal>
 );
}

const styles=StyleSheet.create({
  overlay:{
    flex:1,
    backgroundColor:"rgba(0,0,0,0.4)",
    justifyContent:"center",
    alignItems:"center",
  },

  container:{
    width:"85%",
    padding:24,
    borderRadius:24,
    gap:16,
  },
  
  header:{
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
  },

  title:{
    fontSize:22,
    fontWeight:"600",
    fontFamily: "Baloo2",
  },

  description:{
    fontSize:16,
    fontWeight:"600",
    fontFamily:"Baloo2",
  },
});