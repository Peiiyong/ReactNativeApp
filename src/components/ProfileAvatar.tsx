import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type ProfileAvatarProps = {
  imageUri?: string | null;
  username?: string;
  size?: number;
  onPress?: () => void;
  showEditIcon?: boolean;
};

export default function ProfileAvatar({
  imageUri,
  username = "User",
  size = 104,
  onPress,
  showEditIcon = false,
}: ProfileAvatarProps) {
  const colors = useThemeColors();
  const radius = size / 2;

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <View style={styles.container}>
        <View style={[styles.gradient ]}>
            {imageUri ? (
            <Image
                source={{ uri:imageUri}}
                style={[ styles.image,{ width:size, height:size, borderRadius:radius }, ]}
            />
            ) : (
            <Text
                style={[
                styles.avatarText,
                {
                    width:size,
                    height:size,
                    borderRadius:radius,
                    backgroundColor: colors.primary,
                    color: colors.text2,
                    fontSize:size * 0.38,
                },
                ]}
            >
                { username.charAt(0).toUpperCase() }
                </Text>
            )
            }
        </View>

        {showEditIcon && (
            <View style={[ styles.camera, { backgroundColor: colors.primary, borderColor: colors.text2 }]}>
            <Ionicons
                name="camera"
                size={18}
                color={colors.text2}
            />
            </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container:{
    position:"relative",
  },

  gradient:{
    alignItems:"center",
    justifyContent:"center",
    padding:3,
  },

  image:{
    resizeMode:"cover",
  },

  avatarText:{
    alignItems:"center",
    justifyContent:"center",
    textAlign:"center",
    fontFamily:"Baloo2",
    fontWeight:"bold",
    textAlignVertical:"center",
  },

  camera:{
    position:"absolute",
    right:0,
    bottom:0,
    width:34,
    height:34,
    borderRadius:17,
    alignItems:"center",
    justifyContent:"center",
    borderWidth: 1,
  },
});